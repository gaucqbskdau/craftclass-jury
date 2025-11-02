import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { FHECraftJury } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("FHECraftJury", function () {
  let contract: FHECraftJury;
  let admin: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let instructor: HardhatEthersSigner;

  before(async function () {
    await deployments.fixture(["FHECraftJury"]);
    const deployment = await deployments.get("FHECraftJury");
    contract = await ethers.getContractAt("FHECraftJury", deployment.address);

    [admin, user1, user2, instructor] = await ethers.getSigners();
  });

  describe("Role Management", function () {
    it("Should grant admin role to deployer", async function () {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      expect(await contract.userRoles(admin.address)).to.equal(ADMIN_ROLE);
    });

    it("Should allow admin to grant admin role to others", async function () {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      await expect(contract.connect(admin).grantRole(user1.address, ADMIN_ROLE))
        .to.emit(contract, "RoleGranted")
        .withArgs(user1.address, ADMIN_ROLE);
      
      expect(await contract.userRoles(user1.address)).to.equal(ADMIN_ROLE);
    });

    it("Should not allow non-admin to grant roles", async function () {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      await expect(
        contract.connect(user2).grantRole(instructor.address, ADMIN_ROLE)
      ).to.be.revertedWith("Not admin");
    });
  });

  describe("Group Management", function () {
    it("Should allow admin to create group", async function () {
      await expect(contract.connect(admin).createGroup("Beginner Group"))
        .to.emit(contract, "GroupCreated")
        .withArgs(0, "Beginner Group");

      const group = await contract.getGroup(0);
      expect(group.name).to.equal("Beginner Group");
      expect(group.exists).to.be.true;
    });

    it("Should create multiple groups", async function () {
      await contract.connect(admin).createGroup("Advanced Group");
      const group = await contract.getGroup(1);
      expect(group.name).to.equal("Advanced Group");
    });

    it("Should not allow non-admin to create group", async function () {
      await expect(
        contract.connect(user2).createGroup("Unauthorized Group")
      ).to.be.revertedWith("Not admin");
    });
  });

  describe("Work Registration", function () {
    it("Should allow admin to register work", async function () {
      const Category = { Leather: 0, Wood: 1, Mixed: 2 };
      
      await expect(
        contract.connect(admin).registerWork("Leather Wallet", Category.Leather, 0)
      )
        .to.emit(contract, "WorkRegistered")
        .withArgs(0, "Leather Wallet", Category.Leather, 0);

      const work = await contract.getWork(0);
      expect(work.title).to.equal("Leather Wallet");
      expect(work.category).to.equal(Category.Leather);
      expect(work.groupId).to.equal(0);
    });

    it("Should register multiple works", async function () {
      const Category = { Leather: 0, Wood: 1, Mixed: 2 };
      
      await contract.connect(admin).registerWork("Wood Table", Category.Wood, 0);
      await contract.connect(admin).registerWork("Mixed Craft", Category.Mixed, 1);

      const work1 = await contract.getWork(1);
      expect(work1.title).to.equal("Wood Table");
      
      const work2 = await contract.getWork(2);
      expect(work2.title).to.equal("Mixed Craft");
      expect(work2.groupId).to.equal(1);
    });

    it("Should not allow registration to non-existent group", async function () {
      await expect(
        contract.connect(admin).registerWork("Invalid", 0, 999)
      ).to.be.revertedWith("Group does not exist");
    });
  });

  describe("Scoring", function () {
    it("Should allow anyone to submit encrypted scores", async function () {
      // Use mock encrypted values (0x-prefixed hex)
      // In a real test, these would come from fhevmUtils.encrypt
      const encCrafts = "0x" + "00".repeat(32);
      const encDetail = "0x" + "00".repeat(32);
      const encOrigin = "0x" + "00".repeat(32);
      const inputProof = "0x";

      await expect(
        contract.connect(user1).submitScore(0, encCrafts, encDetail, encOrigin, inputProof)
      )
        .to.emit(contract, "ScoreSubmitted")
        .withArgs(0, user1.address, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));

      expect(await contract.hasJudgeScoredWork(0, user1.address)).to.be.true;
      expect(await contract.getWorkJudgeCount(0)).to.equal(1);
    });

    it("Should allow multiple users to score same work", async function () {
      const encCrafts = "0x" + "00".repeat(32);
      const encDetail = "0x" + "00".repeat(32);
      const encOrigin = "0x" + "00".repeat(32);
      const inputProof = "0x";

      await contract.connect(user2).submitScore(0, encCrafts, encDetail, encOrigin, inputProof);
      expect(await contract.getWorkJudgeCount(0)).to.equal(2);
    });

    it("Should not allow user to score same work twice", async function () {
      const encCrafts = "0x" + "00".repeat(32);
      const encDetail = "0x" + "00".repeat(32);
      const encOrigin = "0x" + "00".repeat(32);
      const inputProof = "0x";

      await expect(
        contract.connect(user1).submitScore(0, encCrafts, encDetail, encOrigin, inputProof)
      ).to.be.revertedWith("Already scored this work");
    });

    it("Should allow any user to score other works", async function () {
      const encCrafts = "0x" + "00".repeat(32);
      const encDetail = "0x" + "00".repeat(32);
      const encOrigin = "0x" + "00".repeat(32);
      const inputProof = "0x";

      await contract.connect(user1).submitScore(1, encCrafts, encDetail, encOrigin, inputProof);
      await contract.connect(user2).submitScore(1, encCrafts, encDetail, encOrigin, inputProof);
      
      // Add third score to work 1 for aggregation test
      const [, , , user3] = await ethers.getSigners();
      await contract.connect(user3).submitScore(1, encCrafts, encDetail, encOrigin, inputProof);
      
      expect(await contract.getWorkJudgeCount(1)).to.equal(3);
    });
  });

  describe("Deadline Management", function () {
    it("Should allow admin to set scoring deadline", async function () {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      await contract.connect(admin).setScoringDeadline(futureTimestamp);
      expect(await contract.scoringDeadline()).to.equal(futureTimestamp);
    });

    it("Should not allow setting deadline in the past", async function () {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;
      await expect(
        contract.connect(admin).setScoringDeadline(pastTimestamp)
      ).to.be.revertedWith("Deadline must be in future");
    });
  });

  describe("Group Aggregation", function () {
    it("Should allow admin to aggregate group anytime", async function () {
      await expect(contract.connect(admin).aggregateGroup(0))
        .to.emit(contract, "GroupAggregated")
        .withArgs(0, 2); // 2 users scored work 0

      const aggregate = await contract.getGroupAggregate(0);
      expect(aggregate.aggregated).to.be.true;
      expect(aggregate.judgeCount).to.equal(2);
    });

    it("Should not allow aggregation of already aggregated group", async function () {
      await expect(
        contract.connect(admin).aggregateGroup(0)
      ).to.be.revertedWith("Already aggregated");
    });

    it("Should aggregate group with minimum 3 scores", async function () {
      await contract.connect(admin).aggregateGroup(1);
      const aggregate = await contract.getGroupAggregate(1);
      expect(aggregate.judgeCount).to.equal(3);
    });

    it("Should not allow non-admin to aggregate", async function () {
      await expect(
        contract.connect(user2).aggregateGroup(0)
      ).to.be.revertedWith("Not admin");
    });
  });

  describe("Award Publishing", function () {
    it("Should allow admin to publish award with decrypted score", async function () {
      // Simulate decrypted score (in production, this comes from decryption oracle)
      const decryptedScore = 83; // Between bronze and silver

      await expect(contract.connect(admin).publishAward(0, decryptedScore))
        .to.emit(contract, "AwardPublished")
        .withArgs(0, decryptedScore, 2); // 2 = Silver

      const award = await contract.publishedAwards(0);
      expect(award.published).to.be.true;
      expect(award.score).to.equal(decryptedScore);
      expect(award.tier).to.equal(2); // Silver
    });

    it("Should assign Gold tier for score >= 85", async function () {
      await contract.connect(admin).publishAward(1, 90);
      const award = await contract.publishedAwards(1);
      expect(award.tier).to.equal(3); // Gold
    });

    it("Should not allow publishing before aggregation", async function () {
      // Group 2 hasn't been aggregated (and doesn't have works)
      await expect(
        contract.connect(admin).publishAward(2, 80)
      ).to.be.revertedWith("Group not aggregated");
    });
  });

  describe("Instructor Authorization", function () {
    it("Should allow admin to authorize instructor", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours

      await expect(
        contract.connect(admin).authorizeInstructor(instructor.address, 0, expiryTime)
      )
        .to.emit(contract, "InstructorAuthorized")
        .withArgs(instructor.address, 0, expiryTime);

      expect(await contract.isInstructorAuthorized(instructor.address, 0)).to.be.true;
    });

    it("Should allow admin to revoke instructor authorization", async function () {
      await expect(
        contract.connect(admin).revokeInstructorAuthorization(instructor.address, 0)
      )
        .to.emit(contract, "InstructorRevoked")
        .withArgs(instructor.address, 0);

      expect(await contract.isInstructorAuthorized(instructor.address, 0)).to.be.false;
    });

    it("Should not allow authorization before aggregation", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;
      
      // Create a new group without aggregation
      await contract.connect(admin).createGroup("Test Group");
      const newGroupId = 2;
      
      await expect(
        contract.connect(admin).authorizeInstructor(instructor.address, newGroupId, expiryTime)
      ).to.be.revertedWith("Group not aggregated");
    });
  });
});

