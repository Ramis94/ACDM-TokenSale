import { task } from "hardhat/config";

task("addOrder")
  .addParam("contract", "The contract address")
  .addParam("amount", "The tokens amount")
  .addParam("price", "The tokens price")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "ACDMPlatform",
      taskArgs.contract
    );
    console.log(await contract.addOrder(taskArgs.amount, taskArgs.price));
  });
