import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home, Sparkles, Heart } from 'lucide-react';
import { GlassCard, PastelButton } from './GlassPrimitives';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global & Component-level ErrorBoundary.
 * Catches any uncaught runtime errors in child components, preventing the
 * "White Screen of Death" and presenting a graceful dark-glassmorphism recovery screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled runtime error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV !== 'production';

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
          <GlassCard elevated className="max-w-md w-full p-8 border-pastel-rose/40 shadow-2xl space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pastel-rose/15 border border-pastel-rose/30 text-pastel-rose">
              <Heart className="h-8 w-8 fill-pastel-rose/20" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-rose/15 border border-pastel-rose/30 px-3 py-1 text-xs font-semibold text-pastel-rose font-handwriting text-base">
                <Sparkles className="h-3.5 w-3.5" />
                Cuidado com as memórias
              </span>
              <h2 className="mt-3 text-xl sm:text-2xl font-extrabold text-white font-serif">
                {this.props.fallbackTitle || 'Ops, essa cartinha tropeçou no caminho'}
              </h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed font-sans">
                {this.props.fallbackMessage ||
                  'Tivemos um pequeno instante de silêncio ao desdobrar esta tela. Recarregue a página para continuar revivendo essas memórias.'}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <PastelButton
                type="button"
                theme="rose"
                onClick={this.handleReset}
                icon={<RotateCcw className="h-4 w-4" />}
              >
                Recarregar
              </PastelButton>

              <Link href="/editor">
                <PastelButton
                  type="button"
                  theme="lavender"
                  icon={<Home className="h-4 w-4" />}
                >
                  Voltar ao Início
                </PastelButton>
              </Link>
            </div>

            {/* Technical diagnostic details (hidden or collapsed) */}
            {this.state.error && (
              <details className="mt-4 text-left border-t border-white/10 pt-4">
                <summary className="text-xs font-mono text-slate-400 cursor-pointer hover:text-slate-200">
                  Ver detalhes técnicos do erro
                </summary>
                <div className="mt-2 max-h-40 overflow-auto rounded-xl bg-obsidian-950/80 p-3 text-[11px] font-mono text-pastel-rose/90 whitespace-pre-wrap border border-white/10">
                  {this.state.error.toString()}
                  {isDev && this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
