/**
 * Real astronomical projection engine for "O Céu Daquela Data / Daquela Noite".
 *
 * Uses cataloged Right Ascension (RA) and Declination (Dec) of bright Southern & Northern
 * Hemisphere stars and constellations (Crux / Cruzeiro do Sul, Orion / Três Marias,
 * Scorpius, Canis Major / Sirius, Centaurus, Cygnus, etc.) and projects them onto the local
 * horizon (Altitude / Azimuth -> Stereographic Polar Dome X, Y) for any Date/Time + Lat/Lon.
 */

export interface CatalogStar {
  id: string;
  name: string;
  constellation: string;
  raHours: number; // Right Ascension in decimal hours (0..24)
  decDeg: number; // Declination in degrees (-90..+90)
  mag: number; // Apparent visual magnitude (lower = brighter)
  color: string;
}

export interface ProjectedStar extends CatalogStar {
  x: number; // SVG 0..240
  y: number; // SVG 0..240
  altitudeDeg: number;
  azimuthDeg: number;
  visible: boolean;
}

export interface ConstellationLine {
  constellation: string;
  fromId: string;
  toId: string;
  color: string;
}

// Bright real stars catalog (J2000 coordinates)
export const BRIGHT_STAR_CATALOG: CatalogStar[] = [
  // Crux (Cruzeiro do Sul)
  { id: 'acrux', name: 'Acrux (α Cru)', constellation: 'Cruzeiro do Sul', raHours: 12.443, decDeg: -63.099, mag: 0.76, color: '#BAE6FD' },
  { id: 'mimosa', name: 'Mimosa (β Cru)', constellation: 'Cruzeiro do Sul', raHours: 12.795, decDeg: -59.688, mag: 1.25, color: '#BAE6FD' },
  { id: 'gacrux', name: 'Gacrux (γ Cru)', constellation: 'Cruzeiro do Sul', raHours: 12.519, decDeg: -57.113, mag: 1.63, color: '#FDA4AF' },
  { id: 'imai', name: 'Imai (δ Cru)', constellation: 'Cruzeiro do Sul', raHours: 12.252, decDeg: -58.748, mag: 2.79, color: '#BAE6FD' },
  { id: 'ginan', name: 'Ginan (ε Cru)', constellation: 'Cruzeiro do Sul', raHours: 12.356, decDeg: -60.401, mag: 3.59, color: '#FDBA74' },

  // Centaurus (Alfa e Beta Centauri)
  { id: 'rigil', name: 'Alpha Centauri', constellation: 'Centauro', raHours: 14.660, decDeg: -60.834, mag: -0.27, color: '#FDE68A' },
  { id: 'hadar', name: 'Hadar (β Cen)', constellation: 'Centauro', raHours: 14.063, decDeg: -60.373, mag: 0.61, color: '#BAE6FD' },

  // Orion (Órion / Três Marias)
  { id: 'betelgeuse', name: 'Betelgeuse', constellation: 'Órion', raHours: 5.919, decDeg: 7.407, mag: 0.50, color: '#FDBA74' },
  { id: 'rigel', name: 'Rigel', constellation: 'Órion', raHours: 5.242, decDeg: -8.201, mag: 0.13, color: '#BAE6FD' },
  { id: 'bellatrix', name: 'Bellatrix', constellation: 'Órion', raHours: 5.418, decDeg: 6.349, mag: 1.64, color: '#BAE6FD' },
  { id: 'saiph', name: 'Saiph', constellation: 'Órion', raHours: 5.795, decDeg: -9.669, mag: 2.09, color: '#BAE6FD' },
  { id: 'alnitak', name: 'Alnitak (Três Marias)', constellation: 'Órion', raHours: 5.679, decDeg: -1.942, mag: 1.77, color: '#C4B5FD' },
  { id: 'alnilam', name: 'Alnilam (Três Marias)', constellation: 'Órion', raHours: 5.603, decDeg: -1.201, mag: 1.69, color: '#C4B5FD' },
  { id: 'mintaka', name: 'Mintaka (Três Marias)', constellation: 'Órion', raHours: 5.533, decDeg: -0.299, mag: 2.23, color: '#C4B5FD' },

  // Canis Major & Carina
  { id: 'sirius', name: 'Sirius (α CMa)', constellation: 'Cão Maior', raHours: 6.752, decDeg: -16.716, mag: -1.46, color: '#A7F3D0' },
  { id: 'canopus', name: 'Canopus (α Car)', constellation: 'Carina', raHours: 6.399, decDeg: -52.695, mag: -0.74, color: '#FDE68A' },

  // Scorpius (Escorpião)
  { id: 'antares', name: 'Antares (α Sco)', constellation: 'Escorpião', raHours: 16.490, decDeg: -26.432, mag: 0.96, color: '#FDA4AF' },
  { id: 'shaula', name: 'Shaula (λ Sco)', constellation: 'Escorpião', raHours: 17.560, decDeg: -37.103, mag: 1.62, color: '#BAE6FD' },
  { id: 'sargas', name: 'Sargas (θ Sco)', constellation: 'Escorpião', raHours: 17.621, decDeg: -42.997, mag: 1.87, color: '#FDE68A' },
  { id: 'dschubba', name: 'Dschubba (δ Sco)', constellation: 'Escorpião', raHours: 16.005, decDeg: -22.621, mag: 2.32, color: '#BAE6FD' },

  // Lyra, Cygnus, Aquila (Triângulo de Verão)
  { id: 'vega', name: 'Vega (α Lyr)', constellation: 'Lira', raHours: 18.615, decDeg: 38.783, mag: 0.03, color: '#BAE6FD' },
  { id: 'altair', name: 'Altair (α Aql)', constellation: 'Águia', raHours: 19.846, decDeg: 8.868, mag: 0.76, color: '#F8FAFC' },
  { id: 'deneb', name: 'Deneb (α Cyg)', constellation: 'Cisne', raHours: 20.690, decDeg: 45.280, mag: 1.25, color: '#BAE6FD' },

  // Taurus, Boötes, Virgo, Piscis Austrinus, Leo
  { id: 'aldebaran', name: 'Aldebaran (α Tau)', constellation: 'Touro', raHours: 4.598, decDeg: 16.509, mag: 0.86, color: '#FDBA74' },
  { id: 'arcturus', name: 'Arcturus (α Boo)', constellation: 'Boieiro', raHours: 14.261, decDeg: 19.182, mag: -0.05, color: '#FDBA74' },
  { id: 'spica', name: 'Spica (α Vir)', constellation: 'Virgem', raHours: 13.419, decDeg: -11.161, mag: 0.97, color: '#BAE6FD' },
  { id: 'fomalhaut', name: 'Fomalhaut (α PsA)', constellation: 'Peixe Austral', raHours: 22.960, decDeg: -29.622, mag: 1.16, color: '#F8FAFC' },
  { id: 'regulus', name: 'Regulus (α Leo)', constellation: 'Leão', raHours: 10.139, decDeg: 11.967, mag: 1.35, color: '#BAE6FD' },
  { id: 'achernar', name: 'Achernar (α Eri)', constellation: 'Erídano', raHours: 1.628, decDeg: -57.236, mag: 0.46, color: '#BAE6FD' },
];

