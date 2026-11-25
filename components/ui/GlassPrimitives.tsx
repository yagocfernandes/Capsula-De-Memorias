import React from 'react';
import { AccentTheme } from '@/utils/types';

export const THEME_ACCENT_MAP: Record<
  AccentTheme,
  {
    badge: string;
    border: string;
    button: string;
    glow: string;
    text: string;
    hex: string;
  }
> = {
  rose: {
    badge: 'bg-pastel-rose/15 text-pastel-rose border-pastel-rose/30',
    border: 'border-pastel-rose/30',
    button:
      'bg-gradient-to-r from-pastel-rose via-pastel-lavender to-pastel-peach text-obsidian-950 hover:brightness-110',
    glow: 'shadow-[0_0_35px_-5px_rgba(253,164,175,0.35)]',
    text: 'text-pastel-rose',
    hex: '#FDA4AF',
  },
  lavender: {
    badge: 'bg-pastel-lavender/15 text-pastel-lavender border-pastel-lavender/30',
    border: 'border-pastel-lavender/30',
    button:
      'bg-gradient-to-r from-pastel-lavender via-pastel-sky to-pastel-rose text-obsidian-950 hover:brightness-110',
    glow: 'shadow-[0_0_35px_-5px_rgba(196,181,253,0.35)]',
    text: 'text-pastel-lavender',
    hex: '#C4B5FD',
  },
  mint: {
    badge: 'bg-pastel-mint/15 text-pastel-mint border-pastel-mint/30',
    border: 'border-pastel-mint/30',
    button:
      'bg-gradient-to-r from-pastel-mint via-pastel-sky to-pastel-lavender text-obsidian-950 hover:brightness-110',
    glow: 'shadow-[0_0_35px_-5px_rgba(167,243,208,0.35)]',
    text: 'text-pastel-mint',
    hex: '#A7F3D0',
  },
  peach: {
    badge: 'bg-pastel-peach/15 text-pastel-peach border-pastel-peach/30',
    border: 'border-pastel-peach/30',
    button:
      'bg-gradient-to-r from-pastel-peach via-pastel-rose to-pastel-butter text-obsidian-950 hover:brightness-110',
    glow: 'shadow-[0_0_35px_-5px_rgba(253,186,116,0.35)]',
    text: 'text-pastel-peach',
    hex: '#FDBA74',
  },
  sky: {
    badge: 'bg-pastel-sky/15 text-pastel-sky border-pastel-sky/30',
    border: 'border-pastel-sky/30',
    button:
      'bg-gradient-to-r from-pastel-sky via-pastel-mint to-pastel-lavender text-obsidian-950 hover:brightness-110',
    glow: 'shadow-[0_0_35px_-5px_rgba(186,230,253,0.35)]',
    text: 'text-pastel-sky',
    hex: '#BAE6FD',
  },
};

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevated = false,
}) => {
  return (
    <div
      className={`${
        elevated ? 'glass-panel' : 'glass-card'
      } rounded-3xl p-6 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
};

interface PastelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'ghost';
  theme?: AccentTheme;
  icon?: React.ReactNode;
}

export const PastelButton: React.FC<PastelButtonProps> = ({
  children,
  variant = 'primary',
  theme = 'rose',
  icon,
  className = '',
  ...props
}) => {
  const accent = THEME_ACCENT_MAP[theme] || THEME_ACCENT_MAP.rose;

  const baseStyles =
    'inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 font-semibold text-sm sm:text-base transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

  const variantStyles =
    variant === 'primary'
      ? `${accent.button} ${accent.glow} font-bold`
      : variant === 'glass'
      ? 'glass-card text-slate-100 hover:border-pastel-rose/40 hover:text-white'
      : 'text-slate-300 hover:text-white hover:bg-white/5';

  return (
    <button className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
