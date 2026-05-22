// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
          <div className="max-w-xl w-full bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
            {/* Background glowing circle decorator */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-6 border border-rose-200/50 dark:border-rose-800/30">
                <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 animate-pulse" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
                Something went wrong
              </h1>
              
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                An unexpected runtime error has occurred. We've logged this issue, and you can try refreshing the page.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8 p-4 rounded-2xl bg-slate-900/5 dark:bg-black/40 border border-slate-200/30 dark:border-slate-800/50 text-left overflow-auto max-h-48 text-xs font-mono text-rose-600 dark:text-rose-400">
                  <div className="font-bold mb-1 border-b border-rose-500/20 pb-1">Error Trace:</div>
                  <pre className="whitespace-pre-wrap">{this.state.error.stack || this.state.error.message}</pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={this.handleReload}
                  className="w-full sm:w-auto min-h-12 py-3 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="w-full sm:w-auto min-h-12 py-3 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 border border-slate-200/50 dark:border-slate-700/50"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
