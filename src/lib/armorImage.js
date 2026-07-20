import sharp from 'sharp';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Registered explicitly and bundled as a dependency because the label text is
// drawn on a headless Linux deploy (Railway/Nixpacks) that has no system
// fonts installed — relying on a default/system font left labels blank there.
const FONT_FAMILY = 'Verity Label';
GlobalFonts.registerFromPath(
  require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf'),
  FONT_FAMILY
);

const ICON_SIZE = 192;
const LABEL_HEIGHT = 48;
const COLUMN_GAP = 16;
const BG = { r: 35, g: 39, b: 42, alpha: 1 };

async function fetchIconBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Icon fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function labelTile(text) {
  const canvas = createCanvas(ICON_SIZE, LABEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2c2f33';
  ctx.fillRect(0, 0, ICON_SIZE, LABEL_HEIGHT);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 22px "${FONT_FAMILY}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxWidth = ICON_SIZE - 16;
  let label = text;
  if (ctx.measureText(label).width > maxWidth) {
    while (label.length > 1 && ctx.measureText(`${label}…`).width > maxWidth) {
      label = label.slice(0, -1);
    }
    label = `${label}…`;
  }

  ctx.fillText(label, ICON_SIZE / 2, LABEL_HEIGHT / 2 + 1);
  return canvas.toBuffer('image/png');
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
