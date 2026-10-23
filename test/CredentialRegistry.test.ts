import { expect } from "chai";
import { ethers } from "hardhat";
import { CredentialRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CredentialRegistry", function () {
  let registry: CredentialRegistry;
  let owner: SignerWithAddress;
  let authorizedIssuer: SignerWithAddress;
  let unauthorizedAccount: SignerWithAddress;

  beforeEach(async function () {
    [owner, authorizedIssuer, unauthorizedAccount] = await ethers.getSigners();

    const CredentialRegistryFactory = await ethers.getContractFactory("CredentialRegistry");
    registry = await CredentialRegistryFactory.deploy();
    await registry.waitForDeployment();

    // Authorize additional issuer for testing
    await registry.authorizeIssuer(authorizedIssuer.address);
  });

  describe("1. Access Control & Deployment", function () {
    it("should set deployer as owner and authorized issuer", async function () {
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.isAuthorizedIssuer(owner.address)).to.be.true;
    });

    it("should allow owner to authorize and deauthorize issuers", async function () {
      expect(await registry.isAuthorizedIssuer(authorizedIssuer.address)).to.be.true;
      await expect(registry.deauthorizeIssuer(authorizedIssuer.address))
        .to.emit(registry, "IssuerDeauthorized")
        .withArgs(authorizedIssuer.address);
      expect(await registry.isAuthorizedIssuer(authorizedIssuer.address)).to.be.false;
    });

    it("should prevent non-owners from authorizing issuers", async function () {
      await expect(
        registry.connect(unauthorizedAccount).authorizeIssuer(unauthorizedAccount.address)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");
    });
  });

  describe("2. Credential Issuance & Sequential IDs", function () {
    it("1. Successful credential issuance", async function () {
      const tx = await registry.issueCredential(
        "Ada Lovelace",
        "Pioneering Computing Certificate",
        "Algorithmic Institute",
        "Distinction in theoretical mechanics and analytical engine calculus"
      );
      await tx.wait();

      expect(await registry.totalCredentials()).to.equal(1n);
    });

    it("2. Sequential unique credential IDs", async function () {
      const tx1 = await registry.issueCredential(
        "Alan Turing",
        "Foundations of Computing",
        "Bletchley Academy",
        ""
      );
      await tx1.wait();

      const tx2 = await registry.issueCredential(
        "Grace Hopper",
        "Compiler Design Mastery",
        "Naval Computing Center",
        ""
      );
      await tx2.wait();

      expect(await registry.totalCredentials()).to.equal(2n);

      const cred1 = await registry.getCredential(1);
      const cred2 = await registry.getCredential(2);

      expect(cred1.id).to.equal(1n);
      expect(cred2.id).to.equal(2n);
      expect(cred1.recipientName).to.equal("Alan Turing");
      expect(cred2.recipientName).to.equal("Grace Hopper");
    });

    it("3. Correct storage and retrieval of all fields", async function () {
      const recipient = "Katherine Johnson";
      const title = "Orbital Trajectory Mathematics";
      const org = "NASA Space Task Group";
      const desc = "Manual calculation and verification of orbital flight paths";

      const tx = await registry.connect(authorizedIssuer).issueCredential(
        recipient,
        title,
        org,
        desc
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const cred = await registry.getCredential(1);
      expect(cred.id).to.equal(1n);
      expect(cred.recipientName).to.equal(recipient);
      expect(cred.achievementTitle).to.equal(title);
      expect(cred.issuingOrganization).to.equal(org);
      expect(cred.description).to.equal(desc);
      expect(cred.issuer).to.equal(authorizedIssuer.address);
      expect(cred.issuedAt).to.equal(BigInt(block!.timestamp));
      expect(cred.revoked).to.be.false;
      expect(cred.revokedAt).to.equal(0n);
      expect(cred.revocationReason).to.equal("");
    });
  });

  describe("3. Verification", function () {
    beforeEach(async function () {
      await registry.issueCredential(
        "Margaret Hamilton",
        "Apollo Software Engineering",
        "MIT Instrumentation Lab",
        "Asynchronous executive system lead"
      );
    });

    it("4. Verification of a valid credential", async function () {
      const [status, cred] = await registry.verifyCredential(1);
      // Status enum: 1 = VALID
      expect(status).to.equal(1n);
      expect(cred.id).to.equal(1n);
      expect(cred.recipientName).to.equal("Margaret Hamilton");
      expect(cred.revoked).to.be.false;
    });

    it("5. Nonexistent credential returns not found", async function () {
      const [status, cred] = await registry.verifyCredential(999);
      // Status enum: 0 = NOT_FOUND
      expect(status).to.equal(0n);
      expect(cred.id).to.equal(0n);

      // getCredential should revert on nonexistent ID
      await expect(registry.getCredential(999)).to.be.revertedWithCustomError(
        registry,
        "CredentialNotFound"
      );
      await expect(registry.getCredential(0)).to.be.revertedWithCustomError(
        registry,
        "CredentialNotFound"
      );
    });

    it("7. Verification reports a revoked credential correctly", async function () {
      await registry.revokeCredential(1, "Administrative audit");

      const [status, cred] = await registry.verifyCredential(1);
      // Status enum: 2 = REVOKED
      expect(status).to.equal(2n);
      expect(cred.id).to.equal(1n);
      expect(cred.revoked).to.be.true;
      expect(cred.revocationReason).to.equal("Administrative audit");
    });
  });

  describe("4. Revocation", function () {
    beforeEach(async function () {
      await registry.issueCredential(
        "Claude Shannon",
        "Information Theory Diploma",
        "Bell Labs",
        "Mathematical theory of communication"
      );
    });

    it("6. Successful credential revocation", async function () {
      const reason = "Reissued under updated standard";
      const tx = await registry.connect(authorizedIssuer).revokeCredential(1, reason);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const cred = await registry.getCredential(1);
      expect(cred.revoked).to.be.true;
      expect(cred.revokedAt).to.equal(BigInt(block!.timestamp));
      expect(cred.revocationReason).to.equal(reason);

      const [total, valid, revoked] = await registry.getStats();
      expect(total).to.equal(1n);
      expect(valid).to.equal(0n);
      expect(revoked).to.equal(1n);
    });

    it("9. Unauthorized account cannot revoke credentials", async function () {
      await expect(
        registry.connect(unauthorizedAccount).revokeCredential(1, "Malicious revocation attempt")
      ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");
    });

    it("11. Already-revoked credentials are handled correctly", async function () {
      await registry.revokeCredential(1, "First revocation");
      await expect(
        registry.revokeCredential(1, "Second revocation attempt")
      ).to.be.revertedWithCustomError(registry, "AlreadyRevoked");
    });

    it("should revert if revoking nonexistent credential", async function () {
      await expect(
        registry.revokeCredential(999, "Nonexistent")
      ).to.be.revertedWithCustomError(registry, "CredentialNotFound");
    });
  });

  describe("5. Validation and Security", function () {
    it("8. Unauthorized account cannot issue credentials", async function () {
      await expect(
        registry
          .connect(unauthorizedAccount)
          .issueCredential("Fake Recipient", "Fake Title", "Fake Org", "")
      ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");
    });

    it("10. Invalid inputs are rejected", async function () {
      // Empty recipient
      await expect(
        registry.issueCredential("", "Valid Title", "Valid Org", "")
      ).to.be.revertedWithCustomError(registry, "EmptyRequiredField");

      // Empty title
      await expect(
        registry.issueCredential("Valid Recipient", "", "Valid Org", "")
      ).to.be.revertedWithCustomError(registry, "EmptyRequiredField");

      // Empty organization
      await expect(
        registry.issueCredential("Valid Recipient", "Valid Title", "", "")
      ).to.be.revertedWithCustomError(registry, "EmptyRequiredField");
    });
  });

  describe("6. Event Emission", function () {
    it("12. Events are emitted with the expected values", async function () {
      const recipient = "John von Neumann";
      const title = "Game Theory & Quantum Logic";
      const org = "Institute for Advanced Study";
      const desc = "Foundational contributions";

      // Issue event check
      const issueTx = await registry.issueCredential(recipient, title, org, desc);
      const receipt = await issueTx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(issueTx)
        .to.emit(registry, "CredentialIssued")
        .withArgs(1n, recipient, title, org, owner.address, BigInt(block!.timestamp));

      // Revoke event check
      const reason = "Curriculum update";
      const revokeTx = await registry.revokeCredential(1, reason);
      const revokeReceipt = await revokeTx.wait();
      const revokeBlock = await ethers.provider.getBlock(revokeReceipt!.blockNumber);

      await expect(revokeTx)
        .to.emit(registry, "CredentialRevoked")
        .withArgs(1n, owner.address, BigInt(revokeBlock!.timestamp), reason);
    });
  });

  describe("7. Batch and Stats Helpers", function () {
    it("should correctly return stats and batches", async function () {
      let stats = await registry.getStats();
      expect(stats.total).to.equal(0n);
      expect(stats.valid).to.equal(0n);
      expect(stats.revoked).to.equal(0n);

      await registry.issueCredential("Student A", "Course 1", "Org", "");
      await registry.issueCredential("Student B", "Course 2", "Org", "");
      await registry.issueCredential("Student C", "Course 3", "Org", "");
      await registry.revokeCredential(2, "Test Revoke");

      stats = await registry.getStats();
      expect(stats.total).to.equal(3n);
      expect(stats.valid).to.equal(2n);
      expect(stats.revoked).to.equal(1n);

      const all = await registry.getAllCredentials();
      expect(all.length).to.equal(3);
      expect(all[0].recipientName).to.equal("Student A");
      expect(all[1].recipientName).to.equal("Student B");
      expect(all[2].recipientName).to.equal("Student C");
      expect(all[1].revoked).to.be.true;

      const batch = await registry.getCredentialBatch(2, 2);
      expect(batch.length).to.equal(2);
      expect(batch[0].id).to.equal(2n);
      expect(batch[1].id).to.equal(3n);
    });
  });
});
