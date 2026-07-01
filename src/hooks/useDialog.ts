import { useEffect, type RefObject } from 'react'

// Elements that can receive keyboard focus inside a dialog. Disabled controls and
// tabindex="-1" are excluded; visibility is filtered at call time.
const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Modal-dialog a11y for the app's bottom sheets (M5). Given a ref to the dialog
 * container (the `.zd-sheet` element) and an `onClose` callback, it:
 *
 *  - remembers the element focused before the sheet opened, and restores focus to
 *    it on close — but only if that element is still connected to the DOM;
 *  - moves focus INTO the dialog on open, onto the container itself (never an
 *    input), so the mobile on-screen keyboard is never summoned automatically;
 *  - traps Tab / Shift+Tab within the dialog's focusable children (wrapping at the
 *    ends), and safely handles dialogs with zero or one focusable child;
 *  - closes via `onClose` on Escape.
 *
 * It changes no styling and does not alter backdrop/inside-click behavior — the
 * caller keeps its own backdrop `onClick` and inside `stopPropagation`.
 */
export function useDialog(containerRef: RefObject<HTMLElement | null>, onClose: () => void): void {
  useEffect(() => {
    const container = containerRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Focus the container (not a field). tabindex=-1 makes it programmatically
    // focusable without adding it to the Tab order; preventScroll avoids a jump.
    if (container) {
      if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1')
      container.focus({ preventScroll: true })
    }

    const visibleFocusables = (): HTMLElement[] => {
      if (!container) return []
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(el => el.offsetParent !== null)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (e.key !== 'Tab' || !container) return

      const items = visibleFocusables()
      // Zero focusable children: keep focus pinned to the container.
      if (items.length === 0) { e.preventDefault(); container.focus({ preventScroll: true }); return }

      const first = items[0]!
      const last = items[items.length - 1]!
      const active = document.activeElement
      const outside = active === container || !container.contains(active)

      if (e.shiftKey) {
        if (outside || active === first) { e.preventDefault(); last.focus() }
      } else {
        if (outside || active === last) { e.preventDefault(); first.focus() }
      }
    }

    // Capture phase so the trap runs before any bubbling window listeners.
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
    // Mount/unmount only — the sheet is conditionally rendered by its parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
