import { ethers } from "hardhat";

async function main() {
  const name = "DAO";
  const contractFactory = await ethers.getContractFactory(name);
  let account;
  [account] = await ethers.getSigners();
  const contract = await contractFactory.deploy(
    account.address,
    40,
    3 * (60 * 60 * 24),
    "0x4E7F004714b381b0A51843A2F7d0BE9865Fe07E9"
  );

  await contract.deployed();

  console.log(name + " deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
