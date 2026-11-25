import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Sparkles,
  Heart,
  Music,
  Image as ImageIcon,
  HelpCircle,
  Mail,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Layers,
  BookOpen,
  Edit3,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { GlassCard, PastelButton } from '@/components/ui/GlassPrimitives';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { LiveTimeCounter } from '@/components/ui/LiveTimeCounter';
import {
  RetroCassettePlayer,
  extractYouTubeId,
} from '@/components/ui/RetroCassettePlayer';
import { StarSkyMapCard } from '@/components/ui/StarSkyMapCard';
import { ShareGiftModal } from '@/components/ui/ShareGiftModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CITY_COORDINATE_PRESETS } from '@/utils/astronomy';
import {
  AccentTheme,
  GiftData,
  GiftFormat,
  TimelineMemory,
} from '@/utils/types';
import {
  createInitialGiftDraft,
  fetchGiftFromFirestore,
  saveGiftToFirestore,
  updateGiftInFirestore,
} from '@/utils/giftStorage';
import { sanitizeGiftData } from '@/utils/sanitizeGift';
import { useAuth } from '@/utils/AuthContext';

const WIZARD_STEPS = [
  { id: 0, title: 'O Estilo', icon: Layers, desc: 'Retrospectiva ou Álbum 3D' },
  { id: 1, title: 'Vocês Dois', icon: Heart, desc: 'Nomes, data e local especial' },
  { id: 2, title: 'Nossa Fita', icon: Music, desc: 'A trilha sonora do amor' },
  { id: 3, title: 'Nossa Jornada', icon: ImageIcon, desc: 'Fotos dos momentos marcantes' },
  { id: 4, title: 'Céu & Cúmplices', icon: HelpCircle, desc: 'Estrelas e brincadeiras' },
  { id: 5, title: 'Carta com Lacre', icon: Mail, desc: 'Palavras sinceras do coração' },
];

const DRAFT_STORAGE_KEY = 'capsula_memorias_draft_v1';

