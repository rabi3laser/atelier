import React, { useState } from 'react';
import { Send, Mail, MessageCircle, Settings } from 'lucide-react';
import { n8nQuoteService, N8nSendRequest } from '../lib/n8nQuoteService';
import Modal from './Modal';
import Button from './Button';
import FormRow from './FormRow';
import Badge from './Badge';

interface SendQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  devisId: string;
  devisNumero: string;
  clientEmail?: string;
  clientPhone?: string;
  onSuccess: () => void;
}

export default function SendQuoteModal({ 
  isOpen, 
  onClose, 
  devisId,
  devisNumero,
  clientEmail = '',
  clientPhone = '',
  onSuccess 
}: SendQuoteModalProps) {
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [sendOptions, setSendOptions] = useState<N8nSendRequest>({
    quote_id: devisId,
    send_methods: ['email'],
    recipient_email: clientEmail,
    recipient_phone: clientPhone,
    custom_message: `Bonjour,

Veuillez trouver ci-joint votre devis ${devisNumero}.

N'hésitez pas à nous contacter pour toute question.

Cordialement,
DECOUPE EXPRESS`,
    send_reminders: true,
    allow_signature: true,
  });

  const handleSend = async () => {
    setSending(true);
    setSendResult(null);
    
    try {
      const result = await n8nQuoteService.sendQuote(sendOptions);
      
      if (result.success) {
        setSendResult({ 
          success: true, 
          message: `Devis envoyé avec succès via ${result.sent_via?.join(', ')}` 
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setSendResult({ 
          success: false, 
          message: result.error || 'Erreur lors de l\'envoi' 
        });
      }
    } catch (error) {
      setSendResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
    } finally {
      setSending(false);
    }
  };

  const toggleSendMethod = (method: 'email' | 'whatsapp') => {
    setSendOptions(prev => ({
      ...prev,
      send_methods: prev.send_methods.includes(method)
        ? prev.send_methods.filter(m => m !== method)
        : [...prev.send_methods, method]
    }));
  };

  const updateOption = (field: keyof N8nSendRequest, value: any) => {
    setSendOptions(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Envoyer le devis ${devisNumero}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Méthodes d'envoi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Méthodes d'envoi
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => toggleSendMethod('email')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                sendOptions.send_methods.includes('email')
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Mail size={16} />
              <span>Email</span>
            </button>
            
            <button
              type="button"
              onClick={() => toggleSendMethod('whatsapp')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                sendOptions.send_methods.includes('whatsapp')
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Destinataires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sendOptions.send_methods.includes('email') && (
            <FormRow label="Email destinataire" required>
              <input
                type="email"
                value={sendOptions.recipient_email}
                onChange={(e) => updateOption('recipient_email', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </FormRow>
          )}

          {sendOptions.send_methods.includes('whatsapp') && (
            <FormRow label="Téléphone WhatsApp" required>
              <input
                type="tel"
                value={sendOptions.recipient_phone}
                onChange={(e) => updateOption('recipient_phone', e.target.value)}
                placeholder="+212 6 12 34 56 78"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </FormRow>
          )}
        </div>

        {/* Message personnalisé */}
        <FormRow label="Message personnalisé">
          <textarea
            value={sendOptions.custom_message}
            onChange={(e) => updateOption('custom_message', e.target.value)}
            rows={6}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        {/* Options avancées */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <Settings size={16} />
            <span>Options avancées</span>
          </h4>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={sendOptions.send_reminders}
                onChange={(e) => updateOption('send_reminders', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Activer les relances automatiques
              </span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={sendOptions.allow_signature}
                onChange={(e) => updateOption('allow_signature', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Permettre la signature électronique
              </span>
            </label>
          </div>
        </div>

        {/* Résultat envoi */}
        {sendResult && (
          <div className={`p-4 rounded-lg flex items-center space-x-2 ${
            sendResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {sendResult.success ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            <span className="text-sm">{sendResult.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            disabled={sending}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSend}
            disabled={sending || sendOptions.send_methods.length === 0}
          >
            <Send size={16} className="mr-2" />
            {sending ? 'Envoi en cours...' : 'Envoyer le devis'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}