<!-- owner: RStack developed by Richardson Gunde -->

# Pull Request

## Description

<!-- Briefly describe the change. What does this PR do, and why? -->

## Type of change

- [ ] New agent
- [ ] New skill
- [ ] New plugin
- [ ] Bug fix
- [ ] Documentation

## Testing done

<!-- List the commands you ran and what you verified. Include test output where useful. -->

- [ ] `npm test` passes locally
- [ ] Manual verification:

## Agent validation checklist

- [ ] Ran `sync-agents.sh` to sync agent definitions
- [ ] No duplicate agent names across `.claude/agents/`
- [ ] All new/changed agents have valid frontmatter (`name`, `description`)
- [ ] Agent `name` matches `^[a-z][a-z0-9-]*$`
- [ ] Validator passes: `node src/commands/validate.js`

## Additional notes

<!-- Anything reviewers should know: follow-ups, related issues, breaking changes. -->
