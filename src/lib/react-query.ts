import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações padrão de cache
      staleTime: 1000 * 60 * 1, // 1 minuto até considerar o dado velho
      refetchOnWindowFocus: false, // Não fazer refetch ao focar a aba (evita excesso de requests)
      retry: 1, // Tentar de novo 1 vez em caso de falha
    },
  },
});
