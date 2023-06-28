// SPDX-License-Identifier: GPL-2.0-or-later


pragma solidity ^0.8.12;
pragma abicoder v2;

import "../interfaces/IPerpetual.sol";

contract TestSet{
    function set(address _perpetual,uint256 price) public {
        IPerpetual perpetual = IPerpetual(_perpetual);
        perpetual.setFairPrice(price);
    }
}
