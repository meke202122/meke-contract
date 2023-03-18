// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity 0.7.6;


interface IPriceFeeder {
    function price() external view returns (uint256 lastPrice, uint256 lastTimestamp);
}
