import { task } from "hardhat/config";

task("finish")
  .addParam("contract", "The contract address")
  .addParam("votingid")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "DAO",
      taskArgs.contract
    );
    console.log(await contract.finish(taskArgs.votingid));
  });