export const CONSTELLATION_LINES: ConstellationLine[] = [
  // Cruzeiro do Sul
  { constellation: 'Cruzeiro do Sul', fromId: 'gacrux', toId: 'acrux', color: 'rgba(253,164,175,0.75)' },
  { constellation: 'Cruzeiro do Sul', fromId: 'imai', toId: 'mimosa', color: 'rgba(253,164,175,0.75)' },
  // Ponteiros do Centauro
  { constellation: 'Centauro', fromId: 'rigil', toId: 'hadar', color: 'rgba(253,230,138,0.55)' },
  // Órion & Três Marias
  { constellation: 'Órion', fromId: 'betelgeuse', toId: 'alnitak', color: 'rgba(196,181,253,0.55)' },
  { constellation: 'Órion', fromId: 'bellatrix', toId: 'mintaka', color: 'rgba(196,181,253,0.55)' },
  { constellation: 'Órion', fromId: 'alnitak', toId: 'alnilam', color: 'rgba(196,181,253,0.85)' },
  { constellation: 'Órion', fromId: 'alnilam', toId: 'mintaka', color: 'rgba(196,181,253,0.85)' },
  { constellation: 'Órion', fromId: 'alnitak', toId: 'saiph', color: 'rgba(196,181,253,0.55)' },
  { constellation: 'Órion', fromId: 'mintaka', toId: 'rigel', color: 'rgba(196,181,253,0.55)' },
  { constellation: 'Órion', fromId: 'betelgeuse', toId: 'bellatrix', color: 'rgba(196,181,253,0.4)' },
  { constellation: 'Órion', fromId: 'rigel', toId: 'saiph', color: 'rgba(196,181,253,0.4)' },
  // Escorpião
  { constellation: 'Escorpião', fromId: 'dschubba', toId: 'antares', color: 'rgba(167,243,208,0.55)' },
  { constellation: 'Escorpião', fromId: 'antares', toId: 'sargas', color: 'rgba(167,243,208,0.55)' },
  { constellation: 'Escorpião', fromId: 'sargas', toId: 'shaula', color: 'rgba(167,243,208,0.55)' },
  // Triângulo de Verão
  { constellation: 'Triângulo', fromId: 'vega', toId: 'altair', color: 'rgba(186,230,253,0.4)' },
  { constellation: 'Triângulo', fromId: 'altair', toId: 'deneb', color: 'rgba(186,230,253,0.4)' },
  { constellation: 'Triângulo', fromId: 'deneb', toId: 'vega', color: 'rgba(186,230,253,0.4)' },
];

