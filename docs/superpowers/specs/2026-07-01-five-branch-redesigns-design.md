# Five Branch Redesigns

## Goal

Create five independent redesign branches for the starter pack. Each branch should be a complete, locally hosted website that demonstrates how the World command flows work, with a distinct product direction, UI system, PRD, QA pass, and peer-review loop.

## Branch Model

- Create five isolated branches from the current branch: `codex/version-1`, `codex/version-2`, `codex/version-3`, `codex/version-4`, and `codex/version-5`.
- Use separate worktrees so each agent can work without touching another branch.
- Keep the existing local `.env.example` modification out of all commits unless explicitly requested.
- Use short commit and PR messages.

## Agent Responsibilities

Each of the five agents owns one branch and must:

- Research a different UI direction and choose its own supporting UI library or styling approach.
- Write a branch-local PRD that explains the user, goal, design direction, and acceptance criteria.
- Redesign the app around the main feature: showing how the World MiniKit, World ID, transaction, AgentKit, or HITL command flow works.
- Run local QA and capture any important notes.
- Host its version locally on a unique port.

## Version Directions

The agents should avoid converging on one aesthetic. The five branches should cover meaningfully different approaches, such as:

- A minimal command console.
- A workflow builder.
- A mobile-first World App simulator.
- An agent operations dashboard.
- A docs/tutorial-style interactive guide.

These are starting points, not fixed mockups. Agents may choose stronger directions after research if the final set remains clearly differentiated.

## Peer Review Loop

After the first implementation pass:

- Each agent reviews the other four branches.
- Feedback must focus on actionable product, UI, accessibility, correctness, and QA issues.
- Each owning agent fixes actionable feedback on its own branch.
- Repeat review and fixes until reviewers report no new actionable issues.

## QA Requirements

Each branch should run the relevant checks from the repo:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Browser smoke checks for desktop and mobile

If a check is not applicable or cannot run, the agent must record why in its branch PRD or QA notes.

## Deliverables

- Five branches with committed implementations.
- Five branch-local PRDs or design notes.
- Five local URLs, one per branch.
- Peer-review notes showing feedback was addressed.
- Final summary comparing the five versions, including QA status and known tradeoffs.
