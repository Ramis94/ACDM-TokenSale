import { ethers } from "hardhat";

async function main() {
  const name = "ACDMPlatform";
  const contractFactory = await ethers.getContractFactory(name);
  const contract = await contractFactory.deploy(
    "0xa09C9C4BdCFA9181fBd3cd557bDF3Aa5E6bf58c8",
    3 * (60 * 60 * 24),
    "0xc778417E063141139Fce010982780140Aa0cD5Ab"
  );

  await contract.deployed();

  console.log(name + " deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
