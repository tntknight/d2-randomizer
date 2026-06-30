import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { parseWeaponCSV } from '../lib/csvParser.js';
import sessionStore from '../lib/sessionStore.js';

export const data = new SlashCommandBuilder()
  .setName('compare-add')
  .setDescription('Add your DIM CSV export to this server\'s pool')
  .addAttachmentOption(o => o.setName('file1').setDescription('DIM CSV export').setRequired(true))
  .addAttachmentOption(o => o.setName('file2').setDescription('DIM CSV export'))
  .addAttachmentOption(o => o.setName('file3').setDescription('DIM CSV export'))
  .addAttachmentOption(o => o.setName('file4').setDescription('DIM CSV export'))
  .addAttachmentOption(o => o.setName('file5').setDescription('DIM CSV export'))
  .addAttachmentOption(o => o.setName('file6').setDescription('DIM CSV export'))
  .addAttachmentOption(o => o.setName('file7').setDescription('DIM CSV export'))
  .addAttachmentOption(o => o.setName('file8').setDescription('DIM CSV export'));

export async function execute(interaction) {
  if (!interaction.guildId) {
    return interaction.reply({ content: 'This command only works in a server.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const attachments = ['file1','file2','file3','file4','file5','file6','file7','file8']
    .map(name => interaction.options.getAttachment(name))
    .filter(Boolean);

  const session = sessionStore.getOrCreate(interaction.guildId);
  const added = [];
  const skipped = [];
  const errors = [];

  for (const attachment of attachments) {
    if (!attachment.name.endsWith('.csv')) {
      skipped.push(`${attachment.name} (not a .csv)`);
      continue;
    }

    // Same user uploading the same filename again — skip it
    if (session.files.some(f => f.filename === attachment.name && f.uploadedBy === interaction.user.username)) {
      skipped.push(`${attachment.name} (you already loaded this file)`);
      continue;
    }

    try {
      const text = await fetch(attachment.url).then(r => r.text());
      const weapons = parseWeaponCSV(text);

      if (weapons.length === 0) {
        errors.push(`${attachment.name} (no weapons found — is this a DIM export?)`);
        continue;
      }

      // If another player already uploaded a file with this name, tag it with the uploader's name
      const displayName = session.files.some(f => f.filename === attachment.name)
        ? `${attachment.name} (${interaction.user.username})`
        : attachment.name;

      session.files.push({
        filename:   displayName,
        weapons,
        uploadedBy: interaction.user.username,
      });
      session.matchData   = null;
      session.lastLoadout = null;
      added.push(`${attachment.name} — ${weapons.length} weapons`);
    } catch (err) {
      console.error('Failed to parse', attachment.name, err);
      errors.push(`${attachment.name} (parse error)`);
    }
  }

  sessionStore.touch(interaction.guildId);

  const embed = new EmbedBuilder().setColor(0x1a1d26);

  if (added.length)   embed.addFields({ name: '✅ Added',   value: added.join('\n')   });
  if (skipped.length) embed.addFields({ name: '⏭️ Skipped', value: skipped.join('\n') });
  if (errors.length)  embed.addFields({ name: '❌ Errors',  value: errors.join('\n')  });

  if (session.files.length > 0) {
    const fileList = session.files
      .map(f => `• ${f.filename} — ${f.weapons.length} weapons (${f.uploadedBy})`)
      .join('\n');
    embed.addFields({
      name:  `📂 Server pool (${session.files.length} file${session.files.length !== 1 ? 's' : ''})`,
      value: fileList,
    });
    embed.setFooter({
      text: session.files.length >= 2
        ? 'Run /compare-loadout to roll a loadout from shared weapons.'
        : 'Waiting for more files from other players.',
    });
  }

  await interaction.editReply({ embeds: [embed] });
}
