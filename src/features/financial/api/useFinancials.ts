import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';

export const FINANCIALS_KEYS = {
  all: ['financials'] as const,
  transactions: (year: number) => [...FINANCIALS_KEYS.all, 'transactions', year] as const,
  summary: (year: number) => [...FINANCIALS_KEYS.all, 'summary', year] as const,
};

export const useFinancialsData = (year: number) => {
  return useQuery({
    queryKey: FINANCIALS_KEYS.all, // Simplify by grouping both summary and transactions under one query for the year, or keep them separate? We fetch them together in the component. Let's make a combined hook.
    queryFn: async () => {
      // Sync de possíveis sessões pagas que não geraram transações no BD (fallback)
      await api.transactions.syncMissing();

      // SSoT: busca transações reais + resumo anual em paralelo
      const [txList, annualSummary] = await Promise.all([
        api.transactions.list({ year }),
        api.transactions.summary(year),
      ]);

      // Monta dados do gráfico: 12 meses do ano selecionado
      const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const chartMap = new Map(annualSummary.map((s: any) => [s.period_month, s]));
      const chartData = monthNames.map((name, i) => {
        const row = chartMap.get(i + 1);
        return {
          name,
          receita: Number(row?.total_revenue ?? 0),
          despesas: Number(row?.total_expenses ?? 0),
        };
      });

      // KPIs: soma de todos os meses do ano
      const totalRevenue  = annualSummary.reduce((s: number, r: any) => s + Number(r.total_revenue),  0);
      const totalExpenses = annualSummary.reduce((s: number, r: any) => s + Number(r.total_expenses), 0);
      const pendingAmount = annualSummary.reduce((s: number, r: any) => s + Number(r.pending_amount), 0);
      
      const financials = {
        balance:       totalRevenue - totalExpenses,
        totalRevenue,
        totalExpenses,
        pendingAmount,
      };

      return {
        transactions: txList,
        monthlyData: chartData,
        financials
      };
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTransaction: any) => api.transactions.create(newTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIALS_KEYS.all });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIALS_KEYS.all });
    },
  });
};
