import Loading from "@/components/loading";
import { NotFound } from "@/components/not-found";
// router.tsx
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export function createRouter() {
  const queryClient = new QueryClient();

  const router = createTanstackRouter({
    routeTree,
    context: {
      queryClient,
    },
    scrollRestoration: true,
    defaultNotFoundComponent: NotFound,
    defaultPendingComponent: Loading,
  });

  return router;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
