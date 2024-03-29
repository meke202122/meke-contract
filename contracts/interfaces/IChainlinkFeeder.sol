// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.12;


// see https://github.com/smartcontractkit/chainlink/blob/v0.7.2/evm/contracts/interfaces/AggregatorInterface.sol
interface IChainlinkFeeder {
    function latestAnswer() external view returns (int256);

    function latestTimestamp() external view returns (uint256);
}
