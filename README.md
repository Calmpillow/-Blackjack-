# Velvet North Blackjack — Self-hosted Edition

A complete blackjack website plus the original Velvet North Network multiplayer server and a separate owner-only management website. The PC that runs the server is the host machine: start it when you want your friends to play, and stop it when you are finished.

## What is included

- `index.html` — the public blackjack website.
- `server/server.js` — original multiplayer server, using Node.js built-ins only.
- `manager.js` + `manage.html` — private owner control website. It runs on `127.0.0.1:8788` only and can start, stop, restart, and monitor the game server.
- `START_VELVET_NORTH_WINDOWS.bat` — Windows one-click launcher.
- `START_VELVET_NORTH_MAC_LINUX.sh` — macOS/Linux launcher.
- `NETWORK_SETUP.md` — how to let friends connect from outside your home.
- `ALLOW_GAME_PORT_WINDOWS.bat` — optional helper to allow the game port through Windows Firewall (run as administrator).
- `REMOVE_GAME_PORT_WINDOWS.bat` — removes that firewall rule later.

## Quick start on Windows

1. Install Node.js 20 or newer from https://nodejs.org/.
2. Extract this entire ZIP into a folder on your PC.
3. Double-click `START_VELVET_NORTH_WINDOWS.bat`.
4. The private control website opens at `http://127.0.0.1:8788/`.
5. Click **Start game server**.
6. Click **Open game website**. The game opens at `http://127.0.0.1:8787/`.
7. Leave the black launcher window open while you want the server online.
8. When finished, use **Stop server** in the control website, then close the launcher window.

## Local multiplayer test

Open `http://127.0.0.1:8787/` in two different browsers or devices on the same Wi-Fi. Create a table in one and join its code from the other. The owner control site shows active rooms and players.

Automated test: `cd server && npm test`.

## GitHub is your project library

Create a new repository and upload the contents of this folder. Keep the repository private if you do not want the source code to be public. GitHub stores and versions your project; it does not run your home PC server. This edition serves the game directly from your PC when you start it, so the old GitHub Pages copy is no longer the live multiplayer site.

## Important hosting behavior

- If your PC is off, asleep, disconnected, or the game server is stopped, the game website and multiplayer are unavailable to friends.
- The management page stays local to your PC; it is not exposed to players.
- For friends outside your Wi-Fi to connect, follow `NETWORK_SETUP.md`.
- The blackjack table host's browser still controls that table's game state. The PC server coordinates rooms and connections; the host player must stay in the game for that table to continue.
- Active rooms are in memory and are cleared when the server restarts.

## Limits

30 active rooms maximum; 12 players per table including the host. Profile photos are selected from each player's own gallery and kept in that player's browser storage.
