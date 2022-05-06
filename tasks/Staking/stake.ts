import { task } from "hardhat/config";

task("stake")
  .addParam("contract", "The contract address")
  .addParam("amount", "amount")
  .setAction(async (taskArgs, hre) => {
    const amount = hre.ethers.utils.parseEther(taskArgs.amount);
    const contract = await hre.ethers.getContractAt(
      "SimpleStaking",
      taskArgs.contract
    );
    await contract.stake(amount);
  });
