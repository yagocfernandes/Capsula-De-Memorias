import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Heart,
  Sparkles,
  Compass,
  FolderHeart,
  LogIn,
  LogOut,
  PenTool,
} from 'lucide-react';
import { useAuth } from '@/utils/AuthContext';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-obsidian-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pastel-rose via-pastel-lavender to-pastel-mint text-obsidian-950 shadow-lg transition-transform group-hover:scale-105">
            <Heart className="h-5 w-5 fill-obsidian-950 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-white font-serif">
              Cápsula de <span className="pastel-gradient-text">Memórias</span>
            </span>
            <span className="ml-2 hidden md:inline-block rounded-full bg-pastel-rose/15 border border-pastel-rose/30 px-2.5 py-0.5 text-xs font-semibold text-pastel-rose font-handwriting">
              Guarde sua história
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/gift/demo-amor"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 transition-colors"
          >
            <Compass className="h-4 w-4 text-pastel-lavender" />
            <span className="hidden sm:inline">Inspiração</span>
          </Link>

          {currentUser ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-xs sm:text-sm font-medium text-pastel-sky transition-colors"
              >
                <FolderHeart className="h-4 w-4" />
                <span>Minhas Cápsulas</span>
              </Link>

              <Link
                href="/editor"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pastel-rose via-pastel-lavender to-pastel-mint px-3.5 py-2 text-xs sm:text-sm font-bold text-obsidian-950 shadow-md hover:brightness-110 transition-all"
              >
                <PenTool className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Cápsula</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title={`Sair (${currentUser.email || currentUser.displayName || 'Usuário'})`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-pastel-rose/20 border border-white/10 hover:border-pastel-rose/40 px-3 py-2 text-xs font-medium text-slate-300 hover:text-pastel-rose transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Sair</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-200 transition-colors"
              >
                <LogIn className="h-4 w-4 text-pastel-rose" />
                <span>Entrar</span>
              </Link>

              <Link
                href="/editor"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pastel-rose via-pastel-lavender to-pastel-mint px-3.5 py-2 text-xs sm:text-sm font-bold text-obsidian-950 shadow-md hover:brightness-110 transition-all"
              >
                <PenTool className="h-4 w-4" />
                <span>Criar nova Cápsula</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
