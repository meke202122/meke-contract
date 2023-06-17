// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

abstract contract MultiSign {
    using EnumerableMap for EnumerableMap.AddressToUintMap;
    EnumerableMap.AddressToUintMap internal signers;

    // default ratio is 2/3 ;
    uint8 internal _molecular = 2;
    uint8 internal _denominator = 3;

    // default sign timeout 10 minutes;
    uint32 public signTimeout = 10 * 60;
    uint256 internal _lastSignTimestamp;

    event MultiSigned(
        address indexed msgSender,
        bool passed,
        bytes4 msgSig,
        bytes msgData
    );

    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event RatioChanged(
        uint8 newMolecular,
        uint8 newDenominator,
        uint8 oldMolecular,
        uint8 oldDenominator
    );

    constructor(address[] memory _signers) {
        for (uint i = 0; i < _signers.length; i++) {
            if (_signers[i] != address(0)) {
                signers.set(_signers[i], 0);
            }
        }

        if (signers.length() == 0) {
            signers.set(msg.sender, 0);
        }
    }

    function _clearAll(uint len) internal {
        for (uint i = 0; i < len; i++) {
            (address signer, uint existingHash) = signers.at(i);
            if (existingHash != 0) {
                signers.set(signer, 0);
            }
        }
    }

    function _multiSigned(address msgSender, bytes4 msgSig, bytes memory msgData) internal returns (bool passed) {
        require(signers.contains(msgSender), "the caller is not the signer");
        uint operationHash = uint(keccak256(msgData));
        uint8 N = _denominator;
        uint len = signers.length();
        uint minSignedCountxN = len * _molecular;
        uint signedCountxN = N;

        bool expired = _lastSignTimestamp + signTimeout < block.timestamp;
        if (expired) {
            _clearAll(len);
        } else {
            for (uint i = 0; i < len; i++) {
                (address signer, uint existingHash) = signers.at(i);
                if (existingHash == operationHash) {
                    signedCountxN += N;
                } else if (existingHash != 0) {
                    signers.set(signer, 0);
                }
            }
        }
        signers.set(msgSender, operationHash);
        passed = signedCountxN >= minSignedCountxN;
        _lastSignTimestamp = block.timestamp;
        emit MultiSigned(msgSender, passed, msgSig, msgData);
        if (passed) {
            _clearAll(len);
        }
    }

    modifier onlyMultiSigned() {
        if (_multiSigned(msg.sender, msg.sig, msg.data)) {
            _;
        }
    }

    function getSigners() public view returns (address[] memory) {
        return signers.keys();
    }

    function getSignerCount() public view returns (uint) {
        return signers.length();
    }

    function getSignerAt(uint index) public view returns (address signer) {
        require(index < signers.length(), "index out of range");
        (signer, ) = signers.at(index);
    }

    function getRatio() public view returns (uint8, uint8) {
        return (_molecular, _denominator);
    }

    function addSigner(address signer) external onlyMultiSigned {
        require(!signers.contains(signer), "the signer already exists");
        signers.set(signer, 0);
        emit SignerAdded(signer);
    }

    function removeSigner(address signer) external onlyMultiSigned {
        require(signers.contains(signer), "the signer does not exist");
        require(signers.length() > 1, "can not remove the only one signer");

        signers.remove(signer);
        emit SignerRemoved(signer);
    }

    function setRatio(
        uint8 molecular,
        uint8 denominator
    ) external onlyMultiSigned {
        require(denominator >= 1, "denominator must >= 1");
        require(
            molecular >= 1 && molecular <= denominator,
            "molecular must >=1 and <= denominator"
        );
        emit RatioChanged(molecular, denominator, _molecular, _denominator);
        _molecular = molecular;
        _denominator = denominator;
    }

    function setSignTimeout(uint32 timeout) external onlyMultiSigned {
        signTimeout = timeout;
    }
}
