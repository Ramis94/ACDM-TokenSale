import { task } from "hardhat/config";

task("removeOrder")
  .addParam("contract", "The contract address")
  .addParam("id", "The order id")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "ACDMPlatform",
      taskArgs.contract
    );
    console.log(await contract.removeOrder(taskArgs.id));
  });
