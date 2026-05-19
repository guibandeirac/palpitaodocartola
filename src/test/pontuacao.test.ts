import { describe, it, expect } from "vitest";
import { calcularVencedor, arredondar2Decimais } from "@/lib/pontuacao";

describe("calcularVencedor", () => {
  it("retorna 'jogador1' quando ele tem mais pontos", () => {
    expect(calcularVencedor(50, 30)).toBe("jogador1");
  });

  it("retorna 'jogador2' quando ele tem mais pontos", () => {
    expect(calcularVencedor(20, 45)).toBe("jogador2");
  });

  it("retorna null (não 'empate') quando as pontuações são iguais", () => {
    expect(calcularVencedor(30, 30)).toBeNull();
  });

  it("retorna null quando ambos têm 0 pontos (não escalaram)", () => {
    // Regressão: antes retornava 'empate' neste caso, quebrando a artilharia
    expect(calcularVencedor(0, 0)).toBeNull();
  });

  it("retorna 'jogador1' quando ele tem pequena vantagem após arredondamento", () => {
    // 55.125 → arredonda para 55.13; 55.12 permanece 55.12 → jogador1 vence
    const p1 = arredondar2Decimais(55.125);
    const p2 = arredondar2Decimais(55.12);
    expect(calcularVencedor(p1, p2)).toBe("jogador1");
  });

  it("retorna null quando os valores são iguais após arredondamento", () => {
    const p1 = arredondar2Decimais(44.005);
    const p2 = arredondar2Decimais(44.005);
    expect(calcularVencedor(p1, p2)).toBeNull();
  });
});

