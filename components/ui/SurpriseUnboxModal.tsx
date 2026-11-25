import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Heart, Volume2, Gift } from 'lucide-react';
import { AccentTheme } from '@/utils/types';
import { THEME_ACCENT_MAP } from './GlassPrimitives';

interface SurpriseUnboxModalProps {
  senderName: string;
  recipientName: string;
  relationshipTitle: string;
  sealInitials: string;
  theme?: AccentTheme;
  onUnbox: () => void;
}

/**
 * Replicates the signature LovePanda unboxing moment:
 * A 3D glassmorphic envelope/gift box sealed with an interactive pulsing wax seal.
 * Breaking the seal triggers a 3D flap opening transition, particle burst, and starts the background soundtrack.
 */
export const SurpriseUnboxModal: React.FC<SurpriseUnboxModalProps> = ({
  senderName,
  recipientName,
  relationshipTitle,
  sealInitials,
  theme = 'rose',
  onUnbox,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const accent = THEME_ACCENT_MAP[theme] || THEME_ACCENT_MAP.rose;
  const unboxTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (unboxTimeoutRef.current) {
        clearTimeout(unboxTimeoutRef.current);
      }
    };
  }, []);

  const handleBreakSeal = () => {
    if (isOpening) return;
    setIsOpening(true);

    // Fire canvas-confetti in pastel tones
    if (typeof window !== 'undefined') {
      import('canvas-confetti')
        .then((confettiModule) => {
          const confetti = confettiModule.default;
          confetti({
            particleCount: 85,
            spread: 80,
            origin: { y: 0.55 },
            colors: ['#FDA4AF', '#C4B5FD', '#A7F3D0', '#FDBA74', '#BAE6FD'],
          });
        })
        .catch(() => {});
    }

    if (unboxTimeoutRef.current) {
      clearTimeout(unboxTimeoutRef.current);
    }
    unboxTimeoutRef.current = setTimeout(() => {
      onUnbox();
    }, 1150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/95 backdrop-blur-2xl px-4 overflow-hidden">
      {/* Ambient Pastel Orbs */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-pastel-rose/15 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-pastel-lavender/15 blur-[110px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-pastel-mint/10 blur-[100px]" />

      <div
        className={`relative w-full max-w-lg transition-all duration-1000 perspective-1000 ${
          isOpening ? 'scale-110 opacity-0 -translate-y-8' : 'scale-100 opacity-100'
        }`}
      >
        {/* Top Tag */}
        <div className="mb-6 flex justify-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wider uppercase ${accent.badge}`}
          >
            <Heart className="h-3.5 w-3.5 fill-current" />
            Cápsula de Memórias • Guarde sua história
          </span>
        </div>

        {/* 3D Interactive Envelope Card */}
        <div className="glass-panel relative overflow-hidden rounded-[2rem] p-8 sm:p-10 text-center border border-white/15">
          {/* Top Envelope Flap Visual Line */}
          <div
            className={`mx-auto mb-6 h-1 w-28 rounded-full bg-gradient-to-r from-pastel-rose via-pastel-lavender to-pastel-mint transition-transform duration-700 ${
              isOpening ? 'scale-x-150 opacity-0' : ''
            }`}
          />

          <p className="text-sm font-medium text-slate-400">
            Para <span className="text-white font-semibold">{recipientName}</span>, enviado com
            carinho por <span className={`${accent.text} font-semibold`}>{senderName}</span>
          </p>

          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {relationshipTitle}
          </h1>

          <p className="mt-3 text-sm text-slate-300/90 max-w-md mx-auto leading-relaxed">
            Este envelope guarda memórias, nossa trilha sonora, estrelas e uma surpresa feita
            sob medida para você.
          </p>

          {/* Interactive Wax Seal Button */}
          <div className="my-9 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={handleBreakSeal}
              aria-label="Quebrar o lacre e abrir o presente"
              className={`group relative flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-pastel-rose/60 bg-gradient-to-br from-pastel-rose/90 via-pastel-lavender/80 to-pastel-peach/90 text-obsidian-950 shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 ${
                isOpening ? 'scale-125 rotate-12 opacity-0' : 'wax-seal-pulse'
              }`}
            >
              <div className="flex h-22 w-22 flex-col items-center justify-center rounded-full border border-obsidian-950/25 px-3 py-2">
                <Heart className="h-6 w-6 fill-obsidian-950 text-obsidian-950 transition-transform group-hover:scale-110" />
                <span className="mt-1 font-serif text-sm font-black tracking-widest uppercase">
                  {sealInitials || 'A & V'}
                </span>
              </div>
            </button>

            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-pastel-rose">
              <Sparkles className="h-3.5 w-3.5" />
              {isOpening ? 'Abrindo sua surpresa...' : 'Toque no lacre para abrir'}
            </span>
          </div>

          {/* Audio Notice Footer */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs text-slate-300">
            <Volume2 className="h-3.5 w-3.5 text-pastel-mint animate-pulse" />
            <span>Aumente o som: inclui trilha sonora sincronizada</span>
          </div>
        </div>
      </div>
    </div>
  );
};
