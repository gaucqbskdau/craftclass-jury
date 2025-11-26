import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { FHECraftJury } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("FHECraftJury - Sepolia Integration", function () {
  let contract: FHECraftJury;
  let admin: HardhatEthersSigner;

  before(async function () {
    // Skip if not on Sepolia
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111n) {
      this.skip();
    }

    await deployments.fixture(["FHECraftJury"]);
    const deployment = await deployments.get("FHECraftJury");
    contract = await ethers.getContractAt("FHECraftJury", deployment.address);

    [admin] = await ethers.getSigners();
  });

  it("Should be deployed on Sepolia", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
  });

  it("Should have admin role assigned to deployer", async function () {
    const ADMIN_ROLE = await contract.ADMIN_ROLE();
    expect(await contract.userRoles(admin.address)).to.equal(ADMIN_ROLE);
  });

  it("Should have default thresholds set", async function () {
    // Thresholds are encrypted, so we just verify they exist
    const goldThreshold = await contract.goldThreshold();
    expect(goldThreshold).to.not.equal(0);
  });

  it("Should allow group creation", async function () {
    const tx = await contract.connect(admin).createGroup("Sepolia Test Group");
    await tx.wait();

    const groupCount = await contract.groupCount();
    expect(groupCount).to.be.gte(1);
  });
});

