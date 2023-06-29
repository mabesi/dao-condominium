//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ICondominium.sol";

contract CondominiumAdapter {

    ICondominium private implementation;
    address public immutable owner;

    event QuotaChanged(uint amount);
    event ManagerChanged(address manager);
    event TopicChanged(bytes32 indexed topicId, string title, Lib.Status status);
    event Transfer(address to, uint indexed amount, string topic);

    constructor() {
        owner = msg.sender;
    }

    modifier upgraded() {
        require(address(implementation) != address(0), "You must upgrade first");
        _;
    }

    function getAddress() external view returns (address) {
        return address(implementation);
    }

    function upgrade(address newImplementation) external {
        require(msg.sender == owner, "You do not have permission");
        require(newImplementation != address(0), "Invalid address");
        implementation = ICondominium(newImplementation);
    }

    function addResident(address resident, uint16 residenceId) external upgraded {
        return implementation.addResident(resident, residenceId);
    }

    function removeResident(address resident) external upgraded {
        return implementation.removeResident(resident);
    }

    function setCounselor(address resident, bool isEntering) external upgraded {
        return implementation.setCounselor(resident, isEntering);
    }

    function addTopic(string memory title, string memory description, Lib.Category category, uint amount, address responsible) external upgraded {
        return implementation.addTopic(title, description, category, amount, responsible);
    }

    function editTopic(string memory topicToEdit, string memory description, uint amount, address responsible) external upgraded {
        Lib.TopicUpdate memory topic = implementation.editTopic(topicToEdit, description, amount, responsible);
        emit TopicChanged(topic.id, topic.title, topic.status);
    }

    function removeTopic(string memory title) external upgraded {
        Lib.TopicUpdate memory topic = implementation.removeTopic(title);
        emit TopicChanged(topic.id, topic.title, topic.status);
    }

    function payQuota(uint16 residenceId) external payable upgraded {
        return implementation.payQuota{value: msg.value}(residenceId);
    }

    function openVoting(string memory title) external upgraded {
        Lib.TopicUpdate memory topic =  implementation.openVoting(title);
        emit TopicChanged(topic.id, topic.title, topic.status);
    }

    function vote(string memory title, Lib.Options option) external upgraded {
        return implementation.vote(title, option);
    }

    function closeVoting(string memory title) external upgraded {
        
        Lib.TopicUpdate memory topic =  implementation.closeVoting(title);
        emit TopicChanged(topic.id, topic.title, topic.status);

        if (topic.status == Lib.Status.APPROVED) {
            if (topic.category == Lib.Category.CHANGE_MANAGER)
                emit ManagerChanged(implementation.getManager());
            else if (topic.category == Lib.Category.CHANGE_QUOTA)
                emit QuotaChanged(implementation.getQuota());
        }
    }

    function transfer(string memory topicTitle, uint amount) external upgraded {
        Lib.TransferReceipt memory receipt = implementation.transfer(topicTitle, amount);
        emit Transfer(receipt.to, receipt.amount, receipt.topic);
    }
    
}