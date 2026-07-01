import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { preloadManifest } from './lib/bungieManifest.js';
import { startCallbackServer } from './server/callbackServer.js';
import { MessageInteraction } from './lib/messageInteraction.js';

const PREFIX = '!';

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
// MessageContent is a privileged intent — enable it in the Discord Developer Portal
// under Bot → Privileged Gateway Intents → Message Content Intent
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
commandModules.forEach(mod => {
  client.commands.set(mod.data.name, mod);
});

// Start the HTTP server immediately so Railway's health check passes on boot
startCallbackServer();

// ── Ready ─────────────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  preloadManifest();
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

// ── Prefix command handler ────────────────────────────────────────────────────
// Mirrors all slash commands so they're available immediately (e.g. !compare-add,
// !link-account) without waiting for Discord's global slash-command propagation.
client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const [commandName, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = client.commands.get(commandName);
  if (!command) return;

  const interaction = new MessageInteraction(message, args);
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error in !${commandName}:`, err);
    const msg = { content: 'Something went wrong running that command.' };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg).catch(() => {});
    } else {
      await message.reply(msg).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
