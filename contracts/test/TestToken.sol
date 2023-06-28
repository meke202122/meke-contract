// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken is ERC20, Ownable {
    uint8 internal _dec=18;
    constructor(string memory name, string memory symbol, uint8 _decimals) ERC20(name, symbol) {
        _dec = _decimals;
    }

    function decimals() public view override returns(uint8){
        return _dec;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address to, uint256 amount) external onlyOwner {
        _burn(to,amount);
    }
}