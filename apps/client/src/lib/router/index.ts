// Opt in to React Router v7 behaviour now so the upgrade is a no-op. Shared with tests so they
// render routes the same way the app does.
export const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
} as const;
