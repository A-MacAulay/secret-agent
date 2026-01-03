# Secret Agent

A cross-platform Electron companion application for Cursor Agent that runs in the system tray / menu bar.

## Features

- **Multi-project support**: Monitor multiple Cursor workspaces simultaneously
- **File-based contract**: Integrates with Cursor Agent via `.cursor_companion/` folder
- **Real-time updates**: Watches for agent status changes and questions
- **Native notifications**: Get notified when agent needs your input
- **Quick responses**: Answer agent questions without switching to Cursor

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

## Building

```bash
# Package for current platform
npm run package

# Create distributable
npm run make
```

## File Contract

The app communicates with Cursor Agent through a `.cursor_companion/` folder in each workspace:

### Required Files

- `project.json` - Project metadata
- `agent-status.json` - Current agent state
- `handshake.json` - Question/response synchronization
- `agent-questions.md` - Agent's current question (markdown)
- `user-response.md` - User's response (written by Secret Agent)
- `agent-log.md` - Append-only activity log

### agent-status.json Schema

```json
{
  "workspaceId": "uuid",
  "state": "idle | thinking | editing | testing | waiting_for_user | done | error",
  "taskTitle": "Short task title",
  "summary": "1-2 sentence summary",
  "progress": {
    "currentStep": 2,
    "totalSteps": 6,
    "stepLabel": "Implementing feature"
  },
  "lastUpdated": "ISO-8601",
  "activeFiles": [],
  "lastError": null
}
```

### handshake.json Schema

```json
{
  "workspaceId": "uuid",
  "questionId": "string",
  "questionState": "none | asked | acknowledged | answered | consumed",
  "lastQuestionUpdated": "ISO-8601",
  "lastUserResponseUpdated": "ISO-8601"
}
```

## Cursor Agent Instructions

Add these instructions to your Cursor Agent per workspace:

1. Ensure `.cursor_companion/project.json` exists
2. Always update `agent-status.json` with current state
3. Append actions to `agent-log.md`
4. When user input is required:
   - Set `state = "waiting_for_user"`
   - Write question to `agent-questions.md`
   - Set `handshake.questionState = "asked"`
   - **STOP and wait for response**
5. When response is detected:
   - Read `user-response.md`
   - Set `handshake.questionState = "consumed"`
   - Continue work

## Platform Support

- **macOS**: Menu bar app (hides from dock)
- **Windows**: System tray app
- **Linux**: System tray (optional)

## License

MIT


