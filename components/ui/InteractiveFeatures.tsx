import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, CheckCircle2, Dices, Sparkles, Mail, Heart } from 'lucide-react';
import { AccentTheme } from '@/utils/types';
import { GlassCard, PastelButton, THEME_ACCENT_MAP } from './GlassPrimitives';

interface InteractiveQuizAndRouletteProps {
  quiz?: {
    enabled?: boolean;
    question?: string;
    options?: string[];
    correctIndex?: number;
    rewardMessage?: string;
  };
  roulette?: {
    enabled?: boolean;
    title?: string;
    options?: string[];
  };
  theme?: AccentTheme;
}

/**
 * Replicates LovePanda's interactive mini-games:
 * 1. "Quiz sobre o Primeiro Dia / Nossa História"
 * 2. "Roleta Surpresa para o Próximo Date"
 * Defensively guarded against undefined objects or arrays.
 */
export const InteractiveQuizAndRoulette: React.FC<InteractiveQuizAndRouletteProps> = ({
  quiz,
  roulette,
  theme = 'rose',
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedDateIdea, setSelectedDateIdea] = useState<string | null>(null);
  const accent = THEME_ACCENT_MAP[theme] || THEME_ACCENT_MAP.rose;
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  const quizEnabled = Boolean(quiz?.enabled);
  const rouletteEnabled = Boolean(roulette?.enabled);

  const rouletteOptions = Array.isArray(roulette?.options) && roulette.options.length > 0
    ? roulette.options
    : [
        'Jantar à luz de velas feito em casa',
        'Sessão cinema com pipoca e abraço',
        'Piquenique no parque no fim da tarde',
        'Passeio noturno ouvindo nossa playlist',
        'Viajar no final de semana sem destino',
      ];

  const quizOptions = Array.isArray(quiz?.options) && quiz.options.length > 0
    ? quiz.options
    : ['No primeiro olhar', 'Num café despretensioso', 'Sob as luzes da cidade', 'Desde o início'];

  const correctIndex = typeof quiz?.correctIndex === 'number' && quiz.correctIndex >= 0 && quiz.correctIndex < quizOptions.length
    ? quiz.correctIndex
    : 0;

  const handleSpinRoulette = () => {
    if (isSpinning || rouletteOptions.length === 0) return;
    setIsSpinning(true);
    setSelectedDateIdea(null);

    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
    }

    let ticks = 0;
    spinIntervalRef.current = setInterval(() => {
      const randomPick =
        rouletteOptions[Math.floor(Math.random() * rouletteOptions.length)];
      setSelectedDateIdea(randomPick);
      ticks += 1;
      if (ticks > 14) {
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current);
          spinIntervalRef.current = null;
        }
        setIsSpinning(false);
      }
    }, 110);
  };

  if (!quizEnabled && !rouletteEnabled) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Interactive Couple Quiz */}
      {quizEnabled && (
        <GlassCard elevated className="flex flex-col justify-between">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${accent.badge}`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Desafio da Memória
            </span>
            <h3 className="mt-3 text-xl font-bold text-white">
              {quiz?.question || 'Você lembra exatamente onde tudo começou?'}
            </h3>

            <div className="mt-5 space-y-2.5">
              {quizOptions.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === correctIndex;
                let btnStyle = 'glass-card text-slate-200 hover:border-pastel-rose/40';

                if (selectedOption !== null) {
                  if (isCorrect) {
                    btnStyle =
                      'bg-pastel-mint/20 border-pastel-mint text-pastel-mint font-semibold';
                  } else if (isSelected) {
                    btnStyle = 'bg-pastel-rose/20 border-pastel-rose text-pastel-rose';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full rounded-2xl border p-3.5 text-left text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {selectedOption !== null && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-pastel-mint" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
                {selectedOption === correctIndex ? (
                  <span className="text-pastel-mint font-medium">
                    {quiz?.rewardMessage || 'Acertou em cheio! O amor vence sempre.'}
                  </span>
                ) : (
                  <span className="text-pastel-peach">
                    Quase lá! Mas cada detalhe nosso continua inesquecível.
                  </span>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* 2. Interactive Date Night Roulette */}
      {rouletteEnabled && (
        <GlassCard elevated className="flex flex-col justify-between">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${accent.badge}`}
            >
              <Dices className="h-3.5 w-3.5" />
              Surpresa Interativa
            </span>
            <h3 className="mt-3 text-xl font-bold text-white">
              {roulette?.title || 'Roleta do Nosso Próximo Date'}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
              Sem ideias para o próximo encontro? Gire a roleta e deixe o destino escolher!
            </p>

            {/* Visual Roulette Wheel Result Box */}
            <div className="my-6 rounded-2xl border border-pastel-peach/30 bg-obsidian-950/75 p-6 text-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Sugestão Sorteada
              </span>
              <div className="mt-2 min-h-[48px] flex items-center justify-center text-base sm:text-lg font-bold text-pastel-peach">
                {selectedDateIdea ? (
                  <span className="animate-pulse">✨ {selectedDateIdea} ✨</span>
                ) : (
                  <span className="text-slate-500 font-normal italic">
                    Clique abaixo para sortear
                  </span>
                )}
              </div>
            </div>
          </div>

          <PastelButton
            type="button"
            theme="peach"
            onClick={handleSpinRoulette}
            icon={<Sparkles className="h-4 w-4" />}
            className="w-full"
          >
            {isSpinning ? 'Girando Roleta...' : 'Girar Roleta do Próximo Date'}
          </PastelButton>
        </GlassCard>
      )}
    </div>
  );
};

