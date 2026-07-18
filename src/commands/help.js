import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const COLOR = 0x1a1d26;

const PAGES = [
  new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('D2 Randomizer — Account & Weapons (1/5)')
    .setDescription('All commands work as `/slash` or `!prefix`.')
    .addFields(
      {
        name: '⚙️ Account Setup',
        value: [
          '`/link-account` — Link your Bungie.net account (required for vault/watcher features)',
          '`/load-vault` — Fetch your D2 vault weapons into the server pool',
        ].join('\n'),
      },
      {
        name: '🎲 Weapon Compare',
        value: [
          '`/compare-add [files] [player]` — Upload your DIM CSV export(s) to the server pool',
          '`/compare-list` — Show all files currently loaded in the server pool',
          '`/compare-loadout` — Roll a random loadout from weapons everyone in the pool shares',
          '`/compare-drop [filename]` — Remove a file from the pool (omit to remove all)',
          '`/compare-clear` — Wipe all files and results for this server',
        ].join('\n'),
      },
    ),

  new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('D2 Randomizer — Random Tools (2/5)')
    .addFields(
      {
        name: '🎯 Random Rolls',
        value: [
          '`/random-exotic [class]` — Pick a random exotic armor piece (auto-detects class if linked)',
          '`/random-loadout` — Roll a random 3-weapon loadout from your vault with one exotic',
          '`/random-map` — Pick a random D2 PvP map',
          '`/roll-class` — Roll a random class (Titan / Hunter / Warlock)',
        ].join('\n'),
      },
    ),

  new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('D2 Randomizer — Activity Watchers (3/5)')
    .setDescription('All watchers poll the Bungie API every 30 seconds. Requires a linked account. Resets on bot restart.')
    .addFields(
      {
        name: '👁️ PvP Watch',
        value: [
          '`/pvp-watch` — Watch for PvP match results; posts scoreboard + rolls a loadout after each match',
          '`/pvp-stop` — Stop watching',
        ].join('\n'),
      },
      {
        name: '🏎️ Sparrow Racing',
        value: [
          '`/srl-watch` — Watch for Sparrow Racing League private match results',
          '`/srl-stop` — Stop watching',
        ].join('\n'),
      },
      {
        name: '🏰 Raid Watch',
        value: [
          '`/raid-watch` — Watch for raid completions; posts a full results embed with kills/weapons per player',
          '`/raid-stop` — Stop watching',
          '`/raid-debug` — Manually pull and post your most recent raid result',
        ].join('\n'),
      },
    ),

  new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('D2 Randomizer — Guided Raids (4/5)')
    .addFields(
      {
        name: '🗺️ Guided Raids',
        value: [
          '`/raid-start <raid>` — Pick a raid and open a lobby (up to 6 players)',
          '> Players join via **Join**; host presses **Begin** when ready',
          '> Each encounter shown in order with randomly assigned roles',
          '> Host presses **Next Encounter** to advance; last shows **Finish Raid**',
          '> Guide images can be added per-encounter in `raidData.js`',
        ].join('\n'),
      },
      {
        name: '🔮 Raid Utilities',
        value: [
          '`/verity-appearances [player1…6]` — Show each player\'s equipped ghost and armor for Verity statue identification',
        ].join('\n'),
      },
    ),

  new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('D2 Randomizer — Chaos Activities (5/5)')
    .setDescription('`/chaos-begin` and `/chaos-class` are shared between Chaos Raids and Chaos Dungeons.')
    .addFields(
      {
        name: '💥 Chaos Raids',
        value: [
          '`/chaos-start` — Open a Chaos Raid lobby (up to 6 players)',
          '`/chaos-begin` — Close the lobby and start class opt-in *(host only)*',
          '`/chaos-class <yes|no>` — Choose whether you want a randomly assigned class',
          '`/raid` — Roll a random raid; rerolls during a session *(host only)*',
          '`/encounter [number]` — Show encounter with roles *(host only)*',
          '`/chaos-roles` — Reroll roles for the current encounter *(host only)*',
        ].join('\n'),
      },
      {
        name: '🏚️ Chaos Dungeons',
        value: [
          '`/dungeon-start` — Open a Chaos Dungeon lobby (up to 3 players)',
          '`/chaos-begin` — Close the lobby and start class opt-in *(host only)*',
          '`/chaos-class <yes|no>` — Choose whether you want a randomly assigned class',
          '`/dungeon` — Roll a random dungeon; rerolls during a session *(host only)*',
          '`/dungeon-encounter [number]` — Show dungeon encounter with roles *(host only)*',
          '`/dungeon-roles` — Reroll roles for the current dungeon encounter *(host only)*',
        ].join('\n'),
      },
    )
    .setFooter({ text: 'Bungie account required for: load-vault, random-loadout, random-exotic, pvp-watch, srl-watch, raid-watch' }),
];

function buildRow(page, userId) {
  const isFirst = page === 0;
  const isLast  = page === PAGES.length - 1;
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help:${page - 1}:${userId}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isFirst),
    new ButtonBuilder()
      .setCustomId(`help:indicator:${userId}`)
      .setLabel(`${page + 1} / ${PAGES.length}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`help:${page + 1}:${userId}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isLast),
  );
}

export async function handleHelpButton(interaction) {
  const parts  = interaction.customId.split(':');
  const page   = parseInt(parts[1], 10);
  const userId = parts[2];

  if (interaction.user.id !== userId) {
    return interaction.reply({ content: 'This help menu belongs to someone else.', ephemeral: true });
  }

  await interaction.update({
    embeds:     [PAGES[page]],
    components: [buildRow(page, userId)],
  });
}

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show all available commands');

export async function execute(interaction) {
  await interaction.reply({
    embeds:     [PAGES[0]],
    components: [buildRow(0, interaction.user.id)],
    ephemeral:  true,
  });
}
