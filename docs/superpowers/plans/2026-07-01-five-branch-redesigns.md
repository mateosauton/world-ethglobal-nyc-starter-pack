# Five Branch Redesigns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce five separate redesign branches, each with an independently researched UI direction, PRD, QA pass, peer review, and locally hosted website.

**Architecture:** The current repository remains the control workspace. Each version runs in its own git worktree and branch, modifies only that branch, and starts its own local Next.js server on a unique port. The main session coordinates subagents, compares review output, and keeps the existing `.env.example` edit unstaged.

**Tech Stack:** pnpm 9, Next.js 16, React 19, TypeScript, Playwright/browser screenshots, git worktrees, multi-agent subagents.

---

## File Structure

- Control spec: `docs/superpowers/specs/2026-07-01-five-branch-redesigns-design.md`
- Control plan: `docs/superpowers/plans/2026-07-01-five-branch-redesigns.md`
- Worktree root: `.worktrees/`
- Branch 1 worktree: `.worktrees/version-1`
- Branch 2 worktree: `.worktrees/version-2`
- Branch 3 worktree: `.worktrees/version-3`
- Branch 4 worktree: `.worktrees/version-4`
- Branch 5 worktree: `.worktrees/version-5`
- Branch-local PRDs: `docs/version-prd.md`
- Branch-local QA notes: `docs/version-qa.md`
- Branch-local peer review notes: `docs/version-peer-review.md`

## Assigned Versions

| Version | Branch | Worktree | Port | Direction |
| --- | --- | --- | --- | --- |
| 1 | `codex/version-1` | `.worktrees/version-1` | `3101` | Minimal command console |
| 2 | `codex/version-2` | `.worktrees/version-2` | `3102` | Workflow builder |
| 3 | `codex/version-3` | `.worktrees/version-3` | `3103` | Mobile World App simulator |
| 4 | `codex/version-4` | `.worktrees/version-4` | `3104` | Agent operations dashboard |
| 5 | `codex/version-5` | `.worktrees/version-5` | `3105` | Interactive tutorial guide |

## Task 1: Prepare Worktrees

**Files:**
- Modify only if needed: `.gitignore`
- Create: `.worktrees/version-1`
- Create: `.worktrees/version-2`
- Create: `.worktrees/version-3`
- Create: `.worktrees/version-4`
- Create: `.worktrees/version-5`

- [ ] **Step 1: Verify current state**

Run:

```bash
git status --short --branch
git rev-parse --show-toplevel
git branch --show-current
```

Expected: current branch is `codex/minimal-shadcn-ui`; `.env.example` may be modified and must not be staged.

- [ ] **Step 2: Ensure `.worktrees` is ignored**

Run:

```bash
git check-ignore -q .worktrees || printf '\n.worktrees/\n' >> .gitignore
```

Expected: `.worktrees` is ignored. If `.gitignore` changes, commit only `.gitignore` with:

```bash
git add .gitignore
git commit -m "ignore worktrees"
```

- [ ] **Step 3: Create worktrees**

Run:

```bash
git worktree add .worktrees/version-1 -b codex/version-1 HEAD
git worktree add .worktrees/version-2 -b codex/version-2 HEAD
git worktree add .worktrees/version-3 -b codex/version-3 HEAD
git worktree add .worktrees/version-4 -b codex/version-4 HEAD
git worktree add .worktrees/version-5 -b codex/version-5 HEAD
```

Expected: five branches exist and each worktree checks out cleanly.

- [ ] **Step 4: Confirm isolation**

Run:

```bash
for path in .worktrees/version-1 .worktrees/version-2 .worktrees/version-3 .worktrees/version-4 .worktrees/version-5; do
  git -C "$path" status --short --branch
done
```

Expected: each worktree reports its matching `codex/version-*` branch.

## Task 2: Dispatch Build Agents

**Files:**
- Create per branch: `docs/version-prd.md`
- Create per branch: `docs/version-qa.md`
- Modify per branch: app files chosen by that branch owner

- [ ] **Step 1: Give each subagent a branch-specific prompt**

Use this prompt template, filling the branch-specific fields from the Assigned Versions table:

