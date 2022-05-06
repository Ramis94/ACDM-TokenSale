import { task } from "hardhat/config";

task("startSaleRound")
  .addParam("contract", "The contract address")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt(
      "ACDMPlatform",
      taskArgs.contract
    );
    console.log(await contract.startSaleRound());
  });
