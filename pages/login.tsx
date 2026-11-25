import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Gift,
  Heart,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
  LogIn,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { GlassCard, PastelButton } from '@/components/ui/GlassPrimitives';
import { useAuth } from '@/utils/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const {
    currentUser,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getRedirectTarget = (): string => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('redirect');
      if (next && next.startsWith('/')) return next;
    }
    if (typeof router.query.redirect === 'string' && router.query.redirect.startsWith('/')) {
      return router.query.redirect;
    }
    return '/dashboard';
  };

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace(getRedirectTarget());
    }
  }, [loading, currentUser, router]);

  const formatFirebaseError = (code?: string, fallback?: string): string => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'E-mail ou senha incorretos. Verifique seus dados ou crie uma conta.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado. Tente entrar na aba "Entrar".';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/popup-closed-by-user':
        return 'A janela de login com Google foi fechada antes de concluir.';
      case 'auth/operation-not-allowed':
        return 'Este método de login ainda não foi ativado no Console do Firebase (Authentication > Sign-in method).';
      default:
        return fallback || 'Não foi possível autenticar. Verifique seus dados.';
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(name, email.trim(), password);
      }
      router.replace(getRedirectTarget());
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err?.code, err?.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace(getRedirectTarget());
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err?.code, err?.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Entrar | Cápsula de Memórias</title>
        <meta
          name="description"
          content="Acesse seu cantinho na Cápsula de Memórias para criar, selar e guardar suas histórias de amor."
        />
        <meta property="og:site_name" content="Cápsula de Memórias" />
        <meta property="og:title" content="Entrar | Cápsula de Memórias" />
      </Head>

      <div className="flex-grow bg-obsidian-950 text-slate-100 pb-16 relative overflow-hidden">
        <Navbar />

        {/* Ambient Pastel Lighting */}
        <div className="pointer-events-none fixed top-20 -left-24 h-96 w-96 rounded-full bg-pastel-rose/15 blur-[130px]" />
        <div className="pointer-events-none fixed bottom-10 -right-24 h-96 w-96 rounded-full bg-pastel-lavender/15 blur-[130px]" />

        <main className="mx-auto max-w-md px-4 sm:px-6 pt-12">
          <GlassCard elevated className="border-white/15">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pastel-rose via-pastel-lavender to-pastel-mint text-obsidian-950 shadow-lg">
                <Heart className="h-7 w-7 stroke-[2.2] fill-obsidian-950" />
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-rose/15 border border-pastel-rose/30 px-3.5 py-1 text-xs font-semibold text-pastel-rose font-handwriting text-base">
                <Sparkles className="h-3.5 w-3.5" />
                Cápsula de Memórias • Guarde sua história
              </span>

              <h1 className="mt-3 text-2xl font-extrabold text-white font-serif">
                {mode === 'login'
                  ? 'Que bom ter você de volta'
                  : 'Crie seu cantinho de memórias'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 font-sans">
                Acesse sua conta para guardar suas cartas, editar surpresas já seladas e revisitar seus momentos mais queridos.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-obsidian-950/90 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-pastel-rose text-obsidian-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-pastel-lavender text-obsidian-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-pastel-rose/40 bg-pastel-rose/15 p-3.5 text-xs text-pastel-rose">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google Popup Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full glass-card flex items-center justify-center gap-3 rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-bold text-white hover:border-pastel-lavender/50 transition-all active:scale-95 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#FDA4AF"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.25 5 12c0-3.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              <span>Continuar com Google</span>
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                ou com e-mail
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Seu Nome
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Yago"
                      className="glass-input w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="glass-input w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="glass-input w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                  />
                </div>
              </div>

              <PastelButton
                type="submit"
                theme={mode === 'login' ? 'rose' : 'lavender'}
                disabled={submitting}
                icon={
                  mode === 'login' ? (
                    <LogIn className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )
                }
                className="w-full mt-2"
              >
                {submitting
                  ? 'Autenticando...'
                  : mode === 'login'
                  ? 'Entrar na Minha Conta'
                  : 'Criar Conta Gratuita'}
              </PastelButton>
            </form>
          </GlassCard>
        </main>
      </div>
    </>
  );
}
