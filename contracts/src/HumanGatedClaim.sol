// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract HumanGatedClaim {
    error AlreadyClaimed(bytes32 nullifierHash);
    error InvalidNullifier();
    error InvalidRecipient();

    event Claimed(address indexed recipient, bytes32 indexed nullifierHash);

    mapping(bytes32 nullifierHash => address recipient) public claimantFor;

    function claim(address recipient, bytes32 nullifierHash) external {
        if (recipient == address(0)) {
            revert InvalidRecipient();
        }

        if (nullifierHash == bytes32(0)) {
            revert InvalidNullifier();
        }

        if (claimantFor[nullifierHash] != address(0)) {
            revert AlreadyClaimed(nullifierHash);
        }

        claimantFor[nullifierHash] = recipient;
        emit Claimed(recipient, nullifierHash);
    }

    function hasClaimed(bytes32 nullifierHash) external view returns (bool) {
        return claimantFor[nullifierHash] != address(0);
    }
}

