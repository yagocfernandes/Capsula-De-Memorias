import { GiftData } from './types';

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * Generates a unique, human-friendly random slug ID (e.g. "og-mkx8-fzxb")
 * using Web Crypto API when available for collision resistance.
 */
export function generateGiftId(prefix = 'og'): string {
  const length = 8;
  let randomPart = '';

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      randomPart += ALPHABET[bytes[i] % ALPHABET.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      randomPart += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
  }

  return `${prefix}-${randomPart.slice(0, 4)}-${randomPart.slice(4)}`;
}

/**
 * Encodes GiftData into a compact URL-safe Base64 payload for optional stateless fallback.
 */
export function encodeGiftPayload(gift: GiftData): string {
  try {
    const json = JSON.stringify(gift);
    if (typeof window !== 'undefined') {
      return btoa(encodeURIComponent(json));
    }
    return Buffer.from(encodeURIComponent(json), 'utf-8').toString('base64');
  } catch (err) {
    console.error('Failed to encode gift payload:', err);
    return '';
  }
}

/**
 * Decodes a URL-safe Base64 payload back into GiftData.
 */
export function decodeGiftPayload(encoded: string): GiftData | null {
  try {
    let decodedUri = '';
    if (typeof window !== 'undefined') {
      decodedUri = atob(encoded);
    } else {
      decodedUri = Buffer.from(encoded, 'base64').toString('utf-8');
    }
    const json = decodeURIComponent(decodedUri);
    return JSON.parse(json) as GiftData;
  } catch (err) {
    console.error('Failed to decode gift payload:', err);
    return null;
  }
}

/**
 * Dynamically builds the shareable gift link using `window.location.origin`.
 * When deployed on Firebase Hosting (e.g. https://seu-projeto.web.app),
 * it automatically produces `https://seu-projeto.web.app/gift/og-xxxx-xxxx`.
 */
export function buildShareableGiftUrl(
  gift: GiftData,
  persistedToFirestore = true
): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';
  const baseUrl = `${origin}/gift/${encodeURIComponent(gift.id)}`;

  // When persisted to Firestore, return the clean canonical URL `/gift/[id]`
  if (persistedToFirestore) {
    return baseUrl;
  }

  // Fallback stateless payload only if Firestore was not connected and payload is compact
  const rawSize = JSON.stringify(gift).length;
  if (rawSize < 4500) {
    const payload = encodeGiftPayload(gift);
    if (payload) {
      return `${baseUrl}?d=${encodeURIComponent(payload)}`;
    }
  }

  return baseUrl;
}
