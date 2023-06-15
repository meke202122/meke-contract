// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.12;


interface IPriceFeeder {
    function price() external view returns (uint256 lastPrice, uint256 lastTimestamp);
}
