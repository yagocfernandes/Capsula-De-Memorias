import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Gift,
  Heart,
  MapPin,
  Share2,
  Sparkles,
  RotateCcw,
  PlusCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  Edit3,
} from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  GlassCard,
  PastelButton,
  THEME_ACCENT_MAP,
} from '@/components/ui/GlassPrimitives';
import { LiveTimeCounter } from '@/components/ui/LiveTimeCounter';
import {
  RetroCassettePlayer,
  extractYouTubeId,
} from '@/components/ui/RetroCassettePlayer';
import { MemoriesViewer } from '@/components/ui/MemoriesViewer';
import { StarSkyMapCard } from '@/components/ui/StarSkyMapCard';
import {
  InteractiveQuizAndRoulette,
  SealedLoveLetterCard,
} from '@/components/ui/InteractiveFeatures';
import { ShareGiftModal } from '@/components/ui/ShareGiftModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GiftData } from '@/utils/types';
import { fetchGiftFromFirestore } from '@/utils/giftStorage';
import { decodeGiftPayload } from '@/utils/idGenerator';
import { sanitizeGiftData } from '@/utils/sanitizeGift';
import { useAuth } from '@/utils/AuthContext';

/**
 * Dynamic recipient view (`/gift/[id]`).
 * Implements an Interaction Gate (`isOpened = false`) to reliably bypass iOS Safari & Chrome
 * autoplay restrictions: the hidden `<audio>` element / YouTube API iframe is pre-mounted
 * in the DOM, and clicking "Tocar para Abrir Presente" synchronously triggers `.play()`
 * within the user gesture event handler while fading in the gift content.
 *
 * Fully protected by `ErrorBoundary`, `sanitizeGiftData`, and defensive fallbacks.
 */
