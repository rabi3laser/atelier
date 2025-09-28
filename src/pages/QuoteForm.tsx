import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Devis, DevisLigne } from '../types/commercial';
import { getDevisById, getDevisLignes, createDevis, updateDevis, saveDevisLignes } from '../lib/commercial';
import Card from '../components/Card';
import Button from '../components/Button';
import DevisForm from '../components/DevisForm';

export default function QuoteForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [devis, setDevis] = useState<Devis | null>(null);
  const [lignes, setLignes] = useState<DevisLigne[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = id !== 'new';

  useEffect(() => {
    if (isEdit && id) {
      loadDevisData();
    } else {
      setIsLoading(false);
    }
  }, [id, isEdit]);

  const loadDevisData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const [devisData, lignesData] = await Promise.all([
        getDevisById(id),
        getDevisLignes(id),
      ]);
      
      setDevis(devisData);
      setLignes(lignesData);
    } catch (error) {
      console.error('Erreur lors du chargement du devis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (
    devisData: Omit<Devis, 'id' | 'created_at' | 'updated_at'>, 
    lignesData: Omit<DevisLigne, 'id' | 'devis_id'>[]
  ) => {
    try {
      setIsSubmitting(true);
      
      let devisId: string;
      
      if (isEdit && id) {
        // Modifier le devis existant
        await updateDevis(id, devisData);
        devisId = id;
      } else {
        // Créer un nouveau devis
        const newDevis = await createDevis(devisData);
        devisId = newDevis.id;
      }
      
      // Sauvegarder les lignes
      await saveDevisLignes(devisId, lignesData);
      
      navigate('/quotes');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/quotes')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Modifier le devis' : 'Nouveau devis'}
          </h1>
          {devis && (
            <p className="text-gray-600 dark:text-gray-400">
              {devis.numero} - {new Date(devis.date_devis).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      <Card>
        <DevisForm
          devis={devis || undefined}
          lignes={lignes}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/quotes')}
          isLoading={isSubmitting}
        />
      </Card>
    </div>
  );
}