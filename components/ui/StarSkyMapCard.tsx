import React, { useMemo, useState } from 'react';
import { Sparkles, MapPin, Compass, Eye } from 'lucide-react';
import { AccentTheme } from '@/utils/types';
import {
  CONSTELLATION_LINES,
  computeRealSkyProjection,
  ProjectedStar,
} from '@/utils/astronomy';
import { GlassCard, THEME_ACCENT_MAP } from './GlassPrimitives';

interface StarSkyMapCardProps {
  dateLabel: string;
  isoDate?: string;
  locationName: string;
  coordinates: string;
  constellationNote: string;
  theme?: AccentTheme;
  compact?: boolean;
}

/**
 * Replicates LovePanda's "O Céu Daquela Data / Daquela Noite" chapter with a
 * 100% real astronomical projection engine.
 * Calculates Local Sidereal Time (LST), Altitude, and Azimuth from the couple's exact
 * date, time, and city coordinates, rendering real constellations (Cruzeiro do Sul,
 * Órion/Três Marias, Escorpião, Centauro, Sirius, Canopus) on an interactive celestial dome.
 */
export const StarSkyMapCard: React.FC<StarSkyMapCardProps> = ({
  dateLabel = 'A Noite Mais Bonita',
  isoDate,
  locationName = 'São Paulo, Brasil',
  coordinates = '-23.5505,-46.6333',
  constellationNote = 'Sob este céu estrelado, o universo conspirou a nosso favor.',
  theme = 'rose',
  compact = false,
}) => {
  const [hoveredStar, setHoveredStar] = useState<ProjectedStar | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const accent = THEME_ACCENT_MAP[theme] || THEME_ACCENT_MAP.rose;

  const projection = useMemo(
    () =>
      computeRealSkyProjection(
        isoDate || dateLabel,
        coordinates,
        locationName
      ),
    [isoDate, dateLabel, coordinates, locationName]
  );

  const starById = useMemo(() => {
    const map: Record<string, ProjectedStar> = {};
    projection.stars.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [projection.stars]);

  const formattedTimeInfo = useMemo(() => {
    if (isoDate) {
      const d = new Date(isoDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }
    return dateLabel;
  }, [isoDate, dateLabel]);

  return (
    <GlassCard elevated className="relative overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${accent.badge}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Mapa Estelar Real • Tempo Sideral {projection.lstHours.toFixed(1)}h
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">
            O Céu Daquela Noite Especial
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLabels((prev) => !prev)}
            className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white"
            title="Mostrar/ocultar nomes das estrelas"
          >
            <Eye className="h-3.5 w-3.5 text-pastel-lavender" />
            <span>{showLabels ? 'Nomes: ON' : 'Nomes: OFF'}</span>
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-pastel-sky">
            <Compass className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono truncate max-w-[190px]">{coordinates}</span>
          </div>
        </div>
      </div>

      {/* Celestial Dome Visualization */}
      <div
        className={`relative mx-auto flex items-center justify-center rounded-full border-2 border-pastel-lavender/35 bg-radial from-obsidian-800 via-obsidian-950 to-black shadow-[0_0_75px_-10px_rgba(196,181,253,0.32)] overflow-hidden ${
          compact ? 'h-64 w-64' : 'h-72 w-72 sm:h-88 sm:w-88'
        }`}
      >
        {/* Inner Horizon & Zenith Rings */}
        <div className="pointer-events-none absolute inset-3 rounded-full border border-dashed border-white/15" />
        <div className="pointer-events-none absolute inset-12 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute inset-24 rounded-full border border-white/5" />

        {/* Dynamic SVG Celestial Dome */}
        <svg
          viewBox="0 0 240 240"
          className="h-full w-full p-3 select-none"
          aria-label="Mapa astronômico calculado para a data e coordenadas do casal"
        >
          {/* Crosshair at Zenith */}
          <line x1="117" y1="120" x2="123" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
          <line x1="120" y1="117" x2="120" y2="123" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />

          {/* Background Starfield rotated by real Sidereal Time */}
          {projection.backgroundField.map((bg, idx) => (
            <circle
              key={`bg-${idx}`}
              cx={bg.x}
              cy={bg.y}
              r={bg.r}
              fill="#F8FAFC"
              opacity={bg.opacity}
            />
          ))}

          {/* Real Constellation Lines */}
          {CONSTELLATION_LINES.map((line, idx) => {
            const fromStar = starById[line.fromId];
            const toStar = starById[line.toId];
            if (!fromStar || !toStar || (!fromStar.visible && !toStar.visible)) {
              return null;
            }
            return (
              <line
                key={`line-${line.fromId}-${line.toId}-${idx}`}
                x1={fromStar.x}
                y1={fromStar.y}
                x2={toStar.x}
                y2={toStar.y}
                stroke={line.color}
                strokeWidth="1.25"
                strokeDasharray={
                  fromStar.altitudeDeg < 0 || toStar.altitudeDeg < 0 ? '2 2' : undefined
                }
              />
            );
          })}

          {/* Real Cataloged Bright Stars */}
          {projection.stars
            .filter((s) => s.visible)
            .map((star) => {
              const radius = Math.max(1.6, 3.3 - star.mag * 0.55);
              return (
                <g
                  key={star.id}
                  className="cursor-pointer transition-opacity hover:opacity-100"
                  onMouseEnter={() => setHoveredStar(star)}
                  onClick={() => setHoveredStar(star)}
                >
                  <circle
                    cx={star.x}
                    cy={star.y}
                    r={radius * 2.4}
                    fill={star.color}
                    opacity={0.22}
                  />
                  <circle
                    cx={star.x}
                    cy={star.y}
                    r={radius}
                    fill={star.color}
                  />
                  {showLabels && star.mag <= 1.3 && (
                    <text
                      x={star.x + 4.5}
                      y={star.y + 2}
                      fill="rgba(248,250,252,0.75)"
                      fontSize="5.8"
                      fontFamily="monospace"
                    >
                      {star.name.split(' ')[0]}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>

        {/* Cardinal Labels */}
        <span className="absolute top-2 text-[10px] font-mono font-bold tracking-widest text-pastel-lavender">
          N
        </span>
        <span className="absolute bottom-2 text-[10px] font-mono font-bold tracking-widest text-pastel-rose">
          S
        </span>
        <span className="absolute left-3 text-[10px] font-mono tracking-widest text-slate-400">
          L
        </span>
        <span className="absolute right-3 text-[10px] font-mono tracking-widest text-slate-400">
          O
        </span>
      </div>

      {/* Hovered Star Telemetry Pill */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {hoveredStar ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-pastel-sky/40 px-3.5 py-1 text-xs text-pastel-sky">
            <strong>{hoveredStar.name}</strong> • Constelação: {hoveredStar.constellation} •
            Alt: {hoveredStar.altitudeDeg}° / Az: {hoveredStar.azimuthDeg}°
          </span>
        ) : (
          projection.visibleConstellations.slice(0, 5).map((constName) => (
            <span
              key={constName}
              className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] text-slate-300"
            >
              ✦ {constName}
            </span>
          ))
        )}
      </div>

      {/* Location & Note Footer */}
      <div className="mt-5 text-center max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-pastel-rose">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>
            {locationName} • {formattedTimeInfo}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">{constellationNote}</p>
      </div>
    </GlassCard>
  );
};
