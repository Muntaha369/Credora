import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting CredentialRegistry deployment...");

  const [deployer] = await ethers.getSigners();
  console.log(`📡 Deploying with account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

  const CredentialRegistryFactory = await ethers.getContractFactory("CredentialRegistry");
  const registry = await CredentialRegistryFactory.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log(`✅ CredentialRegistry deployed successfully to: ${contractAddress}`);
  console.log(`⛓️  Chain ID: ${network.chainId.toString()}`);

  // Prepare deployment info
  const deploymentDir = path.join(__dirname, "../lib/contracts");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // Extract ABI from Hardhat artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json"
  );
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    abi = artifact.abi;
  }

  const deploymentData = {
    address: contractAddress,
    deployer: deployer.address,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    abi,
  };

  const deploymentPath = path.join(deploymentDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2), "utf-8");
  console.log(`📄 Deployment metadata saved to: ${deploymentPath}`);

  // Also update .env.local if present
  const envLocalPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envLocalPath)) {
    let envContent = fs.readFileSync(envLocalPath, "utf-8");
    if (envContent.includes("CREDENTIAL_REGISTRY_ADDRESS=")) {
      envContent = envContent.replace(
        /CREDENTIAL_REGISTRY_ADDRESS=.*(\r?\n|$)/,
        `CREDENTIAL_REGISTRY_ADDRESS="${contractAddress}"$1`
      );
    } else {
      envContent += `\nCREDENTIAL_REGISTRY_ADDRESS="${contractAddress}"\n`;
    }
    fs.writeFileSync(envLocalPath, envContent, "utf-8");
    console.log(`🔧 Updated .env.local with contract address: ${contractAddress}`);
  }

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
