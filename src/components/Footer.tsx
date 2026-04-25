

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/30 border-t border-border mt-12">
      <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Palpitão 2026</span>
          <span>Feito com 💚 por Gui Bandeira</span>
          <span className="text-xs text-muted-foreground/70">© 2026 - Todos os direitos reservados</span>
        </div>
      </div>
    </footer>
  );
}
