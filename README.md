# Credora — Decentralized Digital Credential & Achievement Verification

Credora is a complete, local Ethereum-based platform for issuing, managing, and verifying tamper-proof digital credentials and achievement certificates without external dependencies, browser extension wallets (MetaMask), or real cryptocurrency costs.

Every credential issued through Credora is permanently inscribed onto a local Solidity smart contract (`CredentialRegistry.sol`). Each credential receives a unique sequential identifier (e.g., `CRD-000001`) that can be queried and verified by anyone via the public web interface or QR codes.

---

## 🌟 Key Features

- **Decentralized Single Source of Truth**: All credential state, metadata, and revocation statuses reside on an Ethereum smart contract. Zero database required.
- **Zero Browser Wallet Friction (No MetaMask)**: Transactions are authorized and signed server-side by a dedicated local Hardhat development issuer account.
- **Deterministic 3-State Verification**:
  - `VALID`: Credential exists on the Ethereum ledger and is active in good standing.
  - `REVOKED`: Credential was issued but has been formally revoked by an authorized authority.
  - `NOT_FOUND`: The identifier does not exist on-chain (strictly rejects fraudulent IDs).
- **Public Shareable Verification URLs**: Direct verification routes (e.g., `http://localhost:3000/verify/1`) for instant lookups.
- **Dynamic Local QR Codes**: High-resolution vector QR codes pointing directly to the verification endpoint.
- **Professional PDF Certificate Generation**: Downloadable landscape certificates containing credential details, on-chain metadata, and embedded verification QR codes.
- **Single-Command Orchestration**: Start the local blockchain, compile, deploy, and launch the web frontend using `npm run dev:local`.

---

