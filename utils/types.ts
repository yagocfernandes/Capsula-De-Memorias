export type GiftFormat = 'retrospectiva' | 'album' | 'hibrido';

export type AccentTheme = 'rose' | 'lavender' | 'mint' | 'peach' | 'sky';

export interface TimelineMemory {
  id: string;
  date: string;
  title: string;
  description: string;
  imageUrl: string;
  emoji: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  successNote: string;
}

export interface GiftData {
  id: string;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
  format: GiftFormat;
  accentTheme: AccentTheme;
  senderName: string;
  recipientName: string;
  relationshipTitle: string;
  startDate: string; // ISO date or YYYY-MM-DDTHH:mm
  specialLocation: string;
  coverImageUrl: string;
  soundtrack: {
    songTitle: string;
    artistName: string;
    youtubeOrAudioUrl: string;
    cassetteLabel: string;
    dedicationQuote: string;
  };
  memories: TimelineMemory[];
  starSky: {
    enabled: boolean;
    dateLabel: string;
    locationName: string;
    coordinates: string;
    constellationNote: string;
  };
  quiz: {
    enabled: boolean;
    question: string;
    options: string[];
    correctIndex: number;
    rewardMessage: string;
  };
  roulette: {
    enabled: boolean;
    title: string;
    options: string[];
  };
  loveLetter: {
    title: string;
    content: string;
    signature: string;
    sealInitials: string;
  };
}
