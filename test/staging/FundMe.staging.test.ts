import { getNamedAccounts, ethers, network } from "hardhat";
import { assert, expect } from "chai";
import { networkConfig } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

networkConfig[network.config.chainId!].isLocalDev
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe: FundMe;
          let deployer: SignerWithAddress;
          const sendValue = ethers.utils.parseEther("0.01");
          this.beforeEach(async function () {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              fundMe = (await ethers.getContract(
                  "FundMe",
                  deployer
              )) as unknown as FundMe;
          });

          it("Allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue, gasLimit: 100000 });
              await fundMe.cheaperWithdraw({ gasLimit: 100000 });
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.equal(endingBalance.toString(), "0");
          });
      });
