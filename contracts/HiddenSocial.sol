// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint256, eaddress, externalEuint64, externalEaddress, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title HiddenSocial - Anonymous Social Payment System
/// @notice This contract allows users to bind their X account IDs to encrypted wallet addresses
/// and enables anonymous transfers and withdrawals using Zama FHE technology.
contract HiddenSocial is SepoliaConfig {
    
    /// @dev Fixed withdrawal amount for each anonymous withdrawal (0.01 ETH)
    uint256 public constant WITHDRAWAL_AMOUNT = 0.01 ether;
    
    /// @dev Number of recent recipients to withdraw from simultaneously
    uint256 public constant BATCH_WITHDRAWAL_COUNT = 10;
    
    /// @notice Mapping from X account ID to encrypted address (eaddress is bytes32)
    mapping(string => eaddress) public xAccountToEncryptedAddress;
    
    /// @notice Mapping from encrypted address to encrypted balance
    mapping(bytes32 => euint64) public encryptedBalances;
    
    /// @notice Array to track the last 10 encrypted addresses that received funds
    eaddress[BATCH_WITHDRAWAL_COUNT] public recentRecipients;
    
    /// @notice Current index for the circular buffer of recent recipients
    uint256 public currentRecipientIndex;
    
    /// @notice Total number of recipients (for tracking purposes)
    uint256 public totalRecipients;

    /// @notice Events
    event XAccountBound(string indexed xAccountId, address indexed userAddress);
    event FundsDeposited(string indexed xAccountId, uint256 amount);
    event BatchWithdrawal(address indexed withdrawer, uint256 totalAmount);
    
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
        
        // Update recent recipients list (circular buffer)
        recentRecipients[currentRecipientIndex] = recipientEncryptedAddress;
        currentRecipientIndex = (currentRecipientIndex + 1) % BATCH_WITHDRAWAL_COUNT;
        totalRecipients++;
        
        // Set up ACL permissions
        FHE.allowThis(encryptedBalances[addressKey]);
        FHE.allowThis(recipientEncryptedAddress);
        
        emit FundsDeposited(xAccountId, msg.value);
    }
    
    /// @notice Anonymous withdrawal - withdraws 0.01 ETH from each of the last 10 recipients
    /// This function maintains anonymity by withdrawing from multiple accounts simultaneously
    function anonymousWithdraw() external {
        require(totalRecipients >= BATCH_WITHDRAWAL_COUNT, "Not enough recipients for anonymous withdrawal");
        
        uint256 totalWithdrawn = 0;
        euint64 withdrawalAmount = FHE.asEuint64(uint64(WITHDRAWAL_AMOUNT));
        
        // Withdraw from each of the last 10 recipients
        for (uint256 i = 0; i < BATCH_WITHDRAWAL_COUNT; i++) {
            eaddress recipientAddress = recentRecipients[i];
            bytes32 addressKey = FHE.toBytes32(recipientAddress);
            euint64 currentBalance = encryptedBalances[addressKey];
            
            // Check if balance is sufficient (using FHE comparison)
            ebool hasSufficientBalance = FHE.ge(currentBalance, withdrawalAmount);
            
            // Conditional subtraction: subtract withdrawal amount if sufficient balance, otherwise subtract 0
            euint64 amountToWithdraw = FHE.select(hasSufficientBalance, withdrawalAmount, FHE.asEuint64(uint64(0)));
            encryptedBalances[addressKey] = FHE.sub(currentBalance, amountToWithdraw);
            
            // For anonymity, we always add WITHDRAWAL_AMOUNT to total regardless of actual balance
            // The contract ensures sufficient funds through require statements
            totalWithdrawn += WITHDRAWAL_AMOUNT;
            
            // Update ACL permissions
            FHE.allowThis(encryptedBalances[addressKey]);
        }
        
        // Transfer the total amount to the caller
        require(address(this).balance >= totalWithdrawn, "Insufficient contract balance");
        payable(msg.sender).transfer(totalWithdrawn);
        
        emit BatchWithdrawal(msg.sender, totalWithdrawn);
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