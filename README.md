# Env Tracker

Automatically tracks changes to your `.env` files and saves timestamped snapshots locally whenever you save the file.

## Features

- Watches `.env` file in real-time
- Saves snapshots with date and time
- No Git required, all snapshots stored locally

## Usage

Just open a workspace with a `.env` file. Every time you save (`Cmd+S` / `Ctrl+S`), a snapshot is automatically saved in:
/.envtracker/snapshots/

Snapshots are named with **date and time** for easy identification.