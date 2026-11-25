import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Calendar,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Gift,
  Heart,
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import {
  GlassCard,
  PastelButton,
  THEME_ACCENT_MAP,
} from '@/components/ui/GlassPrimitives';
import { useAuth } from '@/utils/AuthContext';
import { GiftData } from '@/utils/types';
import {
  deleteGiftFromFirestore,
  fetchUserGiftsFromFirestore,
} from '@/utils/giftStorage';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();

  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [loadingGifts, setLoadingGifts] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Protected Route Guard: Redirect anonymous users to /login
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace('/login?redirect=/dashboard');
    }
  }, [authLoading, currentUser, router]);

  // Fetch all gifts created by currentUser.uid from Cloud Firestore
  useEffect(() => {
    if (authLoading || !currentUser) return;

    let isMounted = true;
    setLoadingGifts(true);
    setErrorMsg(null);

    fetchUserGiftsFromFirestore(currentUser.uid)
      .then((userGifts) => {
        if (!isMounted) return;
        setGifts(userGifts);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erro ao buscar presentes do usuário:', err);
        setErrorMsg('Não foi possível carregar seus presentes do Cloud Firestore.');
      })
      .finally(() => {
        if (isMounted) setLoadingGifts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, currentUser]);

  const handleCopyLink = async (giftId: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/gift/${encodeURIComponent(giftId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(giftId);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setCopiedId(null);
    }
  };

  const handleDeleteGift = async (giftId: string, title: string) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Tem certeza que deseja excluir o presente "${title}"?`)
    ) {
      return;
    }

    try {
      await deleteGiftFromFirestore(giftId);
      setGifts((prev) => prev.filter((g) => g.id !== giftId));
    } catch (err) {
      console.error('Erro ao excluir presente:', err);
    }
  };

  if (authLoading || (!currentUser && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-pastel-rose/20 border border-pastel-rose/40 flex items-center justify-center text-pastel-rose animate-pulse">
          <LayoutDashboard className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-300">
          Verificando sua sessão de criador...
        </p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Minhas Cápsulas | Cápsula de Memórias</title>
        <meta
          name="description"
          content="Gerencie, edite e compartilhe todas as suas Cápsulas de Memórias."
        />
        <meta property="og:site_name" content="Cápsula de Memórias" />
        <meta property="og:title" content="Minhas Cápsulas | Cápsula de Memórias" />
      </Head>

      <div className="flex-grow bg-obsidian-950 text-slate-100 pb-20 relative overflow-hidden">
        <Navbar />

        {/* Ambient Pastel Lighting */}
        <div className="pointer-events-none fixed top-20 -left-24 h-96 w-96 rounded-full bg-pastel-rose/10 blur-[130px]" />
        <div className="pointer-events-none fixed bottom-10 -right-24 h-96 w-96 rounded-full bg-pastel-lavender/10 blur-[130px]" />

        <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 space-y-8">
          {/* Top Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-sky/15 border border-pastel-sky/30 px-3 py-1 text-xs font-semibold text-pastel-sky font-handwriting text-base">
                <Sparkles className="h-3.5 w-3.5" />
                Minhas Cápsulas •{' '}
                {currentUser?.displayName || currentUser?.email || 'Minha Conta'}
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-serif">
                Minhas Cápsulas de Memórias
              </h1>
              <p className="mt-1 text-sm text-slate-400 font-sans">
                Aqui ficam guardadas todas as suas cápsulas de memórias. Copie o link para entregar ou retoque cada detalhe quando quiser.
              </p>
            </div>

            <Link href="/editor">
              <PastelButton
                type="button"
                theme="rose"
                icon={<Heart className="h-4 w-4 fill-obsidian-950" />}
              >
                Criar nova Cápsula
              </PastelButton>
            </Link>
          </div>

          {errorMsg && (
            <div className="rounded-2xl border border-pastel-rose/40 bg-pastel-rose/15 p-4 text-xs sm:text-sm text-pastel-rose">
              {errorMsg}
            </div>
          )}

          {/* Gifts Grid */}
          {loadingGifts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="glass-card h-72 rounded-3xl border border-white/10 animate-pulse p-6"
                />
              ))}
            </div>
          ) : gifts.length === 0 ? (
            <GlassCard elevated className="text-center py-14 max-w-xl mx-auto">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pastel-rose/15 border border-pastel-rose/30 text-pastel-rose">
                <Heart className="h-8 w-8 fill-pastel-rose/30" />
              </div>
              <h2 className="text-xl font-extrabold text-white font-serif">
                Você ainda não criou nenhuma cápsula
              </h2>
              <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto leading-relaxed font-sans">
                Que tal começar a guardar sua história agora? Crie uma retrospectiva delicada com fotos, música e carta selada.
              </p>
              <div className="mt-6">
                <Link href="/editor">
                  <PastelButton
                    type="button"
                    theme="rose"
                    icon={<Heart className="h-4 w-4 fill-obsidian-950" />}
                  >
                    Criar minha primeira Cápsula
                  </PastelButton>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gifts.map((gift) => {
                const accent =
                  THEME_ACCENT_MAP[gift.accentTheme] || THEME_ACCENT_MAP.rose;
                const formattedCreatedDate = (() => {
                  const d = new Date(gift.createdAt);
                  if (isNaN(d.getTime())) return gift.createdAt;
                  return d.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                })();

                const isCopied = copiedId === gift.id;

                return (
                  <div
                    key={gift.id}
                    className="glass-card flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 transition-all hover:border-pastel-rose/40"
                  >
                    {/* Card Top Cover Preview */}
                    <div>
                      <div className="relative h-44 w-full overflow-hidden bg-gray-800/50">
                        {gift.coverImageUrl && (
                          <img
                            src={gift.coverImageUrl}
                            alt={gift.relationshipTitle}
                            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-transparent" />

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${accent.badge}`}
                          >
                            <Heart className="h-3 w-3 fill-current" />
                            {gift.senderName} → {gift.recipientName}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteGift(gift.id, gift.relationshipTitle)
                            }
                            title="Excluir presente"
                            className="rounded-full bg-obsidian-950/75 p-2 text-slate-400 hover:text-pastel-rose border border-white/10 backdrop-blur-md transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-pastel-lavender" />
                            Criado em {formattedCreatedDate}
                          </span>
                          <span className="font-mono text-[10px] text-pastel-mint">
                            {gift.id}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        <h3 className="text-lg font-extrabold text-white truncate">
                          {gift.relationshipTitle}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {gift.memories?.length || 0} memórias • Formato{' '}
                          <span className="capitalize text-slate-200">{gift.format}</span> •
                          Música: {gift.soundtrack?.songTitle || 'Padrão'}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Action Buttons */}
                    <div className="px-5 pb-5 pt-3 border-t border-white/10 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(gift.id)}
                        className="glass-card inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-200 hover:text-white"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-pastel-mint" />
                            <span className="text-pastel-mint">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/gift/${encodeURIComponent(gift.id)}`}
                        className="glass-card inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-semibold text-pastel-sky hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Visualizar</span>
                      </Link>

                      <Link
                        href={`/editor?editId=${encodeURIComponent(gift.id)}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-pastel-lavender/20 border border-pastel-lavender/40 py-2.5 px-3 text-xs font-bold text-pastel-lavender hover:bg-pastel-lavender/30 transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
