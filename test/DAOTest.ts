import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ACDMToken, ACDMToken__factory,
  DAO, DAO__factory,
  Staking, Staking__factory,
  XXXToken, XXXToken__factory
} from "../typechain";
import { BigNumberish } from "ethers";
import { parseUnits } from "@ethersproject/units/src.ts";

describe("DAO", function() {
  let acdmToken: ACDMToken;
  let xxxToken: XXXToken;
  let staking: Staking;
  let dao: DAO;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const debatingPeriondDuration = 3 * (60 * 60 * 24);

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();

    const ACDMTokenContractFactory = (await ethers.getContractFactory(
      "ACDMToken",
      owner
    )) as ACDMToken__factory;
    acdmToken = await ACDMTokenContractFactory.deploy();
    await acdmToken.deployed();

    const XXXTokenContractFactory = (await ethers.getContractFactory(
      "XXXToken",
      owner
    )) as XXXToken__factory;
    xxxToken = await XXXTokenContractFactory.deploy();
    await xxxToken.deployed();

    const stakingFactory = (await ethers.getContractFactory(
      "Staking",
      owner
    )) as Staking__factory;
    staking = await stakingFactory.deploy(
      acdmToken.address, xxxToken.address
    );
    await staking.deployed;

    Promise.all([
      acdmToken.mint(owner.address, 0),
      acdmToken.mint(addr1.address, 10),
      acdmToken.mint(addr2.address, 10)
    ]);

    const daoFactory = (await ethers.getContractFactory(
      "DAO",
      owner
    )) as DAO__factory;
    dao = await daoFactory.deploy(
      owner.address,
      40,
      debatingPeriondDuration,
      staking.address
    );
    await dao.deployed;

    await staking.setDAO(dao.address);
  });

  it("should create voting and finish with INVALID status & then repeat finish", async function() {
    await startVote(1, 2);
    await stopThread();
    await expect(dao.connect(addr2).finish(1)).to.emit(dao, "VotingFinished").withArgs(1, 3, 3);
    await expect(dao.connect(addr2).finish(1)).to.revertedWith("DAO: Voting already finished");
  });

  it("should create voting and finish with REJECTED status", async function() {
    await startVote(10, 5);
    await stopThread();
    await expect(dao.connect(addr2).finish(1)).to.emit(dao, "VotingFinished").withArgs(1, 15, 2);
  });

  it("should create voting and finish with ACCEPTED status & withdraw", async function() {
    await startVote(5, 10);
    await stopThread();
    await expect(dao.connect(addr2).finish(1)).to.emit(dao, "VotingFinished").withArgs(1, 15, 1);
    await expect(staking.connect(addr2).unstake()).to.be.ok;
  });

  it("should voting is not finished & withdraw is blocked", async function() {
    await startVote(5, 10);
    await expect(staking.connect(addr2).unstake()).to.revertedWith("Staking: tokens is locked");
    await expect(dao.connect(addr2).finish(1)).to.revertedWith("DAO: vote is not finished");
  });

  it("should vote after finish", async function() {
    await startVote(5, 10);
    await stopThread();
    await expect(dao.connect(addr2).finish(1)).to.emit(dao, "VotingFinished").withArgs(1, 15, 1);
    await expect(dao.vote(1, 1)).to.revertedWith("DAO: dao is finished");
  });

  it("should balance is zero", async function() {
    await startVote(1, 1);
    await expect(dao.vote(1, 0)).to.revertedWith("DAO: balance is zero");
  });

  it("should voting error finished", async function() {
    const ABI = [
      "function aApprove(address spender, uint256 amount)"
    ];
    const iface = new ethers.utils.Interface(ABI);
    await expect(dao.connect(owner).addProposal(
      iface.encodeFunctionData("aApprove", [owner.address, 100]),
      acdmToken.address,
      "first vote")
    ).to.emit(dao, "CreateVoting").withArgs(1, "first vote");

    const firstVoteCount = 5;
    const secondVoteCount = 10;

    await expect(acdmToken.connect(addr1).approve(staking.address, firstVoteCount)).to.be.ok;
    await expect(staking.connect(addr1).stake(firstVoteCount)).to.be.ok;

    await expect(acdmToken.connect(addr2).approve(staking.address, secondVoteCount)).to.be.ok;
    await expect(staking.connect(addr2).stake(secondVoteCount)).to.be.ok;

    await expect(dao.connect(addr1).vote(1, 1)).to.emit(dao, "Vote").withArgs(1, firstVoteCount, addr1.address, 1);
    await expect(dao.connect(addr2).vote(1, 0)).to.emit(dao, "Vote").withArgs(1, secondVoteCount, addr2.address, 0);

    await stopThread();

    await expect(dao.finish(1)).to.be.revertedWith(
      "DAO: Voting error finished"
    );
  });

  async function startVote(firstVoteCount: BigNumberish, secondVoteCount: BigNumberish) {
    //создание голосование
    const ABI = [
      "function approve(address spender, uint256 amount)"
    ];
    const iface = new ethers.utils.Interface(ABI);

    await expect(dao.connect(owner).addProposal(
      iface.encodeFunctionData("approve", [owner.address, 100]),
      acdmToken.address,
      "first vote")
    ).to.emit(dao, "CreateVoting").withArgs(1, "first vote");

    //левый пользователь создает голосование
    await expect(dao.connect(addr1).addProposal(
      iface.encodeFunctionData("approve", [owner.address, 100]),
      acdmToken.address,
      "first vote")
    ).to.revertedWith("DAO: sender not equal chair person");

    await expect(await acdmToken.connect(addr1).approve(staking.address, firstVoteCount)).to.be.ok;
    await expect(staking.connect(addr1).stake(firstVoteCount)).to.be.ok;

    await expect(await acdmToken.connect(addr2).approve(staking.address, secondVoteCount)).to.be.ok;
    await expect(staking.connect(addr2).stake(secondVoteCount)).to.be.ok;

    await expect(dao.connect(addr1).vote(1, 1)).to.emit(dao, "Vote").withArgs(1, firstVoteCount, addr1.address, 1);
    await expect(dao.connect(addr2).vote(1, 0)).to.emit(dao, "Vote").withArgs(1, secondVoteCount, addr2.address, 0);
  }

  it("should vote not found", async function() {
    await expect(dao.vote(2, 1)).to.revertedWith("Voting not found");
  });

  it("should finish vote if not found", async function() {
    await expect(dao.finish(2)).to.revertedWith("Voting not found");
  });

  async function stopThread() {
    await ethers.provider.send("evm_increaseTime", [debatingPeriondDuration]);
  }
});
