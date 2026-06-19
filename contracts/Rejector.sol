// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SimpleEscrow.sol";

contract Rejector {
    // Reverts any incoming ETH transfer to simulate transfer failures
    receive() external payable {
        revert("Rejecting ETH");
    }

    // Generic helper to execute calls from this contract
    function execute(address target, bytes calldata data, uint256 value) external payable returns (bytes memory result) {
        bool success;
        (success, result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                let size := returndatasize()
                returndatacopy(0, 0, size)
                revert(0, size)
            }
        }
    }
}
