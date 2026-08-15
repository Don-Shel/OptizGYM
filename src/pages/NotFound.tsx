import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Dumbbell } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
        <Dumbbell className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-6xl font-extrabold text-foreground">404</h1>
      <p className="text-lg text-muted-foreground">This page doesn't exist.</p>
      <Link to="/" className="mt-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
