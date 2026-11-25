import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Compass,
  Dices,
  Heart,
  Mail,
  Music,
  Sparkles,
  ArrowRight,
  PenTool,
} from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { GlassCard, PastelButton } from '@/components/ui/GlassPrimitives';
import { useAuth } from '@/utils/AuthContext';
import { GiftData } from '@/utils/types';
import { fetchUserGiftsFromFirestore } from '@/utils/giftStorage';

const FEATURE_CARDS = [
  {
    icon: Clock,
    badge: 'O Tempo ao Vivo',
    title: 'O Amor em Números',
    desc: 'Conta cada segundo, dia e até as batidas do coração que vocês já compartilharam desde o primeiro instante.',
    color: 'text-pastel-rose bg-pastel-rose/15 border-pastel-rose/30',
  },
  {
    icon: Music,
    badge: 'Nossa Fita',
    title: 'A Trilha Sonora de Vocês',
    desc: 'Uma fita cassete vintage animada que toca a música de vocês enquanto a pessoa querida viaja pelas memórias.',
    color: 'text-pastel-lavender bg-pastel-lavender/15 border-pastel-lavender/30',
  },
  {
    icon: BookOpen,
    badge: 'Livro de Memórias',
    title: 'Retrospectiva & Álbum 3D',
    desc: 'Folheie como um livro de poesia ou navegue por uma linha do tempo vertical com suas fotos e datas favoritas.',
    color: 'text-pastel-mint bg-pastel-mint/15 border-pastel-mint/30',
  },
  {
    icon: Compass,
    badge: 'Mapa Celeste',
    title: 'O Céu Daquela Noite',
    desc: 'A projeção astronômica exata das constelações e estrelas que brilhavam no céu na noite em que vocês se conheceram.',
    color: 'text-pastel-sky bg-pastel-sky/15 border-pastel-sky/30',
  },
  {
    icon: Dices,
    badge: 'Cúmplices',
    title: 'Quiz de Memórias & Roleta do Date',
    desc: 'Perguntas carinhosas sobre a história de vocês e um sorteio divertido para o próximo encontro a dois.',
    color: 'text-pastel-peach bg-pastel-peach/15 border-pastel-peach/30',
  },
  {
    icon: Mail,
    badge: 'O Grande Momento',
    title: 'Envelope & Lacre de Cera',
    desc: 'A emoção começa ao quebrar o lacre com as iniciais de vocês, revelando uma carta íntima sob chuva de pétalas.',
    color: 'text-pastel-butter bg-pastel-butter/15 border-pastel-butter/30',
  },
];

