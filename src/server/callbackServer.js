import { randomUUID } from 'crypto';
import express from 'express';
import { exchangeCode, getMemberships } from '../auth/bungieOAuth.js';
import { saveTokens } from '../auth/tokenStore.js';

const app = express();

// Temporary store: OAuth state string → Discord user ID (expires after 10 min)
const pendingLinks = new Map();

export function addPendingLink(discordUserId) {
  const state = randomUUID();
  pendingLinks.set(state, discordUserId);
  setTimeout(() => pendingLinks.delete(state), 10 * 60 * 1000);
  return state;
}

// Railway health check
app.get('/health', (_req, res) => res.sendStatus(200));

app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    return res.send(page('Link Failed', `
      <p>Something went wrong: <em>${error ?? 'missing parameters'}</em>.</p>
      <p>Run <code>/link-account</code> in Discord to try again.</p>
    `));
  }

  const discordUserId = pendingLinks.get(state);
  if (!discordUserId) {
    return res.send(page('Link Expired', `
      <p>This link has expired or was already used.</p>
      <p>Run <code>/link-account</code> in Discord to get a fresh link.</p>
    `));
  }

  pendingLinks.delete(state);

  try {
    const tokens     = await exchangeCode(code);
    const membership = await getMemberships(tokens.accessToken);

    saveTokens(discordUserId, { ...tokens, ...membership });

    res.send(page('Account Linked!', `
      <p>&#x2705; Your Bungie account <strong>${membership.displayName}</strong> is now linked.</p>
      <p>Go back to Discord and run <code>/load-vault</code> to load your weapons.</p>
    `));
  } catch (err) {
    console.error('[OAuth] Callback error:', err);
    res.send(page('Link Failed', `
      <p>An error occurred while linking your account.</p>
      <p>Run <code>/link-account</code> in Discord to try again.</p>
    `));
  }
});

function page(title, body) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} — D2 Randomizer</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 16px; background: #1a1d26; color: #ccc; }
    h1   { color: #fff; }
    code { background: #2a2d3a; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    strong { color: #fff; }
    em { color: #f04747; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
</body>
</html>`;
}

export function startCallbackServer() {
  // Railway injects PORT; fall back to OAUTH_PORT for local dev
  const port = Number(process.env.PORT ?? process.env.OAUTH_PORT ?? 3000);
  app.listen(port, () => {
    console.log(`[OAuth] Callback server listening on port ${port}`);
  });
}
