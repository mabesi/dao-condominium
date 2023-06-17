//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ICondominium.sol";

contract CondominiumAdapter {

    ICondominium private implementation;
    address owner;

    constructor() {
        owner = msg.sender;
    }

    function upgrade(address newImplementation) external {
        require(msg.sender == owner, "You do not have permission");
        implementation = ICondominium(newImplementation);
    }

    function addResident(address resident, uint16 residenceId) external {
        return implementation.addResident(resident, residenceId);
    }

    function removeResident(address resident) external {
        return implementation.removeResident(resident);
    }

    function setCounselor(address resident, bool isEntering) external {
        return implementation.setCounselor(resident, isEntering);
    }

    //TODO: mudar 
    function setManager(address newManager) external {
        return implementation.setManager(newManager);
    }

    //TODO: mudar
    function addTopic(string memory title, string memory description) external {
        return implementation.addTopic(title, description);
    }

    //TODO: editar tópicos

    function removeTopic(string memory title) external{
        return implementation.removeTopic(title);
    }

    //TODO: set quota

    //TODO: pay quota

    //TODO: transfer

    function openVoting(string memory title) external {
        return implementation.openVoting(title);
    }

    function vote(string memory title, Lib.Options option) external {
        return implementation.vote(title, option);
    }

    function closeVoting(string memory title) external {
        return implementation.closeVoting(title);
    }

}