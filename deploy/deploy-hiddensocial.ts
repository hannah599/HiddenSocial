import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying HiddenSocial contract...");
  console.log("Deployer address:", deployer);

  const hiddenSocial = await deploy("HiddenSocial", {
    from: deployer,
    args: [], // No constructor arguments needed
    log: true,
    deterministicDeployment: false,
  });

  console.log(`HiddenSocial contract deployed to: ${hiddenSocial.address}`);
  console.log(`Transaction hash: ${hiddenSocial.transactionHash}`);
  
};

func.tags = ["HiddenSocial"];
func.id = "deploy_hidden_social";

export default func;