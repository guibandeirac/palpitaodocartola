export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      classificacao: {
        Row: {
          derrotas: number | null
          empates: number | null
          equipe_id: string | null
          gc: number | null
          gf: number | null
          id: string
          pontos: number | null
          saldo_confrontos: number | null
          updated_at: string | null
          vitorias: number | null
        }
        Insert: {
          derrotas?: number | null
          empates?: number | null
          equipe_id?: string | null
          gc?: number | null
          gf?: number | null
          id?: string
          pontos?: number | null
          saldo_confrontos?: number | null
          updated_at?: string | null
          vitorias?: number | null
        }
        Update: {
          derrotas?: number | null
          empates?: number | null
          equipe_id?: string | null
          gc?: number | null
          gf?: number | null
          id?: string
          pontos?: number | null
          saldo_confrontos?: number | null
          updated_at?: string | null
          vitorias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classificacao_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: true
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      competicoes: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      confrontos_equipe: {
        Row: {
          created_at: string | null
          equipe1_id: string | null
          equipe2_id: string | null
          id: string
          resultado: string | null
          rodada_id: string | null
          vitorias_equipe1: number | null
          vitorias_equipe2: number | null
        }
        Insert: {
          created_at?: string | null
          equipe1_id?: string | null
          equipe2_id?: string | null
          id?: string
          resultado?: string | null
          rodada_id?: string | null
          vitorias_equipe1?: number | null
          vitorias_equipe2?: number | null
        }
        Update: {
          created_at?: string | null
          equipe1_id?: string | null
          equipe2_id?: string | null
          id?: string
          resultado?: string | null
          rodada_id?: string | null
          vitorias_equipe1?: number | null
          vitorias_equipe2?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "confrontos_equipe_equipe1_id_fkey"
            columns: ["equipe1_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confrontos_equipe_equipe2_id_fkey"
            columns: ["equipe2_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confrontos_equipe_rodada_id_fkey"
            columns: ["rodada_id"]
            isOneToOne: false
            referencedRelation: "rodadas"
            referencedColumns: ["id"]
          },
        ]
      }
      confrontos_individuais: {
        Row: {
          confronto_equipe_id: string | null
          created_at: string | null
          id: string
          jogador1_efetivo_id: string | null
          jogador1_original_id: string | null
          jogador2_efetivo_id: string | null
          jogador2_original_id: string | null
          ordem: number
          pontuacao_jogador1: number | null
          pontuacao_jogador2: number | null
          vencedor: string | null
        }
        Insert: {
          confronto_equipe_id?: string | null
          created_at?: string | null
          id?: string
          jogador1_efetivo_id?: string | null
          jogador1_original_id?: string | null
          jogador2_efetivo_id?: string | null
          jogador2_original_id?: string | null
          ordem: number
          pontuacao_jogador1?: number | null
          pontuacao_jogador2?: number | null
          vencedor?: string | null
        }
        Update: {
          confronto_equipe_id?: string | null
          created_at?: string | null
          id?: string
          jogador1_efetivo_id?: string | null
          jogador1_original_id?: string | null
          jogador2_efetivo_id?: string | null
          jogador2_original_id?: string | null
          ordem?: number
          pontuacao_jogador1?: number | null
          pontuacao_jogador2?: number | null
          vencedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confrontos_individuais_confronto_equipe_id_fkey"
            columns: ["confronto_equipe_id"]
            isOneToOne: false
            referencedRelation: "confrontos_equipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confrontos_individuais_jogador1_efetivo_id_fkey"
            columns: ["jogador1_efetivo_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confrontos_individuais_jogador1_original_id_fkey"
            columns: ["jogador1_original_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confrontos_individuais_jogador2_efetivo_id_fkey"
            columns: ["jogador2_efetivo_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confrontos_individuais_jogador2_original_id_fkey"
            columns: ["jogador2_original_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
        ]
      }
      copa_classificacao: {
        Row: {
          aproveitamento: number | null
          created_at: string | null
          derrotas: number | null
          empates: number | null
          equipe_id: string | null
          id: string
          jogos: number | null
          pontos: number | null
          pontos_contra: number | null
          pontos_pro: number | null
          saldo_pontos: number | null
          updated_at: string | null
          vitorias: number | null
        }
        Insert: {
          aproveitamento?: number | null
          created_at?: string | null
          derrotas?: number | null
          empates?: number | null
          equipe_id?: string | null
          id?: string
          jogos?: number | null
          pontos?: number | null
          pontos_contra?: number | null
          pontos_pro?: number | null
          saldo_pontos?: number | null
          updated_at?: string | null
          vitorias?: number | null
        }
        Update: {
          aproveitamento?: number | null
          created_at?: string | null
          derrotas?: number | null
          empates?: number | null
          equipe_id?: string | null
          id?: string
          jogos?: number | null
          pontos?: number | null
          pontos_contra?: number | null
          pontos_pro?: number | null
          saldo_pontos?: number | null
          updated_at?: string | null
          vitorias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "copa_classificacao_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      copa_confrontos: {
        Row: {
          created_at: string | null
          equipe1_id: string | null
          equipe2_id: string | null
          id: string
          pontuacao_equipe1: number | null
          pontuacao_equipe2: number | null
          resultado: string | null
          rodada_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipe1_id?: string | null
          equipe2_id?: string | null
          id?: string
          pontuacao_equipe1?: number | null
          pontuacao_equipe2?: number | null
          resultado?: string | null
          rodada_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipe1_id?: string | null
          equipe2_id?: string | null
          id?: string
          pontuacao_equipe1?: number | null
          pontuacao_equipe2?: number | null
          resultado?: string | null
          rodada_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copa_confrontos_equipe1_id_fkey"
            columns: ["equipe1_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copa_confrontos_equipe2_id_fkey"
            columns: ["equipe2_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copa_confrontos_rodada_id_fkey"
            columns: ["rodada_id"]
            isOneToOne: false
            referencedRelation: "copa_rodadas"
            referencedColumns: ["id"]
          },
        ]
      }
      copa_playoffs: {
        Row: {
          chave: string | null
          created_at: string | null
          equipe1_id: string | null
          equipe2_id: string | null
          fase: string
          id: string
          pontuacao_equipe1_ida: number | null
          pontuacao_equipe1_total: number | null
          pontuacao_equipe1_volta: number | null
          pontuacao_equipe2_ida: number | null
          pontuacao_equipe2_total: number | null
          pontuacao_equipe2_volta: number | null
          rodada_ida_id: string | null
          rodada_volta_id: string | null
          updated_at: string | null
          vencedor_id: string | null
        }
        Insert: {
          chave?: string | null
          created_at?: string | null
          equipe1_id?: string | null
          equipe2_id?: string | null
          fase: string
          id?: string
          pontuacao_equipe1_ida?: number | null
          pontuacao_equipe1_total?: number | null
          pontuacao_equipe1_volta?: number | null
          pontuacao_equipe2_ida?: number | null
          pontuacao_equipe2_total?: number | null
          pontuacao_equipe2_volta?: number | null
          rodada_ida_id?: string | null
          rodada_volta_id?: string | null
          updated_at?: string | null
          vencedor_id?: string | null
        }
        Update: {
          chave?: string | null
          created_at?: string | null
          equipe1_id?: string | null
          equipe2_id?: string | null
          fase?: string
          id?: string
          pontuacao_equipe1_ida?: number | null
          pontuacao_equipe1_total?: number | null
          pontuacao_equipe1_volta?: number | null
          pontuacao_equipe2_ida?: number | null
          pontuacao_equipe2_total?: number | null
          pontuacao_equipe2_volta?: number | null
          rodada_ida_id?: string | null
          rodada_volta_id?: string | null
          updated_at?: string | null
          vencedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copa_playoffs_equipe1_id_fkey"
            columns: ["equipe1_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copa_playoffs_equipe2_id_fkey"
            columns: ["equipe2_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copa_playoffs_rodada_ida_id_fkey"
            columns: ["rodada_ida_id"]
            isOneToOne: false
            referencedRelation: "copa_rodadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copa_playoffs_rodada_volta_id_fkey"
            columns: ["rodada_volta_id"]
            isOneToOne: false
            referencedRelation: "copa_rodadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copa_playoffs_vencedor_id_fkey"
            columns: ["vencedor_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      copa_pontuacoes: {
        Row: {
          created_at: string | null
          equipe_id: string | null
          escalou: boolean | null
          id: string
          jogador_id: string | null
          pontuacao: number | null
          rodada_id: string | null
        }
        Insert: {
          created_at?: string | null
          equipe_id?: string | null
          escalou?: boolean | null
          id?: string
          jogador_id?: string | null
          pontuacao?: number | null
          rodada_id?: string | null
        }
        Update: {
          created_at?: string | null
          equipe_id?: string | null
          escalou?: boolean | null
          id?: string
          jogador_id?: string | null
          pontuacao?: number | null
          rodada_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copa_pontuacoes_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copa_pontuacoes_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copa_pontuacoes_rodada_id_fkey"
            columns: ["rodada_id"]
            isOneToOne: false
            referencedRelation: "copa_rodadas"
            referencedColumns: ["id"]
          },
        ]
      }
      copa_rodadas: {
        Row: {
          created_at: string | null
          fase: string
          fase_detalhe: string | null
          id: string
          numero: number
          rodada_cartola: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fase?: string
          fase_detalhe?: string | null
          id?: string
          numero: number
          rodada_cartola: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fase?: string
          fase_detalhe?: string | null
          id?: string
          numero?: number
          rodada_cartola?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipes: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          nome: string
          serie: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          serie?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          serie?: string
        }
        Relationships: []
      }
      jogadores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          eh_coringa: boolean | null
          equipe_id: string | null
          id: string
          id_cartola: number
          nome: string
          rodada_entrada: number | null
          rodada_saida: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          eh_coringa?: boolean | null
          equipe_id?: string | null
          id?: string
          id_cartola: number
          nome: string
          rodada_entrada?: number | null
          rodada_saida?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          eh_coringa?: boolean | null
          equipe_id?: string | null
          id?: string
          id_cartola?: number
          nome?: string
          rodada_entrada?: number | null
          rodada_saida?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jogadores_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      rodadas: {
        Row: {
          created_at: string | null
          id: string
          numero: number
          rodada_cartola: number | null
          status: string | null
          status_a: string
          status_b: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          numero: number
          rodada_cartola?: number | null
          status?: string | null
          status_a?: string
          status_b?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          numero?: number
          rodada_cartola?: number | null
          status?: string | null
          status_a?: string
          status_b?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
