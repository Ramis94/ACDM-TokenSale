// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { Staking__factory, Staking, ACDMToken, ACDMToken__factory, XXXToken, XXXToken__factory } from "../typechain";
// import { describe } from "mocha";
//
// const helper = require("@openzeppelin/test-helpers");
//
// describe("StakingTest", function() {
//   let acdmToken: ACDMToken;
//   let xxxToken: XXXToken;
//   let staking: Staking;
//   let owner: SignerWithAddress;
//   let addr1: SignerWithAddress;
//
//   beforeEach(async function() {
//     [owner, addr1] = await ethers.getSigners();
//
//     const ACDMTokenContractFactory = (await ethers.getContractFactory(
//       "ACDMToken",
//       owner
//     )) as ACDMToken__factory;
//     acdmToken = await ACDMTokenContractFactory.deploy();
//     await acdmToken.deployed();
//
//     const XXXTokenContractFactory = (await ethers.getContractFactory(
//       "XXXToken",
//       owner
//     )) as XXXToken__factory;
//     xxxToken = await XXXTokenContractFactory.deploy();
//     await xxxToken.deployed();
//
//     const stakingFactory = (await ethers.getContractFactory(
//       "Staking",
//       owner
//     )) as Staking__factory;
//     staking = await stakingFactory.deploy(
//       acdmToken.address, xxxToken.address
//     );
//     await staking.deployed;
//
//     Promise.all([
//       acdmToken.mint(owner.address, ethers.utils.parseEther("12")),
//       acdmToken.mint(addr1.address, ethers.utils.parseEther("23"))
//     ]);
//   });
//
//   describe("Staking", function() {
//     it("should stake zero amount", async function() {
//       await expect(staking.stake(0)).to.be.revertedWith(
//         "SimpleStaking: Cannot stake nothing"
//       );
//     });
//
//     it("should revert stake without allowance", async function() {
//       const toTransfer = ethers.utils.parseEther("1");
//       await expect(staking.connect(addr1).stake(toTransfer))
//         .to.be.revertedWith("ERC20: insufficient allowance");
//     });
//
//     it("should stake", async function() {
//       const toTransfer = ethers.utils.parseEther("3");
//       await acdmToken.connect(addr1).approve(staking.address, toTransfer);
//       expect(
//         await staking
//           .stakers(addr1.address)
//           .then((value) => value.balance.toString())
//       ).to.equal("0");
//
//       await expect(staking.connect(addr1).stake(toTransfer))
//         .to.emit(staking, "Stake")
//         .withArgs(addr1.address, toTransfer);
//
//       expect(
//         await staking
//           .stakers(addr1.address)
//           .then((value) => value.balance.toString())
//       ).to.equal(toTransfer);
//     });
//
//     it("should double stake without interval", async function() {
//       const toFirstTransfer = ethers.utils.parseEther("4");
//       const toSecondTransfer = ethers.utils.parseEther("6");
//       await acdmToken.connect(addr1).approve(staking.address, toFirstTransfer.add(toSecondTransfer));
//       expect(
//         await staking
//           .stakers(addr1.address)
//           .then((value) => value.balance.toString())
//       ).to.equal("0");
//       await expect(staking.connect(addr1).stake(toFirstTransfer))
//         .to.emit(staking, "Stake")
//         .withArgs(addr1.address, toFirstTransfer);
//
//       await expect(staking.connect(addr1).stake(toSecondTransfer))
//         .to.emit(staking, "Stake")
//         .withArgs(addr1.address, toSecondTransfer);
//       expect(
//         await staking
//           .stakers(addr1.address)
//           .then((value) => value.balance.toString())
//       ).to.equal(toFirstTransfer.add(toSecondTransfer));
//     });
//
//     it("should double stake with interval 1 hour", async function() {
//       const toFirstTransfer = ethers.utils.parseEther("4");
//       const toSecondTransfer = ethers.utils.parseEther("6");
//       await acdmToken.connect(addr1).approve(staking.address, toFirstTransfer.add(toSecondTransfer));
//       expect(
//         await staking
//           .stakers(addr1.address)
//           .then((value) => value.balance.toString())
//       ).to.equal("0");
//       await expect(staking.connect(addr1).stake(toFirstTransfer))
//         .to.emit(staking, "Stake")
//         .withArgs(addr1.address, toFirstTransfer);
//       await helper.time.increase(3600);
//       await expect(staking.connect(addr1).stake(toSecondTransfer))
//         .to.emit(staking, "Stake")
//         .withArgs(addr1.address, toSecondTransfer);
//       await staking
//         .stakers(addr1.address)
//         .then((value) => {
//           expect(value.balance.toString()).to.equal(
//             toFirstTransfer.add(toSecondTransfer)
//           );
//           expect(value.claimedReward.toString()).to.not.equal("0.0");
//         });
//     });
//   });
//
//   describe("Unstaking", function() {
//     it("unstake after 20 minutes", async function() {
//       const toTransfer = ethers.utils.parseEther("3");
//       await acdmToken.connect(addr1).approve(staking.address, toTransfer);
//       await expect(staking.connect(addr1).stake(toTransfer))
//         .to.emit(staking, "Stake")
//         .withArgs(addr1.address, toTransfer);
//       await helper.time.increase(21 * 60);
//       await expect(staking.connect(addr1).unstake())
//         .to.emit(staking, "Unstake")
//         .withArgs(addr1.address, toTransfer);
//     });
//     it("if nothing unstake", async function() {
//       await expect(staking.connect(addr1).unstake())
//         .to.be.revertedWith("SimpleStaking: Nothing to unstake");
//     });
//   });
//
//   describe("Claim", function() {
//     it("claim after 10 minutes after stake", async function() {
//       const toTransfer = ethers.utils.parseEther("3");
//       await acdmToken.connect(addr1).approve(staking.address, toTransfer);
//       await expect(staking.connect(addr1).stake(toTransfer))
//         .to.emit(staking, "Stake")
//         .withArgs(addr1.address, toTransfer);
//       await helper.time.increase(11 * 60);
//       await expect(staking.connect(addr1).claim())
//         .to.emit(staking, "Claim");
//     });
//     it("claim after double stake with intervals", async function() {
//       const toFirstTransfer = ethers.utils.parseEther("4");
//       const toSecondTransfer = ethers.utils.parseEther("6");
//       await acdmToken.connect(addr1).approve(staking.address, toFirstTransfer.add(toSecondTransfer));
//       await expect(
//         await staking
//           .stakers(addr1.address)
//           .then((value) => value.balance.toString())
//       ).to.equal("0");
//       await expect(staking.connect(addr1).stake(toFirstTransfer))
//         .to.emit(staking, "Stake")
//         .withArgs(addr1.address, toFirstTransfer);
//       await helper.time.increase(700);
//
//       await expect(
//         await staking
//           .stakers(addr1.address)
//           .then((value) => value.claimedReward.toString())
//       ).to.be.equal("0");
//
//       await expect(staking.connect(addr1).stake(toSecondTransfer))
//         .to.emit(staking, "Stake")
//         .withArgs(addr1.address, toSecondTransfer);
//       await expect(
//         staking
//           .stakers(addr1.address)
//           .then((value) => value.claimedReward.toString())
//       ).to.be.not.equal("0");
//       await helper.time.increase(7000);
//       await expect(staking.connect(addr1).claim())
//         .to.emit(staking, "Claim");
//     });
//   });
//
//   describe("test other methods", function() {
//     it("calculateYieldTotal for 1 year", async function() {
//       const startTime = await helper.time.latest();
//       await helper.time.increase(31536000);
//       const bigNumberPromise = await staking.calculateYieldTotal({
//         balance: ethers.utils.parseEther("10"),
//         startStakeTimestamp: startTime.toString(),
//         claimedReward: 0
//       });
//       await expect(ethers.utils.formatEther(bigNumberPromise).startsWith("15.")).to.be.true;
//     });
//
//     it("updateFreezingTime", async function() {
//       const contractTransaction = await staking.updateFreezingTime(123);
//       await expect(await contractTransaction.wait()).to.be.ok;
//     });
//     it("updatePercent", async function() {
//       const contractTransaction = await staking.updatePercent(123);
//       await expect(await contractTransaction.wait()).to.be.ok;
//     });
//     it("updateDepositTerm", async function() {
//       const contractTransaction = await staking.updateDepositTerm(123);
//       await expect(await contractTransaction.wait()).to.be.ok;
//     });
//   });
// });