export default function HomePage() {
  const { currentUser } = useAuth();
  const [recentGifts, setRecentGifts] = useState<GiftData[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setRecentGifts([]);
      return;
    }
    fetchUserGiftsFromFirestore(currentUser.uid)
      .then((list) => setRecentGifts(list.slice(0, 6)))
      .catch(() => setRecentGifts([]));
  }, [currentUser]);

  return (
    <>
      <Head>
        <title>Cápsula de Memórias | Guarde sua história</title>
        <meta
          name="description"
          content="Crie presentes digitais inesquecíveis e guarde os melhores momentos da sua história de amor."
        />
        <meta property="og:site_name" content="Cápsula de Memórias" />
        <meta property="og:title" content="Cápsula de Memórias | Guarde sua história" />
        <meta
          property="og:description"
          content="Crie presentes digitais inesquecíveis e guarde os melhores momentos da sua história de amor."
        />
      </Head>

      <div className="flex-grow bg-obsidian-950 text-slate-100 pb-20 relative overflow-hidden">
        <Navbar />

        {/* Ambient Pastel Glow Orbs */}
        <div className="pointer-events-none fixed -top-24 left-1/4 h-96 w-96 rounded-full bg-pastel-rose/15 blur-[140px]" />
        <div className="pointer-events-none fixed top-1/3 -right-24 h-96 w-96 rounded-full bg-pastel-lavender/15 blur-[140px]" />
        <div className="pointer-events-none fixed bottom-0 left-10 h-96 w-96 rounded-full bg-pastel-mint/10 blur-[140px]" />

        <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-16 space-y-20">
          {/* HERO SECTION */}
          <ScrollReveal direction="up">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full bg-pastel-rose/15 border border-pastel-rose/30 px-4 py-1.5 text-xs font-semibold text-pastel-rose font-handwriting text-base">
                <Sparkles className="h-4 w-4" />
                Feito com calma • Selado com amor
              </span>

              <h1 className="mt-6 text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15] font-serif">
                Onde o amor ganha tempo,{' '}
                <span className="pastel-gradient-text italic">
                  música e poesia.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
                Um envelope digital artesanal com a{' '}
                <strong className="text-white">música do casal</strong>, o{' '}
                <strong className="text-white">céu estrelado</strong> daquela data inesquecível,
                suas fotos mais especiais e uma{' '}
                <strong className="text-white">carta fechada com lacre de cera</strong>.
              </p>

              <div className="mt-4 font-handwriting text-2xl text-pastel-rose">
                Um presente para guardar no peito por toda a vida.
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/editor">
                  <PastelButton
                    type="button"
                    theme="rose"
                    icon={<Heart className="h-4 w-4 fill-obsidian-950" />}
                  >
                    Criar nova Cápsula
                  </PastelButton>
                </Link>

                <Link href="/gift/demo-amor">
                  <PastelButton
                    type="button"
                    variant="glass"
                    icon={<Sparkles className="h-4 w-4 text-pastel-rose" />}
                  >
                    Explorar Cápsula de Exemplo
                  </PastelButton>
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* HOW IT WORKS (3 TENDER STEPS) */}
          <ScrollReveal direction="up" delayMs={100}>
            <GlassCard elevated>
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-sm font-handwriting text-pastel-mint tracking-wider">
                  Como nasce a surpresa
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white font-serif">
                  Do primeiro detalhe ao momento em que o lacre se rompe
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: '01',
                    title: 'Escreva com o coração',
                    desc: 'Escolha suas fotos mais marcantes, a canção de fundo, o céu daquele dia e a carta que você sempre quis entregar.',
                    icon: PenTool,
                    accent: 'text-pastel-rose border-pastel-rose/30 bg-pastel-rose/10',
                  },
                  {
                    step: '02',
                    title: 'Sele o envelope',
                    desc: 'Seu presente ganha um endereço secreto e um QR Code delicado, prontos para enviar por mensagem ou imprimir.',
                    icon: Mail,
                    accent:
                      'text-pastel-lavender border-pastel-lavender/30 bg-pastel-lavender/10',
                  },
                  {
                    step: '03',
                    title: 'O toque mágico do lacre',
                    desc: 'Ao receber, seu amor toca no lacre com as iniciais de vocês. A música começa a tocar suavemente e as memórias se desdobram.',
                    icon: Heart,
                    accent: 'text-pastel-mint border-pastel-mint/30 bg-pastel-mint/10',
                  },
                ].map((item) => {
                  const StepIcon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${item.accent}`}
                          >
                            <StepIcon className="h-5 w-5" />
                          </span>
                          <span className="font-handwriting text-xl text-slate-400">
                            Capítulo {item.step}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white font-serif">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-300 leading-relaxed font-sans">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </ScrollReveal>

          {/* INTERACTIVE MODULES GRID */}
          <ScrollReveal direction="up" delayMs={140}>
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <span className="text-sm font-handwriting text-pastel-rose tracking-wider">
                  Cada detalhe pensado com carinho
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white font-serif">
                  Tudo o que torna esta surpresa inesquecível
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURE_CARDS.map((feat) => {
                  const FeatIcon = feat.icon;
                  return (
                    <GlassCard key={feat.title} className="flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${feat.color}`}
                          >
                            <FeatIcon className="h-5 w-5" />
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${feat.color}`}
                          >
                            {feat.badge}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white font-serif">{feat.title}</h3>
                        <p className="mt-2 text-sm text-slate-300 leading-relaxed font-sans">
                          {feat.desc}
                        </p>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* RECENTLY CREATED GIFTS ON THIS DEVICE */}
          {recentGifts.length > 0 && (
            <ScrollReveal direction="up" delayMs={160}>
              <GlassCard elevated>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div>
                    <span className="text-sm font-handwriting text-pastel-mint">
                      Guardadas na sua conta
                    </span>
                    <h2 className="mt-1 text-xl font-bold text-white font-serif">
                      Suas Cápsulas Recentes
                    </h2>
                  </div>
                  <Link href="/editor">
                    <PastelButton type="button" variant="glass">
                      Criar nova Cápsula
                    </PastelButton>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentGifts.map((g) => (
                    <Link
                      key={g.id}
                      href={`/gift/${encodeURIComponent(g.id)}`}
                      className="glass-card rounded-2xl p-4 border border-white/10 hover:border-pastel-rose/40 flex items-center justify-between gap-3 group"
                    >
                      <div className="truncate">
                        <div className="text-xs font-semibold text-pastel-rose font-handwriting text-base">
                          {g.senderName} para {g.recipientName}
                        </div>
                        <div className="text-sm font-bold text-white truncate font-serif">
                          {g.relationshipTitle}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Selo: {g.id}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-pastel-rose group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </GlassCard>
            </ScrollReveal>
          )}
        </main>
      </div>
    </>
  );
}
