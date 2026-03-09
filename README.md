# Pomobar

Pomobar is a small Pomodoro timer built for the macOS menu bar.

It uses Electron for the desktop shell and React + Vite for the interface. The current version focuses on a compact timer flow: start, pause, reset, rename the current task, and adjust focus and break durations inline.

## What It Does

- Runs as a small menu bar utility
- Shows the current task and remaining time in the tray title
- Supports focus and break sessions
- Lets you edit the task name without leaving the timer
- Persists task name, durations, and feedback preference locally

## Stack

- Electron
- React
- TypeScript
- Vite

## Local Development

Install dependencies:

```bash
npm install
```

Run the web preview:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Project Structure

```text
electron/            Electron main and preload processes
src/                 React app source
src/components/      UI components
src/hooks/           App-specific hooks
src/lib/             Small utilities
```

## Current Limitations

- The tray icon is still a placeholder.
- The "Today activity" section is still partly presentational.
- Desktop feedback currently relies on browser vibration APIs and a basic system beep, so feedback is limited on macOS.
- Packaging and release setup are not finalized yet.

## Next Improvements

- Replace placeholder tray assets
- Improve completed-session history
- Add stronger desktop feedback
- Polish the compact menu bar layout
