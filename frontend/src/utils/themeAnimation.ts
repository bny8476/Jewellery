import { flushSync } from 'react-dom';

export interface ThemeAnimationOptions {
  duration?: number;
  fromCenter?: boolean;
}

/**
 * Executes a full-screen circular expanding View Transition animation from
 * the position of the triggering element (or center of viewport) when toggling theme.
 */
export function executeThemeViewTransition(
  triggerElement: HTMLElement | null | undefined,
  applyThemeCallback: () => void,
  options: ThemeAnimationOptions = {}
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    applyThemeCallback();
    return;
  }

  // Graceful fallback for browsers or environments without View Transitions API
  if (typeof (document as any).startViewTransition !== 'function') {
    applyThemeCallback();
    return;
  }

  const root = document.documentElement;

  // If a View Transition is already active, run callback directly to prevent collision
  if (root.dataset.magicuiThemeVt === 'active') {
    applyThemeCallback();
    return;
  }

  const duration = options.duration ?? 450;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let x: number;
  let y: number;

  if (options.fromCenter || !triggerElement) {
    x = viewportWidth / 2;
    y = viewportHeight / 2;
  } else {
    const rect = triggerElement.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  const maxRadius = Math.hypot(
    Math.max(x, viewportWidth - x),
    Math.max(y, viewportHeight - y)
  );

  const toX = (val: number) => `${(val / viewportWidth) * 100}%`;
  const toY = (val: number) => `${(val / viewportHeight) * 100}%`;
  const toRadius = (r: number) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

  const point = `${toX(x)} ${toY(y)}`;
  const clipPath = [
    `circle(0% at ${point})`,
    `circle(${toRadius(maxRadius)} at ${point})`,
  ];

  root.dataset.magicuiThemeVt = 'active';
  root.style.setProperty('--magicui-theme-toggle-vt-duration', `${duration}ms`);
  root.style.setProperty('--magicui-theme-vt-clip-from', clipPath[0]);

  let activeAnim: Animation | null = null;

  const cleanup = () => {
    delete root.dataset.magicuiThemeVt;
    root.style.removeProperty('--magicui-theme-toggle-vt-duration');
    root.style.removeProperty('--magicui-theme-vt-clip-from');
    activeAnim?.cancel();
    activeAnim = null;
  };

  try {
    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        applyThemeCallback();
      });
    });

    if (typeof transition?.finished?.finally === 'function') {
      transition.finished.finally(cleanup).catch(() => {});
    } else {
      cleanup();
    }

    const ready = transition?.ready;
    if (ready && typeof ready.then === 'function') {
      ready
        .then(() => {
          activeAnim = root.animate(
            { clipPath },
            {
              duration,
              easing: 'ease-in-out',
              fill: 'forwards',
              pseudoElement: '::view-transition-new(root)',
            }
          );
          activeAnim.onfinish = cleanup;
          activeAnim.oncancel = cleanup;
        })
        .catch(() => {
          cleanup();
        });
    }
  } catch {
    cleanup();
    applyThemeCallback();
  }
}
