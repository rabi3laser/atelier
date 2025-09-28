/*
  # Ajouter les paramètres d'entreprise

  1. Nouveaux paramètres
    - Informations de l'entreprise (nom, adresse, contact)
    - Informations fiscales (ICE, RC, IF)
    - Logo de l'entreprise

  2. Sécurité
    - Aucune restriction RLS nécessaire pour les settings
*/

-- Insérer les paramètres d'entreprise par défaut
INSERT INTO settings (cle, valeur, description, type_donnee) VALUES
  ('entreprise_nom', 'Votre Entreprise', 'Nom de l''entreprise', 'text'),
  ('entreprise_adresse', '', 'Adresse de l''entreprise', 'text'),
  ('entreprise_code_postal', '', 'Code postal', 'text'),
  ('entreprise_ville', '', 'Ville', 'text'),
  ('entreprise_telephone', '', 'Numéro de téléphone', 'text'),
  ('entreprise_email', '', 'Adresse email', 'text'),
  ('entreprise_ice', '', 'Numéro ICE', 'text'),
  ('entreprise_rc', '', 'Numéro RC', 'text'),
  ('entreprise_if', '', 'Numéro IF', 'text'),
  ('entreprise_logo', '', 'Logo de l''entreprise (Base64)', 'text')
ON CONFLICT (cle) DO NOTHING;