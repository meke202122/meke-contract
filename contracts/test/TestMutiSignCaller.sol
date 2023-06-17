// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;
pragma abicoder v2;

import "../lib/WhitelistMultiSign.sol";

contract TestMultiSignCaller {
    WhitelistMultiSign internal admin;
    uint public value;

    constructor(address adminAddress) {
        admin = WhitelistMultiSign(adminAddress);
    }

    modifier onlyMultiSign() {
        if (admin.multiSigned(msg.sender, msg.sig, msg.data)) {
            _;
        }
    }

    function writeDemo1(uint newValue) external onlyMultiSign {
        value = newValue;
    }
}
