// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.12;
pragma abicoder v2;

import "../lib/LibTypes.sol";


contract TestTypes {
    function counterSide(LibTypes.Side side) public pure returns (LibTypes.Side) {
        return LibTypes.counterSide(side);
    }
}
