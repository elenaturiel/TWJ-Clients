type IconProps = { className?: string };

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconWeek({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconChart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 19V10M12 19V5M20 19v-6" />
      <path d="M3 19h18" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.7-3 3-5 5.5-5s4.8 2 5.5 5" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.8 12.2c1.9.4 3.5 2.1 4.1 4.6" />
    </svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-4 4-6.5 7.5-6.5s6.5 2.5 7.5 6.5" />
    </svg>
  );
}

export function IconCart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 4h2l2.2 11.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20.5 8H6" />
      <circle cx="9.5" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </svg>
  );
}

export function IconMessage({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  );
}

export function IconMedal({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="14" r="6" />
      <path d="M9 3h6l2 6.5-3.5 2-3.5-2L8 9.5 9 3Z" />
    </svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconFlame({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3c1 2.5-2.5 4-2.5 7a2.5 2.5 0 0 0 5 0c1.2 1 2 2.6 2 4.2a4.5 4.5 0 0 1-9 0C7.5 9.8 10 8 12 3Z" />
    </svg>
  );
}

export function IconSend({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 12l16-8-6 16-2.5-6L4 12Z" />
    </svg>
  );
}