```text
You own VERSION_NAME on BRANCH_NAME in WORKTREE_PATH.

Build a complete redesign of this World ETHGlobal starter pack as a locally hosted website on PORT.

Constraints:
- Work only inside WORKTREE_PATH.
- Keep commits on BRANCH_NAME.
- Do your own UI research and choose your own UI library or styling approach.
- Write docs/version-prd.md before implementation. Include user, problem, design direction, chosen UI approach, acceptance criteria, and QA plan.
- The main product feature must be a demo of how the World command flows work. Keep the commands prominent and understandable.
- Preserve working TypeScript/Next.js behavior. Do not commit secrets.
- Keep commit messages short and concise.
- Start a local dev server on PORT when done.

Required checks:
- pnpm typecheck
- pnpm lint
- pnpm build
- desktop browser smoke
- mobile browser smoke

Record results and screenshot paths in docs/version-qa.md.
Commit all branch changes with a concise message.
```

Expected: five subagents start independently, one per branch.

- [ ] **Step 2: Track subagent outputs**

For each subagent, record:

```text
Branch:
Worktree:
Local URL:
PRD path:
QA notes path:
Commit SHA:
Tests run:
Known tradeoffs:
```

Expected: every branch has a committed implementation and a local URL.

## Task 3: Cross-Review Branches

**Files:**
- Create per branch: `docs/version-peer-review.md`
- Modify per branch: app files needed to address feedback
- Modify per branch: `docs/version-qa.md` when re-running QA

- [ ] **Step 1: Dispatch peer review prompts**

Ask each subagent to review the other four worktrees with this prompt:

```text
You are reviewing four peer redesign branches for actionable issues.

For each branch:
- Inspect the PRD, implementation, and QA notes.
- Use the local URL if available.
- Review product clarity, command-flow prominence, UI quality, accessibility, responsive layout, broken interactions, and test gaps.
- Do not request subjective style changes unless they block usability or the branch's own PRD.
- Write actionable findings only.

Return findings grouped by branch with severity:
- Critical: must fix before final.
- Important: should fix before final.
- Minor: optional unless repeated by another reviewer.

If no issues remain for a branch, say "No actionable issues".
```

Expected: each branch receives feedback from the other agents.

- [ ] **Step 2: Route feedback to owning agents**

For each branch owner, send only feedback for that branch:

```text
You own BRANCH_NAME in WORKTREE_PATH.

Address the following peer-review feedback on your branch. Fix all Critical and Important issues. Fix Minor issues when they are quick, objective, or repeated by multiple reviewers.

After fixes:
- Update docs/version-peer-review.md with the feedback addressed.
- Re-run relevant checks.
- Update docs/version-qa.md.
- Commit with a short concise message.
- Keep the local server running on PORT.
```

Expected: each branch owner commits fixes for actionable feedback.

- [ ] **Step 3: Repeat review loop**

Run cross-review again after fixes. Stop only when all reviewers report:

```text
No actionable issues
```

Expected: no branch has unresolved Critical or Important issues, and no new actionable feedback is being produced.

## Task 4: Final Local Hosting Verification

**Files:**
- Read: each branch's `docs/version-qa.md`
- Read: each branch's `docs/version-peer-review.md`

- [ ] **Step 1: Verify local servers**

Run:

```bash
for port in 3101 3102 3103 3104 3105; do
  curl -I "http://localhost:$port" | sed -n '1p'
done
```

Expected: each port returns an HTTP response.

- [ ] **Step 2: Confirm branch cleanliness**

Run:

```bash
for path in .worktrees/version-1 .worktrees/version-2 .worktrees/version-3 .worktrees/version-4 .worktrees/version-5; do
  git -C "$path" status --short --branch
done
```

Expected: no unstaged or uncommitted branch implementation changes.

- [ ] **Step 3: Prepare final summary**

Return a concise summary with:

```text
Version:
Branch:
Local URL:
Design direction:
Main command-flow demo:
QA status:
Peer-review status:
Commit SHA:
Known tradeoffs:
```

Expected: the user can open all five local websites and compare the branches.
