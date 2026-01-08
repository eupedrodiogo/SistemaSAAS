import React from 'react'

type Props = { children: React.ReactNode, fallback?: React.ReactNode }
type State = { hasError: boolean; error?: Error }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  constructor(props: Props) {
    super(props)
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Falha ao inicializar o aplicativo</h2>
          <div className="bg-slate-800 p-4 rounded-lg max-w-2xl w-full overflow-auto">
            <p className="font-mono text-sm text-red-300 mb-2">{this.state.error?.toString()}</p>
            <pre className="font-mono text-xs text-slate-400 whitespace-pre-wrap">{this.state.error?.stack}</pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-bold"
          >
            Recarregar Página
          </button>
        </div>
      );
    }
    return this.props.children
  }
}