// Presets for major Brazilian & world cities so users can auto-fill coordinates in 1 click
export const CITY_COORDINATE_PRESETS: Record<
  string,
  { label: string; coordsText: string; lat: number; lon: number }
> = {
  brasilia: {
    label: 'Brasília, DF',
    coordsText: '15°47′38″S • 47°52′58″W',
    lat: -15.7938,
    lon: -47.8827,
  },
  sao_paulo: {
    label: 'São Paulo, SP',
    coordsText: '23°33′01″S • 46°38′02″W',
    lat: -23.5505,
    lon: -46.6333,
  },
  rio_de_janeiro: {
    label: 'Rio de Janeiro, RJ',
    coordsText: '22°54′24″S • 43°10′22″W',
    lat: -22.9068,
    lon: -43.1729,
  },
  belo_horizonte: {
    label: 'Belo Horizonte, MG',
    coordsText: '19°55′15″S • 43°56′16″W',
    lat: -19.9167,
    lon: -43.9345,
  },
  curitiba: {
    label: 'Curitiba, PR',
    coordsText: '25°25′40″S • 49°16′23″W',
    lat: -25.4284,
    lon: -49.2733,
  },
  salvador: {
    label: 'Salvador, BA',
    coordsText: '12°58′16″S • 38°30′39″W',
    lat: -12.9714,
    lon: -38.5014,
  },
  fortaleza: {
    label: 'Fortaleza, CE',
    coordsText: '03°43′02″S • 38°32′35″W',
    lat: -3.7172,
    lon: -38.5433,
  },
  porto_alegre: {
    label: 'Porto Alegre, RS',
    coordsText: '30°01′59″S • 51°13′48″W',
    lat: -30.0346,
    lon: -51.2177,
  },
  recife: {
    label: 'Recife, PE',
    coordsText: '08°03′14″S • 34°52′52″W',
    lat: -8.0542,
    lon: -34.8813,
  },
  goiania: {
    label: 'Goiânia, GO',
    coordsText: '16°40′43″S • 49°15′14″W',
    lat: -16.6869,
    lon: -49.2648,
  },
};

/**
 * Parses either DMS strings like `15°48'52"S • 48°01'42"W` or decimal strings `-15.79, -47.88`
 * into numeric `{ lat, lon }`. Defaults to Brasília/Rio if unparseable.
 */
