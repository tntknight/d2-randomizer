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
const FONT_SIZE = 96;
const LABEL_HEIGHT = 140;
const LABEL_H_PADDING = 24;
const MAX_COLUMN_WIDTH = 640;
const COLUMN_GAP = 24;
const BG = { r: 35, g: 39, b: 42, alpha: 1 };
const FONT = `bold ${FONT_SIZE}px "${FONT_FAMILY}"`;

async function fetchIconBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Icon fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let label = text;
  while (label.length > 1 && ctx.measureText(`${label}…`).width > maxWidth) {
    label = label.slice(0, -1);
  }
  return `${label}…`;
}

// Column width grows to fit the name (up to a cap) so the large font doesn't
// force truncation on ordinary usernames; the icon stack is centered under it.
function labelTile(text) {
  const measureCtx = createCanvas(10, 10).getContext('2d');
  measureCtx.font = FONT;
  const rawWidth = measureCtx.measureText(text).width;
  const columnWidth = Math.max(ICON_SIZE, Math.min(MAX_COLUMN_WIDTH, Math.ceil(rawWidth) + LABEL_H_PADDING * 2));

  const canvas = createCanvas(columnWidth, LABEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2c2f33';
  ctx.fillRect(0, 0, columnWidth, LABEL_HEIGHT);

  ctx.fillStyle = '#ffffff';
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const label = truncateToWidth(ctx, text, columnWidth - LABEL_H_PADDING);
  ctx.fillText(label, columnWidth / 2, LABEL_HEIGHT / 2 + 2);

  return { buffer: canvas.toBuffer('image/png'), width: columnWidth };
}

function blankTile() {
  return sharp({
    create: { width: ICON_SIZE, height: ICON_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer();
}

// players: [{ name, items: [ghost, helmet, gauntlets, chest, legs, classItem] }]
// Builds one image: a labeled column per player, each column stacking that
// player's icons top-to-bottom in the given item order. Column width follows
// the (large) label width, with the icon stack centered underneath.
export async function buildPlayerGridImage(players) {
  if (players.length === 0) return null;

  const rows = players[0].items.length;

  const columns = await Promise.all(players.map(async player => {
    const icons = await Promise.all(player.items.map(async item => {
      if (!item?.iconUrl) return blankTile();
      const buf = await fetchIconBuffer(item.iconUrl);
      return sharp(buf).resize(ICON_SIZE, ICON_SIZE).png().toBuffer();
    }));
    const { buffer: label, width: labelWidth } = labelTile(player.name);
    return { label, labelWidth, icons, columnWidth: Math.max(labelWidth, ICON_SIZE) };
  }));

  const totalWidth = columns.reduce((sum, c) => sum + c.columnWidth, 0) + COLUMN_GAP * (columns.length - 1);
  const height = LABEL_HEIGHT + rows * ICON_SIZE;

  const composites = [];
  let left = 0;
  for (const col of columns) {
    composites.push({ input: col.label, left: left + Math.round((col.columnWidth - col.labelWidth) / 2), top: 0 });
    const iconLeft = left + Math.round((col.columnWidth - ICON_SIZE) / 2);
    col.icons.forEach((icon, rowIdx) => {
      composites.push({ input: icon, left: iconLeft, top: LABEL_HEIGHT + rowIdx * ICON_SIZE });
    });
    left += col.columnWidth + COLUMN_GAP;
  }

  return sharp({ create: { width: totalWidth, height, channels: 4, background: BG } })
    .composite(composites)
    .png()
    .toBuffer();
}
