const BUNGIE_BASE = 'https://www.bungie.net';
const TOKEN_URL   = `${BUNGIE_BASE}/platform/app/oauth/token/`;

export function buildAuthUrl(state) {
  const params = new URLSearchParams({
    client_id:     process.env.BUNGIE_CLIENT_ID,
    response_type: 'code',
    state,
  });
  return `${BUNGIE_BASE}/en/oauth/authorize?${params}`;
}

async function requestToken(body) {
  const credentials = Buffer.from(
    `${process.env.BUNGIE_CLIENT_ID}:${process.env.BUNGIE_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
      'X-API-Key':     process.env.BUNGIE_API_KEY,
    },
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function exchangeCode(code) {
  const data = await requestToken({
    grant_type:   'authorization_code',
    code,
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
  });
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    Date.now() + data.expires_in * 1000,
  };
}

export async function refreshAccessToken(storedRefreshToken) {
  const data = await requestToken({
    grant_type:    'refresh_token',
    refresh_token: storedRefreshToken,
  });
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    Date.now() + data.expires_in * 1000,
  };
}

export async function getMemberships(accessToken) {
  const res = await fetch(`${BUNGIE_BASE}/Platform/User/GetMembershipsForCurrentUser/`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-API-Key':     process.env.BUNGIE_API_KEY,
    },
  });

  const json = await res.json();
  if (json.ErrorCode !== 1) throw new Error(`Bungie error: ${json.Message}`);

  const memberships = json.Response.destinyMemberships ?? [];
  const primaryId   = json.Response.primaryMembershipId;
  const primary     = memberships.find(m => m.membershipId === primaryId) ?? memberships[0];

  if (!primary) throw new Error('No Destiny 2 account found on this Bungie account.');

  const displayName = primary.bungieGlobalDisplayName
    ? `${primary.bungieGlobalDisplayName}#${String(primary.bungieGlobalDisplayNameCode).padStart(4, '0')}`
    : (primary.displayName ?? 'Guardian');

  return {
    membershipType: primary.membershipType,
    membershipId:   primary.membershipId,
    displayName,
  };
}
