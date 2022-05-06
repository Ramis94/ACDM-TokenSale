import { task } from "hardhat/config";

task("addProposal")
  .addParam("contract")
  .addParam("calldata")
  .addParam("recipient")
  .addParam("description")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "DAO",
      taskArgs.contract
    );
    console.log(await contract.addProposal(taskArgs.calldata, taskArgs.recipient, taskArgs.description));
  });