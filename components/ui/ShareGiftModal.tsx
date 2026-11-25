import React, { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Check,
  Copy,
  ExternalLink,
  Gift,
  Sparkles,
  Share2,
  X,
  Database,
  Heart,
} from 'lucide-react';
import { GiftData } from '@/utils/types';
import { buildShareableGiftUrl } from '@/utils/idGenerator';
import { PastelButton } from './GlassPrimitives';

interface ShareGiftModalProps {
  gift: GiftData;
  persistedToFirestore?: boolean;
  onClose: () => void;
}

/**
 * Success Modal displaying the QR Code, Copy Link, and WhatsApp share button.
 * Dynamically uses `window.location.origin` so that in production on Firebase Hosting
 * (e.g. https://seu-projeto.web.app/gift/og-mkx8-fzxb) it always uses the live domain.
 */
export const ShareGiftModal: React.FC<ShareGiftModalProps> = ({
  gift,
  persistedToFirestore = true,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(buildShareableGiftUrl(gift, persistedToFirestore));
    }
  }, [gift, persistedToFirestore]);

  const activeUrl =
    shareUrl ||
    (typeof window !== 'undefined'
      ? buildShareableGiftUrl(gift, persistedToFirestore)
      : `/gift/${encodeURIComponent(gift.id)}`);

  const displayShortUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/gift/${encodeURIComponent(gift.id)}`
      : `/gift/${encodeURIComponent(gift.id)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `💌 Preparei uma Cápsula de Memórias especial para você, ${gift.recipientName}! Abra aqui: ${activeUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/90 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="glass-panel relative w-full max-w-lg rounded-[2rem] border border-pastel-rose/30 p-6 sm:p-8 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute right-5 top-5 rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pastel-rose/15 text-pastel-rose border border-pastel-rose/30 shadow-lg">
          <Heart className="h-8 w-8 fill-pastel-rose/30" />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-rose/15 border border-pastel-rose/30 px-3.5 py-1 text-xs font-semibold text-pastel-rose font-handwriting text-base">
            <Sparkles className="h-3.5 w-3.5" />
            Cápsula selada com carinho
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-extrabold text-white font-serif">
          Sua Cápsula Está Pronta!
        </h2>
        <p className="mt-1.5 text-sm text-slate-300">
          A chave para a Cápsula de Memórias de{' '}
          <span className="font-semibold text-white font-serif">{gift.recipientName}</span> está pronta
          para ser entregue.
        </p>

        {/* QR Code Box generated dynamically from window.location.origin */}
        <div className="my-6 inline-flex flex-col items-center rounded-3xl bg-white p-4 shadow-xl">
          <QRCodeCanvas
            value={activeUrl}
            size={168}
            bgColor="#FFFFFF"
            fgColor="#07070c"
            level="M"
          />
          <span className="mt-2 font-mono text-[11px] font-bold text-obsidian-950">
            Código: {gift.id}
          </span>
        </div>

        {/* Shareable Link Input */}
        <div className="rounded-2xl bg-obsidian-950/90 border border-white/15 p-2.5 flex items-center justify-between gap-2">
          <div className="truncate px-2 text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              A chave para a sua surpresa
            </div>
            <div className="truncate text-xs sm:text-sm font-mono text-pastel-rose">
              {displayShortUrl}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-2.5 text-xs font-semibold text-white transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-pastel-mint" />
                <span className="text-pastel-mint">Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar Chave</span>
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PastelButton
            type="button"
            theme="mint"
            onClick={handleWhatsAppShare}
            icon={<Share2 className="h-4 w-4" />}
          >
            Entregar no WhatsApp
          </PastelButton>

          <a
            href={activeUrl}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-pastel-rose/40 bg-pastel-rose/15 px-5 py-3.5 text-sm font-bold text-pastel-rose hover:bg-pastel-rose/25 transition-all"
          >
            <span>Abrir Envelope Agora</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
