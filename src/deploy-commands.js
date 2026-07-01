/**
 * Run this once whenever you add or change a slash command:
 *   npm run deploy
 *
 * Uses guild commands (instant) during development.
 * To deploy globally, swap Routes.applicationGuildCommands for Routes.applicationCommands.
 */
import 'dotenv/config';
import { REST, Routes } from 'discord.js';

import * as addCmd         from './commands/add.js';
import * as listCmd        from './commands/list.js';
import * as loadoutCmd     from './commands/loadout.js';
import * as clearCmd       from './commands/clear.js';
import * as dropCmd        from './commands/drop.js';
import * as linkAccountCmd from './commands/linkAccount.js';
import * as loadVaultCmd   from './commands/loadVault.js';

const commands = [addCmd, listCmd, loadoutCmd, clearCmd, dropCmd, linkAccountCmd, loadVaultCmd]
  .map(mod => mod.data.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('Registering slash commands...');
  await rest.put(
    Routes.applicationCommands(process.env.APP_ID),
    { body: commands },
  );
  console.log('Done. Commands registered globally.');
  setTimeout(() => process.exit(0), 500);
} catch (err) {
  console.error(err);
  setTimeout(() => process.exit(1), 500);
}
