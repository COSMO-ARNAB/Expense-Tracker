export function formatBytes(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  if (v < 1024) return `${v} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  let val = v;
  do {
    val /= 1024;
    i++;
  } while (val >= 1024 && i < units.length - 1);
  return `${val.toFixed(val < 10 ? 2 : 1)} ${units[i]}`;
}

export function formatSpeed(bps) {
  if (!bps || Number.isNaN(Number(bps))) return '';
  return `${formatBytes(bps)}/s`;
}

export function relTime(iso) {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'never';
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const s = Math.floor(diff / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 2) return '1 min ago';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 2) return '1 hour ago';
  if (h < 24) return `${h} hours ago`;
  const d = Math.floor(h / 24);
  if (d < 2) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} weeks ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} months ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}
