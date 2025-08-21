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

  describe("Anonymous Withdrawal", function () {
    beforeEach(async function () {
      // Bind and fund 10 different X accounts to enable anonymous withdrawal
      for (let i = 0; i < 10; i++) {
        const xAccountId = `@testuser${i}`;
        const signer = i < 3 ? [user1, user2, user3][i] : user1; // Use available signers
        
        // Bind account
        const input = fhevm.createEncryptedInput(contractAddress, signer.address);
        input.addAddress(signer.address);
        const encryptedInput = await input.encrypt();

        await contract.connect(signer).bindXAccount(
          xAccountId,
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );

        // Send funds to account
        const sendAmount = ethers.parseEther("0.1"); // Send more than withdrawal amount
        await contract.connect(owner).sendToXAccount(xAccountId, { value: sendAmount });
      }
    });

    it("Should perform anonymous withdrawal successfully", async function () {
      const withdrawalAmount = await contract.WITHDRAWAL_AMOUNT();
      const batchCount = await contract.BATCH_WITHDRAWAL_COUNT();
      const expectedTotal = withdrawalAmount * batchCount;

      const initialBalance = await ethers.provider.getBalance(user1.address);

      const tx = await contract.connect(user1).anonymousWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(user1.address);
      const actualReceived = finalBalance - initialBalance + gasUsed;

      expect(actualReceived).to.equal(expectedTotal);

      await expect(tx)
        .to.emit(contract, "BatchWithdrawal")
        .withArgs(user1.address, expectedTotal);
    });

    it("Should not allow withdrawal with insufficient recipients", async function () {
      // Deploy a new contract without setting up recipients
      const contractFactory = await ethers.getContractFactory("HiddenSocial");
      const newContract = await contractFactory.deploy();
      await newContract.waitForDeployment();

      await expect(
        newContract.connect(user1).anonymousWithdraw()
      ).to.be.revertedWith("Not enough recipients for anonymous withdrawal");
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
      expect(recipientInfo[0]).to.equal(1); // currentRecipientIndex
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

  describe("Constants", function () {
    it("Should have correct withdrawal amount", async function () {
      const withdrawalAmount = await contract.WITHDRAWAL_AMOUNT();
      expect(withdrawalAmount).to.equal(ethers.parseEther("0.01"));
    });

    it("Should have correct batch withdrawal count", async function () {
      const batchCount = await contract.BATCH_WITHDRAWAL_COUNT();
      expect(batchCount).to.equal(10);
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

      // Should still only count as 2 recipients (same account funded twice)
      const recipientInfo = await contract.getRecipientInfo();
      expect(recipientInfo[1]).to.equal(2); // totalRecipients
    });

    it("Should handle recipient array wraparound", async function () {
      // Fund 15 accounts (more than batch size of 10)
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
      expect(recipientInfo[0]).to.equal(5); // currentRecipientIndex should wrap around
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