// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity 0.7.6;

library LibEIP712 {
    string internal constant DOMAIN_NAME = "Meke Protocol";

    string internal constant DOMAIN_VERSION = "1.0";

    uint256 internal constant chainId = 97;

    string internal constant EIP712_DOMAIN = "EIP712Domain(string name,uint256 chainId,string version)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));

    bytes32 private constant DOMAIN_SEPARATOR =
        keccak256(
            abi.encodePacked(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(DOMAIN_NAME)),
                chainId,
                keccak256(bytes(DOMAIN_VERSION))
            )
        );

    /**
     * Calculates EIP712 encoding for a hash struct in this EIP712 Domain.
     *
     * @param eip712hash The EIP712 hash struct.
     * @return EIP712 hash applied to this EIP712 Domain.
     */
    function hashEIP712Message(bytes32 eip712hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, eip712hash));
    }
}
