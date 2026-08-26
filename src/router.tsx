import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import Loading from "@/components/loading";
import { NotFound } from "@/components/not-found";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export function getRouter() {
  const queryClient = new QueryClient();

  const router = createTanstackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
    defaultPendingComponent: Loading,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
