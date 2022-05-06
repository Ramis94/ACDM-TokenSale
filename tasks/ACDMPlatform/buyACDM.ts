import { task } from "hardhat/config";

task("buyACDM")
  .addParam("contract", "The contract address")
  .addParam("amount", "The tokens amount")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "ACDMPlatform",
      taskArgs.contract
    );
    console.log(await contract.buyACDM(taskArgs.amount));
  });
