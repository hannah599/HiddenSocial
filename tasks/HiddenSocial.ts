import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("hiddensocial:bind", "Bind X account to encrypted address")
  .addParam("xaccount", "X account ID (e.g., @username)")
  .addParam("address", "User's wallet address to encrypt")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { fhevm, ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();
    await fhevm.initializeCLIApi()
    const HiddenSocialDeployment = await deployments.get("HiddenSocial");
    const contract = await ethers.getContractAt("HiddenSocial", HiddenSocialDeployment.address);
    
    // Create encrypted input
    const input = fhevm.createEncryptedInput(HiddenSocialDeployment.address, signer.address);
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
  .addParam("xaccount", "Target X account ID")
  .addParam("amount", "Amount of ETH to send (in ETH)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();
    
    const HiddenSocialDeployment = await deployments.get("HiddenSocial");
    const contract = await ethers.getContractAt("HiddenSocial", HiddenSocialDeployment.address);
    
    const amountWei = ethers.parseEther(taskArguments.amount);
    
    console.log("Sending", taskArguments.amount, "ETH to X account:", taskArguments.xaccount);
    
    const transaction = await contract.sendToXAccount(taskArguments.xaccount, {
      value: amountWei,
    });
    
    await transaction.wait();
    console.log("Transaction hash:", transaction.hash);
    console.log("ETH sent successfully!");
  });

task("hiddensocial:withdraw", "Request withdrawal from X account")
  .addParam("xaccount", "X account ID to withdraw from")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();
    
    const HiddenSocialDeployment = await deployments.get("HiddenSocial");
    const contract = await ethers.getContractAt("HiddenSocial", HiddenSocialDeployment.address);
    
    console.log("Requesting withdrawal for X account:", taskArguments.xaccount);
    
    const transaction = await contract.requestWithdrawal(taskArguments.xaccount);
    await transaction.wait();
    
    console.log("Transaction hash:", transaction.hash);
    console.log("Withdrawal request submitted!");
  });

task("hiddensocial:balance", "Get contract balance and info")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    
    const HiddenSocialDeployment = await deployments.get("HiddenSocial");
    const contract = await ethers.getContractAt("HiddenSocial", HiddenSocialDeployment.address);
    
    const contractBalance = await contract.getContractBalance();
    
    console.log("Contract address:", HiddenSocialDeployment.address);
    console.log("Contract balance:", ethers.formatEther(contractBalance), "ETH");
  });

task("hiddensocial:check", "Check if X account is bound")
  .addParam("xaccount", "X account ID to check")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    
    const HiddenSocialDeployment = await deployments.get("HiddenSocial");
    const contract = await ethers.getContractAt("HiddenSocial", HiddenSocialDeployment.address);
    
    const isBound = await contract.isXAccountBound(taskArguments.xaccount);
    
    console.log("X account:", taskArguments.xaccount);
    console.log("Is bound:", isBound);
    
    if (isBound) {
      const encryptedAddress = await contract.getEncryptedAddress(taskArguments.xaccount);
      console.log("Encrypted address handle:", encryptedAddress);
    }
  });