import { Link } from 'react-router-dom';
import { Home, RefreshCw, ServerCrash } from 'lucide-react';

const ServerError = () => (
  <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
    <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
      <ServerCrash className="mx-auto h-12 w-12 text-rose-400" />
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-primary">OptizGYM</p>
      <h1 className="mt-3 text-2xl font-bold">Service temporarily unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">The request could not be completed. Please try again in a moment.</p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent">
          <Home className="h-4 w-4" /> Go home
        </Link>
      </div>
    </section>
  </main>
);

export default ServerError;
