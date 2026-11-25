import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Disc,
  Music,
  Youtube,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AccentTheme } from '@/utils/types';
import { GlassCard, THEME_ACCENT_MAP } from './GlassPrimitives';

interface RetroCassettePlayerProps {
  songTitle?: string;
  artistName?: string;
  audioUrl?: string;
  cassetteLabel?: string;
  dedicationQuote?: string;
  coverImageUrl?: string;
  autoPlayTrigger?: boolean;
  theme?: AccentTheme;
}

/**
 * Extracts a 11-character YouTube Video ID from any YouTube URL format:
 * - https://www.youtube.com/watch?v=X7D0ckM2p2A
 * - https://youtu.be/X7D0ckM2p2A
 * - https://www.youtube.com/embed/X7D0ckM2p2A
 * - https://music.youtube.com/watch?v=X7D0ckM2p2A
 * - https://www.youtube.com/shorts/X7D0ckM2p2A
 */
export function extractYouTubeId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

/**
 * Replicates LovePanda's interactive "Fita Cassete com a Música de Vocês".
 * Defensively guarded against undefined URLs, missing strings, or unready audio elements.
 */
export const RetroCassettePlayer: React.FC<RetroCassettePlayerProps> = ({
  songTitle = 'Nossa Canção',
  artistName = 'Para Nós Dois',
  audioUrl = '',
  cassetteLabel = 'Lado A • Com Todo Meu Amor',
  dedicationQuote = 'Cada nota dessa canção me faz lembrar de você.',
  autoPlayTrigger = false,
  theme = 'rose',
}) => {
  const safeAudioUrl = typeof audioUrl === 'string' ? audioUrl.trim() : '';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(28);
  const [showYoutubeVideo, setShowYoutubeVideo] = useState(false);

  const accent = THEME_ACCENT_MAP[theme] || THEME_ACCENT_MAP.rose;
  const youtubeId = extractYouTubeId(safeAudioUrl);

  const isDirectAudio =
    !youtubeId &&
    Boolean(
      safeAudioUrl &&
        (safeAudioUrl.startsWith('data:audio/') ||
          safeAudioUrl.endsWith('.mp3') ||
          safeAudioUrl.endsWith('.wav') ||
          safeAudioUrl.endsWith('.ogg') ||
          safeAudioUrl.includes('soundhelix'))
    );

  // Send commands to YouTube embedded player via postMessage API
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

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Trigger autoplay when the recipient breaks the wax seal
  useEffect(() => {
    if (!autoPlayTrigger) return;

    if (youtubeId) {
      setIsPlaying(true);
      sendYouTubeCommand('playVideo');
      return;
    }

    if (audioRef.current && isDirectAudio) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [autoPlayTrigger, youtubeId, isDirectAudio]);

  const togglePlay = () => {
    if (youtubeId) {
      if (isPlaying) {
        sendYouTubeCommand('pauseVideo');
      } else {
        sendYouTubeCommand('playVideo');
      }
      setIsPlaying((prev) => !prev);
      return;
    }

    if (audioRef.current && isDirectAudio) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  const toggleMute = () => {
    if (youtubeId) {
      if (isMuted) {
        sendYouTubeCommand('unMute');
      } else {
        sendYouTubeCommand('mute');
      }
      setIsMuted((prev) => !prev);
      return;
    }

    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted((prev) => !prev);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(Math.min(100, Math.max(5, pct)));
  };

  // Build YouTube Embed URL with JS API enabled
  const youtubeEmbedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=${
        autoPlayTrigger ? 1 : 0
      }&loop=1&playlist=${youtubeId}&rel=0&modestbranding=1&playsinline=1`
    : null;

  return (
    <GlassCard elevated className="relative overflow-hidden">
      {/* Direct HTML5 Audio Element */}
      {isDirectAudio && (
        <audio
          ref={audioRef}
          src={safeAudioUrl}
          loop
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${accent.badge}`}
            >
              <Music className="h-3.5 w-3.5" />
              Trilha Sonora Oficial
            </span>

            {youtubeId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pastel-rose/15 border border-pastel-rose/30 px-2.5 py-1 text-[11px] font-bold text-pastel-rose">
                <Youtube className="h-3.5 w-3.5" />
                YouTube Sincronizado
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">
            A Fita Cassete da Nossa História
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {youtubeId && (
            <button
              type="button"
              onClick={() => setShowYoutubeVideo((prev) => !prev)}
              title="Mostrar/ocultar vídeo do YouTube"
              className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white"
            >
              {showYoutubeVideo ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-pastel-lavender" />
                  <span className="hidden sm:inline">Ocultar Vídeo</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-pastel-lavender" />
                  <span className="hidden sm:inline">Ver Clipe</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
            className="glass-card flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pausar reprodução' : 'Tocar fita cassete'}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-pastel-rose text-obsidian-950 font-bold shadow hover:brightness-110 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Embedded YouTube Player Drawer (Collapsible) */}
      {youtubeEmbedUrl && (
        <div
          className={`overflow-hidden transition-all duration-500 ${
            showYoutubeVideo ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-xl">
            <iframe
              ref={ytIframeRef}
              src={youtubeEmbedUrl}
              title="YouTube Music Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      {/* When YouTube video drawer is hidden, keep an invisible 1x1 iframe mounted so audio keeps playing */}
      {youtubeEmbedUrl && !showYoutubeVideo && (
        <iframe
          ref={ytIframeRef}
          src={youtubeEmbedUrl}
          title="Hidden YouTube Audio Engine"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="pointer-events-none fixed -bottom-20 -left-20 h-1 w-1 opacity-0"
        />
      )}

      {/* Realistic Retro Cassette Shell UI */}
      <div className="relative mx-auto max-w-xl rounded-3xl border-2 border-white/15 bg-gradient-to-b from-[#181824] via-[#101018] to-[#0a0a0f] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Top Screw Accents */}
        <div className="flex justify-between px-2 mb-3 text-slate-600">
          <div className="h-2 w-2 rounded-full border border-white/20 bg-white/10" />
          <div className="h-2 w-2 rounded-full border border-white/20 bg-white/10" />
        </div>

        {/* Vintage Label Area */}
        <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/95 via-pastel-lavender/30 to-pastel-rose/30 p-4 sm:p-5 text-obsidian-950 shadow-inner">
          <div className="flex items-center justify-between border-b border-obsidian-950/20 pb-2">
            <span className="font-mono text-[10px] sm:text-xs font-black tracking-widest uppercase">
              {cassetteLabel}
            </span>
            <span className="font-mono text-[10px] font-bold bg-obsidian-950 text-white px-2 py-0.5 rounded-full">
              STEREO 60MIN
            </span>
          </div>

          <div className="py-2.5">
            <div className="font-serif text-lg sm:text-xl font-bold tracking-tight text-obsidian-950 truncate">
              {songTitle}
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-700 truncate">
              {artistName}
            </div>
          </div>

          {/* Cassette Spools Window */}
          <div className="relative my-2 h-14 sm:h-16 rounded-xl bg-obsidian-950 border border-obsidian-950/40 p-2 flex items-center justify-around shadow-inner overflow-hidden">
            {/* Left Spool */}
            <div
              className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 ${
                isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
              }`}
            >
              <Disc className="h-6 w-6 text-white/70" />
            </div>

            {/* Tape Progress Meter */}
            <div className="h-2 w-28 sm:w-36 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pastel-rose to-pastel-lavender transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Right Spool */}
            <div
              className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 ${
                isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
              }`}
            >
              <Disc className="h-6 w-6 text-white/70" />
            </div>
          </div>
        </div>

        {/* Dedication Quote */}
        {dedicationQuote && (
          <div className="mt-4 text-center px-4">
            <p className="font-handwriting text-base sm:text-lg text-pastel-rose/90 italic break-words">
              &ldquo;{dedicationQuote}&rdquo;
            </p>
          </div>
        )}

        {/* Bottom Screw Accents */}
        <div className="flex justify-between px-2 mt-4 text-slate-600">
          <div className="h-2 w-2 rounded-full border border-white/20 bg-white/10" />
          <div className="h-2 w-2 rounded-full border border-white/20 bg-white/10" />
        </div>
      </div>
    </GlassCard>
  );
};
