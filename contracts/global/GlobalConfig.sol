// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.12;

import "../lib/LibList.sol";
import "../lib/WhitelistMultiSign.sol";

contract GlobalConfig is WhitelistMultiSign {

    using LibList for mapping(address => bool);

    // Authrozied brokers, who is allowed to call match in exchange.
    mapping(address => bool) public brokers;
    // Authrozied user, who is allowed to call pause/unpause in perpetual.
    mapping(address => bool) public pauseControllers;
    // Authrozied user, who is allowed to call disable/enable withdraw in perpetual.
    mapping(address => bool) public withdrawControllers;
    // components can call some dangerous methods in perpetual.
    mapping(address => mapping(address => bool)) public components;

    event CreateGlobalConfig();
    event AddBroker(address indexed broker);
    event RemoveBroker(address indexed broker);
    event AddPauseController(address indexed controller);
    event RemovePauseController(address indexed controller);
    event AddWithdrawController(address indexed controller);
    event RemovedWithdrawController(address indexed controller);
    event AddComponent(address indexed perpetual, address indexed component);
    event RemovedComponent(address indexed perpetual, address indexed component);

    constructor() WhitelistMultiSign(new address[](0), new address[](0)) {
        emit CreateGlobalConfig();
    }

    /**
     * @dev Add authorized broker.
     *
     * @param broker Address of broker.
     */
    function addBroker(address broker) external onlyMultiSigned {
        brokers.add(broker);
        emit AddBroker(broker);
    }

    /**
     * @dev Remove authorized broker.
     *
     * @param broker Address of broker.
     */
    function removeBroker(address broker) external onlyMultiSigned {
        brokers.remove(broker);
        emit RemoveBroker(broker);
    }

    /**
     * @dev Test if a address is a component of sender (perpetual).
     *
     * @param component Address of component contract.
     * @return True if given address is a component of sender.
     */
    function isComponent(address component) external view returns (bool) {
        return components[msg.sender][component];
    }

     /**
     * @dev Add a component to whitelist of a perpetual.
     *
     * @param perpetual Address of perpetual.
     * @param component Address of component.
     */
    function addComponent(address perpetual, address component) external onlyMultiSigned {
        require(!components[perpetual][component], "component already exist");
        components[perpetual][component] = true;
        emit AddComponent(perpetual, component);
    }

     /**
     * @dev Remove a component from whitelist of a perpetual.
     *
     * @param perpetual Address of perpetual.
     * @param component Address of component.
     */
    function removeComponent(address perpetual, address component) external onlyMultiSigned {
        require(components[perpetual][component], "component not exist");
        components[perpetual][component] = false;
        emit RemovedComponent(perpetual, component);
    }

    /**
     * @dev Add authorized pause controller.
     *
     * @param controller Address of controller.
     */
    function addPauseController(address controller) external onlyMultiSigned {
        pauseControllers.add(controller);
        emit AddPauseController(controller);
    }

    /**
     * @dev Remove authorized pause controller.
     *
     * @param controller Address of controller.
     */
    function removePauseController(address controller) external onlyMultiSigned {
        pauseControllers.remove(controller);
        emit RemovePauseController(controller);
    }

    /**
     * @dev Add authorized withdraw controller.
     *
     * @param controller Address of controller.
     */
    function addWithdrawController(address controller) external onlyMultiSigned {
        withdrawControllers.add(controller);
        emit AddWithdrawController(controller);
    }

    /**
     * @dev Remove authorized withdraw controller.
     *
     * @param controller Address of controller.
     */
    function removeWithdrawController(address controller) external onlyMultiSigned {
        withdrawControllers.remove(controller);
        emit RemovedWithdrawController(controller);
    }
}