// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;
pragma abicoder v2;

import "./MultiSign.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract WhitelistMultiSign is MultiSign {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet internal whitelist;

    event CallerAdded(address caller);
    event CallerRemoved(address caller);

    constructor(
        address[] memory signers,
        address[] memory callers
    ) MultiSign(signers) {
        for (uint i = 0; i < callers.length; i++) {
            if (callers[i] != address(0)) {
                whitelist.add(callers[i]);
            }
        }
    }
    
    function multiSigned(address msgSender, bytes4 msgSig, bytes memory msgData) external returns (bool passed){
      require(whitelist.contains(msg.sender),"caller not in whitelist");
      passed=_multiSigned(msgSender, msgSig, msgData);
    }

    function getCallers() external view returns (address[] memory) {
        return whitelist.values();
    }

    function getCallerCount() external view returns (uint256) {
        return whitelist.length();
    }

    function getCallerAt(uint256 index) external view returns (address) {
        return whitelist.at(index);
    }

    function addCaller(address caller) external onlyMultiSigned returns (bool succ) {
        require(!whitelist.contains(caller), "already in whitelist");
        succ = whitelist.add(caller);
        emit CallerAdded(caller);
    }

    function removeCaller(address caller) external onlyMultiSigned returns (bool succ) {
        require(whitelist.contains(caller), "not found in whitelist");
        succ = whitelist.remove(caller);
        emit CallerRemoved(caller);
    }
}
