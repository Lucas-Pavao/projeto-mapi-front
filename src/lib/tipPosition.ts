export const TIP_W = 256; // w-64
const GAP = 8;

/**
 * Posição do balão em coordenadas da janela. O balão vai num portal em document.body (position: fixed): dentro de um
 * card com overflow (card do ponto, painel da esquerda) ele era cortado e criava barra de rolagem horizontal.
 * Preso à janela com 8 px de margem; troca de lado se não couber.
 */
export function tipPosition(btn: { left: number; right: number; top: number; bottom: number }, tipH: number, vw: number, vh: number,
  side: 'top' | 'bottom', align: 'center' | 'end'): { left: number; top: number; width: number } {
  const width = Math.min(TIP_W, vw - 2 * GAP);
  const ideal = align === 'end' ? btn.right - width : (btn.left + btn.right) / 2 - width / 2;
  const left = Math.max(GAP, Math.min(ideal, vw - GAP - width));
  const above = btn.top - GAP - tipH;
  const below = btn.bottom + GAP;
  let top = side === 'top' ? above : below;
  if (side === 'top' && above < GAP) top = below;
  if (side === 'bottom' && below + tipH > vh - GAP && above >= GAP) top = above;
  return { left, top: Math.max(GAP, top), width };
}
