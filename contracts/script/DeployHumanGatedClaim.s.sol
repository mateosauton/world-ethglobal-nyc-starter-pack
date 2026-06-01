// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {HumanGatedClaim} from "../src/HumanGatedClaim.sol";

interface Vm {
    function envUint(string calldata key) external view returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployHumanGatedClaim {
    Vm private constant VM = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (HumanGatedClaim deployed) {
        uint256 deployerKey = VM.envUint("PRIVATE_KEY");
        VM.startBroadcast(deployerKey);
        deployed = new HumanGatedClaim();
        VM.stopBroadcast();
    }
}
