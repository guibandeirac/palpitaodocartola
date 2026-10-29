import { Link } from "react-router-dom";

export function Header() {

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center">
          {/* Center title */}
          <Link to="/serie-b" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logos/champions.jpg" alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-black object-cover" />
            <h1 className="text-lg sm:text-3xl font-bold tracking-tight text-foreground">
              Champions Série B
            </h1>
          </Link>
        </div>
      </div>
    </header>
  );
}
