import { ethers } from "hardhat";

async function main() {
  const name = "Staking";
  const contractFactory = await ethers.getContractFactory(name);
  const contract = await contractFactory.deploy(
    "0x7561E26a63321F4D44725F714b1Bc4537EE0ef18",
    "0xBa90Abed8ac5253EE33cE7e13DfC79D9116aFA85"
  );

  await contract.deployed();

  console.log(name + " deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
