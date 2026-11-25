import React, { useRef, useState } from 'react';
import { Upload, Link2, Check } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (newImageUrlOrDataUrl: string) => void;
  compact?: boolean;
}

/**
 * Allows the user to either:
 * 1. Pick an image file directly from their device (smartphone or computer) with
 *    aggressive client-side canvas compression (~60KB-90KB per photo) so that even 10+
 *    device photos fit comfortably inside Firestore's 1MB document limit!
 * 2. Paste an external image URL.
 */
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const isLocalDataUrl = value?.startsWith('data:image/');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setIsProcessing(false);
        return;
      }

      // Compress & resize via HTML5 Canvas so multiple photos fit well under Firestore's 1MB doc limit
      const img = new window.Image();
      img.onload = () => {
        try {
          const MAX_DIMENSION = 780;
          let { width, height } = img;

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            let quality = 0.68;
            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            // Ensure each base64 photo is at most ~115KB so 6-8 photos never exceed 1MB in Firestore
            while (compressedDataUrl.length > 120000 && quality > 0.35) {
              quality -= 0.12;
              compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            onChange(compressedDataUrl);
          } else {
            onChange(rawDataUrl);
          }
        } catch {
          onChange(rawDataUrl);
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        onChange(rawDataUrl);
        setIsProcessing(false);
      };
      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          className={`block font-medium text-slate-300 ${
            compact ? 'text-[11px]' : 'text-xs'
          }`}
        >
          {label}
        </label>

        {isLocalDataUrl && (
          <span className="inline-flex items-center gap-1 rounded-full bg-pastel-mint/15 border border-pastel-mint/30 px-2.5 py-0.5 text-[10px] font-semibold text-pastel-mint">
            <Check className="h-3 w-3" />
            {uploadedFileName ? `Arquivo: ${uploadedFileName}` : 'Foto do dispositivo carregada'}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-pastel-rose/40 bg-pastel-rose/15 hover:bg-pastel-rose/25 text-pastel-rose font-bold transition-all active:scale-95 ${
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-xs sm:text-sm'
          }`}
        >
          <Upload className="h-4 w-4 shrink-0" />
          <span>
            {isProcessing
              ? 'Otimizando...'
              : isLocalDataUrl
              ? 'Trocar Foto do Dispositivo'
              : 'Escolher do Dispositivo'}
          </span>
        </button>

        <div className="relative flex-1 min-w-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Link2 className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={isLocalDataUrl ? '' : value}
            onChange={(e) => {
              setUploadedFileName(null);
              onChange(e.target.value);
            }}
            placeholder={
              isLocalDataUrl
                ? 'Imagem carregada do dispositivo (ou cole uma URL aqui)'
                : 'Ou cole uma URL de imagem (https://...)'
            }
            className={`glass-input w-full rounded-xl pl-9 pr-3 ${
              compact ? 'py-2 text-xs' : 'py-3 text-sm'
            }`}
          />
        </div>

        {value && (
          <div
            className={`relative shrink-0 overflow-hidden rounded-xl border border-white/15 bg-obsidian-900 ${
              compact ? 'h-9 w-12' : 'h-11 w-14'
            }`}
            title="Prévia da foto selecionada"
          >
            <img
              src={value}
              alt="Prévia"
              className="h-full w-full object-cover object-center"
            />
          </div>
        )}
      </div>
    </div>
  );
};
