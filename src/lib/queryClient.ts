import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min — données fraîches
      gcTime: 1000 * 60 * 15,     // 15 min — cache en mémoire (réduit les refetch au retour d'écran)
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
});
