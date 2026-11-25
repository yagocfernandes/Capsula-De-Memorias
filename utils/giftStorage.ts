import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { GiftData } from './types';
import { generateGiftId } from './idGenerator';
import { ensureFirestoreDb } from './firebase';

const FIRESTORE_COLLECTION = 'gifts';

/**
 * Network safety timeout wrapper (15 seconds).
 * Prevents UI from hanging indefinitely if the connection drops silently during Firestore requests.
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 15000,
  errorMsg = 'Tempo limite de conexão esgotado. Verifique sua internet e tente novamente.'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    ),
  ]);
}

/**
 * Pre-configured demo gift ONLY used when the user explicitly visits `/gift/demo-amor`.
 */
export const DEMO_GIFTS: Record<string, GiftData> = {
  'demo-amor': {
    id: 'demo-amor',
    userId: 'demo-system',
    createdAt: '2025-02-14T10:00:00.000Z',
    format: 'hibrido',
    accentTheme: 'rose',
    senderName: 'Lucas',
    recipientName: 'Marina',
    relationshipTitle: 'Nossa História em Cada Detalhe',
    startDate: '2022-06-12T20:30:00',
    specialLocation: 'Mirante da Praia Vermelha, Rio de Janeiro',
    coverImageUrl:
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1000&q=80',
    soundtrack: {
      songTitle: 'Partilhar',
      artistName: 'Rubel • ANAVITÓRIA',
      youtubeOrAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      cassetteLabel: 'LADO A • NOSSA FITA 2022–∞',
      dedicationQuote:
        'Se for preciso, eu giro a Terra inteira só para ver seu sorriso no fim da tarde.',
    },
    memories: [
      {
        id: 'mem-1',
        date: '12 Jun 2022',
        title: 'O Primeiro Café & Risadas Sem Fim',
        description:
          'Era para ser apenas um café rápido de 30 minutos, mas ficamos conversando até o garçom fechar as portas.',
        imageUrl:
          'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80',
        emoji: '☕',
      },
      {
        id: 'mem-2',
        date: '18 Nov 2022',
        title: 'Nossa Primeira Viagem Juntos',
        description:
          'Pegamos estrada sob chuva, erramos o caminho duas vezes e descobrimos a nossa praia favorita no pôr do sol.',
        imageUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
        emoji: '🌊',
      },
      {
        id: 'mem-3',
        date: '04 Abr 2023',
        title: 'O Dia em que Adotamos Nosso Cantinho',
        description:
          'Caixas espalhadas pela sala, pizza no chão e a certeza de que qualquer lugar com você é o meu lar.',
        imageUrl:
          'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80',
        emoji: '🏡',
      },
      {
        id: 'mem-4',
        date: '31 Dez 2024',
        title: 'Promessas Sob os Fogos de Ano Novo',
        description:
          'Olhando para o céu iluminado, agradeci em silêncio por cada segundo compartilhado ao seu lado.',
        imageUrl:
          'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80',
        emoji: '✨',
      },
    ],
    starSky: {
      enabled: true,
      dateLabel: '12 de Junho de 2022 às 20:30',
      locationName: 'Rio de Janeiro, RJ',
      coordinates: '22°57′06″S • 43°09′52″W',
      constellationNote:
        'Naquela noite de outono, a constelação de Cruzeiro do Sul brilhava no zênite exatamente quando nossas mãos se encontraram.',
    },
    quiz: {
      enabled: true,
      question: 'Qual foi o detalhe mais engraçado do nosso primeiro encontro?',
      options: [
        'Pedimos exatamente o mesmo prato sem combinar',
        'Derrubei açúcar no seu casaco favorito',
        'Começou a chover e dividimos um guarda-chuva quebrado',
        'Esquecemos o nome do restaurante no meio do caminho',
      ],
      correctIndex: 2,
      rewardMessage:
        'Você lembra de tudo! Aquele guarda-chuva quebrado foi a melhor desculpa para te abraçar mais forte.',
    },
    roulette: {
      enabled: true,
      title: 'Roleta do Nosso Próximo Date',
      options: [
        '🍷 Jantar à luz de velas feito por mim',
        '🎬 Maratona de cinema com pipoca gourmet',
        '🌅 Piquenique surpresa no pôr do sol',
        '💆 Noite de spa & massagem relaxante',
        '🍕 Rodízio ou noite da nossa comida favorita',
        '✈️ Planejar nossa próxima escapada de fim de semana',
      ],
    },
    loveLetter: {
      title: 'Para o Amor da Minha Vida',
      content: `Marina,\n\nÀs vezes tento colocar em números tudo o que vivemos, mas nenhuma contagem de dias ou segundos consegue traduzir a paz que sinto quando você está por perto.\n\nObrigado por transformar dias comuns em memórias extraordinárias, por rir das minhas piadas sem graça e por construir comigo uma história tão leve e verdadeira.\n\nQue este presente digital seja um lembrete eterno de que, em qualquer linha do tempo ou universo, eu escolheria você todas as vezes.`,
      signature: 'Com todo o meu amor, Lucas',
      sealInitials: 'L & M',
    },
  },
};

/**
 * Re-compresses any large base64 data:image URLs on the fly if the total document size
 * approaches Firestore's 1MB (1,048,576 bytes) document limit.
 */
