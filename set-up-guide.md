# C.Y.R.U.S. - Absolute Beginner Setup Guide

Welcome! C.Y.R.U.S. (Cybernetic Yielding Resource Utility System) is an advanced, voice-interactive AI assistant with a futuristic HUD. This guide will walk you through setting it up on your own device from scratch.

## Prerequisites

Before we begin, you need to have a few basic tools installed on your computer:
1. **Node.js**: This is required to run the server. Download it from [nodejs.org](https://nodejs.org/) and install the LTS (Long Term Support) version.
2. **A Code Editor**: We recommend [Visual Studio Code (VS Code)](https://code.visualstudio.com/).
3. **An API Key for AI**: C.Y.R.U.S. needs a brain. Get a free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Step-by-Step Installation

### Step 1: Download the Project
1. Download this project folder (usually as a ZIP file) and extract it on your desktop or a familiar location.
2. Open **VS Code**.
3. Go to `File` > `Open Folder` and select the extracted C.Y.R.U.S. folder.

### Step 2: Open the Terminal
1. In VS Code, go to the top menu and click `Terminal` > `New Terminal`.
2. A small window will open at the bottom of your screen. This is where we will type commands.

### Step 3: Install Dependencies
In the terminal, type the following command and press Enter:
```sh
npm install
```
This tells your computer to download all the necessary software packages C.Y.R.U.S. needs to run. Wait a minute or two for this to finish (you'll see a lot of loading bars).

### Step 4: Configure the Brain (Environment Variables)
1. On the left side of VS Code, you will see a list of files. Find a file named `.env.example`.
2. Right-click on `.env.example` and select `Rename`. Change its name to `.env` (just `.env`, nothing else).
3. Open the `.env` file. It will look something like this:
   ```env
   GEMINI_API_KEY=""
   ```
4. Paste the API key you got from Google AI Studio between the quotes:
   ```env
   GEMINI_API_KEY="AIzaSyYourGeneratedKeyHere..."
   ```
5. Save the file (`Ctrl + S` on Windows or `Cmd + S` on Mac).

### Step 5: Start the System !
Now that everything is set up, go back to your Terminal and type:
```sh
npm run dev
```
Wait a few seconds until the terminal says:
`Server running on http://localhost:3000`

### Step 6: Open C.Y.R.U.S.
1. Open your web browser (Chrome, Edge, Safari, etc.).
2. Type `http://localhost:3000` in the address bar and press Enter.
3. You should see the C.Y.R.U.S. interface load up! Click the screen to initialize system protocols.

---

## Databases (Optional)
C.Y.R.U.S. uses your browser's local storage by default (which means it remembers you on your specific browser). If you want to use a centralized database (so it remembers things across different devices), you can use almost any database.

### Using MongoDB (NoSQL)
1. Get a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Get your connection string.
3. Add it to your `.env` file: `DATABASE_URL="mongodb+srv://..."` and `DATABASE_TYPE="mongodb"`

### Using PostgreSQL / MySQL (Relational)
1. You can set up a local database or use a provider like Supabase or PlanetScale.
2. Add your connection string to your `.env` file: `DATABASE_URL="postgresql://..."` and set `DATABASE_TYPE="postgres"`

C.Y.R.U.S. has dynamic hooks that can be connected to the database of your choice.

## Running Independently via Docker (Cross-Platform)

If you prefer to run C.Y.R.U.S. completely isolated from your host machine (no Node.js installation required) and ensure it runs natively on any OS (Windows, Mac, or Linux), you can use Docker.

### Step 1: Install Docker
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### Step 2: Configure Environment
Rename `.env.example` to `.env` and fill in your generated API keys (`GEMINI_API_KEY`, etc.).

### Step 3: Run the Container
Open your terminal in the C.Y.R.U.S. project folder and run:
```sh
docker-compose up --build
```
This builds the ecosystem and safely runs the application on port `3000`. Open `http://localhost:3000` in your browser.

---

## Troubleshooting
- **"Command not found: npm"**: This means Node.js is not installed correctly. Reinstall Node.js and restart your computer.
- **Microphone not working**: Ensure your browser allows microphone permissions for `localhost`.
- **System does not respond to voice**: Ensure you speak clearly. C.Y.R.U.S. needs proper microphone access. Try typing first to see if the AI responds.
