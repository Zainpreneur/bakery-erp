/**
 * Animate a light/dark or palette change with a circular reveal from the
 * pointer position using the native View Transitions API. Falls back to an
 * instant change in browsers that don't support it.
 */
export function startThemeTransition(
  apply: () => void,
  origin?: { clientX: number; clientY: number; currentTarget?: EventTarget | null }
) {
  const root = document.documentElement;

  if (!document.startViewTransition) {
    apply();
    return;
  }

  if (origin) {
    const element =
      origin.currentTarget instanceof HTMLElement ? origin.currentTarget : null;
    const rect = element?.getBoundingClientRect();
    root.style.setProperty("--x", `${rect ? rect.left + rect.width / 2 : origin.clientX}px`);
    root.style.setProperty("--y", `${rect ? rect.top + rect.height / 2 : origin.clientY}px`);
  }

  document.startViewTransition(apply);
}
