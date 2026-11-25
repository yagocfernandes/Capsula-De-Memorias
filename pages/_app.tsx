import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';
import { AuthProvider } from '@/utils/AuthContext';
import { GlobalFooter } from '@/components/ui/GlobalFooter';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function CapsulaDeMemoriasApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        {/* Primary Meta Tags */}
        <title>Cápsula de Memórias | Guarde sua história</title>
        <meta
          name="description"
          content="Crie presentes digitais inesquecíveis e guarde os melhores momentos da sua história de amor."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph / Facebook & WhatsApp Preview */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cápsula de Memórias" />
        <meta property="og:title" content="Cápsula de Memórias | Guarde sua história" />
        <meta
          property="og:description"
          content="Crie presentes digitais inesquecíveis e guarde os melhores momentos da sua história de amor."
        />
        <meta
          property="og:image"
          content="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80"
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cápsula de Memórias | Guarde sua história" />
        <meta
          name="twitter:description"
          content="Crie presentes digitais inesquecíveis e guarde os melhores momentos da sua história de amor."
        />
        <meta
          name="twitter:image"
          content="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80"
        />

        <meta name="theme-color" content="#07070c" />
      </Head>

      <div className="dark min-h-screen flex flex-col bg-obsidian-950 text-slate-100 antialiased selection:bg-pastel-rose/30 selection:text-pastel-rose">
        <div className="flex-grow flex flex-col">
          <ErrorBoundary>
            <Component {...pageProps} />
          </ErrorBoundary>
        </div>
        <GlobalFooter />
      </div>
    </AuthProvider>
  );
}