## 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend (React 18)                     │
│  - Dashboard (/)           - Issue Portal (/issue)                     │
│  - Details (/credentials)  - Public Verification (/verify, /verify/[id])│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         REST API Route Handlers
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Next.js Server Runtime (Node.js)                      │
│  - /api/health             - /api/credentials                          │
│  - /api/credentials/[id]   - /api/credentials/[id]/verify              │
│  - /api/credentials/[id]/revoke                                        │
│                                                                        │
│  Ethers.js v6 + Server Issuer Wallet (Hardhat Account #0)              │
│  Reads address from lib/contracts/deployment.json                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JSON-RPC (HTTP)
┌───────────────────────────────────▼────────────────────────────────────┐
│                Local Hardhat Ethereum Node (Chain ID: 31337)           │
│                            http://127.0.0.1:8545                       │
│                                                                        │
│               Deployed Solidity Contract: CredentialRegistry.sol       │
│  - Sequential numeric token IDs (1, 2, 3...)                           │
│  - issueCredential(), revokeCredential(), verifyCredential()           │
│  - Role-based issuer authorization & custom Solidity errors            │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Matrix

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | 14.2.24 | Modern SSR, routing, and Route Handlers |
| **UI Library** | React & Tailwind CSS | 18.3.1 / 3.4 | Polished slate/navy visual design with emerald accents |
| **Icons** | Lucide React | 0.468 | Modern SVG icon system |
| **Smart Contract**| Solidity | 0.8.24 | EVM smart contract logic with custom errors & events |
| **Blockchain** | Hardhat | 2.29.1 | Local EVM blockchain node, compiler, and testing |
| **Web3 Client** | ethers.js | 6.13.4 | Typed JSON-RPC communication and contract interaction |
| **Validation** | Zod | 3.23.8 | Strict server & form input schema validation |
| **QR Code** | qrcode | 1.5.4 | Base64 PNG QR code generation |
| **PDF Engine** | jsPDF | 2.5.2 | Vector PDF generation with embedded branding and QR |

---

## 📋 Prerequisites

- **Node.js**: `v20.x` or higher (tested on `v24.21.0`)
- **npm**: `v10.x` or higher (tested on `v11.19.0`)

No external API keys, Infura/Alchemy keys, or browser extensions are required.

---

## 🚀 Quick Start (Single Command)

To run the complete platform with automatic blockchain startup, contract deployment, and frontend launch:

```bash
npm run dev:local
```

This single command will:
1. Launch the local Hardhat node on `http://127.0.0.1:8545`.
2. Wait for the JSON-RPC interface to become responsive.
3. Compile `CredentialRegistry.sol`.
4. Deploy the contract to localhost and save deployment metadata to `lib/contracts/deployment.json`.
5. Launch the Next.js development server on `http://localhost:3000`.
6. Gracefully shut down child processes when you press `Ctrl+C`.

Once started, open **`http://localhost:3000`** in your browser.

---

## 🛠️ Step-by-Step Manual Fallback (Three Terminals)

If you prefer to run services in separate terminals:

### Terminal 1: Local Hardhat Node
```bash
npm run chain
```
*Starts local Ethereum blockchain listening on `http://127.0.0.1:8545` with 20 prefunded test accounts.*

### Terminal 2: Contract Deployment
```bash
npm run deploy:local
```
*Deploys `CredentialRegistry.sol` to the running localhost node and updates `lib/contracts/deployment.json` and `.env.local`.*

### Terminal 3: Next.js Web Interface
```bash
npm run dev
```
*Starts the Next.js server on `http://localhost:3000`.*

---

## 🧪 Automated Testing

Credora includes an automated test suite with **17 passing unit and integration tests** in `test/CredentialRegistry.test.ts`.

Run the test suite:
```bash
npm test
```

### Verified Test Cases
1. **Access Control & Deployment**:
   - Contract deployer initialized as owner and authorized issuer.
   - Owner can authorize and deauthorize issuers.
   - Non-owners cannot authorize issuers (`UnauthorizedCaller`).
2. **Credential Issuance & Sequential IDs**:
   - Successful issuance increments total count.
   - Sequential unique numeric IDs assigned (1, 2, 3...).
   - Correct storage and retrieval of all fields (`recipientName`, `achievementTitle`, `issuingOrganization`, `description`, `issuer`, `issuedAt`, `revoked`).
3. **Verification**:
   - Verification of active credential returns status `1` (`VALID`).
   - Nonexistent credential ID returns status `0` (`NOT_FOUND`), and `getCredential()` reverts with `CredentialNotFound`.
   - Verification of revoked credential returns status `2` (`REVOKED`).
4. **Revocation**:
   - Authorized issuer successfully revokes credential with reason.
   - Unauthorized account cannot revoke credentials (`UnauthorizedCaller`).
   - Re-revoking an already-revoked credential reverts (`AlreadyRevoked`).
   - Revoking a nonexistent ID reverts (`CredentialNotFound`).
5. **Input Validation**:
   - Rejects empty `recipientName` with `EmptyRequiredField("recipientName")`.
   - Rejects empty `achievementTitle` with `EmptyRequiredField("achievementTitle")`.
   - Rejects empty `issuingOrganization` with `EmptyRequiredField("issuingOrganization")`.
6. **Events**:
   - `CredentialIssued` emitted with exact arguments (`id`, `recipientName`, `achievementTitle`, `issuingOrganization`, `issuer`, `timestamp`).
   - `CredentialRevoked` emitted with exact arguments (`id`, `revoker`, `timestamp`, `reason`).
7. **Batch & Stats Helpers**:
   - Summary counts `getStats()` return accurate counts `(total, valid, revoked)`.
   - `getAllCredentials()` and `getCredentialBatch()` correctly return arrays of structs.

---

## ⚙️ Environment Configuration

The application uses `.env.local` for local runtime configuration. A template is provided in `.env.example`:

```bash
# Web Application URL (used for QR code links and verification routing)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Local Ethereum RPC Endpoint
LOCAL_RPC_URL="http://127.0.0.1:8545"

# Authorized Issuer Private Key (Server-side ONLY. Never expose with NEXT_PUBLIC_)
# Default: Hardhat Account #0 (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
ISSUER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Optional override. If empty, the backend reads dynamically from lib/contracts/deployment.json
CREDENTIAL_REGISTRY_ADDRESS=""
```

> [!IMPORTANT]
> The `ISSUER_PRIVATE_KEY` is kept strictly on the Node.js server side in Route Handlers. It is never bundled into client-side JavaScript or sent across the network.

---

## 📖 Usage Guide

### 1. View Dashboard (`/`)
- View real-time summary statistics: Total Issued, Active & Valid, and Revoked.
- Search records by recipient name, course title, issuing organization, or ID.
- Filter by status (`Valid & Active` or `Revoked`).
- Click any row to view full details, download a PDF certificate, or view the QR code.

### 2. Issue a Credential (`/issue`)
- Fill in:
  - **Recipient Name** (e.g. `Elena Rostova`)
  - **Achievement Title** (e.g. `Certified Blockchain Solutions Architect`)
  - **Issuing Organization** (e.g. `Credora Global Institute`)
  - **Description** (optional remarks or grade)
- Click **Sign & Issue Credential**.
- The backend signs an on-chain transaction using the authorized local issuer account, waits for block confirmation, and returns the assigned ID (e.g., `CRD-000001`).
- From the confirmation screen, you can immediately download the PDF certificate or click direct verification.

### 3. Verify a Credential (`/verify` or `/verify/[id]`)
- Enter any credential ID, such as `CRD-000001` or `1`.
- The smart contract is queried live:
  - **Valid**: Green shield with recipient, achievement, issuing authority, and block confirmation details.
  - **Revoked**: Red banner warning that the credential was revoked, including the revocation timestamp and reason.
  - **Not Found**: Gray shield indicating the ID does not exist on the Ethereum ledger.

### 4. Revoke a Credential (`/credentials/[id]`)
- From any credential details page, click the **Revoke** button.
- An accessible confirmation modal appears. Enter an optional reason (e.g. `Audit reissue`).
- Confirm revocation. An on-chain transaction executes, setting `revoked = true` permanently.
- Re-verifying the credential will now immediately reflect its revoked status.

---

## 🔄 Resetting the Local Blockchain

Because the local Hardhat node is an in-memory blockchain, stopping the node resets its state:

1. If you restart the node (`npm run chain`), its state returns to block #0.
2. Run `npm run deploy:local` to redeploy the contract. The deploy script will automatically update `lib/contracts/deployment.json` with the new address, and the running Next.js application will pick it up without requiring a restart!

---

## 🔒 Security & Privacy Notices

1. **Development & Educational Purpose**:
   - The private key used in this setup is the well-known default Hardhat test key (`Account #0`). Never send real mainnet ETH to this address.
   - Because the local API signs transactions server-side on behalf of the issuer, this setup is designed for local demonstration and automated verification without requiring end users to hold crypto.
2. **Public Ledger Privacy Limitation**:
   - Blockchains are permanent, globally visible ledgers. Never store confidential personally identifiable information (PII) such as passports, home addresses, phone numbers, or passwords on-chain. Store only public attestation claims.
3. **Localhost QR Code Reachability**:
   - QR codes generated in this local environment point to `http://localhost:3000/verify/<id>`. Scanning this with a mobile phone requires your phone and computer to be on the same local Wi-Fi network and `NEXT_PUBLIC_APP_URL` configured to your computer's local IP (e.g. `http://192.168.1.50:3000`).

---

## 📁 Repository Structure

```
├── contracts/
│   └── CredentialRegistry.sol       # Solidity smart contract
├── scripts/
│   ├── deploy.ts                    # Hardhat deployment script
│   └── dev-local.js                 # Local orchestrator script (npm run dev:local)
├── test/
│   └── CredentialRegistry.test.ts   # 17 automated Hardhat contract tests
├── app/
│   ├── layout.tsx                   # App layout with Navbar & Toast provider
│   ├── page.tsx                     # Main dashboard with table & stats
│   ├── globals.css                  # Tailwind styles
│   ├── issue/page.tsx               # Issue credential form & success view
│   ├── credentials/[id]/page.tsx    # Credential details & revocation modal
│   ├── verify/page.tsx              # Public ID verification search
│   ├── verify/[id]/page.tsx         # Direct verification URL & QR target
│   └── api/                         # Next.js Node.js Route Handlers
│       ├── health/route.ts          # Node & contract health endpoint
│       ├── credentials/route.ts     # List & issue credentials
│       └── credentials/[id]/
│           ├── route.ts             # Get credential by ID
│           ├── verify/route.ts      # Verify status on-chain
│           └── revoke/route.ts      # Revoke credential on-chain
├── components/
│   ├── Navbar.tsx                   # Header with live node health monitor
│   ├── NetworkBanner.tsx            # Alert banner when node is offline
│   ├── StatsCards.tsx               # Dashboard metrics (Total, Valid, Revoked)
│   ├── CredentialTable.tsx          # Management table with search & filters
│   ├── StatusBadge.tsx              # Consistent status badge component
│   ├── QrModal.tsx                  # QR code preview & download modal
│   ├── RevokeModal.tsx              # Revocation confirmation dialog
│   └── Toast.tsx                    # Toast notification system
├── lib/
│   ├── types.ts                     # TypeScript data models
│   ├── blockchain.ts                # Server-side ethers.js contract service
│   ├── formatters.ts                # ID (CRD-000001) & date formatters
│   ├── validation.ts                # Zod schemas
│   ├── qr.ts                        # Local QR code generator
│   ├── certificate.ts               # jsPDF certificate generator
│   └── contracts/
│       └── deployment.json          # Deployed contract address & ABI
├── hardhat.config.ts                # Hardhat 2.29 config (Solidity 0.8.24)
├── tsconfig.json                    # TypeScript strict configuration
├── tailwind.config.ts               # Custom navy/slate/emerald palette
└── package.json                     # Dependencies & scripts
```

---

## 📜 License

MIT License. Educational and demonstration digital credential registry.
# Credora
