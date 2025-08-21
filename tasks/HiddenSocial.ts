import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("hiddensocial:bind", "Bind X account to encrypted address")
  .addParam("contract", "The contract's address")
  .addParam("xaccount", "X account ID (e.g., @username)")
  .addParam("address", "User's wallet address to encrypt")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { fhevm, ethers } = hre;
    const [signer] = await ethers.getSigners();
    
    const contractFactory = await ethers.getContractFactory("HiddenSocial");
    const contract = contractFactory.attach(taskArguments.contract);
    
    // Create encrypted input
    const input = fhevm.createEncryptedInput(taskArguments.contract, signer.address);
    input.addAddress(taskArguments.address);
    const encryptedInput = await input.encrypt();
    
    console.log("Binding X account:", taskArguments.xaccount);
    console.log("To address:", taskArguments.address);
    
    const transaction = await contract.bindXAccount(
      taskArguments.xaccount,
      encryptedInput.handles[0],
      encryptedInput.inputProof,
    );
    
    await transaction.wait();
    console.log("Transaction hash:", transaction.hash);
    console.log("X account bound successfully!");
  });

task("hiddensocial:send", "Send ETH to X account")
  .addParam("contract", "The contract's address")
  .addParam("xaccount", "Target X account ID")
  .addParam("amount", "Amount of ETH to send (in ETH)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();
    
    const contractFactory = await ethers.getContractFactory("HiddenSocial");
    const contract = contractFactory.attach(taskArguments.contract);
    
    const amountWei = ethers.parseEther(taskArguments.amount);
    
    console.log("Sending", taskArguments.amount, "ETH to X account:", taskArguments.xaccount);
    
    const transaction = await contract.sendToXAccount(taskArguments.xaccount, {
      value: amountWei,
    });
    
    await transaction.wait();
    console.log("Transaction hash:", transaction.hash);
    console.log("ETH sent successfully!");
  });

task("hiddensocial:withdraw", "Perform anonymous withdrawal")
  .addParam("contract", "The contract's address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();
    
    const contractFactory = await ethers.getContractFactory("HiddenSocial");
    const contract = contractFactory.attach(taskArguments.contract);
    
    console.log("Performing anonymous withdrawal...");
    
    const transaction = await contract.anonymousWithdraw();
    await transaction.wait();
    
    console.log("Transaction hash:", transaction.hash);
    console.log("Anonymous withdrawal completed!");
  });

task("hiddensocial:balance", "Get contract balance and info")
  .addParam("contract", "The contract's address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const contractFactory = await ethers.getContractFactory("HiddenSocial");
    const contract = contractFactory.attach(taskArguments.contract);
    
    const contractBalance = await contract.getContractBalance();
    const recipientInfo = await contract.getRecipientInfo();
    const withdrawalAmount = await contract.WITHDRAWAL_AMOUNT();
    const batchCount = await contract.BATCH_WITHDRAWAL_COUNT();
    
    console.log("Contract address:", taskArguments.contract);
    console.log("Contract balance:", ethers.formatEther(contractBalance), "ETH");
    console.log("Current recipient index:", recipientInfo[0].toString());
    console.log("Total recipients:", recipientInfo[1].toString());
    console.log("Withdrawal amount per recipient:", ethers.formatEther(withdrawalAmount), "ETH");
    console.log("Batch withdrawal count:", batchCount.toString());
  });

task("hiddensocial:check", "Check if X account is bound")
  .addParam("contract", "The contract's address")
  .addParam("xaccount", "X account ID to check")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const contractFactory = await ethers.getContractFactory("HiddenSocial");
    const contract = contractFactory.attach(taskArguments.contract);
    
    const isBound = await contract.isXAccountBound(taskArguments.xaccount);
    
    console.log("X account:", taskArguments.xaccount);
    console.log("Is bound:", isBound);
    
    if (isBound) {
      const encryptedAddress = await contract.getEncryptedAddress(taskArguments.xaccount);
      console.log("Encrypted address handle:", encryptedAddress);
    }
  });