export default function GiftEditorPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [step, setStep] = useState<number>(0);
  const [draft, setDraft] = useState<GiftData>(() => createInitialGiftDraft());
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoadingEditData, setIsLoadingEditData] = useState<boolean>(false);
  const [generatedGift, setGeneratedGift] = useState<GiftData | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Protected Route Guard: Redirect anonymous visitors to /login
  React.useEffect(() => {
    if (!authLoading && !currentUser) {
      const target =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/editor';
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [authLoading, currentUser, router]);

  // Detect `editId` from query string (`/editor?editId=og-xxxx-xxxx`) and populate form from Firestore
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const queryEditId =
      (typeof router.query.editId === 'string' ? router.query.editId : null) ||
      urlParams.get('editId');

    if (queryEditId) {
      setEditId(queryEditId);
      setIsLoadingEditData(true);
      setSaveError(null);

      fetchGiftFromFirestore(queryEditId)
        .then((existingGift) => {
          if (existingGift) {
            setDraft(sanitizeGiftData(existingGift));
          } else {
            setSaveError(
              `Não foi possível encontrar o presente "${queryEditId}" no Firestore para edição.`
            );
          }
        })
        .catch((err) => {
          console.error('Erro ao carregar dados para edição:', err);
          setSaveError('Erro ao carregar dados do presente para edição.');
        })
        .finally(() => {
          setIsLoadingEditData(false);
        });
      return;
    }

    // Standard Creation Flow: Restore work-in-progress draft from LocalStorage if not editing
    try {
      const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as GiftData;
        if (parsed && typeof parsed === 'object') {
          setDraft(sanitizeGiftData(parsed));
        }
      }
    } catch {
      // ignore corrupted draft
    }
  }, [router.isReady, router.query.editId]);

  // Auto-save draft on every edit when creating a new gift
  React.useEffect(() => {
    if (typeof window === 'undefined' || editId) return;
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // ignore storage quota warning
    }
  }, [draft, editId]);

  const updateDraft = <K extends keyof GiftData>(key: K, value: GiftData[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddMemory = () => {
    const newMemory: TimelineMemory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: 'Novo Momento',
      title: 'Um Dia Inesquecível',
      description: 'Descreva o que tornou esse momento tão especial para vocês.',
      imageUrl:
        'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=900&q=80',
      emoji: '💖',
    };
    updateDraft('memories', [...draft.memories, newMemory]);
  };

  const handleUpdateMemory = (
    index: number,
    field: keyof TimelineMemory,
    value: string
  ) => {
    const updated = [...draft.memories];
    updated[index] = { ...updated[index], [field]: value };
    updateDraft('memories', updated);
  };

  const handleRemoveMemory = (index: number) => {
    if (draft.memories.length <= 1) return;
    const updated = draft.memories.filter((_, idx) => idx !== index);
    updateDraft('memories', updated);
  };

  /**
   * Handles both UPDATE (`editId` present -> `updateDoc` + redirect to `/gift/[id]`)
   * and CREATE (new document -> `setDoc` with `userId: currentUser.uid` + open Share Modal).
   * Validates mandatory fields upfront and arms against double-clicks and network drops.
   */
  const handleGenerateFreeGift = async () => {
    // 1. Immediate lock against double-clicks
    if (isSaving) return;

    if (!currentUser) {
      router.push('/login?redirect=/editor');
      return;
    }

    // 2. Defensive Pre-submission Validation
    if (!draft.senderName?.trim()) {
      setSaveError('Por favor, preencha o seu nome (De:) no Capítulo 1.');
      setStep(1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (!draft.recipientName?.trim()) {
      setSaveError('Por favor, preencha o nome de quem receberá o presente no Capítulo 1.');
      setStep(1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (!draft.relationshipTitle?.trim()) {
      setSaveError('Por favor, dê um título especial para a história de vocês no Capítulo 1.');
      setStep(1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (!draft.memories || draft.memories.length === 0) {
      setSaveError('Por favor, adicione pelo menos uma memória fotográfica no Capítulo 3.');
      setStep(3);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const sanitizedPayload = sanitizeGiftData(draft);

      if (editId) {
        await updateGiftInFirestore(editId, sanitizedPayload, currentUser.uid);
        await router.push(`/gift/${encodeURIComponent(editId)}`);
        return;
      }

      const savedCloudGift = await saveGiftToFirestore(sanitizedPayload, currentUser.uid);
      setGeneratedGift(sanitizeGiftData(savedCloudGift));
    } catch (err: any) {
      console.error('Erro ao salvar presente no Cloud Firestore:', err);
      const isNetworkIssue =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        err?.code === 'unavailable' ||
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('timeout') ||
        err?.message?.toLowerCase().includes('tempo limite') ||
        err?.message?.toLowerCase().includes('offline');

      if (isNetworkIssue) {
        setSaveError('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
      } else {
        setSaveError(
          err?.message ||
            'Erro ao salvar no Cloud Firestore. Verifique sua conexão ou reduza o tamanho das imagens.'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || (!currentUser && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-pastel-rose/20 border border-pastel-rose/40 flex items-center justify-center text-pastel-rose animate-pulse">
          <Sparkles className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-300">
          Verificando sua conta de criador...
        </p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {editId
            ? 'Editar Cápsula | Cápsula de Memórias'
            : 'Criar nova Cápsula | Cápsula de Memórias'}
        </title>
        <meta
          name="description"
          content="Crie presentes digitais inesquecíveis e guarde os melhores momentos da sua história de amor."
        />
        <meta property="og:title" content="Cápsula de Memórias | Guarde sua história" />
        <meta property="og:site_name" content="Cápsula de Memórias" />
        <meta
          property="og:description"
          content="Crie presentes digitais inesquecíveis e guarde os melhores momentos da sua história de amor."
        />
      </Head>

      <div className="flex-grow bg-obsidian-950 text-slate-100 pb-20">
        <Navbar />

        {/* Ambient Background Glows */}
        <div className="pointer-events-none fixed top-24 left-10 h-80 w-80 rounded-full bg-pastel-rose/10 blur-[120px]" />
        <div className="pointer-events-none fixed bottom-10 right-10 h-80 w-80 rounded-full bg-pastel-lavender/10 blur-[120px]" />

        <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
          {/* Header Banner */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-rose/15 border border-pastel-rose/30 px-3 py-1 text-xs font-semibold text-pastel-rose">
                {editId ? (
                  <>
                    <Edit3 className="h-3.5 w-3.5" />
                    Retocando Cápsula Guardada • Código: {editId}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Guardando com carinho • Feito à mão
                  </>
                )}
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-serif">
                {editId
                  ? 'Retocar Nossa Cápsula'
                  : 'Criar nova Cápsula de Memórias'}
              </h1>
              <p className="mt-1 text-sm text-slate-400 font-sans">
                {editId
                  ? 'Altere qualquer detalhe com carinho e sele as alterações para atualizar sua cápsula.'
                  : 'Preencha cada capítulo no seu ritmo. Ao concluir, sua cápsula é selada e você recebe a chave para entregar a surpresa.'}
              </p>
            </div>

            <PastelButton
              type="button"
              theme={draft.accentTheme}
              onClick={handleGenerateFreeGift}
              disabled={isSaving || isLoadingEditData}
              icon={
                isSaving ? (
                  <Heart className="h-4 w-4 fill-obsidian-950 text-obsidian-950 animate-pulse" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )
              }
            >
              {isSaving
                ? editId
                  ? 'Guardando alterações...'
                  : 'Selando com amor...'
                : editId
                ? 'Atualizar Cápsula'
                : 'Selar Cápsula'}
            </PastelButton>
          </div>

          {saveError && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-pastel-rose/50 bg-pastel-rose/15 p-4 text-xs sm:text-sm text-pastel-rose shadow-lg animate-[fadeIn_0.3s_ease-out]">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-pastel-rose" />
              <div className="flex-1">
                <strong className="font-bold">Aviso:</strong> {saveError}
              </div>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="text-pastel-rose/80 hover:text-pastel-rose font-bold px-1.5 py-0.5 rounded-lg hover:bg-pastel-rose/20 transition-colors"
                aria-label="Fechar aviso"
              >
                ✕
              </button>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {WIZARD_STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                    isActive
                      ? 'glass-panel border-pastel-rose/60 shadow-[0_0_25px_-5px_rgba(253,164,175,0.3)]'
                      : isCompleted
                      ? 'glass-card border-pastel-mint/30 text-slate-200'
                      : 'glass-card border-white/10 text-slate-400'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold ${
                        isActive
                          ? 'bg-pastel-rose text-obsidian-950'
                          : isCompleted
                          ? 'bg-pastel-mint/20 text-pastel-mint'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-500">
                      0{s.id + 1}/06
                    </span>
                  </div>
                  <div className="mt-2.5 text-xs font-bold text-white truncate w-full">
                    {s.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400 truncate w-full">
                    {s.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main 2-Column Workspace: Left Form Wizard / Right Live Interactive Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Active Step Form */}
            <div className="lg:col-span-7 space-y-6">
              <GlassCard elevated>
                {/* STEP 0: Format & Pastel Palette */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        1. Escolha o Formato da Experiência
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-slate-400">
                        Inspirado nos formatos clássicos de Retrospectiva Animada e Álbum do
                        Casal 3D.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {(
                        [
                          {
                            id: 'hibrido',
                            label: 'Híbrido Completo',
                            desc: 'Retrospectiva + Álbum 3D com alternador ao vivo',
                            icon: Sparkles,
                          },
                          {
                            id: 'retrospectiva',
                            label: 'Retrospectiva',
                            desc: 'Foco em linha do tempo vertical e stories animados',
                            icon: Layers,
                          },
                          {
                            id: 'album',
                            label: 'Álbum Digital 3D',
                            desc: 'Foco no livro interativo para folhear páginas',
                            icon: BookOpen,
                          },
                        ] as { id: GiftFormat; label: string; desc: string; icon: any }[]
                      ).map((fmt) => {
                        const FmtIcon = fmt.icon;
                        const selected = draft.format === fmt.id;
                        return (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => updateDraft('format', fmt.id)}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              selected
                                ? 'border-pastel-rose bg-pastel-rose/15 text-white'
                                : 'glass-card border-white/10 text-slate-300'
                            }`}
                          >
                            <FmtIcon className="h-5 w-5 text-pastel-rose mb-2" />
                            <div className="text-sm font-bold text-white">{fmt.label}</div>
                            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                              {fmt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                        Paleta de Acento em Tons Pastel (Dark Glassmorphism)
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {(
                          [
                            { id: 'rose', label: 'Rosa Pastel', color: 'bg-pastel-rose' },
                            {
                              id: 'lavender',
                              label: 'Lavanda Astral',
                              color: 'bg-pastel-lavender',
                            },
                            { id: 'mint', label: 'Menta Suave', color: 'bg-pastel-mint' },
                            { id: 'peach', label: 'Pêssego Solar', color: 'bg-pastel-peach' },
                            { id: 'sky', label: 'Céu Boreal', color: 'bg-pastel-sky' },
                          ] as { id: AccentTheme; label: string; color: string }[]
                        ).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => updateDraft('accentTheme', t.id)}
                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                              draft.accentTheme === t.id
                                ? 'border-white bg-white/15 text-white shadow-lg'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span className={`h-3.5 w-3.5 rounded-full ${t.color}`} />
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 1: Couple Details & Live Counter */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        2. Quem Envia, Quem Recebe & Data Especial
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-slate-400">
                        Esses dados alimentam o envelope inicial com lacre e o contador de
                        tempo ao vivo.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Seu Nome (Remetente)
                        </label>
                        <input
                          type="text"
                          value={draft.senderName}
                          onChange={(e) => updateDraft('senderName', e.target.value)}
                          placeholder="Ex: Lucas"
                          className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Nome de Quem Recebe
                        </label>
                        <input
                          type="text"
                          value={draft.recipientName}
                          onChange={(e) => updateDraft('recipientName', e.target.value)}
                          placeholder="Ex: Marina"
                          className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Título Principal do Presente
                      </label>
                      <input
                        type="text"
                        value={draft.relationshipTitle}
                        onChange={(e) => updateDraft('relationshipTitle', e.target.value)}
                        placeholder="Ex: Nossa História em Cada Detalhe"
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Data e Hora do Início (Para o Contador ao Vivo)
                        </label>
                        <input
                          type="datetime-local"
                          value={draft.startDate}
                          onChange={(e) => updateDraft('startDate', e.target.value)}
                          className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Iniciais para o Lacre de Cera
                        </label>
                        <input
                          type="text"
                          maxLength={8}
                          value={draft.loveLetter.sealInitials}
                          onChange={(e) =>
                            updateDraft('loveLetter', {
                              ...draft.loveLetter,
                              sealInitials: e.target.value,
                            })
                          }
                          placeholder="Ex: L & M"
                          className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                        />
                      </div>
                    </div>

                    <ImageUploadField
                      label="Foto de Capa (Arquivo do Dispositivo ou URL de Imagem)"
                      value={draft.coverImageUrl}
                      onChange={(newUrl) => updateDraft('coverImageUrl', newUrl)}
                    />
                  </div>
                )}

                {/* STEP 2: Retro Cassette Soundtrack */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        3. A Fita Cassete com a Música de Vocês
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-slate-400">
                        Personalize o rótulo da fita retrô e o áudio que toca ao quebrar o
                        lacre do presente.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Nome da Música
                        </label>
                        <input
                          type="text"
                          value={draft.soundtrack.songTitle}
                          onChange={(e) =>
                            updateDraft('soundtrack', {
                              ...draft.soundtrack,
                              songTitle: e.target.value,
                            })
                          }
                          className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Artista / Banda
                        </label>
                        <input
                          type="text"
                          value={draft.soundtrack.artistName}
                          onChange={(e) =>
                            updateDraft('soundtrack', {
                              ...draft.soundtrack,
                              artistName: e.target.value,
                            })
                          }
                          className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Rótulo Gravado na Fita Cassete
                      </label>
                      <input
                        type="text"
                        value={draft.soundtrack.cassetteLabel}
                        onChange={(e) =>
                          updateDraft('soundtrack', {
                            ...draft.soundtrack,
                            cassetteLabel: e.target.value,
                          })
                        }
                        placeholder="Ex: LADO A • NOSSA TRILHA SONORA"
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Link do YouTube ou URL de Áudio (.mp3)
                        </label>
                        {extractYouTubeId(draft.soundtrack.youtubeOrAudioUrl) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-pastel-mint/15 border border-pastel-mint/30 px-2.5 py-0.5 text-[10px] font-bold text-pastel-mint">
                            ✓ Vídeo do YouTube reconhecido (ID:{' '}
                            {extractYouTubeId(draft.soundtrack.youtubeOrAudioUrl)})
                          </span>
                        )}
                      </div>
                      <input
                        type="url"
                        value={draft.soundtrack.youtubeOrAudioUrl}
                        onChange={(e) =>
                          updateDraft('soundtrack', {
                            ...draft.soundtrack,
                            youtubeOrAudioUrl: e.target.value,
                          })
                        }
                        placeholder="Cole o link do YouTube (ex: https://www.youtube.com/watch?v=...) ou .mp3"
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Suporta links do YouTube (<code className="text-pastel-rose">youtube.com/watch?v=...</code>,{' '}
                        <code className="text-pastel-rose">youtu.be/...</code>,{' '}
                        <code className="text-pastel-rose">music.youtube.com</code>) ou arquivos diretos <code className="text-pastel-lavender">.mp3</code>.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Trecho da Letra ou Dedicatória Musical
                      </label>
                      <textarea
                        rows={2}
                        value={draft.soundtrack.dedicationQuote}
                        onChange={(e) =>
                          updateDraft('soundtrack', {
                            ...draft.soundtrack,
                            dedicationQuote: e.target.value,
                          })
                        }
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Timeline & 3D Album Memories */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          4. Linha do Tempo & Páginas do Álbum 3D
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-slate-400">
                          Adicione fotos, datas e histórias marcantes da jornada de vocês.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddMemory}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-pastel-rose/20 border border-pastel-rose/40 px-3.5 py-2 text-xs font-bold text-pastel-rose hover:bg-pastel-rose/30"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Adicionar Memória</span>
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
                      {draft.memories.map((mem, idx) => (
                        <div
                          key={mem.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-pastel-lavender">
                              Capítulo #{idx + 1}
                            </span>
                            {draft.memories.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMemory(idx)}
                                className="text-xs text-slate-400 hover:text-pastel-rose inline-flex items-center gap-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remover</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Data / Época
                              </label>
                              <input
                                type="text"
                                value={mem.date}
                                onChange={(e) =>
                                  handleUpdateMemory(idx, 'date', e.target.value)
                                }
                                className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Emoji
                              </label>
                              <input
                                type="text"
                                value={mem.emoji}
                                onChange={(e) =>
                                  handleUpdateMemory(idx, 'emoji', e.target.value)
                                }
                                className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                              />
                            </div>
                          </div>

                          <ImageUploadField
                            label="Foto da Memória (Dispositivo ou URL)"
                            value={mem.imageUrl}
                            onChange={(newUrl) =>
                              handleUpdateMemory(idx, 'imageUrl', newUrl)
                            }
                            compact
                          />

                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Título da Memória
                            </label>
                            <input
                              type="text"
                              value={mem.title}
                              onChange={(e) =>
                                handleUpdateMemory(idx, 'title', e.target.value)
                              }
                              className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Descrição / História
                            </label>
                            <textarea
                              rows={2}
                              value={mem.description}
                              onChange={(e) =>
                                handleUpdateMemory(idx, 'description', e.target.value)
                              }
                              className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: Star Sky Map, Quiz & Date Roulette */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        5. O Céu Daquela Noite, Quiz & Roleta do Casal
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-slate-400">
                        Personalize as seções interativas que tornam o presente inesquecível.
                      </p>
                    </div>

                    {/* Star Sky Settings */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-pastel-sky">
                          ✨ Mapa Estelar (&ldquo;O Céu Daquela Data&rdquo;)
                        </span>
                        <input
                          type="checkbox"
                          checked={draft.starSky.enabled}
                          onChange={(e) =>
                            updateDraft('starSky', {
                              ...draft.starSky,
                              enabled: e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-pastel-rose"
                        />
                      </div>

                      {/* Quick City Coordinate Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 mr-1">
                          Preencher Cidade:
                        </span>
                        {Object.entries(CITY_COORDINATE_PRESETS).map(([key, preset]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              updateDraft('starSky', {
                                ...draft.starSky,
                                locationName: preset.label,
                                coordinates: preset.coordsText,
                              })
                            }
                            className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-all ${
                              draft.starSky.locationName === preset.label
                                ? 'border-pastel-sky bg-pastel-sky/20 text-pastel-sky'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            {preset.label.split(',')[0]}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Cidade / Local
                          </label>
                          <input
                            type="text"
                            value={draft.starSky.locationName}
                            onChange={(e) =>
                              updateDraft('starSky', {
                                ...draft.starSky,
                                locationName: e.target.value,
                              })
                            }
                            placeholder="Ex: Brasília, DF"
                            className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Coordenadas (Graus ou Decimal)
                          </label>
                          <input
                            type="text"
                            value={draft.starSky.coordinates}
                            onChange={(e) =>
                              updateDraft('starSky', {
                                ...draft.starSky,
                                coordinates: e.target.value,
                              })
                            }
                            placeholder='Ex: 15°48&apos;52"S • 48°01&apos;42"W'
                            className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Data/Hora Exibida no Mapa Estelar
                        </label>
                        <input
                          type="text"
                          value={draft.starSky.dateLabel}
                          onChange={(e) =>
                            updateDraft('starSky', {
                              ...draft.starSky,
                              dateLabel: e.target.value,
                            })
                          }
                          placeholder="Ex: 31 de Janeiro de 2025 às 19:00"
                          className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Mensagem Poética sobre o Céu
                        </label>
                        <textarea
                          rows={2}
                          value={draft.starSky.constellationNote}
                          onChange={(e) =>
                            updateDraft('starSky', {
                              ...draft.starSky,
                              constellationNote: e.target.value,
                            })
                          }
                          placeholder="Mensagem poética sobre o céu daquela noite..."
                          className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    {/* Quiz Settings */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-pastel-rose">
                          🎯 Quiz sobre o Primeiro Dia
                        </span>
                        <input
                          type="checkbox"
                          checked={draft.quiz.enabled}
                          onChange={(e) =>
                            updateDraft('quiz', {
                              ...draft.quiz,
                              enabled: e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-pastel-rose"
                        />
                      </div>

                      <input
                        type="text"
                        value={draft.quiz.question}
                        onChange={(e) =>
                          updateDraft('quiz', { ...draft.quiz, question: e.target.value })
                        }
                        placeholder="Pergunta do Quiz"
                        className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {draft.quiz.options.map((opt, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const nextOpts = [...draft.quiz.options];
                              nextOpts[idx] = e.target.value;
                              updateDraft('quiz', { ...draft.quiz, options: nextOpts });
                            }}
                            className="glass-input rounded-xl px-3 py-2 text-xs"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Roulette Settings */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-pastel-peach">
                          🎲 Roleta do Próximo Date
                        </span>
                        <input
                          type="checkbox"
                          checked={draft.roulette.enabled}
                          onChange={(e) =>
                            updateDraft('roulette', {
                              ...draft.roulette,
                              enabled: e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-pastel-rose"
                        />
                      </div>

                      <input
                        type="text"
                        value={draft.roulette. options.join(' | ')}
                        onChange={(e) =>
                          updateDraft('roulette', {
                            ...draft.roulette,
                            options: e.target.value
                              .split('|')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Separe as opções com |"
                        className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 5: Sealed Love Letter & Free Generation */}
                {step === 5 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        6. Carta Fechada com Lacre Virtual
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-slate-400">
                        O grande final da experiência: uma carta que só se abre quando a pessoa
                        amada toca no lacre.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Título da Carta
                      </label>
                      <input
                        type="text"
                        value={draft.loveLetter.title}
                        onChange={(e) =>
                          updateDraft('loveLetter', {
                            ...draft.loveLetter,
                            title: e.target.value,
                          })
                        }
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Mensagem da Carta
                      </label>
                      <textarea
                        rows={7}
                        value={draft.loveLetter.content}
                        onChange={(e) =>
                          updateDraft('loveLetter', {
                            ...draft.loveLetter,
                            content: e.target.value,
                          })
                        }
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Assinatura Final
                      </label>
                      <input
                        type="text"
                        value={draft.loveLetter.signature}
                        onChange={(e) =>
                          updateDraft('loveLetter', {
                            ...draft.loveLetter,
                            signature: e.target.value,
                          })
                        }
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    <div className="rounded-2xl bg-pastel-mint/10 border border-pastel-mint/30 p-4 text-xs text-pastel-mint leading-relaxed">
                      <strong>Tudo pronto para selar o envelope:</strong> Este presente é um gesto
                      de carinho genuíno. Sem carrinho, sem checkout e sem anúncios. Clique em{' '}
                      <strong>&ldquo;Selar Nosso Presente&rdquo;</strong> para fechar o envelope
                      e receber a chave da surpresa.
                    </div>
                  </div>
                )}

                {/* Wizard Footer Navigation Buttons */}
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <PastelButton
                    type="button"
                    variant="glass"
                    disabled={step === 0}
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    icon={<ChevronLeft className="h-4 w-4" />}
                  >
                    Capítulo Anterior
                  </PastelButton>

                  {step < WIZARD_STEPS.length - 1 ? (
                    <PastelButton
                      type="button"
                      theme={draft.accentTheme}
                      onClick={() => setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))}
                      icon={<ChevronRight className="h-4 w-4" />}
                    >
                      Próximo Capítulo
                    </PastelButton>
                  ) : (
                    <PastelButton
                      type="button"
                      theme="mint"
                      onClick={handleGenerateFreeGift}
                      disabled={isSaving || isLoadingEditData}
                      icon={
                        isSaving ? (
                          <Heart className="h-4 w-4 fill-obsidian-950 text-obsidian-950 animate-pulse" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )
                      }
                    >
                      {isSaving
                        ? editId
                          ? 'Guardando alterações...'
                          : 'Selando com amor...'
                        : editId
                        ? 'Atualizar Cápsula'
                        : 'Selar Cápsula'}
                    </PastelButton>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* RIGHT COLUMN: Live Interactive Preview */}
            <div className="lg:col-span-5 space-y-6">
              <ErrorBoundary
                fallbackTitle="Prévia em Atualização"
                fallbackMessage="A prévia será reexibida assim que os dados forem preenchidos."
              >
                <div className="flex items-center justify-between px-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-pastel-lavender font-handwriting text-base">
                    <Eye className="h-3.5 w-3.5" />
                    Espiadinha em Tempo Real
                  </span>
                  <span className="text-xs text-slate-400">
                    Para: <strong className="text-white font-serif">{draft.recipientName || 'Seu Amor'}</strong>
                  </span>
                </div>

                {/* Mini Preview Card 1: Envelope Header */}
                <GlassCard className="border-pastel-rose/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pastel-rose via-pastel-lavender to-pastel-peach text-obsidian-950 font-serif font-black text-sm shadow-lg">
                      {draft.loveLetter?.sealInitials || 'A&V'}
                    </div>
                    <div className="truncate">
                      <div className="text-xs text-pastel-rose font-semibold">
                        De {draft.senderName || 'Você'} para {draft.recipientName || 'Seu Amor'}
                      </div>
                      <div className="text-base font-extrabold text-white truncate">
                        {draft.relationshipTitle || 'Nossa História'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {draft.memories?.length || 0} memórias • Formato {draft.format}
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Mini Preview Card 2: Live Time Counter */}
                <LiveTimeCounter
                  startDate={draft.startDate}
                  senderName={draft.senderName || 'Você'}
                  recipientName={draft.recipientName || 'Seu Amor'}
                  theme={draft.accentTheme}
                  compact
                />

                {/* Mini Preview Card 3: Cassette Player */}
                <RetroCassettePlayer
                  songTitle={draft.soundtrack?.songTitle || 'Nossa Canção'}
                  artistName={draft.soundtrack?.artistName || 'Para Nós Dois'}
                  audioUrl={draft.soundtrack?.youtubeOrAudioUrl || ''}
                  cassetteLabel={draft.soundtrack?.cassetteLabel || 'Lado A'}
                  dedicationQuote={draft.soundtrack?.dedicationQuote || ''}
                  theme={draft.accentTheme}
                />

                {/* Mini Preview Card 4: Live Star Sky Dome */}
                {draft.starSky?.enabled && (
                  <StarSkyMapCard
                    dateLabel={draft.starSky?.dateLabel || 'A Noite Mais Bonita'}
                    isoDate={draft.startDate}
                    locationName={draft.starSky?.locationName || 'São Paulo, Brasil'}
                    coordinates={draft.starSky?.coordinates || '-23.5505,-46.6333'}
                    constellationNote={draft.starSky?.constellationNote || ''}
                    theme={draft.accentTheme}
                    compact
                  />
                )}
              </ErrorBoundary>
            </div>
          </div>
        </main>

        {/* Instant Free Link & QR Code Modal (only rendered after Firestore write succeeds) */}
        {generatedGift && (
          <ShareGiftModal
            gift={generatedGift}
            persistedToFirestore={true}
            onClose={() => setGeneratedGift(null)}
          />
        )}
      </div>
    </>
  );
}