async function compressDataUrlIfNeeded(
  dataUrl: string,
  maxDim = 640,
  quality = 0.55
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function normalizeGiftPayloadSize(gift: GiftData): Promise<GiftData> {
  if (typeof window !== 'undefined' && JSON.stringify(gift).length > 750000) {
    const compressedCover = await compressDataUrlIfNeeded(gift.coverImageUrl, 600, 0.52);
    const compressedMemories = await Promise.all(
      gift.memories.map(async (m) => ({
        ...m,
        imageUrl: await compressDataUrlIfNeeded(m.imageUrl, 560, 0.5),
      }))
    );
    return {
      ...gift,
      coverImageUrl: compressedCover,
      memories: compressedMemories,
    };
  }
  return gift;
}

/**
 * CREATE FLOW (Authenticated Only):
 * Saves a newly created GiftData object to Cloud Firestore (`gifts/{id}`)
 * with `userId: currentUser.uid`. No LocalStorage ownership hacks.
 */
export async function saveGiftToFirestore(
  draftGift: GiftData,
  userId: string
): Promise<GiftData> {
  if (!userId) {
    throw new Error('Usuário não autenticado. Faça login para criar um presente.');
  }

  const uniqueId = generateGiftId('og');
  const nowIso = new Date().toISOString();

  let gift: GiftData = {
    ...draftGift,
    id: uniqueId,
    userId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  gift = await normalizeGiftPayloadSize(gift);

  const db = await ensureFirestoreDb();
  if (!db) {
    throw new Error('Não foi possível inicializar a conexão com o Cloud Firestore.');
  }

  const giftDocRef = doc(db, FIRESTORE_COLLECTION, gift.id);
  await withTimeout(setDoc(giftDocRef, gift), 15000);

  return gift;
}

/**
 * UPDATE FLOW (Authenticated Owner Only):
 * Executes `updateDoc` on an existing Firestore document (`gifts/{editId}`),
 * preserving `userId`.
 */
export async function updateGiftInFirestore(
  editId: string,
  updatedDraft: GiftData,
  userId: string
): Promise<GiftData> {
  if (!editId) {
    throw new Error('ID do presente inválido para atualização.');
  }
  if (!userId) {
    throw new Error('Usuário não autenticado. Faça login para editar este presente.');
  }

  let gift: GiftData = {
    ...updatedDraft,
    id: editId,
    userId,
    updatedAt: new Date().toISOString(),
  };

  gift = await normalizeGiftPayloadSize(gift);

  const db = await ensureFirestoreDb();
  if (!db) {
    throw new Error('Não foi possível inicializar a conexão com o Cloud Firestore.');
  }

  const giftDocRef = doc(db, FIRESTORE_COLLECTION, editId);
  await withTimeout(
    updateDoc(giftDocRef, {
      ...gift,
    }),
    15000
  );

  return gift;
}

/**
 * DELETE FLOW (Authenticated Owner Only):
 * Deletes a gift document from Firestore (`gifts/{giftId}`).
 */
export async function deleteGiftFromFirestore(giftId: string): Promise<void> {
  const db = await ensureFirestoreDb();
  if (!db) {
    throw new Error('Não foi possível conectar ao Cloud Firestore.');
  }
  await withTimeout(deleteDoc(doc(db, FIRESTORE_COLLECTION, giftId)), 15000);
}

/**
 * Fetches a single gift from Cloud Firestore (`gifts/{id}`) by its URL ID.
 * Publicly accessible so any recipient can open `/gift/[id]` without logging in.
 */
export async function fetchGiftFromFirestore(id: string): Promise<GiftData | null> {
  if (!id) return null;

  if (id === 'demo-amor') {
    return DEMO_GIFTS['demo-amor'];
  }

  const db = await ensureFirestoreDb();
  if (!db) {
    throw new Error('Falha ao conectar com o Cloud Firestore.');
  }

  const giftDocRef = doc(db, FIRESTORE_COLLECTION, id);
  const snap = await withTimeout(getDoc(giftDocRef), 15000);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data() as GiftData;
  return {
    ...data,
    id: snap.id,
  };
}

/**
 * DASHBOARD QUERY:
 * Queries Cloud Firestore for all gifts where `userId == currentUser.uid`,
 * sorted by `createdAt` descending.
 */
export async function fetchUserGiftsFromFirestore(userId: string): Promise<GiftData[]> {
  if (!userId) return [];

  const db = await ensureFirestoreDb();
  if (!db) {
    throw new Error('Falha ao conectar com o Cloud Firestore.');
  }

  const giftsRef = collection(db, FIRESTORE_COLLECTION);
  const q = query(giftsRef, where('userId', '==', userId));
  const querySnapshot = await withTimeout(getDocs(q), 15000);

  const results: GiftData[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data() as GiftData;
    results.push({
      ...data,
      id: docSnap.id,
    });
  });

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Creates a default template for the Editor wizard.
 */
export function createInitialGiftDraft(): GiftData {
  const demo = DEMO_GIFTS['demo-amor'];
  return {
    ...demo,
    id: '',
    userId: '',
    createdAt: new Date().toISOString(),
  };
}
