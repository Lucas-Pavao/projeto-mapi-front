/**
 * Torna um elemento (marcador DOM do MapLibre) operável por teclado: role=button, foco por Tab,
 * Enter/Espaço disparam `click`. Devolve a função que desfaz tudo.
 */
export function makeOperable(element: HTMLElement, label?: string): () => void {
  element.setAttribute("role", "button");
  element.setAttribute("tabindex", "0");
  if (label) element.setAttribute("aria-label", label);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      element.click();
    }
  };
  element.addEventListener("keydown", onKeyDown);
  return () => {
    element.removeEventListener("keydown", onKeyDown);
    element.removeAttribute("role");
    element.removeAttribute("tabindex");
    element.removeAttribute("aria-label");
  };
}