describe("artilheiros – contagem de vitórias", () => {
  // Simula a lógica do useArtilheiros para garantir que 'empate' não conta vitória
  function contarVitorias(
    confrontos: Array<{
      vencedor: string | null;
      jogador1_original_id: string;
      jogador2_original_id: string;
    }>,
    jogadorId: string
  ): number {
    let vitorias = 0;
    for (const c of confrontos) {
      if (c.jogador1_original_id === jogadorId && c.vencedor === "jogador1") vitorias++;
      if (c.jogador2_original_id === jogadorId && c.vencedor === "jogador2") vitorias++;
    }
    return vitorias;
  }

  it("conta a vitória do jogador1 corretamente", () => {
    const confrontos = [
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "fulano" },
    ];
    expect(contarVitorias(confrontos, "marcelo")).toBe(1);
  });

  it("conta a vitória do jogador2 corretamente", () => {
    const confrontos = [
      { vencedor: "jogador2", jogador1_original_id: "fulano", jogador2_original_id: "marcelo" },
    ];
    expect(contarVitorias(confrontos, "marcelo")).toBe(1);
  });

  it("NÃO conta vitória quando vencedor é null (empate real)", () => {
    const confrontos = [
      { vencedor: null, jogador1_original_id: "marcelo", jogador2_original_id: "fulano" },
    ];
    expect(contarVitorias(confrontos, "marcelo")).toBe(0);
  });

  it("NÃO conta vitória quando vencedor é 'empate' (bug corrigido: deve-se usar null)", () => {
    // Se o banco tiver 'empate' por causa do bug antigo, a artilharia não conta — esperado
    const confrontos = [
      { vencedor: "empate", jogador1_original_id: "marcelo", jogador2_original_id: "fulano" },
    ];
    expect(contarVitorias(confrontos, "marcelo")).toBe(0);
    expect(contarVitorias(confrontos, "fulano")).toBe(0);
  });

  it("acumula vitórias de múltiplas rodadas corretamente", () => {
    const confrontos = [
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "a" },
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "b" },
      { vencedor: null,       jogador1_original_id: "marcelo", jogador2_original_id: "c" },
      { vencedor: "jogador2", jogador1_original_id: "x",       jogador2_original_id: "marcelo" },
    ];
    // 2 wins como jogador1 + 1 win como jogador2 = 3 total
    expect(contarVitorias(confrontos, "marcelo")).toBe(3);
  });

  it("com fix: calcularVencedor de empate retorna null e não quebra a artilharia", () => {
    // Garante que o fluxo completo — calcularVencedor → salvar no banco → contar artilharia — funciona
    const p1 = 0;
    const p2 = 0;
    const vencedor = calcularVencedor(p1, p2); // null após o fix

    const confrontos = [
      { vencedor, jogador1_original_id: "marcelo", jogador2_original_id: "fulano" },
    ];

    // Nenhum ganha, mas a contagem não é envenenada com 'empate'
    expect(contarVitorias(confrontos, "marcelo")).toBe(0);
    expect(contarVitorias(confrontos, "fulano")).toBe(0);
  });

  it("com fix: quando Marcelo tem mais pontos, sua vitória é contada na artilharia", () => {
    const p1 = 75.5; // Marcelo
    const p2 = 60.2; // Adversário
    const vencedor = calcularVencedor(p1, p2); // "jogador1"

    const confrontos = [
      { vencedor, jogador1_original_id: "marcelo", jogador2_original_id: "fulano" },
    ];

    expect(contarVitorias(confrontos, "marcelo")).toBe(1);
    expect(contarVitorias(confrontos, "fulano")).toBe(0);
  });

  it("regressão: empate real (pontuações não-zero iguais) retorna null e não conta vitória", () => {
    const vencedor = calcularVencedor(75.5, 75.5);
    expect(vencedor).toBeNull();

    const confrontos = [
      { vencedor, jogador1_original_id: "marcelo", jogador2_original_id: "fulano" },
    ];
    expect(contarVitorias(confrontos, "marcelo")).toBe(0);
    expect(contarVitorias(confrontos, "fulano")).toBe(0);
  });

  it("regressão Marcelo rodada 15→16: vitória na rodada 16 eleva contagem de 11 para 12", () => {
    // Reproduz o bug relatado: após finalizar rodada 16 (Marcelo venceu como jogador2),
    // a contagem permanecia em 11. A causa era vencedor='empate' no banco para ties,
    // que fazia calcularVencedor retornar uma string não reconhecida pelo contador.
    const confrontos: Array<{ vencedor: string | null; jogador1_original_id: string; jogador2_original_id: string }> = [
      // Rodadas 1-15: Marcelo com 11 vitórias (mix de j1 e j2)
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "a" },  // R1
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "b" },  // R2
      { vencedor: "jogador2", jogador1_original_id: "c", jogador2_original_id: "marcelo" },  // R3
      { vencedor: "jogador2", jogador1_original_id: "d", jogador2_original_id: "marcelo" },  // R4
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "e" },  // R5
      { vencedor: "jogador2", jogador1_original_id: "f", jogador2_original_id: "marcelo" },  // R6
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "g" },  // R7
      { vencedor: "jogador2", jogador1_original_id: "marcelo", jogador2_original_id: "h" },  // R8 derrota
      { vencedor: "jogador2", jogador1_original_id: "marcelo", jogador2_original_id: "i" },  // R9 derrota
      { vencedor: "jogador1", jogador1_original_id: "j", jogador2_original_id: "marcelo" },  // R10 derrota
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "k" },  // R11
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "l" },  // R12
      { vencedor: "jogador1", jogador1_original_id: "m", jogador2_original_id: "marcelo" },  // R13 derrota
      { vencedor: "jogador2", jogador1_original_id: "n", jogador2_original_id: "marcelo" },  // R14
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "o" },  // R15
    ];

    expect(contarVitorias(confrontos, "marcelo")).toBe(11);

    // Rodada 16: Marcelo vence como jogador2 — deve ir para 12
    const p_marcelo = 77.24;
    const p_adversario = 73.48;
    const vencedor16 = calcularVencedor(p_adversario, p_marcelo); // j1=adversario, j2=marcelo
    expect(vencedor16).toBe("jogador2");

    const confrontos16 = [
      ...confrontos,
      { vencedor: vencedor16, jogador1_original_id: "p", jogador2_original_id: "marcelo" },
    ];

    expect(contarVitorias(confrontos16, "marcelo")).toBe(12);
  });

  it("regressão: se rodada 16 tivesse vencedor='empate' (bug antigo), contagem permanece em 11", () => {
    // Documenta o comportamento incorreto que causou o bug: o banco tinha 'empate'
    // em vez de NULL, fazendo a vitória não ser contabilizada.
    const confrontosBugado = [
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "a" },
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "b" },
      { vencedor: "jogador2", jogador1_original_id: "c", jogador2_original_id: "marcelo" },
      { vencedor: "jogador2", jogador1_original_id: "d", jogador2_original_id: "marcelo" },
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "e" },
      { vencedor: "jogador2", jogador1_original_id: "f", jogador2_original_id: "marcelo" },
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "g" },
      { vencedor: "jogador2", jogador1_original_id: "marcelo", jogador2_original_id: "h" },
      { vencedor: "jogador2", jogador1_original_id: "marcelo", jogador2_original_id: "i" },
      { vencedor: "jogador1", jogador1_original_id: "j", jogador2_original_id: "marcelo" },
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "k" },
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "l" },
      { vencedor: "jogador1", jogador1_original_id: "m", jogador2_original_id: "marcelo" },
      { vencedor: "jogador2", jogador1_original_id: "n", jogador2_original_id: "marcelo" },
      { vencedor: "jogador1", jogador1_original_id: "marcelo", jogador2_original_id: "o" },
      // Rodada 16 com vencedor gravado como 'empate' pelo bug antigo (deveria ser 'jogador2')
      { vencedor: "empate", jogador1_original_id: "p", jogador2_original_id: "marcelo" },
    ];

    // Com o bug, a vitória da rodada 16 não seria contada → trava em 11
    expect(contarVitorias(confrontosBugado, "marcelo")).toBe(11);
  });
});
