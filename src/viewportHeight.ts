/**
 * Pin the app shell to the REAL visible viewport height.
 *
 * `.zd-app` is `overflow:hidden` and sized to a viewport height unit. On Android
 * (browser and installed PWA) a viewport unit such as `100dvh`/`100vh` can
 * resolve TALLER than the actually-visible area right after a reload /
 * pull-to-refresh / update activation, while the dynamic browser toolbar state
 * is still settling. Because the shell clips its overflow, its bottom — and with
 * it the bottom of the single inner `.zd-scroll` (content + bottom padding) and
 * the exam-runner action buttons — gets pushed below the fold and can no longer
 * be reached, and the floating bottom nav (pinned to the true visible bottom)
 * then overlaps the last content.
 *
 * `window.innerHeight` is the live visible height that already excludes the
 * URL bar and does not shrink for the soft keyboard (so opening a sheet input
 * never collapses the shell). Writing it to `--zd-app-h` makes `.zd-app` fill
 * exactly the visible viewport in every state. The CSS keeps `100svh`/`100vh`
 * as fallbacks, so even with this disabled the shell can never exceed the
 * visible viewport (`svh` is the smallest viewport).
 *
 * Runs on every load path: module init (cold load and every reload re-evaluates
 * the bundle), `load`, `resize`, `orientationchange`, `pageshow` (bfcache
 * restore) and a short delayed re-measure that catches the post-reload toolbar
 * settle where the first synchronous read is still the stale (taller) value.
 */
export function installViewportHeight(): void {
  if (typeof window === 'undefined') return

  const set = () => {
    document.documentElement.style.setProperty('--zd-app-h', `${window.innerHeight}px`)
  }

  set()
  window.addEventListener('resize', set)
  window.addEventListener('orientationchange', set)
  window.addEventListener('pageshow', set)
  window.addEventListener('load', set)
  // Catch the post-reload dynamic-toolbar settle on Android.
  window.setTimeout(set, 300)
}
