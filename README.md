# D2 Compare Bot

A Discord bot for Destiny 2 groups. It compares weapon inventories across players to roll shared loadouts, and runs Chaos Raids and Chaos Dungeons — randomized activity sessions with random role assignments for each encounter.

Players can either upload a [DIM](https://app.destinyitemmanager.com/) CSV export or link their Bungie account so the bot fetches their vault automatically.

---

## How it works

### Weapon comparison

1. Each player adds their weapons to the server pool (via CSV upload or Bungie vault sync)
2. The bot finds every weapon owned by **all** players in the pool
3. `/compare-loadout` picks a random weapon for each slot from that shared pool
4. The result includes a DIM search string so you can quickly find the weapons in-game

### Guided Raids

1. A player runs `/raid-start <raid>` and picks which raid to run from the list of all 9 raids
2. The bot opens a lobby — up to 6 players can join by clicking the **Join** button
3. The raid watcher starts automatically for the host (requires a linked Bungie account)
4. Once the host presses **Begin**, the first encounter is shown with randomly assigned roles
5. The host presses **Next Encounter** to advance through each encounter; roles reshuffle every time
6. Guide images can be added per-encounter by setting `imageUrl` in `raidData.js`

### Chaos Raids

1. A player runs `/chaos-start` to open a lobby — up to 6 players can join by clicking the **Join** button
2. The host presses **Begin** (or runs `/chaos-begin`) to close the lobby
3. Each player chooses whether they want a randomly assigned class
4. A random raid is rolled — the host can keep it or reroll up to 3 times
5. Once confirmed, the bot shows the first encounter with a random role assigned to each player
6. The host steps through every encounter with **Next Encounter**; roles are reshuffled each time
7. Every step is also available as a standalone command for groups that want to skip the full flow

### Chaos Dungeons

Same flow as Chaos Raids but capped at 3 players and pulls from the dungeon pool instead. Use `/dungeon-start` to open a dungeon lobby.

### PvP Random

1. A player runs `/pvp-random` to open a lobby — up to 12 players can join or leave at any time via the **Join**/**Leave** buttons
2. The host presses **Roll Loadout** (requires at least 2 players) — the bot freshly fetches every joined player's vault and rolls a Kinetic/Energy/Power loadout from weapons **everyone owns in common**
3. Weapons that get rolled are added to a per-session exclusion list, so future rolls in the same lobby won't repeat them
4. The host presses **Roll Map** at any time to pick a random PvP map
5. The result embed also shows stats on the shared pool — total common weapons, how many are exotic, and how many have been excluded so far
6. If the host has a linked Bungie account, the bot automatically watches the host's PvP matches for the life of the lobby. After each match it ranks every participant by individual score, awards points to whichever ranked players are in the lobby (1st place: 6 points, 2nd: 5, down to 6th: 1 — 7th and below score 0), and posts a running **🏆 Rankings** leaderboard in the lobby embed
7. `/pvp-random-kick <player>` removes a specific player from the lobby *(host only)*
8. `/pvp-random-stop` ends the lobby early *(host only)*

---

## Commands

All commands are available as both slash commands (`/command`) and prefix commands (`!command`). Prefix commands work immediately; slash commands can take up to an hour to appear in a new server.

### Guided Raids

| Command | Description |
|---|---|
| `/raid-start <raid>` | Pick a raid and open a guided lobby (up to 6 players). Automatically starts the raid watcher for the host. |

Players join via the **Join** button; the host presses **Begin** when ready. The bot then walks through every encounter in order — each time showing randomly assigned roles and an optional guide image. **Next Encounter** advances the session; the last encounter shows **Finish Raid** instead.

To add guide images: open `src/lib/raidData.js`, find the encounter, and set `imageUrl` to a direct image URL.

### Chaos Raids

| Command | Description |
|---|---|
| `/chaos-start` | Open a Chaos Raid lobby (up to 6 players) |
| `/chaos-begin` | Close the lobby and start class opt-in *(host only)* |
| `/chaos-class choice:<Yes\|No>` | Record your random class preference |
| `/raid` | Roll a random raid — works standalone or rerolls during a session *(host only in session)* |
| `/encounter [number]` | Show an encounter with randomly assigned roles; jump to a specific encounter by number *(host only)* |
| `/chaos-roles` | Reroll roles for the current encounter without advancing *(host only)* |

### Chaos Dungeons

| Command | Description |
|---|---|
| `/dungeon-start` | Open a Chaos Dungeon lobby (up to 3 players) |
| `/chaos-begin` | Close the lobby and start class opt-in *(host only)* |
| `/chaos-class choice:<Yes\|No>` | Record your random class preference |
| `/dungeon` | Roll a random dungeon — works standalone or rerolls during a session *(host only in session)* |
| `/dungeon-encounter [number]` | Show a dungeon encounter with randomly assigned roles *(host only)* |
| `/dungeon-roles` | Reroll roles for the current dungeon encounter without advancing *(host only)* |

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

### Random tools

| Command | Description |
|---|---|
| `/random-loadout` | Roll a random weapon loadout (one guaranteed exotic) from the server pool |
| `/random-exotic [class]` | Pick a random exotic armor piece — defaults to your most recently played class |
| `/random-map` | Pick a random D2 PvP map |
| `/roll-class` | Roll a random Destiny 2 class (Titan / Hunter / Warlock) |

The **Pull to Inventory** button on `/random-exotic` results transfers the exotic from your vault or another character to your active character (requires a linked Bungie account).

### PvP Random

| Command | Description |
|---|---|
| `/pvp-random` | Open a PvP random loadout lobby (up to 12 players) |
| `/pvp-random-kick <player>` | Remove a player from the lobby *(host only)* |
| `/pvp-random-stop` | End the lobby *(host only)* |

Players **Join**/**Leave** at any time. The host presses **Roll Loadout** *(host only, 2+ players)* to pull every joined player's vault and roll a shared loadout — already-rolled weapons are excluded from later rolls in the same lobby. The host presses **Roll Map** *(host only)* to pick a random PvP map.

If the host is linked, match-ranking starts automatically: the bot watches the host's PvP matches and, after each one, awards points based on individual placement (1st: 6, 2nd: 5, 3rd: 4, 4th: 3, 5th: 2, 6th: 1, 7th+: 0) to whichever ranked players are in the lobby. Standings accumulate in the lobby embed's **🏆 Rankings** field for the life of the session.

### PvP & SRL watching

| Command | Description |
|---|---|
| `/pvp-watch` | Start watching for PvP match completions — posts a scoreboard and rolls a loadout after each match |
| `/pvp-stop` | Stop watching for PvP matches |
| `/srl-watch` | Start watching for Sparrow Racing League private match results — posts finish order after each race |
| `/srl-stop` | Stop watching for SRL races |

The bot polls the Bungie API every 30 seconds. Watching is per-user and stops automatically when the bot restarts.

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
- **Scopes**: `ReadDestinyInventoryAndVault` and `MoveEquipDestinyItems` (required for the Pull to Inventory button)

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
  bot.js                  # Entry point — Discord client, command routing, button dispatch
  deploy-commands.js      # One-off script to register slash commands with Discord
  commands/
    add.js                # /compare-add — upload DIM CSV
    list.js               # /compare-list — show loaded files
    loadout.js            # /compare-loadout — roll a loadout
    clear.js              # /compare-clear — reset session
    drop.js               # /compare-drop — remove a file
    linkAccount.js        # /link-account — start Bungie OAuth flow
    loadVault.js          # /load-vault — fetch vault from Bungie
    randomMap.js          # /random-map — pick a random PvP map
    randomExotic.js       # /random-exotic — pick a random exotic armor piece
    randomLoadout.js      # /random-loadout — roll a loadout from the server pool
    rollClass.js          # /roll-class — roll a random class
    pvpWatch.js           # /pvp-watch — start watching for PvP match completions
    pvpStop.js            # /pvp-stop — stop watching
    srlWatch.js           # /srl-watch — start watching for SRL race completions
    srlStop.js            # /srl-stop — stop watching
    raidStart.js          # /raid-start — open a Guided Raid lobby with chosen raid
    chaosStart.js         # /chaos-start — open a Chaos Raid lobby
    chaosBegin.js         # /chaos-begin — close lobby and start class opt-in
    chaosClass.js         # /chaos-class — record class preference
    chaosRaid.js          # /raid — roll a random raid
    chaosEncounter.js     # /encounter — show encounter with role assignments
    chaosRoles.js         # /chaos-roles — reroll roles for current encounter
    dungeonStart.js       # /dungeon-start — open a Chaos Dungeon lobby
    dungeonRoll.js        # /dungeon — roll a random dungeon
    dungeonEncounter.js   # /dungeon-encounter — show dungeon encounter with role assignments
    dungeonRoles.js       # /dungeon-roles — reroll roles for current dungeon encounter
    pvpRandomStart.js     # /pvp-random — open a PvP random loadout lobby
    pvpRandomStop.js      # /pvp-random-stop — end the lobby (host only)
    pvpRandomKick.js      # /pvp-random-kick — remove a player from the lobby (host only)
  lib/
    sessionStore.js       # In-memory per-server weapon pool
    csvParser.js          # Parses DIM CSV exports
    comparator.js         # Finds weapons common to all players
    loadoutPicker.js      # Picks one weapon per slot from shared pool
    dimSearch.js          # Builds DIM search strings from weapon lists
    bungieManifest.js     # Streams and caches the Bungie item manifest
    bungieVault.js        # Fetches vault + character inventories via Bungie API
    bungieActivity.js     # Fetches activity history and most-recent character class
    bungieInventory.js    # Transfers items from vault/characters to active character
    matchWatcher.js       # Per-user PvP match polling (30 s interval)
    raceWatcher.js        # Per-user SRL race polling (30 s interval)
    messageInteraction.js # Adapter so prefix commands reuse slash command logic
    raidData.js           # All raids, encounters, and per-encounter role lists
    dungeonData.js        # All dungeons, encounters, and per-encounter role lists
    chaosSession.js       # In-memory per-guild session state for raids and dungeons (3-hr TTL)
    chaosButtonHandler.js # Dispatches chaos: button interactions; shared embed builders
    guidedSession.js      # In-memory per-guild session state for guided raids (3-hr TTL)
    guidedButtonHandler.js # Dispatches guided: button interactions; lobby and encounter embed builders
    pvpRandomSession.js    # In-memory per-guild session state for PvP Random lobbies (3-hr TTL)
    pvpRandomView.js       # Builds the pvp-random lobby message (embeds, buttons, DIM search content)
    pvpRandomButtonHandler.js # Dispatches pvpr: button interactions (join/leave/roll loadout/roll map)
    pvpRandomWatcher.js    # Watches the host's PvP matches per guild; awards ranking points after each match
  auth/
    bungieOAuth.js        # OAuth URL builder, token exchange, token refresh
    tokenStore.js         # Persists Bungie tokens to data/tokens.json
  server/
    callbackServer.js     # Express HTTP server for OAuth callback + health check
```
