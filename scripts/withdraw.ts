import { getNamedAccounts, ethers } from "hardhat";

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Withdrawing from contract...");
    const transactionResponse = await fundMe.cheaperWithdraw();
    await transactionResponse.wait(1);
    console.log("Funds withdrawn!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(0);
    });
