//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library CondominiumLib {

    enum Status {
        IDLE,       //0
        VOTING,     //1
        APPROVED,   //2
        DENIED      //3
    }

    enum Options {
        EMPTY,      //0
        YES,        //1
        NO,         //2
        ABSTENTION  //3
    }

    enum Category {
        DECISION,       //0
        SPENT,          //1
        CHANGE_QUOTA,   //2
        CHANGE_MANAGER  //3
    }

    struct Topic {
        string title;
        string description;
        Status status;
        uint256 createdDate;
        uint256 startDate;
        uint256 endDate;
        Category category;
        uint amount;
        address responsible;
    }

    struct Vote {
        address resident;
        uint16 residence;
        Options option;
        uint256 timestamp;
    }

}