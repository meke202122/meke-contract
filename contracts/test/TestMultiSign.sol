// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;
pragma abicoder v2;

import "../lib/MultiSign.sol";

contract TestMultiSign is MultiSign {
    uint public lastBlockNumber;
    uint public lastTimestamp;
    address public lastWriter;

    constructor(address[] memory signers) MultiSign(signers) {
        lastBlockNumber = block.number;
        lastTimestamp = block.timestamp;
        lastWriter = msg.sender;
    }

    function writeDemo1() external onlyMultiSigned {
        lastBlockNumber = block.number;
        lastTimestamp = block.timestamp;
        lastWriter = msg.sender;
    }

    function writeDemo2() external onlyMultiSigned {
        lastBlockNumber = block.number;
        lastTimestamp = block.timestamp;
        lastWriter = msg.sender;
    }

    function getMsg(
        uint8 a
    ) public view returns (address sender, bytes4 sig, bytes memory data) {
        require( a >0 ," a must be > 0");
        sender = msg.sender;
        sig = msg.sig;
        data = msg.data;
    }
}
