# Pomobar Test Checklist

This checklist is designed for quick manual verification and for repeatable smoke checks during development.

## Setup
- [ ] Install dependencies: `npm install`
- [ ] (Once) Install Playwright browsers: `npx playwright install`
- [ ] Start web mode for testing: `npm run dev:web -- --host 127.0.0.1 --port 4173`
- [ ] Run Playwright smoke tests: `npx playwright test`

## Smoke Checklist (Manual)

### Launch & UI
- [ ] App loads without errors in console
- [ ] Header renders (traffic lights, date label)
- [ ] Timer shows `MM:SS` and updates after starting
- [ ] Controls are visible: `-5`, Play/Pause, `+5`, `Reset timer`
- [ ] Activity section renders with `NOW:` and Daily goal ring

### Timer Core
- [ ] Click Play starts countdown
- [ ] Click Pause stops countdown
- [ ] `-5` decreases time, `+5` increases time
- [ ] Reset timer returns to default focus duration
- [ ] Timer does not go below 00:00 on adjustments

### Task Editing
- [ ] Click task name switches to input
- [ ] Save updates the displayed task
- [ ] Cancel keeps previous task

### Settings Panel
- [ ] Toggle settings open/close
- [ ] Focus minutes input accepts positive integers
- [ ] Break minutes input accepts positive integers
- [ ] Invalid inputs are rejected (empty/0/non‑numeric)

### Theme
- [ ] Toggle Dark ↔ Analog
- [ ] Analog theme uses warmer background and softer borders
- [ ] No hardcoded colors clash with theme tokens

### History & Goal
- [ ] Completing a focus session adds to history
- [ ] Daily goal ring updates
- [ ] Clear history removes list

### Notifications & Sound
- [ ] Completion triggers notification (if permissions granted)
- [ ] Completion triggers sound or fallback audio

## Notes / Findings
- Date:
- Tester:
- Findings:
- Screenshots:
