import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain-types";
import { assert, expect } from "chai";
import { networkConfig } from "../../helper-hardhat-config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("FundMe", async () => {
    let fundMe: FundMe;
    let mockV3Aggregator: MockV3Aggregator;
    let deployer: string;
    const sendValue = ethers.utils.parseEther("1"); // 1 ETH

    beforeEach(async () => {
        if (!networkConfig[network.config.chainId!].isLocalDev) {
            throw "You need to be on a development chain to run tests";
        }
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = (await ethers.getContract("FundMe")) as unknown as FundMe;
        mockV3Aggregator = (await ethers.getContract(
            "MockV3Aggregator"
        )) as unknown as MockV3Aggregator;
    });

    describe("constructor", async () => {
        it("Sets the aggregator addresses correctly", async () => {
            const response = await fundMe.priceFeedContract();
            assert.equal(response, mockV3Aggregator.address);
        });
    });

    describe("fund", async () => {
        it("Fails when minimum amount of ETH isn't met", async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            );
        });

        it("Updates the amount funded data structure", async () => {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.addressToAmountFunded(deployer);
            assert.equal(response.toString(), sendValue.toString());
        });

        it("Adds funder to array of funders", async () => {
            await fundMe.fund({ value: sendValue });
            const funder = await fundMe.funders(0);
            assert.equal(funder, deployer);
        });
    });

    describe("withdraw", async () => {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue });
        });

        it("Withdraws ETH from the founder address", async () => {
            const startingContractBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);

            const endingContractBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            assert.equal(endingContractBalance.toString(), "0");
            assert.equal(
                startingContractBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            );
        });

        it("Withdraws with multiple founders", async () => {
            const accounts = await ethers.getSigners();
            for (let i = 1; i < 6; i++) {
                const fundmeConnectedContract = await fundMe.connect(
                    accounts[i]
                );
                await fundmeConnectedContract.fund({ value: sendValue });
            }
            const startingContractBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);

            const endingContractBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            assert.equal(endingContractBalance.toString(), "0");
            assert.equal(
                startingContractBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            );

            await expect(fundMe.funders(0)).to.be.reverted;

            for (let i = 1; i < 6; i++) {
                assert.equal(
                    (
                        await fundMe.addressToAmountFunded(accounts[i].address)
                    ).toString(),
                    "0"
                );
            }
        });

        it("Only allows the owner to withdraw", async () => {
            const accounts = await ethers.getSigners();
            const attacker = accounts[1];
            const attackerConnectedContract = fundMe.connect(attacker);
            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });
    });
});
