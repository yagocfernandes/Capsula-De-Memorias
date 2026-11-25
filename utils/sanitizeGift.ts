import { GiftData, TimelineMemory, AccentTheme, GiftFormat } from './types';

export const DEFAULT_FALLBACK_MEMORY: TimelineMemory = {
  id: 'mem-fallback-1',
  date: 'Nosso Primeiro Capítulo',
  title: 'Onde Tudo Começou',
  description: 'Cada segundo ao seu lado é uma memória inesquecível guardada com carinho no coração.',
  imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
  emoji: '💖',
};

const VALID_THEMES: AccentTheme[] = ['rose', 'lavender', 'mint', 'peach', 'sky'];
const VALID_FORMATS: GiftFormat[] = ['retrospectiva', 'album', 'hibrido'];

/**
 * Defensive Data Sanitizer & Normalizer.
 * Guarantees that EVERY property, nested sub-object, and array in `GiftData`
 * is defined with robust fallbacks, completely preventing runtime crashes,
 * undefined property reads, or White Screen of Death (WSOD).
 */
export function sanitizeGiftData(raw: any): GiftData {
  if (!raw || typeof raw !== 'object') {
    raw = {};
  }

  // 1. Theme & Format Normalization
  const accentTheme: AccentTheme = VALID_THEMES.includes(raw.accentTheme)
    ? raw.accentTheme
    : 'rose';

  const format: GiftFormat = VALID_FORMATS.includes(raw.format)
    ? raw.format
    : 'retrospectiva';

  // 2. Memories Array Normalization
  let sanitizedMemories: TimelineMemory[] = [];
  if (Array.isArray(raw.memories) && raw.memories.length > 0) {
    sanitizedMemories = raw.memories
      .filter((m: any) => m && typeof m === 'object')
      .map((m: any, index: number) => ({
        id: String(m.id || `mem-${index + 1}`),
        date: String(m.date || `Momento ${index + 1}`),
        title: String(m.title || 'Um Dia Especial'),
        description: String(m.description || 'Memória guardada com muito carinho.'),
        imageUrl: String(
          m.imageUrl ||
            'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80'
        ),
        emoji: String(m.emoji || '💖'),
      }));
  }

  if (sanitizedMemories.length === 0) {
    sanitizedMemories = [DEFAULT_FALLBACK_MEMORY];
  }

  // 3. Soundtrack Sub-object Normalization
  const rawSoundtrack = raw.soundtrack || {};
  const soundtrack = {
    songTitle: String(rawSoundtrack.songTitle || 'Nossa Canção'),
    artistName: String(rawSoundtrack.artistName || 'Para Nós Dois'),
    youtubeOrAudioUrl: String(rawSoundtrack.youtubeOrAudioUrl || 'https://www.youtube.com/watch?v=X7D0ckM2p2A'),
    cassetteLabel: String(rawSoundtrack.cassetteLabel || 'Lado A • Com Todo Meu Amor'),
    dedicationQuote: String(
      rawSoundtrack.dedicationQuote ||
        'Se você soubesse o quanto a sua voz me acalma, cantaria pra mim todos os dias.'
    ),
  };

  // 4. Star Sky Sub-object Normalization
  const rawStarSky = raw.starSky || {};
  const starSky = {
    enabled: Boolean(rawStarSky.enabled ?? true),
    dateLabel: String(rawStarSky.dateLabel || 'A Noite Mais Bonita'),
    locationName: String(rawStarSky.locationName || 'São Paulo, Brasil'),
    coordinates: String(rawStarSky.coordinates || '-23.5505,-46.6333'),
    constellationNote: String(
      rawStarSky.constellationNote ||
        'Sob este céu estrelado, o universo conspirou para nossos caminhos se cruzarem.'
    ),
  };

  // 5. Quiz Sub-object Normalization
  const rawQuiz = raw.quiz || {};
  const rawOptions = Array.isArray(rawQuiz.options) ? rawQuiz.options : [];
  const quizOptions = rawOptions.length > 0 ? rawOptions.map(String) : [
    'No primeiro olhar',
    'Num café despretensioso',
    'Sob as luzes da cidade',
    'Desde o início já sabia',
  ];

  const quiz = {
    enabled: Boolean(rawQuiz.enabled ?? true),
    question: String(rawQuiz.question || 'Você lembra exatamente onde tudo começou?'),
    options: quizOptions,
    correctIndex: typeof rawQuiz.correctIndex === 'number' && rawQuiz.correctIndex >= 0 && rawQuiz.correctIndex < quizOptions.length
      ? rawQuiz.correctIndex
      : 0,
    rewardMessage: String(
      rawQuiz.rewardMessage ||
        'Acertou em cheio! Nossa história foi escrita nas estrelas desde aquele instante.'
    ),
  };

  // 6. Roulette Sub-object Normalization
  const rawRoulette = raw.roulette || {};
  const rawRouletteOptions = Array.isArray(rawRoulette.options) ? rawRoulette.options : [];
  const rouletteOptions = rawRouletteOptions.length > 0 ? rawRouletteOptions.map(String) : [
    'Jantar à luz de velas feito em casa',
    'Sessão cinema com pipoca e abraço',
    'Piquenique no parque no fim da tarde',
    'Passeio noturno ouvindo nossa playlist',
    'Viajar no final de semana sem destino',
  ];

  const roulette = {
    enabled: Boolean(rawRoulette.enabled ?? true),
    title: String(rawRoulette.title || 'Roleta do Nosso Próximo Date'),
    options: rouletteOptions,
  };

  // 7. Love Letter Sub-object Normalization
  const rawLoveLetter = raw.loveLetter || {};
  const loveLetter = {
    title: String(rawLoveLetter.title || 'Uma Carta de Amor Para Guardar no Peito'),
    content: String(
      rawLoveLetter.content ||
        'Não há palavras suficientes para descrever a felicidade que sinto ao ter você na minha vida. Cada sorriso, cada conversa boba e cada momento juntos são os maiores presentes que o universo poderia me dar.\n\nObrigado por ser meu porto seguro, minha melhor companhia e a pessoa que faz meus dias terem mais cor.'
    ),
    signature: String(rawLoveLetter.signature || raw.senderName || 'Para Sempre Seu Amor'),
    sealInitials: String(rawLoveLetter.sealInitials || 'A & V'),
  };

  // 8. StartDate normalization
  let startDate = String(raw.startDate || '2023-06-12T19:00');
  const testDate = new Date(startDate);
  if (isNaN(testDate.getTime())) {
    startDate = new Date().toISOString();
  }

  return {
    id: String(raw.id || 'og-gift'),
    userId: raw.userId ? String(raw.userId) : undefined,
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    format,
    accentTheme,
    senderName: String(raw.senderName || 'Alguém Especial'),
    recipientName: String(raw.recipientName || 'Meu Amor'),
    relationshipTitle: String(raw.relationshipTitle || 'Nossa Linda História'),
    startDate,
    specialLocation: String(raw.specialLocation || 'Onde Nos Conhecemos'),
    coverImageUrl: String(
      raw.coverImageUrl ||
        'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1600&q=80'
    ),
    soundtrack,
    memories: sanitizedMemories,
    starSky,
    quiz,
    roulette,
    loveLetter,
  };
}
