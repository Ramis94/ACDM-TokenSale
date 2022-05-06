import { task } from "hardhat/config";

task("unstake")
  .addParam("contract", "The contract address")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "SimpleStaking",
      taskArgs.contract
    );
    await contract.unstake();
  });
