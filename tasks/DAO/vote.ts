import { task } from "hardhat/config";

task("vote")
  .addParam("contract", "The contract address")
  .addParam("votingid")
  .addParam("option")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "DAO",
      taskArgs.contract
    );
    let option: number;
    if (taskArgs.option == "positive") {
      option = 0;
    } else if (taskArgs.option == "negative") {
      option = 1;
    } else {
      throw new Error("option must be 'positive' or 'negative'");
    }
    console.log(await contract.vote(taskArgs.votingid, option));
  });
