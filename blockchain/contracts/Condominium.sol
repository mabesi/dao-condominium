// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./ICondominium.sol";
import {CondominiumLib as Lib} from "./CondominiumLib.sol";

contract Condominium is ICondominium {

    address public manager; //Ownable Pattern
    mapping(uint16 => bool) public residences; // unidade => true/false
    mapping(address => uint16) public residents; // wallet => unidade (1101 - 2505)
    mapping(address => bool) public counselors; // conselheiro => true/false
    mapping(bytes32 => Lib.Topic) public topics; // hash do título => tópico
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
        require(tx.origin == manager || counselors[tx.origin], "Only the manager or the council can do this");
        _;
    }

    modifier onlyResidents() {
        require(tx.origin == manager || isResident(tx.origin), "Only the manager or the residents can do this");
        _;
    }

    function residenceExists(uint16 residenceId) public view returns (bool) {
        return residences[residenceId];
    }

    function isResident(address resident) public view returns (bool) {
        return residents[resident] > 0;
    }

    function addResident(address resident, uint16 residenceId) external onlyCouncil {
        require(residences[residenceId], "This residence does not exists");
        residents[resident] = residenceId;
    }

    function removeResident(address resident) external onlyManager {
        require(!counselors[resident], "A counselor cannot be removed");
        if (counselors[resident]) delete counselors[resident];
        delete residents[resident];
    }

    function setCounselor(address resident, bool isEntering) external onlyManager {
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

    function addTopic(string memory title, string memory description) external onlyResidents {
        require(!topicExists(title), "This topic already exists");
        Lib.Topic memory newTopic = Lib.Topic({
            title: title,
            description: description,
            createdDate: block.timestamp,
            startDate: 0,
            endDate: 0,
            status: Lib.Status.IDLE
        });

        topics[keccak256(bytes(title))] = newTopic;
    }

    function removeTopic(string memory title) external onlyManager {
        Lib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(topic.status == Lib.Status.IDLE, "Only IDLE topics can be removed");
        delete topics[keccak256(bytes(title))];
    }

    function openVoting(string memory title) external onlyManager {
        Lib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(topic.status == Lib.Status.IDLE, "Only IDLE topics can be opened for voting");
        bytes32 topicId = keccak256(bytes(title));
        topics[topicId].status = Lib.Status.VOTING;
        topics[topicId].startDate = block.timestamp;
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
            if (votes[i].residence == residence) require(false, "A residence should vote only once");
        }

        Lib.Vote memory newVote = Lib.Vote({
            residence: residence,
            resident: tx.origin,
            option: option,
            timestamp: block.timestamp
        });

        votings[topicId].push(newVote);
    }

    function closeVoting(string memory title) external onlyManager {
        
        Lib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(topic.status == Lib.Status.VOTING, "Only VOTING topics can be closed");

        uint8 approved = 0;
        uint8 denied = 0;
        uint8 abstentions = 0;

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

        if (approved > denied)
            topics[topicId].status = Lib.Status.APPROVED;
        else
            topics[topicId].status = Lib.Status.DENIED;

        topics[topicId].endDate = block.timestamp;        
    }

    function numberOfVotes(string memory title) external view returns(uint256) {
        bytes32 topicId = keccak256(bytes(title));
        return votings[topicId].length;
    }    

}
