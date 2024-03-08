// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IMock.sol";

contract Mock1 is Ownable, IMock1 {
    address public mockAddr;

    constructor() Ownable() {
        mockAddr = address(0);
    }

    function mockFun1(address mockAddr_) public onlyOwner {
        mockAddr = mockAddr_;
    }
}

contract Mock2 is IMock2 {
    uint public mockAm;

    constructor() {
        mockAm = 0;
    }

    function mockFun2(uint mockAm_) public {
        mockAm = mockAm_;
    }
}
