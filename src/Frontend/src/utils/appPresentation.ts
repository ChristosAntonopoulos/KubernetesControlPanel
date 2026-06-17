export const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const isEmojiOrUrl = (icon?: string | null): boolean => {
  if (!icon) return false;
  if (icon.startsWith('http://') || icon.startsWith('https://')) return true;
  return icon.length <= 4;
};

export const formatRelativeTime = (date?: string | null): string => {
  if (!date) return '';
  const then = new Date(date).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
