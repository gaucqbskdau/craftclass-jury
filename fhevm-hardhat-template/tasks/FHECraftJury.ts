import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("craft:create-group", "Create a new group")
  .addParam("name", "The group name")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const deployment = await deployments.get("FHECraftJury");
    const contract = await ethers.getContractAt("FHECraftJury", deployment.address);

    const tx = await contract.connect(signer).createGroup(taskArguments.name);
    const receipt = await tx.wait();

    console.log(`Group created in tx: ${receipt?.hash}`);
    const groupCount = await contract.groupCount();
    console.log(`Total groups: ${groupCount}`);
  });

task("craft:register-work", "Register a new work")
  .addParam("title", "The work title")
  .addParam("category", "Category: 0=Leather, 1=Wood, 2=Mixed")
  .addParam("group", "Group ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const deployment = await deployments.get("FHECraftJury");
    const contract = await ethers.getContractAt("FHECraftJury", deployment.address);

    const tx = await contract
      .connect(signer)
      .registerWork(taskArguments.title, parseInt(taskArguments.category), parseInt(taskArguments.group));
    const receipt = await tx.wait();

    console.log(`Work registered in tx: ${receipt?.hash}`);
    const workCount = await contract.workCount();
    console.log(`Total works: ${workCount}`);
  });

task("craft:set-deadline", "Set scoring deadline")
  .addParam("timestamp", "Unix timestamp for deadline")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const deployment = await deployments.get("FHECraftJury");
    const contract = await ethers.getContractAt("FHECraftJury", deployment.address);

    const tx = await contract.connect(signer).setScoringDeadline(parseInt(taskArguments.timestamp));
    const receipt = await tx.wait();

    console.log(`Deadline set in tx: ${receipt?.hash}`);
    console.log(`Deadline: ${new Date(parseInt(taskArguments.timestamp) * 1000).toISOString()}`);
  });

task("craft:aggregate", "Aggregate group scores")
  .addParam("group", "Group ID to aggregate")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const deployment = await deployments.get("FHECraftJury");
    const contract = await ethers.getContractAt("FHECraftJury", deployment.address);

    const tx = await contract.connect(signer).aggregateGroup(parseInt(taskArguments.group));
    const receipt = await tx.wait();

    console.log(`Group aggregated in tx: ${receipt?.hash}`);
  });

task("craft:info", "Get contract info").setAction(async function (taskArguments: TaskArguments, hre) {
  const { ethers, deployments } = hre;

  const deployment = await deployments.get("FHECraftJury");
  const contract = await ethers.getContractAt("FHECraftJury", deployment.address);

  const workCount = await contract.workCount();
  const groupCount = await contract.groupCount();
  const deadline = await contract.scoringDeadline();

  console.log("FHECraftJury Contract Info");
  console.log("==========================");
  console.log(`Address: ${deployment.address}`);
  console.log(`Total Works: ${workCount}`);
  console.log(`Total Groups: ${groupCount}`);
  console.log(`Scoring Deadline: ${deadline > 0 ? new Date(Number(deadline) * 1000).toISOString() : "Not set"}`);
});

