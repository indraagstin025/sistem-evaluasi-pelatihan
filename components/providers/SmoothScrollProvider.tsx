'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { usePathname } from 'next/navigation';

export interface ScrollToOptions {
  offset?: number;
  duration?: number;
  immediate?: boolean;
}

export interface SmoothScrollContextValue {
  scrollTo: (
    target: number | string | HTMLElement,
    options?: ScrollToOptions
  ) => void;
  refresh: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  scrollTo: () => {},
  refresh: () => {},
});

export function useSmoothScroll(): SmoothScrollContextValue {
  return useContext(SmoothScrollContext);
}

function getHeaderOffset(): number {
  if (typeof window === 'undefined') return 72;
  return window.innerWidth >= 1024 ? 84 : 72;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function hasScrollableAncestor(el: EventTarget | null, deltaY: number): boolean {
  if (!(el instanceof HTMLElement)) return false;

  let node: HTMLElement | null = el;
  while (
    node &&
    node !== document.body &&
    node !== document.documentElement
  ) {
    if (node.hasAttribute('data-smooth-prevent')) {
      return true;
    }

    if (node.tagName === 'TEXTAREA') {
      if (
        document.activeElement === node &&
        node.scrollHeight > node.clientHeight + 2
      ) {
        const canScrollDown =
          deltaY > 0 &&
          node.scrollTop + node.clientHeight < node.scrollHeight - 1;
        const canScrollUp = deltaY < 0 && node.scrollTop > 0;
        if (canScrollDown || canScrollUp) {
          return true;
        }
      }
      node = node.parentElement;
      continue;
    }

    const role = node.getAttribute('role');
    if (role === 'dialog' || role === 'listbox' || role === 'menu') {
      return true;
    }

    if (node.scrollHeight > node.clientHeight + 2) {
      const style = window.getComputedStyle(node);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        const canScrollDown =
          deltaY > 0 &&
          node.scrollTop + node.clientHeight < node.scrollHeight - 1;
        const canScrollUp = deltaY < 0 && node.scrollTop > 0;
        if (canScrollDown || canScrollUp) {
          return true;
        }
      }
    }

    node = node.parentElement;
  }

  return false;
}

/**
 * Mendeteksi apakah WheelEvent berasal dari Touchpad 2-jari atau Mouse Wheel bertakik.
 * Touchpad diberi damping lebih responsif (0.165) agar mengikuti jari secara presisi
 * namun tetap memiliki luncuran (gliding tail) halus.
 */
function isTouchpadEvent(e: WheelEvent, dtMs: number): boolean {
  if (e.deltaMode !== 0) return false;
  if (!Number.isInteger(e.deltaY) || !Number.isInteger(e.deltaX)) return true;
  if (e.deltaX !== 0) return true;

  const legacyWheelDeltaY = (e as unknown as { wheelDeltaY?: number }).wheelDeltaY;
  if (typeof legacyWheelDeltaY === 'number' && legacyWheelDeltaY !== 0) {
    if (legacyWheelDeltaY % 120 !== 0) return true;
  }

  const absY = Math.abs(e.deltaY);
  if (absY > 0 && absY < 48) return true;
  if (dtMs > 0 && dtMs < 24 && absY < 96) return true;

  return false;
}

