// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.12;

import "../global/GlobalConfig.sol";

contract TestGlobalConfig {
    GlobalConfig public _globalConfig;

    function setUp() public {
        _globalConfig = new GlobalConfig();
    }

    function addBroker() external {
        return _globalConfig.addBroker(address(1));
    }
}
