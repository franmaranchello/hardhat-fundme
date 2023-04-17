import { deployments } from "hardhat";
describe("FundMe", async function () {
    let fundMe;
    beforeEach(async function () {
        deployments.fixture(["all"]);
    });

    describe("constructor", async function () {});
});
