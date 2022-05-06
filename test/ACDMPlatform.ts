import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ACDMToken,
  ACDMToken__factory,
  DAO,
  DAO__factory,
  Staking,
  Staking__factory,
  XXXToken,
  XXXToken__factory,
  ACDMPlatform,
  ACDMPlatform__factory,
  ETHMock,
  ETHMock__factory
} from "../typechain";

describe("ACDMPlatform", function() {
  let eth: ETHMock;
  let acdmPlatform: ACDMPlatform;
  let acdmToken: ACDMToken;
  let xxxToken: XXXToken;
  let staking: Staking;
  let dao: DAO;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let refer1: SignerWithAddress;
  let refer2: SignerWithAddress;

  const threeDays = 3 * (60 * 60 * 24);

  beforeEach(async function() {
    [owner, addr1, addr2, refer1, refer2] = await ethers.getSigners();

    const ETHMockFactory = (await ethers.getContractFactory(
      "ETHMock",
      owner
    )) as ETHMock__factory;
    eth = await ETHMockFactory.deploy("ETH", "ETH");
    await eth.deployed();

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
    staking = await stakingFactory.deploy(acdmToken.address, xxxToken.address);
    await staking.deployed;

    await Promise.all([
      acdmToken.mint(addr1.address, 100),
      acdmToken.mint(addr2.address, 100)
    ]);

    await Promise.all([
      eth.mint(addr1.address, ethers.utils.parseEther("2")),
      eth.mint(addr2.address, ethers.utils.parseEther("1"))
    ]);

    const daoFactory = (await ethers.getContractFactory(
      "DAO",
      owner
    )) as DAO__factory;
    dao = await daoFactory.deploy(
      owner.address,
      40,
      threeDays,
      staking.address
    );
    await dao.deployed;

    await staking.setDAO(dao.address);

    const acdmPlatformFactory = (await ethers.getContractFactory(
      "ACDMPlatform",
      owner
    )) as ACDMPlatform__factory;
    acdmPlatform = await acdmPlatformFactory.deploy(
      acdmToken.address,
      threeDays,
      eth.address
    );
    await acdmPlatform.deployed;

    await eth
      .connect(addr1)
      .approve(acdmPlatform.address, ethers.utils.parseEther("2"));
    await eth
      .connect(addr2)
      .approve(acdmPlatform.address, ethers.utils.parseEther("1"));
  });

  it("should start without register", async function() {
    await startPlatform();
  });

  it("should start with one refer level", async function() {
    await acdmPlatform.connect(refer1)["register()"]();
    await acdmPlatform.connect(addr1)["register(address)"](refer1.address);
    await expect(await eth.balanceOf(refer1.address)).to.be.equal(0);
    await startPlatform();
    await expect(await eth.balanceOf(refer1.address)).to.be.not.equal(0);
  });

  it("should start with two refer level", async function() {
    await acdmPlatform.connect(refer1)["register()"]();
    await acdmPlatform.connect(refer2)["register(address)"](refer1.address);
    await acdmPlatform.connect(addr1)["register(address)"](refer2.address);
    await expect(await eth.balanceOf(refer1.address)).to.be.equal(0);
    await expect(await eth.balanceOf(refer2.address)).to.be.equal(0);
    await startPlatform();
    await expect(await eth.balanceOf(refer1.address)).to.be.not.equal(0);
    await expect(await eth.balanceOf(refer2.address)).to.be.not.equal(0);
  });

  async function startPlatform() {
    await acdmPlatform.startSaleRound();
    await expect(acdmPlatform.connect(addr1).buyACDM(50_000))
      .to.emit(acdmPlatform, "ACDMBought")
      .withArgs(addr1.address, 50_000);
    await expect(acdmPlatform.connect(addr2).buyACDM(49_000))
      .to.emit(acdmPlatform, "ACDMBought")
      .withArgs(addr2.address, 49_000);
    stopThread();
    // buyACDM start trade round
    await expect(acdmPlatform.connect(addr1).buyACDM(0)).to.emit(
      acdmPlatform,
      "TradeRoundStarted"
    );

    await acdmToken.connect(addr1).approve(acdmPlatform.address, 100_000);
    await expect(acdmPlatform.connect(addr1).addOrder(50_000, 123000)).to.emit(
      acdmPlatform,
      "OrderAdded"
    ).withArgs(1, addr1.address, 50_000, 123000);
    await expect(
      acdmPlatform.connect(addr1).removeOrder(190)
    ).to.be.revertedWith("ACDMPlatform: Order not found");
    await expect(
      acdmPlatform.connect(addr2).removeOrder(1)
    ).to.be.revertedWith("ACDMPlatform: Error delete. You're not owner");
    await expect(
      acdmPlatform
        .connect(addr1)
        .removeOrder(1)
    ).to.emit(acdmPlatform, "OrderDeleted")
      .withArgs(1);

    await expect(acdmPlatform.connect(addr1).addOrder(50_000, 256000))
      .to.emit(acdmPlatform, "OrderAdded")
      .withArgs(2, addr1.address, 50_000, 256000);
    await expect(acdmPlatform.connect(addr2).redeemOrder(2, 50_000))
      .to.emit(acdmPlatform, "OrderRedeemed")
      .withArgs(addr2.address, 50_000);
    stopThread();
    await expect(acdmPlatform.connect(addr2).redeemOrder(2, 2))
      .to.emit(acdmPlatform, "SaleRoundStarted");
  }

  async function stopThread() {
    await ethers.provider.send("evm_increaseTime", [threeDays]);
  }
});
