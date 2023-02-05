import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig } from "../helper-hardhat-config";
import "dotenv/config";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const { deploy, log } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();
    const chainId = network.config.chainId!;
    let ethUsdPriceFeedAddress;
    if (networkConfig[chainId].isLocalDev) {
        ethUsdPriceFeedAddress = (await hre.deployments.get("MockV3Aggregator"))
            .address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
    }

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
    });

    log("FundMe deployed!");

    if (!networkConfig[chainId].isLocalDev && process.env.ETHERSCAN_API_KEY) {
        // verify deployed contract on etherscan
    }

    log("-----------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
