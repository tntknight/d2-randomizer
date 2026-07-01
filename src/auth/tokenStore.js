import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = join(__dirname, '../../data');
const TOKEN_FILE = join(DATA_DIR, 'tokens.json');

function load() {
  if (!existsSync(TOKEN_FILE)) return {};
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function getTokens(discordUserId) {
  return load()[discordUserId] ?? null;
}

export function saveTokens(discordUserId, tokenData) {
  const data = load();
  data[discordUserId] = tokenData;
  save(data);
}

export function removeTokens(discordUserId) {
  const data = load();
  delete data[discordUserId];
  save(data);
}

export function isLinked(discordUserId) {
  return Boolean(load()[discordUserId]);
}
