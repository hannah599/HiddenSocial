import { expect } from "chai";
import hre, { ethers, fhevm } from "hardhat";
import type { HiddenSocial } from "../types";

describe("HiddenSocial", function () {
  let contract: HiddenSocial;
  let contractAddress: string;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("HiddenSocial");
    contract = await contractFactory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();

    console.log("Contract deployed to:", contractAddress);
  });

  describe("X Account Binding", function () {
    it("Should bind X account to encrypted address", async function () {
      const xAccountId = "@testuser1";
      
      // Create encrypted input for user1's address
      const input = fhevm.createEncryptedInput(contractAddress, user1.address);
      input.addAddress(user1.address);
      const encryptedInput = await input.encrypt();

      // Bind X account
      await expect(
        contract.connect(user1).bindXAccount(
          xAccountId,
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.emit(contract, "XAccountBound")
       .withArgs(xAccountId, user1.address);

      // Check if account is bound
      const isBound = await contract.isXAccountBound(xAccountId);
      expect(isBound).to.be.true;
    });

    it("Should not allow empty X account ID", async function () {
      const input = fhevm.createEncryptedInput(contractAddress, user1.address);
      input.addAddress(user1.address);
      const encryptedInput = await input.encrypt();

      await expect(
        contract.connect(user1).bindXAccount(
          "",
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.be.revertedWith("X account ID cannot be empty");
    });

    it("Should return false for unbound X account", async function () {
      const isBound = await contract.isXAccountBound("@nonexistent");
      expect(isBound).to.be.false;
    });
  });

  describe("Sending ETH to X Account", function () {
    beforeEach(async function () {
      // Bind user1's X account first
      const xAccountId = "@testuser1";
      const input = fhevm.createEncryptedInput(contractAddress, user1.address);
      input.addAddress(user1.address);
      const encryptedInput = await input.encrypt();

      await contract.connect(user1).bindXAccount(
        xAccountId,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
    });

    it("Should send ETH to bound X account", async function () {
      const xAccountId = "@testuser1";
      const sendAmount = ethers.parseEther("1.0");

      await expect(
        contract.connect(user2).sendToXAccount(xAccountId, { value: sendAmount })
      ).to.emit(contract, "FundsDeposited")
       .withArgs(xAccountId, sendAmount);

      // Check contract balance
      const contractBalance = await contract.getContractBalance();
      expect(contractBalance).to.equal(sendAmount);

      // Check recipient info
      const recipientInfo = await contract.getRecipientInfo();
      expect(recipientInfo[1]).to.equal(1); // totalRecipients should be 1
    });

    it("Should not send to unbound X account", async function () {
      const sendAmount = ethers.parseEther("1.0");

      await expect(
        contract.connect(user2).sendToXAccount("@nonexistent", { value: sendAmount })
      ).to.be.revertedWith("X account not bound");
    });

    it("Should not send zero ETH", async function () {
      const xAccountId = "@testuser1";

      await expect(
        contract.connect(user2).sendToXAccount(xAccountId, { value: 0 })
      ).to.be.revertedWith("Must send some ETH");
    });

    it("Should not send to empty X account ID", async function () {
      const sendAmount = ethers.parseEther("1.0");

      await expect(
        contract.connect(user2).sendToXAccount("", { value: sendAmount })
      ).to.be.revertedWith("X account ID cannot be empty");
    });
  });

  describe("Withdrawal Functionality", function () {
    beforeEach(async function () {
      // Bind user1's X account and send some ETH to it
      const xAccountId = "@testuser1";
      const input = fhevm.createEncryptedInput(contractAddress, user1.address);
      input.addAddress(user1.address);
      const encryptedInput = await input.encrypt();

      await contract.connect(user1).bindXAccount(
        xAccountId,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Send funds to the account
      const sendAmount = ethers.parseEther("0.1");
      await contract.connect(user2).sendToXAccount(xAccountId, { value: sendAmount });
    });

    it("Should request withdrawal successfully", async function () {
      const xAccountId = "@testuser1";

      // Request withdrawal
      const tx = await contract.connect(user1).requestWithdrawal(xAccountId);
      
      // Should emit withdrawal request event
      await expect(tx)
        .to.emit(contract, "WithdrawalRequested")
    });

    it("Should not allow withdrawal for unbound account", async function () {
      await expect(
        contract.connect(user1).requestWithdrawal("@nonexistent")
      ).to.be.revertedWith("X account not bound");
    });

    it("Should not allow withdrawal with empty X account ID", async function () {
      await expect(
        contract.connect(user1).requestWithdrawal("")
      ).to.be.revertedWith("X account ID cannot be empty");
    });

    it("Should allow withdrawal request from any user but only process for correct owner", async function () {
      const xAccountId = "@testuser1";

      // user2 can request withdrawal from user1's account, but it won't be processed in callback
      // since the decrypted address won't match user2's address
      const tx = await contract.connect(user2).requestWithdrawal(xAccountId);
      
      // Should emit withdrawal request event
      await expect(tx)
        .to.emit(contract, "WithdrawalRequested");
        
      // The actual authorization happens in the callback when addresses are compared
    });

    it("Should track withdrawal requests correctly", async function () {
      const xAccountId = "@testuser1";

      // Request withdrawal
      await contract.connect(user1).requestWithdrawal(xAccountId);

      // Check withdrawal request details
      const request = await contract.getWithdrawalRequest(1);
      expect(request.xAccountId).to.equal(xAccountId);
      expect(request.requester).to.equal(user1.address);
      expect(request.isProcessed).to.be.false;

      // Check processed status
      const isProcessed = await contract.isWithdrawalProcessed(1);
      expect(isProcessed).to.be.false;

      // Check total withdrawal requests
      const totalRequests = await contract.getTotalWithdrawalRequests();
      expect(totalRequests).to.equal(1);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Set up test data
      const xAccountId = "@testuser1";
      const input = fhevm.createEncryptedInput(contractAddress, user1.address);
      input.addAddress(user1.address);
      const encryptedInput = await input.encrypt();

      await contract.connect(user1).bindXAccount(
        xAccountId,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      const sendAmount = ethers.parseEther("2.0");
      await contract.connect(user2).sendToXAccount(xAccountId, { value: sendAmount });
    });

    it("Should return correct contract balance", async function () {
      const balance = await contract.getContractBalance();
      expect(balance).to.equal(ethers.parseEther("2.0"));
    });

    it("Should return correct recipient info", async function () {
      const recipientInfo = await contract.getRecipientInfo();
      expect(recipientInfo[0]).to.equal(0); // currentRecipientIndex
      expect(recipientInfo[1]).to.equal(1); // totalRecipients
    });

    it("Should return encrypted address for bound account", async function () {
      const xAccountId = "@testuser1";
      const encryptedAddress = await contract.getEncryptedAddress(xAccountId);
      
      // Should return a non-zero bytes32 value (encrypted address handle)
      expect(encryptedAddress).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should return encrypted balance for bound account", async function () {
      const xAccountId = "@testuser1";
      const encryptedBalance = await contract.getEncryptedBalance(xAccountId);
      
      // Should return a non-zero bytes32 value (encrypted balance handle)
      expect(encryptedBalance).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should revert when getting balance for unbound account", async function () {
      await expect(
        contract.getEncryptedBalance("@nonexistent")
      ).to.be.revertedWith("X account not bound");
    });
  });

  describe("Withdrawal Request Management", function () {
    beforeEach(async function () {
      // Set up multiple X accounts for testing
      const accounts = ["@user1", "@user2", "@user3"];
      const signers = [user1, user2, user3];
      
      for (let i = 0; i < accounts.length; i++) {
        const input = fhevm.createEncryptedInput(contractAddress, signers[i].address);
        input.addAddress(signers[i].address);
        const encryptedInput = await input.encrypt();

        await contract.connect(signers[i]).bindXAccount(
          accounts[i],
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );

        // Send funds to each account
        const sendAmount = ethers.parseEther("0.1");
        await contract.connect(owner).sendToXAccount(accounts[i], { value: sendAmount });
      }
    });

    it("Should handle multiple withdrawal requests", async function () {
      // Request withdrawals for multiple accounts
      await contract.connect(user1).requestWithdrawal("@user1");
      await contract.connect(user2).requestWithdrawal("@user2");
      await contract.connect(user3).requestWithdrawal("@user3");

      // Check total withdrawal requests
      const totalRequests = await contract.getTotalWithdrawalRequests();
      expect(totalRequests).to.equal(3);

      // Verify each request
      for (let i = 1; i <= 3; i++) {
        const request = await contract.getWithdrawalRequest(i);
        expect(request.xAccountId).to.equal(`@user${i}`);
        expect(request.isProcessed).to.be.false;
      }
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple deposits to same account", async function () {
      const xAccountId = "@testuser1";
      
      // Bind account
      const input = fhevm.createEncryptedInput(contractAddress, user1.address);
      input.addAddress(user1.address);
      const encryptedInput = await input.encrypt();

      await contract.connect(user1).bindXAccount(
        xAccountId,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Send multiple deposits
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("2.0");

      await contract.connect(user2).sendToXAccount(xAccountId, { value: amount1 });
      await contract.connect(user3).sendToXAccount(xAccountId, { value: amount2 });

      const totalBalance = await contract.getContractBalance();
      expect(totalBalance).to.equal(amount1 + amount2);

      // Should count as 2 recipients (same account funded twice)
      const recipientInfo = await contract.getRecipientInfo();
      expect(recipientInfo[1]).to.equal(2); // totalRecipients
    });

    it("Should handle multiple recipient accounts", async function () {
      // Fund 15 accounts
      for (let i = 0; i < 15; i++) {
        const xAccountId = `@testuser${i}`;
        
        const input = fhevm.createEncryptedInput(contractAddress, user1.address);
        input.addAddress(user1.address);
        const encryptedInput = await input.encrypt();

        await contract.connect(user1).bindXAccount(
          xAccountId,
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );

        const sendAmount = ethers.parseEther("0.1");
        await contract.connect(owner).sendToXAccount(xAccountId, { value: sendAmount });
      }

      const recipientInfo = await contract.getRecipientInfo();
      expect(recipientInfo[0]).to.equal(0); // currentRecipientIndex (not used in new implementation)
      expect(recipientInfo[1]).to.equal(15); // totalRecipients
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow emergency withdrawal", async function () {
      // Send some ETH to contract
      await owner.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("1.0")
      });

      const initialBalance = await contract.getContractBalance();
      expect(initialBalance).to.equal(ethers.parseEther("1.0"));

      // Emergency withdraw
      await contract.connect(owner).emergencyWithdraw();

      const finalBalance = await contract.getContractBalance();
      expect(finalBalance).to.equal(0);
    });
  });
});