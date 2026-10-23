#!/usr/bin/env node

/**
 * Credora Local Development Orchestrator
 *
 * 1. Spawns the local Hardhat blockchain on 127.0.0.1:8545.
 * 2. Waits until RPC is fully accepting calls.
 * 3. Compiles and deploys CredentialRegistry contract.
 * 4. Writes deployment metadata for the backend.
 * 5. Starts Next.js dev server on port 3000.
 * 6. Gracefully terminates all child processes on Ctrl+C.
 */

const { spawn, execSync } = require("child_process");
const http = require("http");
const path = require("path");

const RPC_HOST = "127.0.0.1";
const RPC_PORT = 8545;
const MAX_WAIT_MS = 30000;
const POLL_INTERVAL_MS = 600;

let hardhatProcess = null;
let nextProcess = null;
let isShuttingDown = false;

function log(prefix, msg) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\x1b[90m[${timestamp}]\x1b[0m \x1b[1m${prefix}\x1b[0m ${msg}`);
}

function checkRpcReady() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1,
    });

    const req = http.request(
      {
        hostname: RPC_HOST,
        port: RPC_PORT,
        path: "/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 1000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed && (parsed.result !== undefined || parsed.jsonrpc)) {
              resolve(true);
              return;
            }
          } catch {
            // response not ready yet
          }
          resolve(false);
        });
      }
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function waitForRpc() {
  const start = Date.now();
  log("\x1b[36m[Orchestrator]\x1b[0m", "Waiting for local Ethereum RPC node to become ready...");

  while (Date.now() - start < MAX_WAIT_MS) {
    if (await checkRpcReady()) {
      log("\x1b[32m[Orchestrator]\x1b[0m", `Local RPC node is ready at http://${RPC_HOST}:${RPC_PORT}`);
      return true;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("\n");
  log("\x1b[33m[Orchestrator]\x1b[0m", "Shutting down Credora local development services...");

  if (nextProcess) {
    log("\x1b[33m[Next.js]\x1b[0m", "Stopping frontend server...");
    try {
      process.kill(-nextProcess.pid);
    } catch {
      try {
        nextProcess.kill("SIGTERM");
      } catch {}
    }
  }

  if (hardhatProcess) {
    log("\x1b[33m[Hardhat]\x1b[0m", "Stopping local Hardhat blockchain...");
    try {
      process.kill(-hardhatProcess.pid);
    } catch {
      try {
        hardhatProcess.kill("SIGTERM");
      } catch {}
    }
  }

  setTimeout(() => {
    process.exit(0);
  }, 500);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);

async function start() {
  log("\x1b[35m[Credora]\x1b[0m", "Initializing Credora local blockchain environment...");

  // 1. Check if node is already running
  const alreadyRunning = await checkRpcReady();

  if (alreadyRunning) {
    log(
      "\x1b[34m[Hardhat]\x1b[0m",
      `Existing local Hardhat node detected on http://${RPC_HOST}:${RPC_PORT}. Reusing existing node.`
    );
  } else {
    // Start Hardhat Node
    log("\x1b[34m[Hardhat]\x1b[0m", `Launching local node on http://${RPC_HOST}:${RPC_PORT}...`);
    hardhatProcess = spawn(
      "npx",
      ["hardhat", "node", "--hostname", RPC_HOST, "--port", RPC_PORT.toString()],
      {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          HARDHAT_ENABLE_TELEMETRY: "false",
        },
      }
    );

    hardhatProcess.stdout.on("data", (data) => {
      const text = data.toString();
      if (text.includes("Started HTTP and WebSocket JSON-RPC server")) {
        log("\x1b[34m[Hardhat]\x1b[0m", "JSON-RPC server running.");
      }
    });

    hardhatProcess.stderr.on("data", (data) => {
      const msg = data.toString();
      if (!msg.includes("telemetry") && !msg.includes("warn")) {
        log("\x1b[31m[Hardhat Error]\x1b[0m", msg.trim());
      }
    });

    hardhatProcess.on("exit", (code) => {
      if (!isShuttingDown && code !== null && code !== 0) {
        log("\x1b[31m[Hardhat]\x1b[0m", `Hardhat node exited with code ${code}`);
      }
    });

    // Wait for RPC
    const ready = await waitForRpc();
    if (!ready) {
      log("\x1b[31m[Error]\x1b[0m", "Timeout waiting for Hardhat node to start.");
      shutdown();
      return;
    }
  }

  // 2. Deploy contract
  log("\x1b[36m[Deploy]\x1b[0m", "Deploying CredentialRegistry contract to local network...");
  try {
    const deployOutput = execSync("npx hardhat run scripts/deploy.ts --network localhost", {
      encoding: "utf-8",
      env: {
        ...process.env,
        HARDHAT_ENABLE_TELEMETRY: "false",
      },
    });
    console.log(deployOutput.trim());
  } catch (err) {
    log("\x1b[31m[Deploy Error]\x1b[0m", `Contract deployment failed: ${err.message}`);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    shutdown();
    return;
  }

  // 3. Start Next.js App
  log("\x1b[32m[Next.js]\x1b[0m", "Starting Credora web interface at http://localhost:3000...");
  nextProcess = spawn("npx", ["next", "dev", "-p", "3000"], {
    detached: true,
    stdio: "inherit",
  });

  nextProcess.on("exit", (code) => {
    if (!isShuttingDown) {
      log("\x1b[33m[Next.js]\x1b[0m", `Next.js exited with code ${code}`);
      shutdown();
    }
  });
}

start().catch((err) => {
  log("\x1b[31m[Fatal]\x1b[0m", err.message);
  shutdown();
});
