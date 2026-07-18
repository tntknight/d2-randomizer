import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { preloadManifest } from './lib/bungieManifest.js';
import { startCallbackServer } from './server/callbackServer.js';
import { MessageInteraction } from './lib/messageInteraction.js';
import { pullExoticToInventory } from './lib/bungieInventory.js';

const PREFIX = '!';

// ── Load commands ─────────────────────────────────────────────────────────────
import * as addCmd         from './commands/add.js';
import * as listCmd        from './commands/list.js';
import * as loadoutCmd     from './commands/loadout.js';
import * as clearCmd       from './commands/clear.js';
import * as dropCmd        from './commands/drop.js';
import * as linkAccountCmd from './commands/linkAccount.js';
import * as loadVaultCmd   from './commands/loadVault.js';
import * as randomMapCmd   from './commands/randomMap.js';
import * as pvpWatchCmd    from './commands/pvpWatch.js';
import * as pvpStopCmd     from './commands/pvpStop.js';
import * as srlWatchCmd    from './commands/srlWatch.js';
import * as srlStopCmd     from './commands/srlStop.js';
import * as randomExoticCmd  from './commands/randomExotic.js';
import * as randomLoadoutCmd from './commands/randomLoadout.js';
import * as chaosStartCmd     from './commands/chaosStart.js';
import * as chaosBeginCmd     from './commands/chaosBegin.js';
import * as chaosClassCmd     from './commands/chaosClass.js';
import * as chaosRaidCmd      from './commands/chaosRaid.js';
import * as chaosEncounterCmd from './commands/chaosEncounter.js';
import * as chaosRolesCmd     from './commands/chaosRoles.js';
import * as dungeonStartCmd   from './commands/dungeonStart.js';
import * as dungeonRollCmd    from './commands/dungeonRoll.js';
import * as dungeonEncounterCmd from './commands/dungeonEncounter.js';
import * as dungeonRolesCmd   from './commands/dungeonRoles.js';
import * as helpCmd           from './commands/help.js';
import * as rollClassCmd      from './commands/rollClass.js';
import * as raidWatchCmd      from './commands/raidWatch.js';
import * as raidStopCmd       from './commands/raidStop.js';
import * as raidDebugCmd          from './commands/raidDebug.js';
import * as mapDebugCmd           from './commands/mapDebug.js';
import * as verityAppearancesCmd  from './commands/verityAppearances.js';
import { handleChaosButton }  from './lib/chaosButtonHandler.js';
import * as raidStartCmd      from './commands/raidStart.js';
import { handleGuidedButton } from './lib/guidedButtonHandler.js';
import { handleHelpButton }   from './commands/help.js';
import * as pvpRandomStartCmd from './commands/pvpRandomStart.js';
import * as pvpRandomStopCmd  from './commands/pvpRandomStop.js';
import * as pvpRandomKickCmd  from './commands/pvpRandomKick.js';
import { handlePvpRandomButton } from './lib/pvpRandomButtonHandler.js';

const commandModules = [
  addCmd, listCmd, loadoutCmd, clearCmd, dropCmd,
  linkAccountCmd, loadVaultCmd, randomMapCmd,
  pvpWatchCmd, pvpStopCmd,
  srlWatchCmd, srlStopCmd,
  randomExoticCmd, randomLoadoutCmd,
  chaosStartCmd, chaosBeginCmd, chaosClassCmd,
  chaosRaidCmd, chaosEncounterCmd, chaosRolesCmd,
  dungeonStartCmd, dungeonRollCmd, dungeonEncounterCmd, dungeonRolesCmd,
  helpCmd, rollClassCmd, raidWatchCmd, raidStopCmd, raidDebugCmd,
  raidStartCmd, verityAppearancesCmd, mapDebugCmd,
  pvpRandomStartCmd, pvpRandomStopCmd, pvpRandomKickCmd,
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
  client.user.setPresence({
    activities: [{ name: '/link-account', type: 2 }],
    status: 'online',
  });
});

// ── Button handler ────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('help:')) {
    await handleHelpButton(interaction);
    return;
  }

  if (interaction.customId.startsWith('chaos:')) {
    await handleChaosButton(interaction);
    return;
  }

  if (interaction.customId.startsWith('guided:')) {
    await handleGuidedButton(interaction);
    return;
  }

  if (interaction.customId.startsWith('pvpr:')) {
    await handlePvpRandomButton(interaction);
    return;
  }

  if (interaction.customId.startsWith('rollclass:reroll:')) {
    const [, , guildId, ownerId] = interaction.customId.split(':');
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: 'Only the person who rolled can reroll.', ephemeral: true });
    }
    const CLASSES = [
      { name: 'Titan',   color: 0xe8a838, emoji: '🛡️' },
      { name: 'Hunter',  color: 0x4a9eff, emoji: '🗡️' },
      { name: 'Warlock', color: 0x9b59b6, emoji: '✨' },
    ];
    const cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const embed = new EmbedBuilder()
      .setColor(cls.color)
      .setTitle(`${cls.emoji} ${cls.name}`)
      .setDescription(`${interaction.member?.displayName ?? interaction.user.username} rolled **${cls.name}**`);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rollclass:reroll:${guildId}:${ownerId}`)
        .setLabel('Reroll')
        .setStyle(ButtonStyle.Secondary),
    );
    await interaction.update({ embeds: [embed], components: [row] });
    return;
  }

  if (interaction.customId.startsWith('pull_exotic:')) {
    const itemHash = Number(interaction.customId.split(':')[1]);
    await interaction.deferReply({ ephemeral: true });

    const result = await pullExoticToInventory(interaction.user.id, itemHash).catch(err => ({
      ok: false, reason: err.message,
    }));

    if (result.ok) {
      const msg = {
        'vault':        '✅ Pulled from your vault to your active character.',
        'already-here': '✅ Already in your active character\'s inventory.',
        'character':    '✅ Moved from another character to your active character.',
      };
      await interaction.editReply({ content: msg[result.location] ?? '✅ Done.' });
    } else {
      const msg = {
        'not-owned':    "❌ You don't own this exotic.",
        'only-equipped': "❌ This exotic is currently equipped on one of your characters. Unequip it in-game first, then try again.",
        'no-link':      '❌ Your Bungie account isn\'t linked. Run `/link-account` first.',
        'refresh-failed':'❌ Your Bungie session expired. Run `/link-account` to re-link.',
      };
      await interaction.editReply({ content: msg[result.reason] ?? `❌ Transfer failed: ${result.reason}` });
    }
    return;
  }
});

// ── Slash command handler ─────────────────────────────────────────────────────
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
