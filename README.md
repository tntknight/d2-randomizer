# D2 Compare Bot

A Discord bot that compares Destiny 2 weapon inventories across multiple players and rolls a random shared loadout from their overlapping weapons.

Players can either upload a [DIM](https://app.destinyitemmanager.com/) CSV export or link their Bungie account so the bot fetches their vault automatically.

---

## How it works

1. Each player adds their weapons to the server pool (via CSV upload or Bungie vault sync)
2. The bot finds every weapon owned by **all** players in the pool
3. `/compare-loadout` picks a random weapon for each slot from that shared pool
4. The result includes a DIM search string so you can quickly find the weapons in-game

---

## Commands

All commands are available as both slash commands (`/command`) and prefix commands (`!command`). Prefix commands work immediately; slash commands can take up to an hour to appear in a new server.

### Adding weapons

| Command | Description |
|---|---|
| `/compare-add` + CSV file(s) | Upload your DIM CSV export. Attach up to 8 files at once. |
| `/load-vault` | Fetch your vault directly from Bungie (requires account link) |
| `/link-account` | Link your Bungie account for automatic vault fetching |

### Running a comparison

| Command | Description |
|---|---|
| `/compare-list` | Show all files currently loaded in the server pool |
| `/compare-loadout` | Roll a random loadout from weapons shared by everyone in the pool |
| `/compare-dimsearch all` | Get a DIM search string for all matched weapons |
| `/compare-dimsearch loadout` | Get a DIM search string for the last rolled loadout |

### Managing the pool

| Command | Description |
|---|---|
| `/compare-drop` | Remove all files from the server pool |
| `/compare-drop <filename>` | Remove a specific file from the pool |
| `/compare-clear` | Clear all files and reset the session |

---

## Getting a DIM CSV export

1. Open [DIM](https://app.destinyitemmanager.com/) and sign in
2. Go to **Inventory** → click the **Download** icon (top right)
3. Select **Weapons** → **Export CSV**
4. Upload the downloaded file with `/compare-add`

---

## Bungie account linking

`/link-account` generates a one-time OAuth link. Click it, sign in with Bungie, and approve access. After that, `/load-vault` fetches your vault automatically — no CSV needed.

The link expires in 10 minutes. If something goes wrong, just run `/link-account` again for a fresh link.

---

## Self-hosting

### Prerequisites

- Node.js 18+
- A Discord application with a bot token ([discord.com/developers](https://discord.com/developers/applications))
- A Bungie application with OAuth enabled ([bungie.net/developer](https://www.bungie.net/en/Application))

### Environment variables

Create a `.env` file (or set these in your hosting platform):

```
DISCORD_TOKEN=        # Bot token from Discord Developer Portal
APP_ID=               # Application ID from Discord Developer Portal
BUNGIE_API_KEY=       # API key from Bungie developer portal
BUNGIE_CLIENT_ID=     # OAuth client ID from Bungie developer portal
BUNGIE_CLIENT_SECRET= # OAuth client secret from Bungie developer portal
BUNGIE_REDIRECT_URI=  # Full public URL of your callback, e.g. https://yourapp.up.railway.app/auth/callback
OAUTH_PORT=3000       # Port for the OAuth callback server (Railway sets PORT automatically)
```

### Discord bot setup

In the [Discord Developer Portal](https://discord.com/developers/applications):

1. **Bot → Privileged Gateway Intents**: enable **Message Content Intent**
2. **OAuth2 → URL Generator**: select scopes `bot` and `applications.commands`, then use the generated URL to add the bot to your server

### Bungie app setup

In the [Bungie developer portal](https://www.bungie.net/en/Application):

- **OAuth Client Type**: Confidential
- **Redirect URL**: your public callback URL (must be HTTPS — use a hosting platform like Railway)
- **Scope**: `ReadDestinyInventoryAndVault`

### Running locally

```bash
npm install
npm run deploy   # Register slash commands with Discord (run once, or after adding commands)
npm start
```

### Deploying to Railway

1. Push this repo to GitHub
2. Create a new Railway project from the GitHub repo
3. Set the **Root Directory** to `d2-compare-bot` (if your repo contains other files at the root)
4. Add all environment variables in the Railway **Variables** tab
5. Add a **Volume** mounted at `/app/data` to persist Bungie tokens across restarts
6. Railway will build and deploy automatically on every push

After deploying, run `npm run deploy` locally once to register the slash commands globally.

---

## Project structure

```
src/
  bot.js                  # Entry point — Discord client, command routing
  deploy-commands.js      # One-off script to register slash commands with Discord
  commands/
    add.js                # /compare-add — upload DIM CSV
    list.js               # /compare-list — show loaded files
    loadout.js            # /compare-loadout — roll a loadout
    clear.js              # /compare-clear — reset session
    drop.js               # /compare-drop — remove a file
    dimsearch.js          # /compare-dimsearch — export DIM search string
    linkAccount.js        # /link-account — start Bungie OAuth flow
    loadVault.js          # /load-vault — fetch vault from Bungie
  lib/
    sessionStore.js       # In-memory per-server weapon pool
    csvParser.js          # Parses DIM CSV exports
    comparator.js         # Finds weapons common to all players
    loadoutPicker.js      # Picks one weapon per slot from shared pool
    dimSearch.js          # Builds DIM search strings from weapon lists
    bungieManifest.js     # Streams and caches the Bungie item manifest
    bungieVault.js        # Fetches vault + character inventories via Bungie API
    messageInteraction.js # Adapter so prefix commands reuse slash command logic
  auth/
    bungieOAuth.js        # OAuth URL builder, token exchange, token refresh
    tokenStore.js         # Persists Bungie tokens to data/tokens.json
  server/
    callbackServer.js     # Express HTTP server for OAuth callback + health check
```