interface SealedLoveLetterCardProps {
  title?: string;
  content?: string;
  signature?: string;
  sealInitials?: string;
  theme?: AccentTheme;
}

/**
 * Replicates LovePanda's final chapter: "Carta Fechada com Lacre".
 * Remains sealed inside an envelope until the recipient taps to break the final seal.
 */
export const SealedLoveLetterCard: React.FC<SealedLoveLetterCardProps> = ({
  title = 'Uma Carta de Amor Para Guardar no Peito',
  content = 'Cada momento com você é um presente eterno.',
  signature = 'Com todo amor',
  sealInitials = 'A & V',
  theme = 'rose',
}) => {
  const [isLetterOpened, setIsLetterOpened] = useState(false);
  const [isOpeningLetter, setIsOpeningLetter] = useState(false);
  const accent = THEME_ACCENT_MAP[theme] || THEME_ACCENT_MAP.rose;

  const handleOpenLetter = () => {
    if (isOpeningLetter) return;
    setIsOpeningLetter(true);
    setTimeout(() => {
      setIsLetterOpened(true);
      setIsOpeningLetter(false);
    }, 450);
  };

  return (
    <GlassCard elevated className="relative overflow-hidden">
      <div className="text-center max-w-2xl mx-auto">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold ${accent.badge}`}
        >
          <Mail className="h-3.5 w-3.5" />
          Nossa Carta com Lacre
        </span>

        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white break-words break-all font-serif">
          {title}
        </h2>

        {!isLetterOpened ? (
          <div className="my-8 rounded-3xl border border-white/15 bg-obsidian-950/75 p-8 flex flex-col items-center">
            <p className="text-sm text-slate-300 max-w-md break-words font-sans">
              Há palavras guardadas com muito carinho neste envelope. Toque no lacre abaixo para desdobrar a carta.
            </p>

            <button
              type="button"
              onClick={handleOpenLetter}
              className={`mt-6 group flex h-20 w-20 flex-col items-center justify-center rounded-full bg-gradient-to-br from-pastel-rose via-pastel-lavender to-pastel-peach text-obsidian-950 shadow-xl wax-seal-pulse transition-all duration-500 hover:scale-105 active:scale-95 ${
                isOpeningLetter ? 'scale-110 opacity-70' : ''
              }`}
            >
              <Heart className="h-5 w-5 fill-obsidian-950" />
              <span className="mt-0.5 font-serif text-xs font-black truncate max-w-[60px]">
                {sealInitials || 'A & V'}
              </span>
            </button>

            <span className="mt-3 text-sm font-handwriting text-pastel-rose text-base">
              {isOpeningLetter ? 'Desdobrando a carta...' : 'Toque no lacre para abrir'}
            </span>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-pastel-rose/30 bg-obsidian-950/70 p-6 sm:p-10 text-left shadow-2xl transition-all duration-700 animate-[fadeIn_0.6s_ease-out]">
            <div className="space-y-4 text-base sm:text-lg text-slate-200 leading-relaxed whitespace-pre-line font-serif break-words break-all max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
              {content}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 shrink-0">
                Com amor eterno
              </span>
              <span className={`font-handwriting text-2xl font-bold truncate max-w-[220px] sm:max-w-[320px] ${accent.text}`}>
                {signature}
              </span>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