export function parseCoordinatesString(
  coordsStr: string,
  locationName = ''
): { lat: number; lon: number } {
  const lowerLoc = locationName.toLowerCase();
  for (const preset of Object.values(CITY_COORDINATE_PRESETS)) {
    const citySimple = preset.label.split(',')[0].toLowerCase();
    if (lowerLoc.includes(citySimple)) {
      // Still try parsing explicit DMS if user typed custom numbers
      break;
    }
  }

  if (coordsStr) {
    // Match DMS pattern: 15°48'52"S ... 48°01'42"W
    const dmsRegex =
      /(\d{1,3})\s*[°º]\s*(\d{1,2})?\s*[′'’]?\s*(\d{1,2}(?:\.\d+)?)?\s*[″"”]?\s*([NSnsLoEwOo])/g;
    const matches = Array.from(coordsStr.matchAll(dmsRegex));

    if (matches.length >= 2) {
      const toDec = (m: RegExpMatchArray) => {
        const deg = parseFloat(m[1] || '0');
        const min = parseFloat(m[2] || '0');
        const sec = parseFloat(m[3] || '0');
        const dir = (m[4] || '').toUpperCase();
        let val = deg + min / 60 + sec / 3600;
        if (dir === 'S' || dir === 'W' || dir === 'O') val = -val;
        return val;
      };
      return {
        lat: Math.max(-89.9, Math.min(89.9, toDec(matches[0]))),
        lon: Math.max(-180, Math.min(180, toDec(matches[1]))),
      };
    }

    // Match simple decimal numbers: "-15.79, -47.88"
    const numMatches = coordsStr.match(/-?\d+(?:\.\d+)?/g);
    if (numMatches && numMatches.length >= 2) {
      const n1 = parseFloat(numMatches[0]);
      const n2 = parseFloat(numMatches[1]);
      if (!isNaN(n1) && !isNaN(n2)) {
        const isSouth = /s/i.test(coordsStr) && n1 > 0 ? -n1 : n1;
        const isWest = /[wo]/i.test(coordsStr) && n2 > 0 ? -n2 : n2;
        return {
          lat: Math.max(-89.9, Math.min(89.9, isSouth)),
          lon: Math.max(-180, Math.min(180, isWest)),
        };
      }
    }
  }

  // Fallback by matching city name
  if (lowerLoc.includes('brasília') || lowerLoc.includes('brasilia')) {
    return { lat: -15.7938, lon: -47.8827 };
  }
  if (lowerLoc.includes('são paulo') || lowerLoc.includes('sao paulo')) {
    return { lat: -23.5505, lon: -46.6333 };
  }

  return { lat: -22.9068, lon: -43.1729 };
}

/**
 * Computes real sky dome projection for the given ISO date/time and coordinates.
 */
export function computeRealSkyProjection(
  isoDateStr: string,
  coordsStr: string,
  locationName: string
): {
  stars: ProjectedStar[];
  backgroundField: { x: number; y: number; r: number; opacity: number }[];
  lstHours: number;
  visibleConstellations: string[];
  lat: number;
  lon: number;
} {
  const { lat, lon } = parseCoordinatesString(coordsStr, locationName);
  const parsedDate = new Date(isoDateStr);
  const date = isNaN(parsedDate.getTime()) ? new Date('2025-01-31T19:00:00') : parsedDate;

  // Days since J2000.0 (2000-01-01T12:00:00Z)
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;

  // Greenwich Mean Sidereal Time (GMST) in degrees
  const gmstDeg = (280.46061837 + 360.98564736629 * d) % 360;
  const lstDeg = ((gmstDeg + lon) % 360 + 360) % 360;
  const lstHours = lstDeg / 15;

  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;
  const latRad = lat * deg2rad;

  const CENTER = 120;
  const DOME_RADIUS = 102;

  const projectedStars: ProjectedStar[] = BRIGHT_STAR_CATALOG.map((star) => {
    const raDeg = star.raHours * 15;
    const haDeg = ((lstDeg - raDeg) % 360 + 360) % 360;
    const haRad = haDeg * deg2rad;
    const decRad = star.decDeg * deg2rad;

    // Altitude formula
    const sinAlt =
      Math.sin(decRad) * Math.sin(latRad) +
      Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
    const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    const altitudeDeg = altRad * rad2deg;

    // Azimuth formula (0 = North, 90 = East, 180 = South, 270 = West)
    const cosAz =
      (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
      Math.max(0.0001, Math.cos(altRad) * Math.cos(latRad));
    let azRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (Math.sin(haRad) > 0) {
      azRad = 2 * Math.PI - azRad;
    }
    const azimuthDeg = azRad * rad2deg;

    // Stereographic polar projection onto dome (Zenith = center, Horizon = outer circle)
    // Include stars slightly below horizon (-12 deg) near the rim so constellations stay recognizable
    const clampedAlt = Math.max(-12, altitudeDeg);
    const zenithNormalized = (90 - clampedAlt) / 102; // 0 at zenith, ~1 at horizon
    const r = zenithNormalized * DOME_RADIUS;

    // On a sky chart looking UP: North is top (0 deg), East is left (-X), West is right (+X)
    const x = CENTER - r * Math.sin(azRad);
    const y = CENTER - r * Math.cos(azRad);

    return {
      ...star,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      altitudeDeg: Math.round(altitudeDeg),
      azimuthDeg: Math.round(azimuthDeg),
      visible: altitudeDeg > -8,
    };
  });

  // Deterministic background starfield rotated by Local Sidereal Time
  const backgroundField: { x: number; y: number; r: number; opacity: number }[] = [];
  const lstAngleRad = lstDeg * deg2rad;
  for (let i = 0; i < 48; i++) {
    const seedAngle = (i * 137.5 * deg2rad) + lstAngleRad;
    const dist = Math.sqrt((i + 1) / 49) * (DOME_RADIUS - 6);
    const bx = CENTER + dist * Math.cos(seedAngle);
    const by = CENTER + dist * Math.sin(seedAngle);
    backgroundField.push({
      x: Math.round(bx * 10) / 10,
      y: Math.round(by * 10) / 10,
      r: (i % 3) * 0.45 + 0.7,
      opacity: ((i * 29) % 55) / 100 + 0.25,
    });
  }

  // Unique visible constellations above the horizon
  const visibleSet = new Set<string>();
  projectedStars.forEach((s) => {
    if (s.altitudeDeg > 5) visibleSet.add(s.constellation);
  });

  return {
    stars: projectedStars,
    backgroundField,
    lstHours: Math.round(lstHours * 100) / 100,
    visibleConstellations: Array.from(visibleSet),
    lat,
    lon,
  };
}