const TOUCHPAD_DAMPING = 0.165;
const WHEEL_DAMPING = 0.105;
const STOP_EPSILON = 0.05;

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const stateRef = useRef({
    currentScroll: 0,
    targetScroll: 0,
    maxScroll: 0,
    activeDamping: WHEEL_DAMPING,
    lastWheelTime: 0,
    touchpadLockUntil: 0,
    isRunning: false,
    rafId: 0,
    lastFrameTime: 0,
    isEnabled: false,
    programmatic: null as {
      startScroll: number;
      endScroll: number;
      startTime: number;
      durationMs: number;
    } | null,
  });

  const updateBounds = useCallback(() => {
    if (typeof window === 'undefined') return;
    const s = stateRef.current;
    const doc = document.documentElement;
    s.maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
    if (s.targetScroll > s.maxScroll) s.targetScroll = s.maxScroll;
    if (s.currentScroll > s.maxScroll) s.currentScroll = s.maxScroll;
  }, []);

  const stopLoop = useCallback(() => {
    const s = stateRef.current;
    if (s.rafId) {
      window.cancelAnimationFrame(s.rafId);
      s.rafId = 0;
    }
    s.isRunning = false;
    s.programmatic = null;
    document.documentElement.classList.remove('app-smooth-scroll');
  }, []);

  const startLoop = useCallback(() => {
    const s = stateRef.current;
    if (s.isRunning || !s.isEnabled) return;
    s.isRunning = true;
    s.lastFrameTime = performance.now();
    document.documentElement.classList.add('app-smooth-scroll');

    const tick = (now: number) => {
      if (!s.isRunning) return;

      const dt = Math.min((now - s.lastFrameTime) / 1000, 0.064);
      s.lastFrameTime = now;

      if (s.programmatic) {
        const elapsed = now - s.programmatic.startTime;
        const progress = Math.min(1, elapsed / s.programmatic.durationMs);
        const eased = easeOutExpo(progress);
        s.currentScroll =
          s.programmatic.startScroll +
          (s.programmatic.endScroll - s.programmatic.startScroll) * eased;
        s.targetScroll = s.currentScroll;

        window.scrollTo(0, s.currentScroll);

        if (progress >= 1) {
          s.currentScroll = s.programmatic.endScroll;
          s.targetScroll = s.programmatic.endScroll;
          window.scrollTo(0, s.currentScroll);
          stopLoop();
          return;
        }

        s.rafId = window.requestAnimationFrame(tick);
        return;
      }

      const diff = s.targetScroll - s.currentScroll;

      if (Math.abs(diff) > STOP_EPSILON) {
        const lambda = -Math.log(1 - s.activeDamping) * 60;
        const alpha = 1 - Math.exp(-lambda * Math.max(dt, 0.004));
        s.currentScroll += diff * alpha;

        window.scrollTo(0, s.currentScroll);
        s.rafId = window.requestAnimationFrame(tick);
      } else {
        s.currentScroll = s.targetScroll;
        window.scrollTo(0, s.currentScroll);
        stopLoop();
      }
    };

    s.rafId = window.requestAnimationFrame(tick);
  }, [stopLoop]);

  const scrollTo = useCallback(
    (
      target: number | string | HTMLElement,
      options: ScrollToOptions = {}
    ) => {
      if (typeof window === 'undefined') return;

      const s = stateRef.current;
      updateBounds();

      let resolvedY = 0;

      if (typeof target === 'number') {
        resolvedY = target;
      } else if (typeof target === 'string') {
        if (target === '#' || target === '#top') {
          resolvedY = 0;
        } else {
          const id = target.startsWith('#') ? target.slice(1) : target;
          const el =
            document.getElementById(id) ??
            document.querySelector<HTMLElement>(target);
          if (!el) return;
          const offset = options.offset ?? -getHeaderOffset();
          resolvedY = el.getBoundingClientRect().top + window.scrollY + offset;
        }
      } else if (target instanceof HTMLElement) {
        const offset = options.offset ?? -getHeaderOffset();
        resolvedY = target.getBoundingClientRect().top + window.scrollY + offset;
      }

      const clampedY = Math.max(0, Math.min(s.maxScroll, resolvedY));

      if (!s.isEnabled || options.immediate) {
        stopLoop();
        s.currentScroll = clampedY;
        s.targetScroll = clampedY;
        window.scrollTo({ top: clampedY, behavior: 'auto' });
        return;
      }

      s.currentScroll = window.scrollY;
      s.targetScroll = clampedY;
      const durationMs = Math.max(180, (options.duration ?? 0.9) * 1000);
      s.programmatic = {
        startScroll: s.currentScroll,
        endScroll: clampedY,
        startTime: performance.now(),
        durationMs,
      };
      startLoop();
    },
    [startLoop, stopLoop, updateBounds]
  );

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return;
    updateBounds();
  }, [updateBounds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const s = stateRef.current;
    const html = document.documentElement;

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

    if (reducedMotionQuery.matches || coarsePointerQuery.matches) {
      stopLoop();
      s.isEnabled = false;
      return;
    }

    s.isEnabled = true;
    const initialY = window.scrollY;
    s.currentScroll = initialY;
    s.targetScroll = initialY;
    updateBounds();

    const onWheel = (e: WheelEvent) => {
      if (!s.isEnabled) return;
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey) return;

      if (
        Math.abs(e.deltaX) > Math.abs(e.deltaY) &&
        Math.abs(e.deltaY) < 4
      ) {
        return;
      }

      let deltaY = e.deltaY;
      if (e.deltaMode === 1) {
        deltaY *= 36;
      } else if (e.deltaMode === 2) {
        deltaY *= window.innerHeight * 0.85;
      }

      if (hasScrollableAncestor(e.target, deltaY)) {
        return;
      }

      const now = performance.now();
      const dt = now - s.lastWheelTime;
      s.lastWheelTime = now;

      const detectedTouchpad = isTouchpadEvent(e, dt);
      if (detectedTouchpad) {
        s.touchpadLockUntil = now + 280;
      }
      const isTouchpad = detectedTouchpad || now < s.touchpadLockUntil;

      e.preventDefault();

      s.programmatic = null;
      s.activeDamping = isTouchpad ? TOUCHPAD_DAMPING : WHEEL_DAMPING;

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      s.maxScroll = maxScroll;

      if (!s.isRunning) {
        const currentY = window.scrollY;
        s.currentScroll = currentY;
        s.targetScroll = currentY;
      }

      s.targetScroll = Math.max(
        0,
        Math.min(s.maxScroll, s.targetScroll + deltaY)
      );

      startLoop();
    };

    const onNativeScroll = () => {
      if (s.isRunning) return;
      const nativeY = window.scrollY;
      s.currentScroll = nativeY;
      s.targetScroll = nativeY;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.clientX >= document.documentElement.clientWidth - 2) {
        stopLoop();
        const y = window.scrollY;
        s.currentScroll = y;
        s.targetScroll = y;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        activeTag === 'SELECT' ||
        (document.activeElement as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }

      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === ' '
      ) {
        stopLoop();
      }
    };

    const onAnchorClick = (e: MouseEvent) => {
      if (!s.isEnabled || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const targetEl = e.target as HTMLElement | null;
      const anchor = targetEl?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.includes('#')) return;

      let hash = '';
      if (href.startsWith('#')) {
        hash = href;
      } else {
        try {
          const url = new URL(href, window.location.origin);
          if (
            url.origin === window.location.origin &&
            url.pathname === window.location.pathname
          ) {
            hash = url.hash;
          }
        } catch {
          return;
        }
      }

      if (!hash || hash === '#') return;

      const id = decodeURIComponent(hash.slice(1));
      const dest = document.getElementById(id);
      if (!dest) return;

      e.preventDefault();
      window.history.pushState(null, '', hash);
      scrollTo(dest, { offset: -getHeaderOffset(), duration: 0.9 });
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        updateBounds();
      }, 120);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('click', onAnchorClick);

    return () => {
      stopLoop();
      s.isEnabled = false;
      html.classList.remove('app-smooth-scroll');
      window.clearTimeout(resizeTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onNativeScroll);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('click', onAnchorClick);
    };
  }, [scrollTo, startLoop, stopLoop, updateBounds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = stateRef.current;

    const timer = window.setTimeout(() => {
      updateBounds();

      if (window.location.hash && s.isEnabled) {
        const id = decodeURIComponent(window.location.hash.slice(1));
        const dest = document.getElementById(id);
        if (dest) {
          scrollTo(dest, { offset: -getHeaderOffset(), duration: 0.85 });
          return;
        }
      }

      stopLoop();
      const y = window.scrollY;
      s.currentScroll = y;
      s.targetScroll = y;
    }, 60);

    return () => window.clearTimeout(timer);
  }, [pathname, scrollTo, stopLoop, updateBounds]);

  const contextValue = useMemo<SmoothScrollContextValue>(
    () => ({
      scrollTo,
      refresh,
    }),
    [scrollTo, refresh]
  );

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
