import React from 'react';
import { Link } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  requestId?: string;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true, requestId: crypto.randomUUID?.().slice(0, 8) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const requestId = this.state.requestId;
    console.error('[UI] Unhandled render error', {
      requestId,
      name: error.name,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
        <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">OptizGYM</p>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We could not load this page. Please try again or return to your dashboard.
          </p>
          {this.state.requestId && (
            <p className="mt-3 text-xs text-muted-foreground">Reference: {this.state.requestId}</p>
          )}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              <Home className="h-4 w-4" /> Go home
            </Link>
          </div>
        </section>
      </main>
    );
  }
}
