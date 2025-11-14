import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy FHECraftJury contract with no constructor arguments
  const deployed = await deploy("FHECraftJury", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`FHECraftJury contract deployed at: ${deployed.address}`);
};

export default func;
func.id = "deploy_fhe_craft_jury";
func.tags = ["FHECraftJury"];

