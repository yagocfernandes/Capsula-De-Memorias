import React, { useEffect, useState } from 'react';
import { Clock, Heart, Sparkles, Calendar } from 'lucide-react';
import { calculateTimeTogether, TimeTogetherBreakdown } from '@/utils/timeStats';
import { AccentTheme } from '@/utils/types';
import { GlassCard, THEME_ACCENT_MAP } from './GlassPrimitives';

interface LiveTimeCounterProps {
  startDate: string;
  senderName: string;
  recipientName: string;
  theme?: AccentTheme;
  compact?: boolean;
}

/**
 * Replicates LovePanda's "Contador de Tempo Juntos" & "O Amor em Números" section.
 * Updates live every second in the browser. Supports `compact` mode for narrow preview containers.
 */
export const LiveTimeCounter: React.FC<LiveTimeCounterProps> = ({
  startDate = '2023-06-12T19:00',
  senderName = 'Alguém',
  recipientName = 'Meu Amor',
  theme = 'rose',
  compact = false,
}) => {
  const [stats, setStats] = useState<TimeTogetherBreakdown>(() =>
    calculateTimeTogether(startDate)
  );
  const accent = THEME_ACCENT_MAP[theme] || THEME_ACCENT_MAP.rose;

  useEffect(() => {
    setStats(calculateTimeTogether(startDate));
    const timer = setInterval(() => {
      setStats(calculateTimeTogether(startDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [startDate]);

  const timeUnits = [
    { label: 'Anos', value: stats.years, color: 'text-pastel-rose' },
    { label: 'Meses', value: stats.months, color: 'text-pastel-lavender' },
    { label: 'Dias', value: stats.days, color: 'text-pastel-mint' },
    { label: 'Horas', value: stats.hours, color: 'text-pastel-peach' },
    { label: 'Min', value: stats.minutes, color: 'text-pastel-sky' },
    { label: 'Seg', value: stats.seconds, color: 'text-pastel-butter' },
  ];

  const formattedDate = (() => {
    const parsed = new Date(startDate);
    if (isNaN(parsed.getTime())) return startDate;
    return parsed.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  })();

  return (
    <GlassCard elevated className="relative overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${accent.badge}`}
          >
            <Clock className="h-3.5 w-3.5" />
            Contador ao Vivo
          </span>
          <h2 className="mt-2 text-lg sm:text-2xl font-bold text-white break-words">
            {senderName} & {recipientName} através do tempo
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-slate-300 shrink-0">
          <Calendar className="h-3.5 w-3.5 text-pastel-lavender shrink-0" />
          <span suppressHydrationWarning>Desde {formattedDate}</span>
        </div>
      </div>

      {/* 6-Unit Live Counter Grid */}
      <div
        className={`grid gap-2.5 ${
          compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'
        }`}
      >
        {timeUnits.map((unit) => (
          <div
            key={unit.label}
            className="glass-card rounded-2xl px-2.5 py-3 text-center border border-white/10 min-w-0"
          >
            <div
              suppressHydrationWarning
              className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${unit.color}`}
            >
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              {unit.label}
            </div>
          </div>
        ))}
      </div>

      {/* "O Amor em Números" Highlights */}
      <div
        className={`mt-6 pt-5 border-t border-white/10 grid gap-3 ${
          compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pastel-rose/15 text-pastel-rose">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              suppressHydrationWarning
              className="text-base sm:text-lg font-extrabold text-white tabular-nums truncate"
            >
              {stats.totalDays.toLocaleString('pt-BR')} dias
            </div>
            <div className="text-xs text-slate-400 leading-snug">
              Compartilhando capítulos únicos
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pastel-mint/15 text-pastel-mint">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              suppressHydrationWarning
              className="text-base sm:text-lg font-extrabold text-white tabular-nums truncate"
            >
              {stats.totalMinutes.toLocaleString('pt-BR')} min
            </div>
            <div className="text-xs text-slate-400 leading-snug">
              De histórias, planos e sorrisos
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pastel-lavender/15 text-pastel-lavender">
            <Heart className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              suppressHydrationWarning
              className="text-base sm:text-lg font-extrabold text-white tabular-nums truncate"
            >
              ~{stats.totalHeartbeats.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-slate-400 leading-snug">
              Batidas do coração no mesmo compasso
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
