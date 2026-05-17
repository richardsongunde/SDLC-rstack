<!-- owner: RStack developed by Richardson Gunde -->

# Notification System — SDLC Pipeline

## Purpose
Send status notifications to Slack, Microsoft Teams, or email at key pipeline events.

## Supported Channels

### Slack
- Uses incoming webhook URL
- Send via: `curl -X POST -H 'Content-type: application/json' --data '{"text":"message"}' $SLACK_WEBHOOK_URL`
- Format: Rich message with agent name, status, key metrics

### Microsoft Teams
- Uses incoming webhook URL
- Send via: `curl -H 'Content-Type: application/json' -d '{"text":"message"}' $TEAMS_WEBHOOK_URL`

### Email
- Uses Python smtplib (no external deps)
- Requires: SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_RECIPIENTS

## Notification Events

| Event | When | Message Content |
|-------|------|----------------|
| `agent_started` | Agent begins execution | Agent name, input files |
| `agent_completed` | Agent finishes | Agent name, files created, key metrics |
| `decision_needed` | Interactive decision point | Options being presented to user |
| `pipeline_completed` | All agents done | Full summary with links to outputs |
| `error_occurred` | Any agent fails | Error details, affected agent, recovery options |

## Message Template

```
🏗️ SDLC Pipeline — [EVENT]
━━━━━━━━━━━━━━━━━━━━━
Agent: [agent_name] ([NN]/[TOTAL])
Status: [✅ Completed / ⏳ In Progress / ❌ Failed]
Duration: [time]

Key Metrics:
• [metric 1]
• [metric 2]

Next: [next_agent_name]
━━━━━━━━━━━━━━━━━━━━━
```

## Configuration
Notifications are configured in `sdlc-pipeline.yml` under the `notifications` section.
Agents check this config before sending. If notifications.enabled is false, skip silently.

## Integration with Agents
Each agent should check for notification config in environment_report.json:
1. At start: send "agent_started" notification
2. At completion: send "agent_completed" with summary metrics
3. On error: send "error_occurred" with details
