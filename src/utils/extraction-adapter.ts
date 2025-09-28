// Adaptateur pour la structure EXACTE retournée par le workflow n8n

export function adaptExtractionPayload(rawResponse: any) {
  console.log('🔄 Adaptation payload workflow:', rawResponse);
  
  // Cas d'erreur de validation
  if (rawResponse.error) {
    return {
      success: false,
      error: rawResponse.error,
      stage: 'validation_failed'
    };
  }
  
  // Structure normale du workflow
  const {
    request_id,
    org_id,
    processing_stage,
    extracted_values = {},
    field_validations = {},
    confidence_scores = {},
    extraction_summary,
    errors = []
  } = rawResponse;
  
  // Adapter vers la structure attendue par l'application
  const adaptedResponse = {
    request_id,
    org_id,
    processing_stage,
    extracted_info: {
      values: {
        // Mapping exact des champs du workflow
        nom_entreprise: field_validations.nom_entreprise?.status === 'found' 
          ? field_validations.nom_entreprise.normalized 
          : null,
        adresse: field_validations.adresse?.status === 'found' 
          ? field_validations.adresse.normalized 
          : null,
        telephones: field_validations.telephones?.status === 'found' 
          ? (Array.isArray(field_validations.telephones.normalized) 
             ? field_validations.telephones.normalized 
             : [field_validations.telephones.normalized].filter(Boolean))
          : [],
        emails: field_validations.emails?.status === 'found' 
          ? (Array.isArray(field_validations.emails.normalized) 
             ? field_validations.emails.normalized 
             : [field_validations.emails.normalized].filter(Boolean))
          : [],
        website: field_validations.website?.status === 'found' 
          ? field_validations.website.normalized 
          : null,
        ice: field_validations.ice?.status === 'found' 
          ? field_validations.ice.normalized 
          : null,
        rc: field_validations.rc?.status === 'found' 
          ? field_validations.rc.normalized 
          : null,
        if: field_validations.if?.status === 'found' 
          ? field_validations.if.normalized 
          : null,
        numero_tva: field_validations.numero_tva?.status === 'found' 
          ? field_validations.numero_tva.normalized 
          : null,
        forme_juridique: field_validations.forme_juridique?.status === 'found' 
          ? field_validations.forme_juridique.normalized 
          : null,
        capital_social: field_validations.capital_social?.status === 'found' 
          ? field_validations.capital_social.normalized 
          : null,
      },
      confidence: {
        // Mapping des scores de confiance
        nom_entreprise: confidence_scores.nom_entreprise || 0,
        adresse: confidence_scores.adresse || 0,
        telephones: confidence_scores.telephones || 0,
        emails: confidence_scores.emails || 0,
        website: confidence_scores.website || 0,
        ice: confidence_scores.ice || 0,
        rc: confidence_scores.rc || 0,
        if: confidence_scores.if || 0,
        numero_tva: confidence_scores.numero_tva || 0,
        forme_juridique: confidence_scores.forme_juridique || 0,
        capital_social: confidence_scores.capital_social || 0,
      },
      source: rawResponse.extraction_source || 'workflow_n8n'
    },
    validation: {
      field_validations,
      summary: extraction_summary || {
        extracted_count: 0,
        total_fields: 11,
        extraction_rate: 0,
        keys_found: []
      }
    },
    errors
  };
  
  console.log('✅ Payload adapté:', adaptedResponse);
  return adaptedResponse;
}