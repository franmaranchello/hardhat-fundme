import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
    networkConfig,
    DECIMALS,
    INITIAL_ANSWER,
} from "../helper-hardhat-config";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const { deploy, log } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();
    const chainId = network.config.chainId!;
    if (networkConfig[chainId].isLocalDev) {
        log("Local dev network detected. Deploying mocks...");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        });
        log("Mocks deployed!");
        log("-----------------------------------------------");
    }
};

module.exports.tags = ["all", "mocks"];
