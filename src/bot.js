import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { preloadManifest } from './lib/bungieManifest.js';
import { startCallbackServer } from './server/callbackServer.js';

// ── Load commands ─────────────────────────────────────────────────────────────
import * as addCmd         from './commands/add.js';
import * as listCmd        from './commands/list.js';
import * as loadoutCmd     from './commands/loadout.js';
import * as clearCmd       from './commands/clear.js';
import * as dropCmd        from './commands/drop.js';
import * as linkAccountCmd from './commands/linkAccount.js';
import * as loadVaultCmd   from './commands/loadVault.js';

const commandModules = [
  addCmd, listCmd, loadoutCmd, clearCmd, dropCmd,
  linkAccountCmd, loadVaultCmd,
];

// ── Discord client ────────────────────────────────────────────────────────────
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
commandModules.forEach(mod => {
  client.commands.set(mod.data.name, mod);
});

// ── Ready ─────────────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  preloadManifest();
  startCallbackServer();
});

// ── Interaction handler ───────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error in /${interaction.commandName}:`, err);
    const msg = { content: 'Something went wrong running that command.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
