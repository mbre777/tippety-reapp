export function initialsOf(nick?: string) {
  if (!nick) return '?';
  const parts = nick.split(/[_\d]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : nick.slice(0, 2)).toUpperCase();
}
