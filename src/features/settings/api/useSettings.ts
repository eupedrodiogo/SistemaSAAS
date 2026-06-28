import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export const SETTINGS_KEYS = {
  profile: ['settings', 'profile'] as const,
};

export const useTherapistProfile = () => {
  return useQuery({
    queryKey: SETTINGS_KEYS.profile,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile, error } = await supabase
        .from('therapists')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is row not found, might happen on new users
        throw error;
      }

      return { user, profile };
    },
  });
};

export const useUpdateTherapistProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updateData = {
        name: formData.name,
        photo_url: formData.photo_url,
        specialty: formData.specialties?.[0] || formData.specialty || 'Geral',
        bio: formData.bio,
        citrg_code: formData.citrg_code,
        phone: formData.phone,
        price: formData.price ? parseFloat(String(formData.price)) : null,
        session_duration: formData.session_duration ? parseInt(String(formData.session_duration)) : 50,
        specialties: formData.specialties,
        certificates: formData.certificates,
        is_verified: formData.is_verified,
        is_overflow_source: formData.is_overflow_source,
        is_overflow_target: formData.is_overflow_target,
        pix_key: formData.pixKey,
        pix_type: formData.pixType,
        invoice_notes: formData.invoiceNotes,
        clinic_name: formData.clinicName,
        cnpj: formData.cnpj,
        address: formData.address,
      };

      const { data, error, count } = await supabase
        .from('therapists')
        .update(updateData)
        .eq('id', user.id)
        // @ts-ignore
        .select('*', { count: 'exact' });

      if (error) throw error;
      if (count === 0) throw new Error('Profile not found in database');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.profile });
    },
  });
};
