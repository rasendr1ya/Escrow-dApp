// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SimpleEscrow.sol";

contract EscrowFactory {
    address[] public allEscrows;
    mapping(uint256 => address) public idToEscrow;
    mapping(address => address[]) public userToEscrows;
    uint256 public escrowCount;

    event EscrowCreated(
        uint256 indexed escrowId,
        address escrowAddress,
        address indexed buyer,
        address indexed seller,
        address arbiter
    );

    function createEscrow(
        address payable _seller,
        address payable _arbiter,
        uint256 _durationSeconds,
        uint256 _arbiterFeePercent
    ) external returns (address) {
        // Deploy new SimpleEscrow passing msg.sender explicitly as the buyer
        SimpleEscrow newEscrow = new SimpleEscrow(
            msg.sender,
            _seller,
            _arbiter,
            _durationSeconds,
            _arbiterFeePercent
        );
        
        address escrowAddress = address(newEscrow);
        
        allEscrows.push(escrowAddress);
        idToEscrow[escrowCount] = escrowAddress;
        userToEscrows[msg.sender].push(escrowAddress); // buyer
        userToEscrows[_seller].push(escrowAddress);     // seller
        userToEscrows[_arbiter].push(escrowAddress);    // arbiter
        
        emit EscrowCreated(escrowCount, escrowAddress, msg.sender, _seller, _arbiter);
        escrowCount++;
        
        return escrowAddress;
    }

    function getEscrowsByUser(address _user) external view returns (address[] memory) {
        return userToEscrows[_user];
    }
}
