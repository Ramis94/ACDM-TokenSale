import { task } from "hardhat/config";

task("mint", "mint 1_000_000_000 token")
  .addParam("contract", "The contract address")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "XXXToken",
      taskArgs.contract
    );
    let account;
    [account] = await hre.ethers.getSigners();
    console.log(await contract.mint(account.address, hre.ethers.utils.parseEther("1000000000")));
  });
