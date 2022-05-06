import { ethers } from "hardhat";

async function main() {
  const name = "ACDMToken";
  const contractFactory = await ethers.getContractFactory(name);
  const contract = await contractFactory.deploy();

  await contract.deployed();

  console.log(name + " deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
