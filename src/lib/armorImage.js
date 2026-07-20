import sharp from 'sharp';

const ICON_SIZE = 128;
const LABEL_HEIGHT = 36;
const COLUMN_GAP = 12;
const BG = { r: 35, g: 39, b: 42, alpha: 1 };

async function fetchIconBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Icon fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function labelTile(text) {
  const safe = escapeXml(text.length > 16 ? `${text.slice(0, 15)}…` : text);
  const svg = `
    <svg width="${ICON_SIZE}" height="${LABEL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#2c2f33"/>
      <text x="50%" y="50%" fill="#ffffff" font-size="14" font-family="sans-serif"
            text-anchor="middle" dominant-baseline="middle">${safe}</text>
    </svg>`;
  return Buffer.from(svg);
}

function blankTile() {
  return sharp({
    create: { width: ICON_SIZE, height: ICON_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer();
}

// players: [{ name, items: [ghost, helmet, gauntlets, chest, legs, classItem] }]
// Builds one image: a labeled column per player, each column stacking that
// player's icons top-to-bottom in the given item order.
export async function buildPlayerGridImage(players) {
  if (players.length === 0) return null;

  const rows = players[0].items.length;

  const columns = await Promise.all(players.map(async player => {
    const icons = await Promise.all(player.items.map(async item => {
      if (!item?.iconUrl) return blankTile();
      const buf = await fetchIconBuffer(item.iconUrl);
      return sharp(buf).resize(ICON_SIZE, ICON_SIZE).png().toBuffer();
    }));
    return { label: labelTile(player.name), icons };
  }));

  const width = players.length * ICON_SIZE + (players.length - 1) * COLUMN_GAP;
  const height = LABEL_HEIGHT + rows * ICON_SIZE;

  const composites = [];
  columns.forEach((col, colIdx) => {
    const left = colIdx * (ICON_SIZE + COLUMN_GAP);
    composites.push({ input: col.label, left, top: 0 });
    col.icons.forEach((icon, rowIdx) => {
      composites.push({ input: icon, left, top: LABEL_HEIGHT + rowIdx * ICON_SIZE });
    });
  });

  return sharp({ create: { width, height, channels: 4, background: BG } })
    .composite(composites)
    .png()
    .toBuffer();
}
