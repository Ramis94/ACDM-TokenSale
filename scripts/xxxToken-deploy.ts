import { ethers } from "hardhat";

async function main() {
  const name = "XXXToken";
  const contractFactory = await ethers.getContractFactory(name);
  console.log(1);
  const contract = await contractFactory.deploy();
  console.log(2);
  await contract.deployed();

  console.log(3);

  console.log(name + " deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
