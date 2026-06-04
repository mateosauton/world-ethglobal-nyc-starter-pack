import { requestHumanAuthorization } from "@worldcoin/human-in-the-loop";
import { buildApprovalAction, type ProposalRisk } from "./approval-workflow";

export type SensitiveAgentAction = {
  amountUsd?: number;
  proposalId: string;
  risk?: ProposalRisk;
  summary: string;
};

export const requestSensitiveActionApproval =
  requestHumanAuthorization<SensitiveAgentAction>({
    action: ({ input }) =>
      buildApprovalAction({
        amountUsd: input.amountUsd,
        proposalId: input.proposalId,
        risk: input.risk
      })
  });
