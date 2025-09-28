import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { 
  IntakeRequest, 
  IntakeResponse, 
  ConfirmRequest, 
  ConfirmResponse 
} from '../types/company';
import { intakeKey, confirmKey } from '../lib/companyHelpers';

const INTAKE_URL = '/api/n8n/company-intake';
const CONFIRM_URL = '/api/n8n/company-confirm';

// Hook pour l'analyse (intake)
export const useCompanyIntake = (requestId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: IntakeRequest): Promise<IntakeResponse> => {
      console.log('🚀 Appel workflow Intake:', INTAKE_URL);
      console.log('📊 Données envoyées:', {
        request_id: data.request_id,
        org_id: data.org_id,
        has_pdf: !!data.assets.pdf_example_base64
      });
      
      const response = await fetch(INTAKE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur de communication');
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Réponse Intake:', result);
      
      return result;
    },
    onSuccess: (data) => {
      // Mettre en cache la réponse
      queryClient.setQueryData(intakeKey(requestId), data);
      
      // Sauvegarder dans localStorage pour persistance
      localStorage.setItem('company:last_intake', JSON.stringify(data));
      
      toast.success('Analyse terminée ! Vérifiez les informations extraites.');
    },
    onError: (error) => {
      console.error('❌ Erreur Intake:', error);
      toast.error(`Erreur d'analyse: ${error.message}`);
    },
  });
};

// Hook pour la confirmation
export const useCompanyConfirm = (requestId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ConfirmRequest): Promise<ConfirmResponse> => {
      console.log('🚀 Appel workflow Confirm:', CONFIRM_URL);
      console.log('📊 Données confirmées:', data.confirmed_info);
      
      const response = await fetch(CONFIRM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur de communication');
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Réponse Confirm:', result);
      
      return result;
    },
    onSuccess: (data) => {
      // Mettre en cache la réponse
      queryClient.setQueryData(confirmKey(requestId), data);
      
      // Nettoyer le request_id pour la prochaine fois
      localStorage.removeItem('company:request_id');
      localStorage.removeItem('company:last_intake');
      
      toast.success('Configuration société terminée ! Template de devis généré.');
    },
    onError: (error) => {
      console.error('❌ Erreur Confirm:', error);
      toast.error(`Erreur de confirmation: ${error.message}`);
    },
  });
};

// Hook pour récupérer la dernière analyse (persistance)
export const useLastIntake = () => {
  return useQuery({
    queryKey: ['company', 'last-intake'],
    queryFn: () => {
      const saved = localStorage.getItem('company:last_intake');
      return saved ? JSON.parse(saved) : null;
    },
    staleTime: Infinity, // Ne jamais refetch automatiquement
  });
};