// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.6;
pragma abicoder v2;

import "../lib/LibTypes.sol";
import "../interface/IPerpetual.sol";

contract ContractReader {
    struct GovParams {
        LibTypes.PerpGovernanceConfig perpGovernanceConfig;
        LibTypes.AMMGovernanceConfig ammGovernanceConfig;
        address amm; // AMM contract address
        address poolAccount; // AMM account address
    }

    struct PerpetualStorage {
        address collateralTokenAddress;
        uint256 totalSize;
        int256 insuranceFundBalance;
        int256 longSocialLossPerContract;
        int256 shortSocialLossPerContract;
        bool isEmergency;
        bool isGlobalSettled;
        uint256 globalSettlePrice;
        bool isPaused;
        bool isWithdrawDisabled;
        LibTypes.FundingState fundingParams;
        uint256 oraclePrice;
        uint256 oracleTime;
    }

    function getGovParams(address perpetualAddress) public view returns (GovParams memory params) {
        IPerpetual perpetual = IPerpetual(perpetualAddress);
        params.perpGovernanceConfig = perpetual.getGovernance();
        params.ammGovernanceConfig = perpetual.amm().getGovernance();
        params.amm = address(perpetual.amm());
        params.poolAccount = address(perpetual.amm().perpetualProxy());
    }

    function getPerpetualStorage(address perpetualAddress) public view returns (PerpetualStorage memory params) {
        IPerpetual perpetual = IPerpetual(perpetualAddress);
        params.collateralTokenAddress = address(perpetual.collateral());

        params.totalSize = perpetual.totalSize(LibTypes.Side.LONG);
        params.insuranceFundBalance = perpetual.insuranceFundBalance();
        params.longSocialLossPerContract = perpetual.socialLossPerContract(LibTypes.Side.LONG);
        params.shortSocialLossPerContract = perpetual.socialLossPerContract(LibTypes.Side.SHORT);

        params.isEmergency = perpetual.status() == LibTypes.Status.EMERGENCY;
        params.isGlobalSettled = perpetual.status() == LibTypes.Status.SETTLED;
        params.globalSettlePrice = perpetual.settlementPrice();
        params.isPaused = perpetual.paused();
        params.isWithdrawDisabled = perpetual.withdrawDisabled();

        params.fundingParams = perpetual.amm().lastFundingState();
        (params.oraclePrice, params.oracleTime) = perpetual.amm().indexPrice();
    }

    function getAccountStorage(address perpetualAddress, address trader)
        public
        view
        returns (LibTypes.MarginAccount memory margin)
    {
        IPerpetual perpetual = IPerpetual(perpetualAddress);
        return perpetual.getMarginAccount(trader);
    }
}