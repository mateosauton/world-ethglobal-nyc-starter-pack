import {
  encodeFunctionData,
  isAddress,
  padHex,
  type Address,
  type Hex
} from "viem";

export const claimAbi = [
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "nullifierHash", type: "bytes32" }
    ],
    outputs: []
  }
] as const;

export type ClaimTransactionInput = {
  contractAddress: Address;
  recipient: Address;
  nullifierHash: Hex;
};

export type MiniKitCalldataTransaction = {
  to: Address;
  data: Hex;
  value: "0x0";
};

export function createClaimTransaction(
  input: ClaimTransactionInput
): MiniKitCalldataTransaction {
  if (!isAddress(input.contractAddress)) {
    throw new Error("Invalid claim contract address");
  }

  if (!isAddress(input.recipient)) {
    throw new Error("Invalid claim recipient address");
  }

  const bytes32Nullifier = padHex(input.nullifierHash, { size: 32 });

  return {
    to: input.contractAddress,
    value: "0x0",
    data: encodeFunctionData({
      abi: claimAbi,
      functionName: "claim",
      args: [input.recipient, bytes32Nullifier]
    })
  };
}

export function createMiniKitSendTransactionPayload(input: {
  chainId: number;
  transaction: MiniKitCalldataTransaction;
}) {
  return {
    chainId: input.chainId,
    transactions: [input.transaction]
  };
}

