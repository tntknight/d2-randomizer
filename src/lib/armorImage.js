import sharp from 'sharp';

const ICON_SIZE = 128;

async function fetchIconBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Icon fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Stacks item icons top-to-bottom in the given order into a single PNG buffer.
export async function buildStackedIconImage(items) {
  const icons = items.filter(item => item.iconUrl);
  if (icons.length === 0) return null;

  const resized = await Promise.all(
    icons.map(async item => {
      const buf = await fetchIconBuffer(item.iconUrl);
      return sharp(buf).resize(ICON_SIZE, ICON_SIZE).png().toBuffer();
    })
  );

  return sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE * resized.length,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(resized.map((input, i) => ({ input, left: 0, top: i * ICON_SIZE })))
    .png()
    .toBuffer();
}
