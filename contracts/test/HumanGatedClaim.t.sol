// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {HumanGatedClaim} from "../src/HumanGatedClaim.sol";

interface Vm {
    function expectRevert(bytes calldata revertData) external;
    function expectEmit(bool checkTopic1, bool checkTopic2, bool checkTopic3, bool checkData) external;
}

contract HumanGatedClaimTest {
    Vm private constant VM = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    bytes32 private constant HUMAN_ONE_NULLIFIER = bytes32(uint256(1));
    HumanGatedClaim private claim;

    event Claimed(address indexed recipient, bytes32 indexed nullifierHash);

    function setUp() public {
        claim = new HumanGatedClaim();
    }

    function testFirstClaimSucceedsAndEmits() public {
        address recipient = address(0xBEEF);
        bytes32 nullifierHash = HUMAN_ONE_NULLIFIER;

        VM.expectEmit(true, true, false, false);
        emit Claimed(recipient, nullifierHash);

        claim.claim(recipient, nullifierHash);

        assertEq(claim.claimantFor(nullifierHash), recipient);
        assertTrue(claim.hasClaimed(nullifierHash));
    }

    function testDuplicateNullifierReverts() public {
        bytes32 nullifierHash = HUMAN_ONE_NULLIFIER;
        claim.claim(address(0xBEEF), nullifierHash);

        VM.expectRevert(
            abi.encodeWithSelector(HumanGatedClaim.AlreadyClaimed.selector, nullifierHash)
        );
        claim.claim(address(0xCAFE), nullifierHash);
    }

    function testInvalidRecipientReverts() public {
        VM.expectRevert(
            abi.encodeWithSelector(HumanGatedClaim.InvalidRecipient.selector)
        );
        claim.claim(address(0), HUMAN_ONE_NULLIFIER);
    }

    function testInvalidNullifierReverts() public {
        VM.expectRevert(
            abi.encodeWithSelector(HumanGatedClaim.InvalidNullifier.selector)
        );
        claim.claim(address(0xBEEF), bytes32(0));
    }

    function assertEq(address actual, address expected) internal pure {
        require(actual == expected, "address mismatch");
    }

    function assertTrue(bool value) internal pure {
        require(value, "expected true");
    }
}
