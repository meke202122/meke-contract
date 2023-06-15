// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.12;
pragma abicoder v2;

import "../lib/LibSignature.sol";


contract TestSignature {
    function isValidSignature(LibSignature.OrderSignature memory signature, bytes32 hash, address signerAddress)
        public
        pure
        returns (bool)
    {
        return LibSignature.isValidSignature(signature, hash, signerAddress);
    }
}
