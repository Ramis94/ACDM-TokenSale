import { task } from "hardhat/config";

task("redeemOrder")
  .addParam("contract", "The contract address")
  .addParam("id", "The order id")
  .addParam("amount", "The tokens amount")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "ACDMPlatform",
      taskArgs.contract
    );
    console.log(await contract.redeemOrder(taskArgs.id, taskArgs.amount));
  });
