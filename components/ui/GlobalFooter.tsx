import React from 'react';

/**
 * Minimalist dark-mode / glassmorphism global footer displayed across all pages
 * (Home, Login, Dashboard, Editor, and Gift Surprise Page).
 */
export const GlobalFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-obsidian-950/80 backdrop-blur-md py-6 px-4 text-center z-30">
      <p className="text-xs text-slate-400 tracking-wide">
        © 2026 Todos os direitos reservados a{' '}
        <span className="font-semibold text-slate-300">Yago Leonardo</span> | GitHub:{' '}
        <a
          href="https://github.com/HighestCoder"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono font-medium text-pastel-lavender hover:underline"
        >
          HighestCoder
        </a>
      </p>
    </footer>
  );
};
