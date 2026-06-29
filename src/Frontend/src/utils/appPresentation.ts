export const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const isWebOrFrontendApp = (app: {
  displayName: string;
  appKey: string;
  description?: string;
  tags?: string[];
  components?: { name: string }[];
  labels?: Record<string, string>;
}): boolean => {
  const haystack = [
    app.displayName,
    app.appKey,
    app.description ?? '',
    ...(app.tags ?? []),
    ...(app.components ?? []).map((c) => c.name),
    ...Object.values(app.labels ?? {}),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes('frontend') || haystack.includes('web');
};

export const getAppDisplayName = (app: { displayName: string; siteTitle?: string }): string =>
  app.siteTitle?.trim() || app.displayName;

export const getAppIconUrl = (app: { icon?: string; faviconUrl?: string }): string | undefined =>
  app.faviconUrl || (app.icon?.startsWith('http') ? app.icon : undefined);

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
