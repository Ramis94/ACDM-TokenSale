import { task } from "hardhat/config";

task("claim")
  .addParam("contract", "The contract address")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "SimpleStaking",
      taskArgs.contract
    );
    await contract.claim();
  });
