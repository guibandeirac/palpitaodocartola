import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AdminRodadas } from "@/components/admin/AdminRodadas";
import { AdminConfrontos } from "@/components/admin/AdminConfrontos";
import { AdminConfrontosLista } from "@/components/admin/AdminConfrontosLista";
import { AdminPontuacoes } from "@/components/admin/AdminPontuacoes";
import { AdminJogadores } from "@/components/admin/AdminJogadores";
import { AdminCopaRodadas } from "@/components/admin/AdminCopaRodadas";
import { AdminCopaPontuacoes } from "@/components/admin/AdminCopaPontuacoes";
import { AdminCopaClassificacao } from "@/components/admin/AdminCopaClassificacao";
import { AdminCopaGerenciar } from "@/components/admin/AdminCopaGerenciar";
import { AdminCopaPlayoffs } from "@/components/admin/AdminCopaPlayoffs";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ArrowLeft, Calendar, Swords, RefreshCw, Users, LogOut, Calculator, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Serie } from "@/lib/classificacao";

type AuthState = "loading" | "unauthenticated" | "authenticated";
type Competicao = "serie-a" | "serie-b" | "copa";

const COMPETICAO_CONFIG: Record<
  Competicao,
  { label: string; emoji: string; activeClass: string; iconColor: string }
> = {
  "serie-a": {
    label: "Série A",
    emoji: "📺",
    activeClass: "bg-orange-600 hover:bg-orange-700",
    iconColor: "text-orange-400",
  },
  "serie-b": {
    label: "Série B",
    emoji: "🏆",
    activeClass: "",
    iconColor: "text-primary",
  },
  copa: {
    label: "Copa",
    emoji: "🏅",
    activeClass: "bg-blue-600 hover:bg-blue-700",
    iconColor: "text-blue-400",
  },
};

function SerieTabs({ serie }: { serie: Serie }) {
  return (
    <Tabs defaultValue="rodadas" className="space-y-6">
      <TabsList className="bg-secondary">
        <TabsTrigger value="rodadas" className="gap-2">
          <Calendar className="h-4 w-4" />
          Rodadas
        </TabsTrigger>
        <TabsTrigger value="confrontos" className="gap-2">
          <Swords className="h-4 w-4" />
          Confrontos
        </TabsTrigger>
        <TabsTrigger value="jogadores" className="gap-2">
          <Users className="h-4 w-4" />
          Jogadores
        </TabsTrigger>
        <TabsTrigger value="pontuacoes" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Pontuações
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rodadas">
        <AdminRodadas serie={serie} />
      </TabsContent>
      <TabsContent value="confrontos" className="space-y-6">
        <AdminConfrontos serie={serie} />
        <AdminConfrontosLista serie={serie} />
      </TabsContent>
      <TabsContent value="jogadores">
        <AdminJogadores serie={serie} />
      </TabsContent>
      <TabsContent value="pontuacoes">
        <AdminPontuacoes serie={serie} />
      </TabsContent>
    </Tabs>
  );
}

function CopaTabs() {
  return (
    <Tabs defaultValue="rodadas" className="space-y-6">
      <TabsList className="bg-secondary">
        <TabsTrigger value="rodadas" className="gap-2">
          <Calendar className="h-4 w-4" />
          Rodadas
        </TabsTrigger>
        <TabsTrigger value="confrontos" className="gap-2">
          <Swords className="h-4 w-4" />
          Confrontos
        </TabsTrigger>
        <TabsTrigger value="pontuacoes" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Pontuações
        </TabsTrigger>
        <TabsTrigger value="classificacao" className="gap-2">
          <Calculator className="h-4 w-4" />
          Classificação
        </TabsTrigger>
        <TabsTrigger value="playoffs" className="gap-2">
          <Trophy className="h-4 w-4" />
          Playoffs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rodadas">
        <AdminCopaRodadas />
      </TabsContent>
      <TabsContent value="confrontos">
        <AdminCopaGerenciar />
      </TabsContent>
      <TabsContent value="pontuacoes">
        <AdminCopaPontuacoes />
      </TabsContent>
      <TabsContent value="classificacao">
        <AdminCopaClassificacao />
      </TabsContent>
      <TabsContent value="playoffs">
        <AdminCopaPlayoffs />
      </TabsContent>
    </Tabs>
  );
}

const Admin = () => {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [competicao, setCompeticao] = useState<Competicao>("serie-b");
  const verifiedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let settled = false;

    const checkAdminRole = async (userId: string): Promise<boolean> => {
      if (verifiedUserIdRef.current === userId) return true;
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (error) {
          console.warn("[Admin] checkAdminRole error:", error);
          return false;
        }
        const ok = !!data;
        if (ok) verifiedUserIdRef.current = userId;
        return ok;
      } catch (err) {
        console.warn("[Admin] checkAdminRole threw:", err);
        return false;
      }
    };

    const applySession = async (userId: string | undefined) => {
      if (!mounted) return;
      if (!userId) {
        verifiedUserIdRef.current = null;
        setAuthState("unauthenticated");
        settled = true;
        return;
      }
      const isAdmin = await checkAdminRole(userId);
      if (!mounted) return;
      if (isAdmin) {
        setAuthState("authenticated");
      } else {
        verifiedUserIdRef.current = null;
        await supabase.auth.signOut().catch(() => {});
        if (!mounted) return;
        setAuthState("unauthenticated");
      }
      settled = true;
    };

    // Safety net: nunca deixar travado em "loading"
    const loadingTimeout = setTimeout(() => {
      if (mounted && !settled) {
        console.warn("[Admin] getSession demorou demais; indo pra login.");
        setAuthState("unauthenticated");
      }
    }, 10000);

    // Carga inicial via getSession (o onAuthStateChange cobre o restante)
    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session?.user?.id))
      .catch((err) => {
        console.warn("[Admin] getSession erro:", err);
        if (mounted) setAuthState("unauthenticated");
      });

    // IMPORTANT: callback síncrono pra evitar deadlock com TOKEN_REFRESHED
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // Só reagir a mudanças reais de login/logout; TOKEN_REFRESHED e USER_UPDATED não exigem rechecar role
      if (event === "SIGNED_IN") {
        setTimeout(() => applySession(session?.user?.id), 0);
      } else if (event === "SIGNED_OUT") {
        verifiedUserIdRef.current = null;
        setAuthState("unauthenticated");
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <AdminLogin onLogin={() => setAuthState("authenticated")} />;
  }

  const config = COMPETICAO_CONFIG[competicao];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className={`h-6 w-6 ${config.iconColor}`} />
              <h1 className="text-xl font-bold">
                Admin · <span className={config.iconColor}>{config.label}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Competition selector */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {(Object.keys(COMPETICAO_CONFIG) as Competicao[]).map((c) => {
            const isActive = competicao === c;
            const cfg = COMPETICAO_CONFIG[c];
            return (
              <Button
                key={c}
                variant={isActive ? "default" : "outline"}
                onClick={() => setCompeticao(c)}
                className={isActive ? cfg.activeClass : ""}
              >
                {cfg.emoji} {cfg.label}
              </Button>
            );
          })}
        </div>
      </div>

      <main className="container mx-auto px-4 pb-8">
        {competicao === "serie-a" && <SerieTabs serie="A" />}
        {competicao === "serie-b" && <SerieTabs serie="B" />}
        {competicao === "copa" && <CopaTabs />}
      </main>
    </div>
  );
};

export default Admin;
