// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.12;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/Address.sol";

import {LibMathSigned, LibMathUnsigned} from "../lib/LibMath.sol";
import "../lib/LibTypes.sol";
import "../interfaces/IGlobalConfig.sol";
import "../interfaces/IPriceFeeder.sol";
import "../interfaces/IPerpetual.sol";


contract FundingGovernance {
    using LibMathSigned for int256;
    using LibMathUnsigned for uint256;

    LibTypes.FundingGovernanceConfig internal governance;
    LibTypes.FundingState internal fundingState;

    // auto-set when calling setGovernanceParameter
    int256 public emaAlpha2; // 1 - emaAlpha
    int256 public emaAlpha2Ln; // ln(emaAlpha2)

    IPerpetual public perpetualProxy;
    IPriceFeeder public priceFeeder;
    IGlobalConfig public globalConfig;

    event UpdateGovernanceParameter(bytes32 indexed key, int256 value);

    constructor(address _globalConfig) {
        require(_globalConfig != address(0), "invalid global config");
        globalConfig = IGlobalConfig(_globalConfig);
    }

    modifier onlyMultiSigned() {
        if(globalConfig.multiSigned(msg.sender, msg.sig, msg.data)){
            _;
        }
    }

    modifier onlyAuthorized() {
        require(globalConfig.isComponent(msg.sender), "unauthorized caller");
        _;
    }

    /**
     * @dev Set governance parameters.
     *
     * @param key   Name of parameter.
     * @param value Value of parameter.
     */
    function setGovernanceParameter(bytes32 key, int256 value) public onlyMultiSigned {
        if (key == "emaAlpha") {
            require(value > 0, "alpha should be > 0");
            require(value <= 10**18, "alpha should be <= 1");
            governance.emaAlpha = value;
            emaAlpha2 = 10**18 - governance.emaAlpha;
            emaAlpha2Ln = emaAlpha2.wln();
        } else if (key == "updatePremiumPrize") {
            governance.updatePremiumPrize = value.toUint256();
        } else if (key == "markPremiumLimit") {
            governance.markPremiumLimit = value;
        } else if (key == "fundingDampener") {
            governance.fundingDampener = value;
        } else if (key == "accumulatedFundingPerContract") {
            require(perpetualProxy.status() == LibTypes.Status.EMERGENCY, "wrong perpetual status");
            fundingState.accumulatedFundingPerContract = value;
        } else if (key == "priceFeeder") {
            address addr = address(uint160(uint256(value)));
            require(Address.isContract(addr), "wrong address");
            priceFeeder = IPriceFeeder(addr);
        } else {
            revert("key not exists");
        }
        emit UpdateGovernanceParameter(key, value);
    }

    // get governance data structure.
    function getGovernance() public view returns (LibTypes.FundingGovernanceConfig memory) {
        return governance;
    }
}
