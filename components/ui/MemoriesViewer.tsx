import React, { useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { AccentTheme, GiftFormat, TimelineMemory } from '@/utils/types';
import { GlassCard, THEME_ACCENT_MAP } from './GlassPrimitives';
import { DEFAULT_FALLBACK_MEMORY } from '@/utils/sanitizeGift';

interface MemoriesViewerProps {
  memories?: TimelineMemory[];
  initialFormat?: GiftFormat;
  relationshipTitle?: string;
  theme?: AccentTheme;
}

/**
 * Replicates both of LovePanda's core visual products in one seamless switcher:
 * 1. "Retrospectiva do Casal": Animated vertical/story timeline cards
 * 2. "Álbum do Casal 3D": Interactive page-by-page 3D flipbook
 * Fully resilient against empty/undefined arrays or missing properties.
 */
export const MemoriesViewer: React.FC<MemoriesViewerProps> = ({
  memories,
  initialFormat = 'retrospectiva',
  relationshipTitle = 'Nossa História',
  theme = 'rose',
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'album3d'>(
    initialFormat === 'album' ? 'album3d' : 'timeline'
  );
  const [activePage, setActivePage] = useState(0);
  const accent = THEME_ACCENT_MAP[theme] || THEME_ACCENT_MAP.rose;

  const safeMemories: TimelineMemory[] =
    Array.isArray(memories) && memories.length > 0
      ? memories
      : [DEFAULT_FALLBACK_MEMORY];

  const nextPage = () => {
    setActivePage((prev) => (prev + 1) % safeMemories.length);
  };

  const prevPage = () => {
    setActivePage((prev) => (prev - 1 + safeMemories.length) % safeMemories.length);
  };

  const currentMemory = safeMemories[activePage] || safeMemories[0] || DEFAULT_FALLBACK_MEMORY;

  return (
    <GlassCard elevated className="relative overflow-hidden">
      {/* Header + Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${accent.badge}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Nossa Jornada & Memórias
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">
            Capítulos que Construímos Juntos
          </h2>
        </div>

        {/* Toggle between Retrospectiva (Timeline) & Álbum 3D (Flipbook) */}
        <div className="inline-flex rounded-2xl bg-obsidian-950/80 p-1 border border-white/10 self-start">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              viewMode === 'timeline'
                ? 'bg-pastel-rose text-obsidian-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Retrospectiva</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('album3d')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              viewMode === 'album3d'
                ? 'bg-pastel-lavender text-obsidian-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Álbum 3D</span>
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        /* MODE 1: Retrospectiva Timeline Cards */
        <div className="relative space-y-6 before:absolute before:top-4 before:bottom-4 before:left-4 sm:before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-pastel-rose before:via-pastel-lavender before:to-pastel-mint">
          {safeMemories.map((mem, index) => {
            const isEven = index % 2 === 0;
            const memoryTitle = mem?.title || 'Um Momento Lindo';
            const memoryDate = mem?.date || 'Data Especial';
            const memoryDesc = mem?.description || 'Um capítulo inesquecível da nossa jornada.';
            const memoryImage = mem?.imageUrl || DEFAULT_FALLBACK_MEMORY.imageUrl;
            const memoryEmoji = mem?.emoji || '✨';

            return (
              <div
                key={mem?.id || `mem-${index}`}
                className={`relative flex flex-col sm:flex-row items-stretch ${
                  isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                } gap-6 w-full`}
              >
                {/* Timeline Center Badge */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-pastel-rose bg-obsidian-950 text-base shadow-lg z-10">
                  <span>{memoryEmoji}</span>
                </div>

                {/* Content Card Wrapper with Rigid Width Lock */}
                <div className="pl-12 sm:pl-0 w-full sm:w-[calc(50%-2rem)] sm:min-w-[calc(50%-2rem)] sm:max-w-[calc(50%-2rem)] flex-shrink-0">
                  <div className="glass-card flex flex-col w-full overflow-hidden rounded-2xl border border-white/10 transition-transform duration-300 hover:-translate-y-1">
                    {memoryImage && (
                      <div className="relative w-full h-64 overflow-hidden rounded-t-2xl bg-gray-800/50 flex-shrink-0">
                        <img
                          src={memoryImage}
                          alt={memoryTitle}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-transparent" />
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-obsidian-950/80 backdrop-blur-md border border-white/15 px-3.5 py-1 text-sm font-handwriting text-pastel-rose z-10">
                          <Calendar className="h-3.5 w-3.5" />
                          {memoryDate}
                        </span>
                      </div>
                    )}
                    <div className="p-5 flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white break-words break-all hyphens-auto font-serif">
                        {memoryTitle}
                      </h3>
                      <div className="mt-2 text-sm text-slate-300 leading-relaxed break-words break-all max-h-60 overflow-y-auto pr-1.5 custom-scrollbar">
                        {memoryDesc}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE 2: Álbum do Casal 3D Flipbook */
        <div className="perspective-1000 mx-auto max-w-2xl">
          <div className="glass-panel relative overflow-hidden rounded-[2rem] border-2 border-pastel-lavender/30 p-5 sm:p-8 shadow-2xl transition-all duration-500">
            {/* Book Spine Shadow */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/50 to-transparent" />

            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-slate-400 mb-4">
              <span>{relationshipTitle}</span>
              <span>
                Página {activePage + 1} de {safeMemories.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Page: Polaroid Frame */}
              <div className="rounded-2xl bg-white/[0.04] p-3 border border-white/15 shadow-inner">
                <div className="relative w-full h-64 overflow-hidden rounded-xl bg-gray-800/50">
                  <img
                    src={currentMemory.imageUrl || DEFAULT_FALLBACK_MEMORY.imageUrl}
                    alt={currentMemory.title || 'Foto do Álbum'}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-all duration-500"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-300">
                  <span className="font-handwriting text-base text-pastel-lavender">{currentMemory.date || 'Data Especial'}</span>
                  <span className="text-base">{currentMemory.emoji || '💝'}</span>
                </div>
              </div>

              {/* Right Page: Story Note */}
              <div className="flex flex-col justify-between space-y-4 min-w-0 max-w-full">
                <div className="min-w-0">
                  <span className="inline-block rounded-full bg-pastel-lavender/15 border border-pastel-lavender/30 px-3 py-1 text-xs font-semibold text-pastel-lavender font-handwriting text-sm">
                    Capítulo #{activePage + 1}
                  </span>
                  <h3 className="mt-3 text-xl sm:text-2xl font-extrabold text-white break-words break-all hyphens-auto font-serif">
                    {currentMemory.title || 'Um Momento Especial'}
                  </h3>
                  <div className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed break-words break-all max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {currentMemory.description || 'Lembrança eterna do nosso amor.'}
                  </div>
                </div>

                {/* Page Turn Controls */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevPage}
                    className="glass-card inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Página Anterior</span>
                  </button>

                  <button
                    type="button"
                    onClick={nextPage}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-pastel-lavender px-4 py-2.5 text-xs font-bold text-obsidian-950 shadow hover:brightness-110"
                  >
                    <span>Virar Página</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
