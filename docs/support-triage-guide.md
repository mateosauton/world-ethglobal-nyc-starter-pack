# Judge and Support Triage Guide

Use this on-site when teams ask whether their integration is strong enough.

## Fast diagnosis

Ask:

- What does the app do?
- Which track are you submitting to?
- What breaks without World ID?
- Where is proof validation enforced?
- What will continue after the weekend?

## Weak World ID patterns

Weak: Login button only.

Stronger: Use proof of human for eligibility, uniqueness, fairness, reputation, rate limits, or anti-spam.

Weak: “We added verification because the track asks for it.”

Stronger: “Without World ID, attackers can claim multiple grants, skew votes, spam matching, or farm rewards.”

Weak: Client-only proof handling.

Stronger: Backend or smart contract verification with nullifier storage and duplicate rejection.

## AgentKit fit check

Good fit:

- The app exposes a protected resource to agents.
- Agents sign requests.
- AgentBook registration gates access.
- Usage policy is per human-backed agent.

Poor fit:

- The agent is only a chatbot wrapper.
- No protected resource.
- No signed request.
- No AgentBook registration.

## Human-in-the-Loop fit check

Good fit:

- The workflow pauses before a sensitive action.
- Approval is bound to a specific action.
- World ID proof is required before resume.

Poor fit:

- Approval is just a regular confirm button.
- The agent can continue without verification.

## Push teams toward launchability

Ask for the smallest public iteration:

- Hosted demo.
- One repeatable user loop.
- One proof-backed constraint.
- One failure path.
- One post-event ship goal.

