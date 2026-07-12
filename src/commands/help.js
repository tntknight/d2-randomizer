import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show all available commands and what they do');

export async function execute(interaction) {
  const embeds = [
    new EmbedBuilder()
      .setColor(0x1a1d26)
      .setTitle('D2 Randomizer — Commands')
      .setDescription('All commands are available as `/slash` or `!prefix` style.')
      .addFields(
        {
          name: '⚙️ Account Setup',
          value: [
            '`/link-account` — Link your Bungie.net account so the bot can access your vault',
            '`/load-vault` — Fetch your D2 vault weapons and add them to the server pool',
          ].join('\n'),
        },
        {
          name: '🎲 Weapon Compare',
          value: [
            '`/compare-add [file1…8] [player]` — Upload your DIM CSV export(s) to the server pool',
            '`/compare-list` — Show all files currently loaded in the server pool',
            '`/compare-loadout` — Roll a random loadout from weapons everyone in the pool shares',
            '`/compare-drop [filename]` — Remove a file from the pool (omit to remove all)',
            '`/compare-clear` — Wipe all files and results for this server',
          ].join('\n'),
        },
        {
          name: '🎯 Random Rolls',
          value: [
            '`/random-exotic [class]` — Pick a random exotic armor piece for your class (auto-detects if linked)',
            '`/random-loadout` — Roll a random 3-weapon loadout from your vault with one guaranteed exotic',
            '`/random-map` — Pick a random D2 PvP map',
          ].join('\n'),
        },
        {
          name: '👁️ PvP Watch',
          value: [
            '`/pvp-watch` — Watch for your PvP match results; posts a scoreboard and rolls a new loadout after each match',
            '`/pvp-stop` — Stop watching for PvP results',
          ].join('\n'),
        },
        {
          name: '🏎️ Sparrow Racing',
          value: [
            '`/srl-watch` — Watch for Sparrow Racing League private match results',
            '`/srl-stop` — Stop watching for SRL results',
          ].join('\n'),
        },
        {
          name: '💥 Chaos Raids',
          value: [
            '`/chaos-start` — Open a Chaos Raid lobby (up to 6 players can join via button)',
            '`/chaos-begin` — Close the lobby and move to class opt-in *(host only)*',
            '`/chaos-class <yes|no>` — Choose whether you want a randomly assigned class',
            '`/raid` — Roll a random raid; during a session rerolls the raid *(host only)*',
            '`/encounter [number]` — Show the current encounter with roles assigned per player',
            '`/chaos-roles` — Reroll roles for the current encounter without advancing',
          ].join('\n'),
        },
      )
      .setFooter({ text: 'Bungie account required for: load-vault, random-loadout, random-exotic, pvp-watch, srl-watch' }),
  ];

  await interaction.reply({ embeds, ephemeral: true });
}
