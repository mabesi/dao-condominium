// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./ICondominium.sol";
import {CondominiumLib as Lib} from "./CondominiumLib.sol";

contract Condominium is ICondominium {

    address public manager; //Ownable Pattern
    uint public monthlyQuota = 0.01 ether; // Monthly Quota
    mapping(uint16 => bool) public residences; // unidade => true/false
    Lib.Resident[] public residents;
    mapping(address => uint) private _residentIndex; // wallet => array index

    address[] public counselors; // conselheiro => true/false

    mapping(uint16 => uint) public nextPayment; // unidade => próximo pagamento (timestamp)

    Lib.Topic[] public topics;

    mapping(bytes32 => uint) private _topicIndex; // hash do título => array index
    mapping(bytes32 => Lib.Vote[]) public votings; // hash do título => votos

    constructor() {

        manager = msg.sender;
        
        // Blocos
        for (uint16 i=1; i <= 2; i++) {
            // Andares
            for (uint16 j=1; j <= 5; j++) {
                // Unidades
                for (uint16 k=1; k <= 5; k++) {
                    residences[(i * 1000) + (j * 100) + k] = true;
                }
            }
        }
    }

    modifier onlyManager() {
        require(tx.origin == manager, "Only the manager can do this");
        _;
    }

    modifier onlyCouncil() {
        require(tx.origin == manager || _isCounselor(tx.origin), "Only the manager or the council can do this");
        _;
    }

    modifier onlyResidents() {

        if (tx.origin != manager) {

            require(isResident(tx.origin), "Only the manager or the residents can do this");

            Lib.Resident memory resident = _getResident(tx.origin);

            require(block.timestamp <= nextPayment[resident.residence], "The resident must not be defaulter");
        }
        _;
    }

    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }

    function residenceExists(uint16 residenceId) public view returns (bool) {
        return residences[residenceId];
    }

    function isResident(address resident) public view returns (bool) {
        return _getResident(resident).residence > 0;
    }

    function _getResident(address resident) private view returns (Lib.Resident memory) {
        uint index = _residentIndex[resident];
        if (index < residents.length) {
            Lib.Resident memory result = residents[index];
            if (result.wallet == resident) return result;
        }
        return Lib.Resident({
            wallet: address(0),
            residence: 0,
            isCounselor: false,
            isManager: false
        });
    }

    function getResident(address resident) external view returns (Lib.Resident memory) {
        return _getResident(resident);
    }

    function getResidents(uint page, uint pageSize) external view returns (Lib.ResidentPage memory) {
        Lib.Resident[] memory result = new Lib.Resident[pageSize];
        uint skip = ((page - 1) * pageSize);
        uint index = 0;
        for (
            uint i = skip;
            i < (skip + pageSize) && i < residents.length;
            i++
        ) {
            result[index++] = residents[i];
        }
        return Lib.ResidentPage({
            residents: result,
            total: residents.length
        });
    }

    function addResident(address resident, uint16 residenceId) external onlyCouncil validAddress(resident) {
        require(residences[residenceId], "This residence does not exists");
        residents.push(Lib.Resident({
            wallet: resident,
            residence: residenceId,
            isCounselor: false,
            isManager: resident == manager
        }));
        _residentIndex[resident] = residents.length - 1;
    }

    function removeResident(address resident) external onlyManager {
        require(!_isCounselor(resident), "A counselor cannot be removed");
        uint index = _residentIndex[resident];
        if (index != residents.length - 1) {
            Lib.Resident memory latest = residents[residents.length - 1];
            residents[index] = latest;
        }
        residents.pop();
        delete _residentIndex[resident];
    }

    function _isCounselor(address resident) private view returns (bool) {
        for (uint i=0; i < counselors.length; i++) {
            if (counselors[i] == resident) return true;
        }
        return false;
    }

    function setCounselor(address resident, bool isEntering) external onlyManager validAddress(resident) {
        if (isEntering) {
            require(isResident(resident), "The counselor must be a resident");
            counselors[resident] = true;
        } else {
            delete counselors[resident];
        }
    }

    function getTopic(string memory title) public view returns (Lib.Topic memory) {
        bytes32 topicId = keccak256(bytes(title));
        return topics[topicId];
    }

    function topicExists(string memory title) public view returns (bool) {
        return getTopic(title).createdDate > 0;
    }

    function addTopic(string memory title, string memory description, Lib.Category category, uint amount, address responsible) external onlyResidents {

        require(!topicExists(title), "This topic already exists");
        
        if (amount > 0) {
            require(category == Lib.Category.CHANGE_QUOTA || category == Lib.Category.SPENT,"Wrong category");
        }

        Lib.Topic memory newTopic = Lib.Topic({
            title: title,
            description: description,
            createdDate: block.timestamp,
            startDate: 0,
            endDate: 0,
            status: Lib.Status.IDLE,
            category: category,
            amount: amount,
            responsible: responsible != address(0) ? responsible : tx.origin
        });

        topics[keccak256(bytes(title))] = newTopic;
    }

    function removeTopic(string memory title) external onlyManager returns (Lib.TopicUpdate memory) {
        
        Lib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(topic.status == Lib.Status.IDLE, "Only IDLE topics can be removed");
        bytes32 topicId = keccak256(bytes(title));
        delete topics[topicId];

        return Lib.TopicUpdate({
            id: topicId,
            title: topic.title,
            category: topic.category,
            status: Lib.Status.DELETED
        });         
    }

    function openVoting(string memory title) external onlyManager returns (Lib.TopicUpdate memory) {
        
        Lib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(topic.status == Lib.Status.IDLE, "Only IDLE topics can be opened for voting");
        bytes32 topicId = keccak256(bytes(title));
        topics[topicId].status = Lib.Status.VOTING;
        topics[topicId].startDate = block.timestamp;
        
        return Lib.TopicUpdate({
            id: topicId,
            title: topic.title,
            category: topic.category,
            status: Lib.Status.VOTING
        });         
    }

    function vote(string memory title, Lib.Options option) external onlyResidents {
        
        require(option != Lib.Options.EMPTY, "The option cannot be EMPTY");
        
        Lib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(topic.status == Lib.Status.VOTING, "Only VOTING topics can be voted");
        
        uint16 residence = residents[tx.origin];
        bytes32 topicId = keccak256(bytes(title));
        
        Lib.Vote[] memory votes = votings[topicId];
        for (uint8 i = 0; i < votes.length; i++) {
            require(votes[i].residence != residence, "A residence should vote only once");
        }

        Lib.Vote memory newVote = Lib.Vote({
            residence: residence,
            resident: tx.origin,
            option: option,
            timestamp: block.timestamp
        });

        votings[topicId].push(newVote);
    }

    function editTopic(string memory topicToEdit, string memory description, uint amount, address responsible)
             external onlyManager returns (Lib.TopicUpdate memory) {
        
        Lib.Topic memory topic = getTopic(topicToEdit);
        require(topic.createdDate > 0, "This topic does not exists");
        require(topic.status == Lib.Status.IDLE, "Only IDLE topics can be edited");

        bytes32 topicId = keccak256(bytes(topicToEdit));

        if(bytes(description).length > 0) topics[topicId].description = description;
        if(amount > 0) topics[topicId].amount = amount;
        if(responsible != address(0)) topics[topicId].responsible = responsible;

        return Lib.TopicUpdate({
            id: topicId,
            title: topic.title,
            category: topic.category,
            status: topic.status
        });
    }

    function closeVoting(string memory title) external onlyManager returns (Lib.TopicUpdate memory) {
        
        Lib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(topic.status == Lib.Status.VOTING, "Only VOTING topics can be closed");

        uint8 minimumVotes = 5;
        uint8 approved = 0;
        uint8 denied = 0;
        uint8 abstentions = 0;

        if (topic.category == Lib.Category.SPENT) 
            minimumVotes = 10;
        else if (topic.category == Lib.Category.CHANGE_MANAGER)
            minimumVotes = 15;
        else if (topic.category == Lib.Category.CHANGE_QUOTA)
            minimumVotes = 20;

        require(numberOfVotes(title) >= minimumVotes, "You cannot finish a voting without the minimum votes");

        bytes32 topicId = keccak256(bytes(title));
        Lib.Vote[] memory votes = votings[topicId];

        for (uint8 i=0; i < votes.length; i++) {
            if (votes[i].option == Lib.Options.YES)
                approved++;
            else if (votes[i].option == Lib.Options.NO)
                denied++;
            else
                abstentions++;
        }

        Lib.Status newStatus = approved > denied
            ? Lib.Status.APPROVED
            : Lib.Status.DENIED;

        topics[topicId].status = newStatus; 
        topics[topicId].endDate = block.timestamp;

        if (newStatus == Lib.Status.APPROVED) {
            if (topic.category == Lib.Category.CHANGE_QUOTA) {
                monthlyQuota = topic.amount;
            } else if (topic.category == Lib.Category.CHANGE_MANAGER) {
                manager = topic.responsible;
            }
        }

        return Lib.TopicUpdate({
            id: topicId,
            title: topic.title,
            category: topic.category,
            status: newStatus
        });        
    }

    function numberOfVotes(string memory title) public view returns(uint256) {
        bytes32 topicId = keccak256(bytes(title));
        return votings[topicId].length;
    }    

    function payQuota(uint16 residenceId) external payable {
        require(residenceExists(residenceId), "The residence does not exists");
        require(msg.value >= monthlyQuota, "Wrong value");
        require(block.timestamp > payments[residenceId] + (30 * 24 * 60 * 60), "You cannot pay twice a month");
        payments[residenceId] = block.timestamp;
    }

    function transfer(string memory topicTitle, uint amount) external onlyManager returns (Lib.TransferReceipt memory) {
        
        require(address(this).balance >= amount,"Insufficient funds");
        Lib.Topic memory topic = getTopic(topicTitle);
        require(topic.status == Lib.Status.APPROVED && topic.category == Lib.Category.SPENT,
                "Only APPROVED SPENT topics can be used for transfers");
        require(topic.amount >= amount,"The amount must be less or equal the APPROVED topic");

        payable(topic.responsible).transfer(amount);
        bytes32 topicId = keccak256(bytes(topicTitle));
        topics[topicId].status = Lib.Status.SPENT;

        return Lib.TransferReceipt({
            to: topic.responsible,
            amount: amount,
            topic: topicTitle
        });
    }

    function getManager() external view returns (address) {
        return manager;
    }

    function getQuota() external view returns (uint) {
        return monthlyQuota;
    }

    function getTopic(string memory title) external view returns (Lib.Topic memory) {
        
    }

    function getTopics(uint page, uint pageSize) external view returns (Lib.TopicPage memory) {
        
    } 

} // End Contract
