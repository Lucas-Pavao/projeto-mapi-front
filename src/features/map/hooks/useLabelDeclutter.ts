import { useEffect, useState } from 'react';
import { useMap } from '@/components/ui/map';

/** Caixa de um rótulo na tela, em px, centrada em (x, y) como o marcador do MapLibre. */
export interface LabelBox {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Rótulo no mapa: posição geográfica e tamanho aproximado na tela (px). */
export interface GeoLabel {
  key: string;
  longitude: number;
  latitude: number;
  w: number;
  h: number;
}

/**
 * Em ordem de prioridade, mantém cada rótulo que não encosta (a `gap` px) nos já mantidos nem nas áreas reservadas.
 * Devolve as chaves que cabem; as outras viram ponto até o zoom abrir espaço.
 */
export function pickVisibleLabels(labels: readonly LabelBox[], reserved: readonly LabelBox[] = [], gap = 4): Set<string> {
  const kept: LabelBox[] = [...reserved];
  const visible = new Set<string>();
  for (const b of labels) {
    const hit = kept.some((k) => Math.abs(k.x - b.x) < (k.w + b.w) / 2 + gap && Math.abs(k.y - b.y) < (k.h + b.h) / 2 + gap);
    if (!hit) {
      kept.push(b);
      visible.add(b.key);
    }
  }
  return visible;
}

/**
 * Rótulos do mapa que cabem sem se sobrepor, recalculados ao fim de cada movimento ou zoom e no resize.
 * `labels` vem em ordem de prioridade; `reserved` são marcadores que nunca somem (pontos críticos). Passe os dois
 * memoizados: cada array novo refaz o cálculo.
 * Devolve null até o mapa carregar (aí todos aparecem).
 */
export function useLabelDeclutter(labels: readonly GeoLabel[], reserved: readonly GeoLabel[]): Set<string> | null {
  const { map, isLoaded } = useMap();
  const [visible, setVisible] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const toBox = (l: GeoLabel): LabelBox => {
      const p = map.project([l.longitude, l.latitude]);
      return { key: l.key, x: p.x, y: p.y, w: l.w, h: l.h };
    };
    const update = () => setVisible(pickVisibleLabels(labels.map(toBox), reserved.map(toBox)));
    update();
    map.on('moveend', update);
    map.on('resize', update);
    return () => {
      map.off('moveend', update);
      map.off('resize', update);
    };
  }, [map, isLoaded, labels, reserved]);

  return visible;
}
