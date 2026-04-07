# Drishyam

A desktop app for saving and managing cooking recipes and video content. Built with Spring Boot, React, and Electron.

## Features

- **Recipe scraping** - Paste a URL from any recipe site and Drishyam extracts the title, ingredients, instructions, and metadata using JSON-LD structured data with an HTML fallback scraper.
- **Video downloads** - Download videos from Instagram (and other platforms via yt-dlp), with automatic caption extraction and recipe parsing from video descriptions.
- **Recipe search** - Full-text search across recipe titles, ingredients, instructions, and cuisines.
- **WhatsApp integration** - Ask about your saved recipes via WhatsApp using [OpenClaw](https://github.com/nichochar/openclaw) with a local Ollama model (qwen2.5:7b). Recipes are synced to the OpenClaw workspace so the model can answer without external API calls.
- **JWT authentication** - Simple username/password login with JWT tokens.

## Tech Stack

- **Backend**: Spring Boot 3.4, Java 21, H2 database, Spring Security, Jsoup
- **Frontend**: React 19, Vite
- **Desktop**: Electron 28
- **AI**: OpenClaw + Ollama (local inference, no paid APIs)
- **Video**: yt-dlp

## Prerequisites

- Java 21
- Node.js 18+
- [Ollama](https://ollama.ai) (for WhatsApp recipe bot)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (for video downloads)
- [OpenClaw](https://github.com/nichochar/openclaw) (for WhatsApp integration)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Rahul-M01/drishyam.git
cd drishyam

# Run with the launcher script (Windows)
start.bat
```

The launcher checks for dependencies, starts Ollama if needed, builds the frontend on first run, and launches the Electron app.

## Project Structure

```
drishyam/
  src/main/java/        # Spring Boot backend
  frontend/             # React + Vite frontend
  main.js               # Electron main process
  scripts/              # OpenClaw helper scripts
    recipe.cmd          # Recipe API wrapper for OpenClaw
    sync-recipes.js     # Syncs recipes to OpenClaw workspace
  skills/drishyam/      # OpenClaw skill definition
  start.bat             # One-click Windows launcher
```

## Configuration

App config lives in `src/main/resources/application.properties` (gitignored). You'll need to set:

```properties
jwt.secret=your-secret-key-here
app.security.username=your-username
app.security.password=your-password
video.storage.path=./videos
ytdlp.path=yt-dlp
```

OpenClaw config lives in `~/.openclaw/openclaw.json` (see OpenClaw docs for setup).
