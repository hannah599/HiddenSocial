// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint256, eaddress, externalEuint64, externalEaddress, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title HiddenSocial - Anonymous Social Payment System
/// @notice This contract allows users to bind their X account IDs to encrypted wallet addresses
/// and enables anonymous transfers and withdrawals using Zama FHE technology.
contract HiddenSocial is SepoliaConfig {
    /// @notice Mapping from X account ID to encrypted address (eaddress is bytes32)
    mapping(string => eaddress) public xAccountToEncryptedAddress;

    /// @notice Mapping from encrypted address to encrypted balance
    mapping(bytes32 => euint64) public encryptedBalances;

    /// @notice Current index for the circular buffer of recent recipients
    uint256 public currentRecipientIndex;

    /// @notice Total number of recipients (for tracking purposes)
    uint256 public totalRecipients;

    /// @notice Mapping to track withdrawal requests
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    
    /// @notice Counter for withdrawal request IDs
    uint256 public withdrawalRequestCounter;

    /// @notice Struct to store withdrawal request information
    struct WithdrawalRequest {
        string xAccountId;
        address requester;
        bool isProcessed;
        uint256 timestamp;
    }

    /// @notice Events
    event XAccountBound(string indexed xAccountId, address indexed userAddress);
    event FundsDeposited(string indexed xAccountId, uint256 amount);
    event BatchWithdrawal(address indexed withdrawer, uint256 totalAmount);
    event WithdrawalRequested(string indexed xAccountId, uint256 requestId, address indexed requester);
    event WithdrawalCompleted(string indexed xAccountId, address indexed recipient, uint256 amount);

    /// @notice Bind a user's X account ID to their encrypted wallet address
    /// @param xAccountId The X account ID (e.g., "@username")
    /// @param encryptedUserAddress External encrypted address of the user
    /// @param inputProof Input proof for the encrypted address
    function bindXAccount(
        string calldata xAccountId,
        externalEaddress encryptedUserAddress,
        bytes calldata inputProof
    ) external {
        require(bytes(xAccountId).length > 0, "X account ID cannot be empty");

        // Convert external encrypted address to internal eaddress
        eaddress userEncryptedAddress = FHE.fromExternal(encryptedUserAddress, inputProof);

        // Note: In production, you would want to verify that only the actual owner
        // of the wallet address can bind it to their X account
        // For simplicity, we allow any caller to bind any X account

        // Store the binding
        xAccountToEncryptedAddress[xAccountId] = userEncryptedAddress;

        // Initialize balance to zero if not already set
        bytes32 addressKey = FHE.toBytes32(userEncryptedAddress);
        encryptedBalances[addressKey] = FHE.asEuint64(uint64(0));

        // Set up ACL permissions
        FHE.allowThis(userEncryptedAddress);
        FHE.allow(userEncryptedAddress, msg.sender);
        FHE.allowThis(encryptedBalances[addressKey]);
        FHE.allow(encryptedBalances[addressKey], msg.sender);

        emit XAccountBound(xAccountId, msg.sender);
    }

    /// @notice Send ETH to an X account by increasing their encrypted balance
    /// @param xAccountId The target X account ID
    function sendToXAccount(string calldata xAccountId) external payable {
        require(msg.value > 0, "Must send some ETH");
        require(bytes(xAccountId).length > 0, "X account ID cannot be empty");

        // Get the encrypted address for this X account
        eaddress recipientEncryptedAddress = xAccountToEncryptedAddress[xAccountId];
        require(FHE.toBytes32(recipientEncryptedAddress) != bytes32(0), "X account not bound");

        bytes32 addressKey = FHE.toBytes32(recipientEncryptedAddress);

        // Convert ETH amount to encrypted uint64 (in wei)
        euint64 encryptedAmount = FHE.asEuint64(uint64(msg.value));

        // Add to the recipient's encrypted balance
        encryptedBalances[addressKey] = FHE.add(encryptedBalances[addressKey], encryptedAmount);

        totalRecipients++;

        // Set up ACL permissions
        FHE.allowThis(encryptedBalances[addressKey]);
        FHE.allowThis(recipientEncryptedAddress);

        emit FundsDeposited(xAccountId, msg.value);
    }

    /// @notice Get encrypted balance for a user's X account
    /// @param xAccountId The X account ID
    /// @return The encrypted balance
    function getEncryptedBalance(string calldata xAccountId) external view returns (euint64) {
        eaddress userEncryptedAddress = xAccountToEncryptedAddress[xAccountId];
        require(FHE.toBytes32(userEncryptedAddress) != bytes32(0), "X account not bound");
        bytes32 addressKey = FHE.toBytes32(userEncryptedAddress);
        return encryptedBalances[addressKey];
    }

    /// @notice Get encrypted address for an X account
    /// @param xAccountId The X account ID
    /// @return The encrypted address
    function getEncryptedAddress(string calldata xAccountId) external view returns (eaddress) {
        return xAccountToEncryptedAddress[xAccountId];
    }

    /// @notice Check if an X account is bound to an encrypted address
    /// @param xAccountId The X account ID
    /// @return True if the X account is bound
    function isXAccountBound(string calldata xAccountId) external view returns (bool) {
        eaddress encAddress = xAccountToEncryptedAddress[xAccountId];
        bytes32 addressBytes = FHE.toBytes32(encAddress);
        return addressBytes != bytes32(0);
    }

    /// @notice Get contract balance
    /// @return The contract's ETH balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get information about recent recipients (for debugging/monitoring)
    /// @return The current recipient index and total recipients count
    function getRecipientInfo() external view returns (uint256, uint256) {
        return (currentRecipientIndex, totalRecipients);
    }

    /// @notice Request withdrawal of funds from a user's X account
    /// @param xAccountId The X account ID to withdraw from
    /// @dev This initiates the withdrawal process by requesting decryption of the encrypted address and balance
    /// The actual authorization happens in the callback when we verify the decrypted address matches the caller
    function requestWithdrawal(string calldata xAccountId) external returns (uint256) {
        require(bytes(xAccountId).length > 0, "X account ID cannot be empty");
        
        // Get the encrypted address for this X account
        eaddress userEncryptedAddress = xAccountToEncryptedAddress[xAccountId];
        require(FHE.toBytes32(userEncryptedAddress) != bytes32(0), "X account not bound");
        
        bytes32 addressKey = FHE.toBytes32(userEncryptedAddress);
        euint64 encryptedBalance = encryptedBalances[addressKey];
        
        // Create withdrawal request
        uint256 requestId = ++withdrawalRequestCounter;
        withdrawalRequests[requestId] = WithdrawalRequest({
            xAccountId: xAccountId,
            requester: msg.sender,
            isProcessed: false,
            timestamp: block.timestamp
        });
        
        // Prepare ciphertexts for decryption (address and balance)
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(userEncryptedAddress);  // First decrypt the address
        cts[1] = FHE.toBytes32(encryptedBalance);       // Then decrypt the balance
        
        // Request decryption with callback - this returns the actual request ID from KMS
        uint256 kmsRequestId = FHE.requestDecryption(cts, this.withdrawalCallback.selector);
        
        // Update our withdrawal request with the KMS request ID
        withdrawalRequests[requestId] = WithdrawalRequest({
            xAccountId: xAccountId,
            requester: msg.sender,
            isProcessed: false,
            timestamp: kmsRequestId  // Store KMS request ID in timestamp field for lookup
        });
        
        emit WithdrawalRequested(xAccountId, kmsRequestId, msg.sender);
        return kmsRequestId;
    }
    
    /// @notice Callback function for withdrawal decryption
    /// @param requestId The request ID for this decryption
    /// @param decryptedValues Array of decrypted values [address, balance]
    /// @param signatures Array of signatures from the KMS
    function withdrawalCallback(
        uint256 requestId,
        uint256[] memory decryptedValues,
        bytes[] memory signatures
    ) public {
        // Verify the signatures from KMS
        FHE.checkSignatures(requestId, signatures);
        
        // Find the withdrawal request by matching KMS request ID in timestamp field
        uint256 foundIndex = 0;
        bool found = false;
        for (uint256 i = 1; i <= withdrawalRequestCounter; i++) {
            if (withdrawalRequests[i].timestamp == requestId && !withdrawalRequests[i].isProcessed) {
                foundIndex = i;
                found = true;
                break;
            }
        }
        require(found, "Withdrawal request not found");
        
        // Get the withdrawal request
        WithdrawalRequest storage request = withdrawalRequests[foundIndex];
        
        // Mark as processed
        request.isProcessed = true;
        
        // Extract decrypted values
        address decryptedAddress = address(uint160(decryptedValues[0]));
        uint64 decryptedBalance = uint64(decryptedValues[1]);
        
        // Authorization: Only allow withdrawal if the decrypted address matches the original requester
        // This ensures only the true owner of the encrypted address can withdraw
        require(decryptedAddress == request.requester, "Unauthorized: decrypted address does not match requester");
        
        // Zero out the balance in storage
        eaddress userEncryptedAddress = xAccountToEncryptedAddress[request.xAccountId];
        bytes32 addressKey = FHE.toBytes32(userEncryptedAddress);
        encryptedBalances[addressKey] = FHE.asEuint64(uint64(0));
        
        // Set up ACL permissions for the zeroed balance
        FHE.allowThis(encryptedBalances[addressKey]);
        
        // Transfer ETH to the decrypted address
        if (decryptedBalance > 0 && address(this).balance >= decryptedBalance) {
            payable(decryptedAddress).transfer(decryptedBalance);
            emit WithdrawalCompleted(request.xAccountId, decryptedAddress, decryptedBalance);
        }
    }

    /// @notice Get withdrawal request details
    /// @param requestId The withdrawal request ID
    /// @return The withdrawal request details
    function getWithdrawalRequest(uint256 requestId) external view returns (WithdrawalRequest memory) {
        return withdrawalRequests[requestId];
    }
    
    /// @notice Check if a withdrawal request is processed
    /// @param requestId The withdrawal request ID
    /// @return True if the withdrawal request is processed
    function isWithdrawalProcessed(uint256 requestId) external view returns (bool) {
        return withdrawalRequests[requestId].isProcessed;
    }
    
    /// @notice Get the total number of withdrawal requests
    /// @return The total number of withdrawal requests
    function getTotalWithdrawalRequests() external view returns (uint256) {
        return withdrawalRequestCounter;
    }

    /// @notice Emergency function to allow contract owner to withdraw excess funds
    /// @dev This should only be used in emergency situations
    function emergencyWithdraw() external {
        // In a production environment, you might want to add access control here
        payable(msg.sender).transfer(address(this).balance);
    }

    /// @notice Fallback function to receive ETH
    receive() external payable {}

    /// @notice Fallback function to receive ETH
    fallback() external payable {}
}
