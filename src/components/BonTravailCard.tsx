import React from 'react';
import { Clock, User, Package, Play, CheckCircle } from 'lucide-react';
import { BonTravailWithDetails } from '../types/production';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import { num3 } from '../lib/format';

interface BonTravailCardProps {
  bon: BonTravailWithDetails;
  onStart?: (id: string) => void;
  onComplete?: (bon: BonTravailWithDetails) => void;
  onEdit?: (id: string) => void;
}

export default function BonTravailCard({ bon, onStart, onComplete, onEdit }: BonTravailCardProps) {
  const getStatusBadge = (statut: string) => {
    const config = {
      planifie: { variant: 'default' as const, label: 'Planifié' },
      en_cours: { variant: 'warning' as const, label: 'En cours' },
      termine: { variant: 'success' as const, label: 'Terminé' },
      annule: { variant: 'danger' as const, label: 'Annulé' },
    };
    
    const statusConfig = config[statut as keyof typeof config];
    return statusConfig ? (
      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
    ) : (
      <Badge>{statut}</Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* En-tête */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{bon.numero}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {bon.client_nom} • {bon.commande_numero}
            </p>
          </div>
          {getStatusBadge(bon.statut)}
        </div>

        {/* Matière */}
        {bon.matiere_designation && (
          <div className="flex items-center space-x-2 text-sm">
            <Package size={16} className="text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {bon.matiere_code} - {bon.matiere_designation}
            </span>
          </div>
        )}

        {/* Quantités */}
        {bon.quantite_prevue && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span>Prévu: {num3(bon.quantite_prevue)} m²</span>
            {bon.quantite_produite && (
              <span className="ml-4">Produit: {num3(bon.quantite_produite)} m²</span>
            )}
            {bon.quantite_chutes && (
              <span className="ml-4">Chutes: {num3(bon.quantite_chutes)} m²</span>
            )}
          </div>
        )}

        {/* Opérateur et temps */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            {bon.operateur && (
              <div className="flex items-center space-x-1">
                <User size={14} />
                <span>{bon.operateur}</span>
              </div>
            )}
            {bon.temps_prevu_minutes && (
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{Math.round(bon.temps_prevu_minutes / 60)}h</span>
              </div>
            )}
          </div>
          <div className="text-xs">
            {new Date(bon.date_creation).toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Notes */}
        {bon.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
            {bon.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {bon.statut === 'planifie' && onStart && (
            <Button
              size="sm"
              onClick={() => onStart(bon.id)}
              className="flex-1"
            >
              <Play size={16} className="mr-1" />
              Démarrer
            </Button>
          )}
          
          {bon.statut === 'en_cours' && onComplete && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onComplete(bon)}
              className="flex-1"
            >
              <CheckCircle size={16} className="mr-1" />
              Terminer
            </Button>
          )}
          
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(bon.id)}
            >
              Modifier
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}