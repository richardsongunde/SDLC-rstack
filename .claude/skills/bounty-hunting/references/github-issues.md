# GitHub Issues Workflow

As a bounty hunter, you can claim bounties directly from the project's issue tracker. Follow these steps to fetch, review, and solve GitHub issues.

## 1. Finding Open Bounties
Use the GitHub CLI (`gh`) to list open issues:
```bash
gh issue list --state open --limit 10
```
This command provides the issue ID, status, and title. Look for issues labeled as "bug", "enhancement", "good first issue", or any description that sounds like a manageable bounty.

## 2. Investigating an Issue
Once you have selected a target issue (e.g., ID `123`), view its full details:
```bash
gh issue view 123
```
Read the description, steps to reproduce, and any comments to understand the core problem.

## 3. Claiming the Bounty
1. Analyze the context in the codebase related to the issue.
2. Formulate a plan and implement the fix.
3. Verify your fix using standard project commands (linting, tests, etc.).

## 4. Closing the Issue
If you successfully solve the issue and are ready to commit, you can use GitHub's standard closing keywords in your commit message or PR description (e.g., `Fixes #123`, `Closes #123`).
Alternatively, if your task involves directly managing issues, you can close it via CLI (only do this if specifically requested by the user):
```bash
gh issue close 123 -c "Bounty claimed: Fixed the reported issue."
```
