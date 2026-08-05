 // Colores fijos para el portfolio real de Daniel — se mantienen así (mismo color de siempre, sin
  // "saltar" al agregar/quitar símbolos). Cualquier símbolo que NO esté acá (el portfolio de
  // cualquier otro usuario) cae en getAssetColor(), no en un único color plano.
  export const ASSET_COLORS: Record<string, string> = {
      // ETFs europeos (XTB)
      EIMI: '#0ea5e9',
      VWCE: '#22c55e',
      CNDX: '#f59e0b',
      // ETFs y acciones US (HAPI)
      QQQ:  '#6366f1',
      VOO:  '#10b981',
      VGT:  '#8b5cf6',
      NVDA: '#84cc16',
      AMZN: '#f97316',
      NU:   '#ec4899',
      NOW:  '#06b6d4',
  };

  // Paleta de respaldo para símbolos que no están en ASSET_COLORS (cualquier usuario que no sea
  // Daniel, o un símbolo nuevo que él todavía no tenía).
  const FALLBACK_PALETTE = [
      '#0ea5e9', '#22c55e', '#f59e0b', '#6366f1', '#10b981', '#8b5cf6',
      '#84cc16', '#f97316', '#ec4899', '#06b6d4', '#eab308', '#f43f5e',
      '#14b8a6', '#a855f7', '#3b82f6', '#d946ef',
  ];

  // Bug real encontrado 2026-07-25 (reportado por el equipo probando en el celular): la primera
  // versión de este fallback hasheaba cada símbolo por separado a un índice de la paleta — probado
  // contra un portfolio típico de 10 tickers y YA colisionaba (dos símbolos distintos cayendo en el
  // mismo color), porque un hash aislado no tiene forma de saber qué colores ya están en uso en ESE
  // portfolio puntual. Fix real: en vez de hashear símbolo por símbolo, se arma un mapa para TODO el
  // conjunto de símbolos de una vez, repartiendo la paleta sin repetir dentro de ese conjunto —
  // mismo criterio que usar cartas de un mazo sin reponer, no tirar un dado por separado para cada
  // uno. Orden alfabético (no el orden en que vienen de la API, que puede cambiar por el sorteo por
  // rentabilidad) para que la asignación sea estable entre recargas.
  export function buildAssetColorMap(symbols: string[]): Map<string, string> {
      const map = new Map<string, string>();
      const usedColors = new Set<string>();
      const unique = Array.from(new Set(symbols)).sort();

      for (const symbol of unique) {
          if (ASSET_COLORS[symbol]) {
              map.set(symbol, ASSET_COLORS[symbol]);
              usedColors.add(ASSET_COLORS[symbol]);
          }
      }

      const available = FALLBACK_PALETTE.filter(c => !usedColors.has(c));
      let i = 0;
      for (const symbol of unique) {
          if (map.has(symbol)) continue;
          map.set(symbol, available[i % available.length]);
          i++;
      }

      return map;
  }

  // Para contextos de un solo símbolo (ej. la página de detalle de un item) — ahí no hay ningún
  // otro símbolo con el que colisionar, un mapa de un solo elemento alcanza.
  export function getAssetColor(symbol: string): string {
      return buildAssetColorMap([symbol]).get(symbol)!;
  }

  export const PERIODS = ['1M', '3M', '6M', '1A', 'Todo'];