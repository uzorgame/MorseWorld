/// <reference types="vite/client" />

/* The analytics tag is loaded by index.html rather than imported, so nothing in
   the source declares it. Optional rather than assumed: a blocker removes it, and
   a page view is not worth a crash. */
interface Window {
  gtag?: (command: string, ...args: unknown[]) => void
}
