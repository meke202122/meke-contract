// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../lib/LibMath.sol";
import "../interfaces/IChainlinkFeeder.sol";

contract ChainlinkAdapter is Ownable {
    using LibMathSigned for int256;
    using LibMathUnsigned for uint256;

    int256 public constant CHAINLINK_DECIMALS_ADAPTER = 10 ** 10;
    uint256 public constant ONE = 10 ** 18;

    IChainlinkFeeder public feeder;
    uint256 public timeout;
    bool public inversed;

    constructor(address _feeder, uint256 _timeout, bool _inversed) {
        require(_feeder != address(0), "feeder must not be 0 address");
        timeout = _timeout;
        feeder = IChainlinkFeeder(_feeder);
        inversed = _inversed;
    }

    /**
     * @dev Set the timeout of price read from oracle. Only owner is allowed to set the timeout.
     * @param _timeout The timeout in seconds.
     */
    function setTimeout(uint256 _timeout) external onlyOwner {
        timeout = _timeout;
    }
    
    /** Read price from oracle with extra checks.
     */
    function price() public view returns (uint256 newPrice, uint256 timestamp) {
        newPrice = (feeder.latestAnswer().mul(CHAINLINK_DECIMALS_ADAPTER)).toUint256();
        require(newPrice != 0, "price must be greater than 0");
        timestamp = feeder.latestTimestamp();
        require(timestamp <= block.timestamp, "future timestmap");
        require(timestamp.add(timeout) >= block.timestamp, "price timeout");

        if (inversed) {
            newPrice = ONE.wdiv(newPrice);
        }
    }

    /** Read price from oracle with extra checks.
     */
    function truePrice() public view returns (uint256 newPrice, uint256 timestamp) {
        newPrice = (feeder.latestAnswer()).toUint256();
        require(newPrice != 0, "price must be greater than 0");
        timestamp = feeder.latestTimestamp();
        require(timestamp <= block.timestamp, "future timestmap");
        require(timestamp.add(timeout) >= block.timestamp, "price timeout");
    }
}
