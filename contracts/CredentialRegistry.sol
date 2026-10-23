// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title CredentialRegistry
 * @dev Decentralized registry for issuing, retrieving, and verifying digital credentials on Ethereum.
 *
 * PRIVACY & DATA LIMITATION NOTICE:
 * Public blockchains are permanent, immutable, and world-readable. Never store sensitive personal
 * information (PII) such as national identity numbers, passwords, residential addresses, financial
 * account details, or raw biometric data on-chain. Store only public achievement identifiers,
 * organizational attestation details, and verifiable status flags.
 */
contract CredentialRegistry {
    enum VerificationStatus {
        NOT_FOUND, // 0
        VALID,     // 1
        REVOKED    // 2
    }

    struct Credential {
        uint256 id;
        string recipientName;
        string achievementTitle;
        string issuingOrganization;
        string description;
        address issuer;
        uint256 issuedAt;
        bool revoked;
        uint256 revokedAt;
        string revocationReason;
    }

    // State Variables
    address public owner;
    uint256 private _currentCredentialId;
    uint256 public revokedCount;

    // Authorized issuers mapping
    mapping(address => bool) public isAuthorizedIssuer;

    // Credential storage: id => Credential
    mapping(uint256 => Credential) private _credentials;

    // Custom Errors
    error UnauthorizedCaller(address caller);
    error CredentialNotFound(uint256 id);
    error AlreadyRevoked(uint256 id);
    error EmptyRequiredField(string fieldName);
    error InvalidBatchRange();
    error InvalidIssuerAddress();

    // Events
    event CredentialIssued(
        uint256 indexed id,
        string recipientName,
        string achievementTitle,
        string issuingOrganization,
        address indexed issuer,
        uint256 issuedAt
    );

    event CredentialRevoked(
        uint256 indexed id,
        address indexed revoker,
        uint256 revokedAt,
        string reason
    );

    event IssuerAuthorized(address indexed issuer);
    event IssuerDeauthorized(address indexed issuer);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    modifier onlyAuthorizedIssuer() {
        if (!isAuthorizedIssuer[msg.sender]) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        isAuthorizedIssuer[msg.sender] = true;
        emit IssuerAuthorized(msg.sender);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Authorize an address to issue and revoke credentials.
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) revert InvalidIssuerAddress();
        isAuthorizedIssuer[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    /**
     * @notice Deauthorize an issuer.
     */
    function deauthorizeIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) revert InvalidIssuerAddress();
        isAuthorizedIssuer[issuer] = false;
        emit IssuerDeauthorized(issuer);
    }

    /**
     * @notice Transfer ownership of the registry.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidIssuerAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Issue a new credential.
     * @param recipientName Recipient full name or public identity handle
     * @param achievementTitle Course/award/achievement title
     * @param issuingOrganization Name of issuing school, academy, or company
     * @param description Optional description or remarks
     * @return id Sequential unique numeric ID of the issued credential
     */
    function issueCredential(
        string calldata recipientName,
        string calldata achievementTitle,
        string calldata issuingOrganization,
        string calldata description
    ) external onlyAuthorizedIssuer returns (uint256 id) {
        if (bytes(recipientName).length == 0) revert EmptyRequiredField("recipientName");
        if (bytes(achievementTitle).length == 0) revert EmptyRequiredField("achievementTitle");
        if (bytes(issuingOrganization).length == 0) revert EmptyRequiredField("issuingOrganization");

        _currentCredentialId++;
        id = _currentCredentialId;

        _credentials[id] = Credential({
            id: id,
            recipientName: recipientName,
            achievementTitle: achievementTitle,
            issuingOrganization: issuingOrganization,
            description: description,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false,
            revokedAt: 0,
            revocationReason: ""
        });

        emit CredentialIssued(
            id,
            recipientName,
            achievementTitle,
            issuingOrganization,
            msg.sender,
            block.timestamp
        );

        return id;
    }

    /**
     * @notice Revoke an existing credential.
     * @param id Credential ID to revoke
     * @param reason Explanation for revocation
     */
    function revokeCredential(uint256 id, string calldata reason) external onlyAuthorizedIssuer {
        if (id == 0 || id > _currentCredentialId) {
            revert CredentialNotFound(id);
        }

        Credential storage cred = _credentials[id];
        if (cred.revoked) {
            revert AlreadyRevoked(id);
        }

        cred.revoked = true;
        cred.revokedAt = block.timestamp;
        cred.revocationReason = bytes(reason).length > 0 ? reason : "Revoked by issuer";

        revokedCount++;

        emit CredentialRevoked(id, msg.sender, block.timestamp, cred.revocationReason);
    }

    /**
     * @notice Retrieve an individual credential by ID.
     * @param id Credential ID
     */
    function getCredential(uint256 id) external view returns (Credential memory) {
        if (id == 0 || id > _currentCredentialId) {
            revert CredentialNotFound(id);
        }
        return _credentials[id];
    }

    /**
     * @notice Verify credential status and retrieve details if found.
     * @param id Credential ID
     * @return status NOT_FOUND (0), VALID (1), or REVOKED (2)
     * @return credential Credential struct data (empty if NOT_FOUND)
     */
    function verifyCredential(uint256 id)
        external
        view
        returns (VerificationStatus status, Credential memory credential)
    {
        if (id == 0 || id > _currentCredentialId) {
            return (VerificationStatus.NOT_FOUND, credential);
        }

        Credential memory cred = _credentials[id];
        if (cred.revoked) {
            return (VerificationStatus.REVOKED, cred);
        }

        return (VerificationStatus.VALID, cred);
    }

    /**
     * @notice Total number of credentials issued so far.
     */
    function totalCredentials() external view returns (uint256) {
        return _currentCredentialId;
    }

    /**
     * @notice Get summary counts for dashboard.
     */
    function getStats() external view returns (uint256 total, uint256 valid, uint256 revoked) {
        total = _currentCredentialId;
        revoked = revokedCount;
        valid = total >= revoked ? total - revoked : 0;
    }

    /**
     * @notice Retrieve a batch of credentials for pagination/listing.
     * @param startId Starting credential ID (inclusive, 1-indexed)
     * @param count Maximum number of credentials to return
     */
    function getCredentialBatch(uint256 startId, uint256 count)
        external
        view
        returns (Credential[] memory batch)
    {
        if (startId == 0 || startId > _currentCredentialId || count == 0) {
            return new Credential[](0);
        }

        uint256 endId = startId + count - 1;
        if (endId > _currentCredentialId) {
            endId = _currentCredentialId;
        }

        uint256 totalItems = endId - startId + 1;
        batch = new Credential[](totalItems);

        for (uint256 i = 0; i < totalItems; i++) {
            batch[i] = _credentials[startId + i];
        }

        return batch;
    }

    /**
     * @notice Convenience helper to get all credentials (for local registry exploration).
     */
    function getAllCredentials() external view returns (Credential[] memory) {
        if (_currentCredentialId == 0) {
            return new Credential[](0);
        }

        Credential[] memory allCreds = new Credential[](_currentCredentialId);
        for (uint256 i = 1; i <= _currentCredentialId; i++) {
            allCreds[i - 1] = _credentials[i];
        }
        return allCreds;
    }
}
