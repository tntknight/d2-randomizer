/**
 * Register slash commands globally (replaces any previous global commands).
 *
 *   npm run deploy
 *
 * To also wipe guild-specific commands (e.g. from dev), pass guild IDs as args:
 *
 *   npm run deploy -- 123456789012345678 987654321098765432
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
import * as randomMapCmd   from './commands/randomMap.js';
import * as pvpWatchCmd    from './commands/pvpWatch.js';
import * as pvpStopCmd     from './commands/pvpStop.js';
import * as srlWatchCmd     from './commands/srlWatch.js';
import * as srlStopCmd      from './commands/srlStop.js';
import * as randomExoticCmd  from './commands/randomExotic.js';
import * as randomLoadoutCmd from './commands/randomLoadout.js';
import * as chaosStartCmd     from './commands/chaosStart.js';
import * as chaosBeginCmd     from './commands/chaosBegin.js';
import * as chaosClassCmd     from './commands/chaosClass.js';
import * as chaosRaidCmd      from './commands/chaosRaid.js';
import * as chaosEncounterCmd from './commands/chaosEncounter.js';
import * as chaosRolesCmd     from './commands/chaosRoles.js';

const commands = [addCmd, listCmd, loadoutCmd, clearCmd, dropCmd, linkAccountCmd, loadVaultCmd, randomMapCmd, pvpWatchCmd, pvpStopCmd, srlWatchCmd, srlStopCmd, randomExoticCmd, randomLoadoutCmd, chaosStartCmd, chaosBeginCmd, chaosClassCmd, chaosRaidCmd, chaosEncounterCmd, chaosRolesCmd]
  .map(mod => mod.data.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Guild IDs passed as CLI args will have their commands wiped before global registration
const guildsToClear = process.argv.slice(2).filter(Boolean);

try {
  // Clear any guild-specific commands first (these are separate from global commands)
  for (const guildId of guildsToClear) {
    console.log(`Clearing guild commands for ${guildId}...`);
    await rest.put(Routes.applicationGuildCommands(process.env.APP_ID, guildId), { body: [] });
    console.log(`  Done.`);
  }

  // PUT replaces all existing global commands with this exact list
  console.log(`Registering ${commands.length} commands globally...`);
  await rest.put(
    Routes.applicationCommands(process.env.APP_ID),
    { body: commands },
  );
  console.log('Done. Commands registered globally (may take up to 1 hour to appear in new servers).');
  setTimeout(() => process.exit(0), 500);
} catch (err) {
  console.error(err);
  setTimeout(() => process.exit(1), 500);
}