export default function GiftSurprisePage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useAuth();

  const [gift, setGift] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  // Interaction Gate & Audio State
  const [isOpened, setIsOpened] = useState(false);
  const [isOpeningTransition, setIsOpeningTransition] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Persistent Media Refs mounted before interaction so `.play()` runs synchronously on click
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const openTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up media and timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (openTransitionTimeoutRef.current) {
        clearTimeout(openTransitionTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check optional stateless payload in URL query (?d=...)
    const queryD = router.query.d;
    if (typeof queryD === 'string' && queryD.length > 10) {
      const decoded = decodeGiftPayload(queryD);
      if (decoded) {
        setGift(sanitizeGiftData(decoded));
        setLoading(false);
        return;
      }
    }

    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const idFromPath =
      pathSegments.length >= 2 && pathSegments[0] === 'gift'
        ? decodeURIComponent(pathSegments[1])
        : null;

    const routerId =
      typeof id === 'string' && id !== '[id]' ? id : null;
    const resolvedGiftId = routerId || idFromPath;

    if (!resolvedGiftId || resolvedGiftId === '[id]') {
      if (router.isReady) {
        setLoading(false);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setNotFoundError(null);

    fetchGiftFromFirestore(resolvedGiftId)
      .then((cloudGift) => {
        if (!isMounted) return;
        if (cloudGift) {
          // Pass through data sanitizer to guarantee all properties exist
          setGift(sanitizeGiftData(cloudGift));
        } else {
          // If Firestore didn't find it, check URL payload fallback again
          if (typeof queryD === 'string') {
            const decodedFallback = decodeGiftPayload(queryD);
            if (decodedFallback) {
              setGift(sanitizeGiftData(decodedFallback));
              return;
            }
          }
          setGift(null);
          setNotFoundError(
            `O presente com código "${resolvedGiftId}" não foi encontrado no Cloud Firestore.`
          );
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erro ao buscar presente no Firestore:', err);
        setNotFoundError(
          'Não foi possível carregar os dados do presente no Cloud Firestore.'
        );
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router.isReady, id, router.query.d]);

  const rawAudioUrl = gift?.soundtrack?.youtubeOrAudioUrl || '';
  const youtubeId = extractYouTubeId(rawAudioUrl);
  const isDirectAudio =
    !youtubeId &&
    Boolean(
      rawAudioUrl &&
        (rawAudioUrl.startsWith('data:audio/') ||
          rawAudioUrl.endsWith('.mp3') ||
          rawAudioUrl.endsWith('.wav') ||
          rawAudioUrl.endsWith('.ogg') ||
          rawAudioUrl.includes('soundhelix'))
    );

  const sendYouTubeCommand = (func: string, args: unknown[] = []) => {
    if (!ytIframeRef.current || !ytIframeRef.current.contentWindow) return;
    ytIframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func,
        args,
      }),
      '*'
    );
  };

  /**
   * Synchronous Interaction Gate Handler:
   * Invoked directly inside the user's `onClick` gesture to unlock iOS/Chrome Web Audio policy.
   */
  const handleOpenCapsuleAndPlayAudio = () => {
    if (isOpeningTransition) return;
    setIsOpeningTransition(true);

    // 1. Synchronously trigger HTML5 <audio> playback inside the click call stack
    if (audioRef.current && isDirectAudio) {
      audioRef.current.muted = false;
      audioRef.current.volume = 1.0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlayingAudio(true);
            setIsMuted(false);
          })
          .catch((err) => {
            console.warn('Autoplay fallback warning:', err);
          });
      }
    }

    // 2. Synchronously trigger YouTube IFrame API playback inside the click call stack
    if (youtubeId) {
      sendYouTubeCommand('unMute');
      sendYouTubeCommand('setVolume', [100]);
      sendYouTubeCommand('playVideo');
      setIsPlayingAudio(true);
      setIsMuted(false);
    }

    // 3. Fire pastel confetti burst
    if (typeof window !== 'undefined') {
      import('canvas-confetti')
        .then((confettiModule) => {
          const confetti = confettiModule.default;
          confetti({
            particleCount: 80,
            spread: 85,
            origin: { y: 0.55 },
            colors: ['#FDA4AF', '#C4B5FD', '#A7F3D0', '#FDBA74', '#BAE6FD'],
          });
        })
        .catch(() => {});
    }

    // 4. Reveal main gift content with smooth suspense fade-in transition (750ms intentional unboxing suspense)
    if (openTransitionTimeoutRef.current) {
      clearTimeout(openTransitionTimeoutRef.current);
    }
    openTransitionTimeoutRef.current = setTimeout(() => {
      setIsOpened(true);
      setIsOpeningTransition(false);
    }, 750);
  };

  /**
   * Discreet floating Mute / Unmute toggle in the corner of the screen once opened.
   */
  const handleToggleFloatingMute = () => {
    if (audioRef.current && isDirectAudio) {
      if (!isPlayingAudio) {
        audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
        audioRef.current.muted = false;
        setIsMuted(false);
        return;
      }
      const nextMute = !isMuted;
      audioRef.current.muted = nextMute;
      setIsMuted(nextMute);
      return;
    }

    if (youtubeId) {
      if (!isPlayingAudio) {
        sendYouTubeCommand('unMute');
        sendYouTubeCommand('playVideo');
        setIsPlayingAudio(true);
        setIsMuted(false);
        return;
      }
      if (isMuted) {
        sendYouTubeCommand('unMute');
        sendYouTubeCommand('playVideo');
        setIsMuted(false);
      } else {
        sendYouTubeCommand('mute');
        setIsMuted(true);
      }
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-6 text-center">
        {/* Animated Skeleton Box */}
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 sm:p-10 space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-pastel-rose/20 border border-pastel-rose/30 flex items-center justify-center text-pastel-rose animate-pulse">
            <Heart className="h-8 w-8 fill-pastel-rose/30" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-32 mx-auto rounded-full bg-white/10 animate-pulse" />
            <div className="h-7 w-48 mx-auto rounded-xl bg-white/15 animate-pulse" />
            <div className="h-4 w-64 mx-auto rounded-full bg-white/10 animate-pulse" />
          </div>
          <div className="h-14 w-full rounded-2xl bg-gradient-to-r from-pastel-rose/30 via-pastel-lavender/30 to-pastel-mint/30 animate-pulse" />
          <p className="text-xs text-slate-400 font-handwriting text-base">
            Desdobrando suas memórias com carinho...
          </p>
        </div>
      </div>
    );
  }

  // Not Found State
  if (notFoundError || !gift) {
    return (
      <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <GlassCard elevated className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-rose/15 border border-pastel-rose/30 text-pastel-rose">
              <Heart className="h-7 w-7 text-pastel-rose fill-pastel-rose/20" />
            </div>
            <h1 className="text-xl font-extrabold text-white font-serif">
              Ops, não conseguimos abrir este envelope
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Parece que esta cartinha se perdeu no caminho ou o endereço do envelope mudou. Mas o carinho continua aqui.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/editor">
                <PastelButton
                  type="button"
                  theme="rose"
                  icon={<Heart className="h-4 w-4 fill-obsidian-950" />}
                >
                  Criar nova Cápsula
                </PastelButton>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const accent = THEME_ACCENT_MAP[gift.accentTheme] || THEME_ACCENT_MAP.rose;
  const isCreator = Boolean(
    currentUser && gift.userId && currentUser.uid === gift.userId
  );
  const youtubeEmbedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0&loop=1&playlist=${youtubeId}&rel=0&modestbranding=1&playsinline=1`
    : null;

  return (
    <ErrorBoundary
      fallbackTitle="Ops, essa cartinha tropeçou no caminho"
      fallbackMessage="Houve um instante de silêncio ao abrir os detalhes deste presente. Recarregue a página para voltar a ver."
    >
      <Head>
        <title>
          {`Cápsula de ${gift.recipientName} • De ${gift.senderName} | Cápsula de Memórias`}
        </title>
        <meta
          name="description"
          content={`${gift.senderName} preparou uma Cápsula de Memórias inesquecível para ${gift.recipientName}: ${gift.relationshipTitle}`}
        />
        <meta property="og:site_name" content="Cápsula de Memórias" />
        <meta
          property="og:title"
          content={`Cápsula de ${gift.recipientName} • De ${gift.senderName} | Cápsula de Memórias`}
        />
        <meta
          property="og:description"
          content={`${gift.senderName} preparou uma Cápsula de Memórias inesquecível para ${gift.recipientName}: ${gift.relationshipTitle}`}
        />
        {gift.coverImageUrl && (
          <meta property="og:image" content={gift.coverImageUrl} />
        )}
      </Head>

      {/* =====================================================================
          INVISIBLE PERSISTENT AUDIO / YOUTUBE ENGINE
          Mounted upfront so `audioRef.current.play()` executes synchronously
          on the Interaction Gate button click (unlocking iOS Safari & Chrome).
      ====================================================================== */}
      {isDirectAudio && (
        <audio
          ref={audioRef}
          src={rawAudioUrl}
          preload="auto"
          loop
          playsInline
          className="hidden"
        />
      )}

      {youtubeEmbedUrl && (
        <iframe
          ref={ytIframeRef}
          src={youtubeEmbedUrl}
          title="Background Soundtrack Engine"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="pointer-events-none fixed -bottom-20 -left-20 h-1 w-1 opacity-0"
        />
      )}

      {/* =====================================================================
          1. INTERACTION GATE (ENVELOPE / WELCOME COVER)
          When `isOpened === false`, the recipient ONLY sees this minimalist
          dark glassmorphism screen. Clicking the button unlocks audio & fades in.
      ====================================================================== */}
      {!isOpened ? (
        <div className="flex-grow flex flex-col bg-obsidian-950 overflow-hidden relative">
          <Navbar />
          {/* Ambient Pastel Orbs */}
          <div className="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-pastel-rose/15 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-pastel-lavender/15 blur-[120px]" />

          <div className="flex-grow flex items-center justify-center px-4 py-12">
            <div
              className={`relative w-full max-w-md transition-all duration-700 ${
                isOpeningTransition
                  ? 'scale-105 opacity-0 -translate-y-6'
                  : 'scale-100 opacity-100'
              }`}
            >
              <div className="glass-panel rounded-[2rem] border border-white/15 p-8 sm:p-10 text-center shadow-2xl">
                {/* Wax Seal Initials Badge */}
                <div className="mx-auto mb-6 flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-pastel-rose/60 bg-gradient-to-br from-pastel-rose via-pastel-lavender to-pastel-peach text-obsidian-950 shadow-xl wax-seal-pulse">
                  <Heart className="h-5 w-5 fill-obsidian-950" />
                  <span className="mt-0.5 font-serif text-xs font-black tracking-widest uppercase">
                    {gift.loveLetter?.sealInitials || 'A & V'}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold max-w-full ${accent.badge}`}
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[220px] sm:max-w-[320px]">
                    Surpresa Especial para {gift.recipientName}
                  </span>
                </span>

                <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white break-words break-all font-serif">
                  {gift.relationshipTitle}
                </h1>

                <p className="mt-2.5 text-sm text-slate-300 leading-relaxed break-words font-sans">
                  Selado com carinho por{' '}
                  <strong className="text-white break-words font-serif">{gift.senderName}</strong>. Aumente o
                  som e quebre o lacre para entrar neste cantinho que é só de vocês.
                </p>

                {/* Primary Call-To-Action Trigger (Unlocks Audio + Opens Gift) */}
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={handleOpenCapsuleAndPlayAudio}
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-pastel-rose via-pastel-lavender to-pastel-mint px-6 py-4 text-base font-extrabold text-obsidian-950 shadow-[0_0_35px_-5px_rgba(253,164,175,0.5)] transition-all duration-300 hover:brightness-110 active:scale-95"
                  >
                    <Heart className="h-5 w-5 fill-obsidian-950 stroke-[1.8]" />
                    <span>
                      {isOpeningTransition ? 'Rompendo o lacre...' : 'Tocar para Romper o Lacre'}
                    </span>
                  </button>
                </div>

                {/* Soundtrack Preview Note */}
                <div className="mt-5 inline-flex items-center gap-2 text-xs text-slate-400 max-w-full truncate px-2">
                  <Volume2 className="h-3.5 w-3.5 text-pastel-mint animate-pulse shrink-0" />
                  <span className="truncate">
                    Ao abrir, tocará: <strong className="text-slate-200">{gift.soundtrack?.songTitle || 'Nossa Música'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =====================================================================
           2. REVEALED GIFT CONTENT (Fades in after Interaction Gate click)
        ====================================================================== */
        <div className="min-h-screen bg-obsidian-950 text-slate-100 pb-24 relative overflow-hidden animate-[fadeIn_0.8s_ease-out]">
          <Navbar />

          {/* Discreet Floating Audio Control Pill (Bottom-Right Corner) */}
          {(isDirectAudio || youtubeId) && (
            <button
              type="button"
              onClick={handleToggleFloatingMute}
              aria-label={isMuted ? 'Ativar trilha sonora' : 'Silenciar trilha sonora'}
              className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-obsidian-900/85 backdrop-blur-xl px-4 py-2.5 text-xs font-semibold text-white shadow-2xl transition-all hover:border-pastel-rose/50 hover:scale-105 active:scale-95"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  isMuted
                    ? 'bg-white/10 text-slate-400'
                    : 'bg-pastel-rose/20 text-pastel-rose'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                )}
              </span>
              <div className="text-left pr-1 hidden sm:block">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {isMuted ? 'Som Mutado' : 'Tocando Agora'}
                </div>
                <div className="max-w-[140px] truncate text-xs font-bold text-pastel-rose">
                  {gift.soundtrack?.songTitle || 'Música Especial'}
                </div>
              </div>
            </button>
          )}

          {/* Ambient Pastel Lighting */}
          <div className="pointer-events-none fixed top-20 -left-24 h-96 w-96 rounded-full bg-pastel-rose/10 blur-[130px]" />
          <div className="pointer-events-none fixed top-1/2 -right-24 h-96 w-96 rounded-full bg-pastel-lavender/10 blur-[130px]" />
          <div className="pointer-events-none fixed bottom-10 left-1/3 h-80 w-80 rounded-full bg-pastel-mint/10 blur-[130px]" />

          <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 space-y-10">
            {/* CHAPTER 1: Hero Cover Banner */}
            <ScrollReveal direction="zoom">
              <GlassCard elevated className="relative overflow-hidden p-0">
                <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-obsidian-900">
                  <img
                    src={gift.coverImageUrl}
                    alt={gift.relationshipTitle}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/55 to-transparent" />

                  {/* Floating Controls Top Right */}
                  <div className="absolute top-4 right-4 flex flex-wrap items-center justify-end gap-2">
                    {isCreator && (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/editor?editId=${encodeURIComponent(gift.id)}`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-full bg-pastel-lavender/90 hover:bg-pastel-lavender border border-white/20 px-3.5 py-1.5 text-xs font-extrabold text-obsidian-950 shadow-lg transition-all"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Editar Presente</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsOpened(false)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-950/75 backdrop-blur-md border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-pastel-rose" />
                      <span>Voltar à Capa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-950/75 backdrop-blur-md border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-pastel-mint hover:text-white"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>QR Code & Link</span>
                    </button>
                  </div>

                  {/* Bottom Overlay Content */}
                  <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold max-w-full ${accent.badge}`}
                      >
                        <Heart className="h-3.5 w-3.5 fill-current shrink-0" />
                        <span className="truncate max-w-[260px] sm:max-w-[400px]">
                          {gift.senderName} & {gift.recipientName}
                        </span>
                      </span>

                      {gift.specialLocation && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs text-slate-200 max-w-full">
                          <MapPin className="h-3 w-3 text-pastel-mint shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-[300px]">
                            {gift.specialLocation}
                          </span>
                        </span>
                      )}
                    </div>

                    <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white break-words break-all">
                      {gift.relationshipTitle}
                    </h1>
                  </div>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* CHAPTER 2: Live Time Counter & "O Amor em Números" */}
            <ScrollReveal direction="up" delayMs={80}>
              <LiveTimeCounter
                startDate={gift.startDate}
                senderName={gift.senderName}
                recipientName={gift.recipientName}
                theme={gift.accentTheme}
              />
            </ScrollReveal>

            {/* CHAPTER 3: Retrospectiva Timeline & Álbum do Casal 3D */}
            <ScrollReveal direction="up" delayMs={120}>
              <MemoriesViewer
                memories={gift.memories}
                initialFormat={gift.format}
                relationshipTitle={gift.relationshipTitle}
                theme={gift.accentTheme}
              />
            </ScrollReveal>

            {/* CHAPTER 4: Retro Cassette Visual Card */}
            <ScrollReveal direction="up" delayMs={150}>
              <RetroCassettePlayer
                songTitle={gift.soundtrack?.songTitle}
                artistName={gift.soundtrack?.artistName}
                audioUrl={gift.soundtrack?.youtubeOrAudioUrl}
                cassetteLabel={gift.soundtrack?.cassetteLabel}
                dedicationQuote={gift.soundtrack?.dedicationQuote}
                autoPlayTrigger={false}
                theme={gift.accentTheme}
              />
            </ScrollReveal>

            {/* CHAPTER 5: Star Sky Map ("O Céu Daquela Noite") */}
            {gift.starSky?.enabled && (
              <ScrollReveal direction="up" delayMs={180}>
                <StarSkyMapCard
                  dateLabel={gift.starSky?.dateLabel}
                  isoDate={gift.startDate}
                  locationName={gift.starSky?.locationName}
                  coordinates={gift.starSky?.coordinates}
                  constellationNote={gift.starSky?.constellationNote}
                  theme={gift.accentTheme}
                />
              </ScrollReveal>
            )}

            {/* CHAPTER 6: Couple Quiz & Next Date Roulette */}
            <ScrollReveal direction="up" delayMs={200}>
              <InteractiveQuizAndRoulette
                quiz={gift.quiz}
                roulette={gift.roulette}
                theme={gift.accentTheme}
              />
            </ScrollReveal>

            {/* CHAPTER 7: Final Sealed Love Letter */}
            <ScrollReveal direction="up" delayMs={220}>
              <SealedLoveLetterCard
                title={gift.loveLetter?.title}
                content={gift.loveLetter?.content}
                signature={gift.loveLetter?.signature}
                sealInitials={gift.loveLetter?.sealInitials}
                theme={gift.accentTheme}
              />
            </ScrollReveal>

            {/* Footer Call-to-Action */}
            <ScrollReveal direction="up" delayMs={250}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 text-center">
                <span className="inline-flex items-center gap-1.5 text-sm font-handwriting text-pastel-rose">
                  <Sparkles className="h-3.5 w-3.5" />
                  Cápsula de Memórias • Guarde sua história
                </span>
                <h3 className="mt-2 text-lg sm:text-2xl font-bold text-white font-serif">
                  Quer criar uma Cápsula de Memórias como esta para quem você ama?
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-sans">
                  Personalize sua própria retrospectiva, álbum 3D, fita cassete e carta selada em poucos minutos.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/editor">
                    <PastelButton
                      type="button"
                      theme={gift.accentTheme}
                      icon={<Heart className="h-4 w-4 fill-obsidian-950" />}
                    >
                      Criar nova Cápsula
                    </PastelButton>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </main>

          {showShareModal && (
            <ShareGiftModal gift={gift} onClose={() => setShowShareModal(false)} />
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}
