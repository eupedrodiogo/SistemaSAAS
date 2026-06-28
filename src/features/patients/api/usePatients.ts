import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';

export const PATIENTS_KEYS = {
  all: ['patients'] as const,
  lists: () => [...PATIENTS_KEYS.all, 'list'] as const,
  listWithFinancials: () => [...PATIENTS_KEYS.lists(), 'financials'] as const,
  details: (id: string) => [...PATIENTS_KEYS.all, 'detail', id] as const,
  sudHistory: (id: string) => [...PATIENTS_KEYS.all, 'sud', id] as const,
};

export const usePatientsList = () => {
  return useQuery({
    queryKey: PATIENTS_KEYS.listWithFinancials(),
    queryFn: () => api.patients.listWithFinancials(),
  });
};

export const usePatientDetails = (patientId: string | null) => {
  return useQuery({
    queryKey: PATIENTS_KEYS.details(patientId!),
    queryFn: () => api.patients.details(patientId!),
    enabled: !!patientId,
  });
};

export const usePatientSUDHistory = (patientId: string | null) => {
  return useQuery({
    queryKey: PATIENTS_KEYS.sudHistory(patientId!),
    queryFn: () => api.patients.sud.list(patientId!),
    enabled: !!patientId,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPatient: any) => api.patients.create(newPatient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_KEYS.lists() });
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patients.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PATIENTS_KEYS.details(variables.id) });
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patients.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_KEYS.lists() });
    },
  });
};

export const useCreatePatientSUD = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { therapistId?: string; patientId: string; score: number; notes: string }) => 
      api.patients.sud.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_KEYS.sudHistory(variables.patientId) });
    },
  });
};
