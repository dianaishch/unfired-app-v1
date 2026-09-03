/* Late-bound navigation registry — avoids circular imports between screens. */
export const nav = {
  go: () => {},          // (route) => void   'items' | 'insights'
  openCard: () => {},    // (id) => void
  openCapture: () => {}, // (opts) => void
  openSearch: () => {},
  openDiscover: () => {},
  openCollide: () => {},
  openLock: () => {},
  openWatch: () => {},
  openShare: () => {},
  openOnboarding: () => {},
  refresh: () => {},
};
