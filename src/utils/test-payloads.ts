// Jeux de tests pour QA du workflow company-intake

export const TEST_PAYLOADS = {
  // Test de succès complet
  success: {
    request: {
      request_id: "test_success_001",
      org_id: "test123",
      assets: {
        pdf_example_base64: "data:application/pdf;base64,JVBERi0xLjc="
      }
    },
    response: {
      request_id: "test_success_001",
      org_id: "test123",
      processing_stage: "READY_FOR_REVIEW",
      extracted_info: {
        values: {
          nom_entreprise: "DECOUPE EXPRESS",
          adresse: "BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA",
          telephones: ["+212523305880", "+212666045824"],
          emails: ["contact@decoupe-express.ma"],
          website: "https://www.decoupe-express.ma",
          ice: "002741154000000",
          rc: "27441/14",
          forme_juridique: "SARL",
          capital_social: 100000
        },
        confidence: {
          nom_entreprise: 0.9,
          adresse: 0.8,
          telephones: 0.8,
          emails: 0.9,
          website: 0.7,
          ice: 0.9,
          rc: 0.8,
          forme_juridique: 0.7,
          capital_social: 0.6
        },
        source: "pdf_text_multi_contact_v2"
      },
      validation: {
        files: {
          pdf_example: {
            status: "processed",
            text_length: 2847,
            extraction_method: "native_pdf_text"
          }
        },
        field_validations: {
          nom_entreprise: {
            status: "found",
            message: null,
            normalized: "DECOUPE EXPRESS"
          },
          telephones: {
            status: "found",
            message: null,
            normalized: ["+212523305880", "+212666045824"],
            count: 2
          }
        },
        summary: {
          extracted_count: 8,
          total_fields: 9,
          extraction_rate: 0.89,
          keys_found: ["nom_entreprise", "adresse", "telephones", "emails", "ice", "rc", "forme_juridique", "capital_social"]
        }
      },
      errors: []
    }
  },

  // Test d'échec extraction
  extractFailed: {
    request: {
      request_id: "test_extract_failed_001",
      org_id: "test123",
      assets: {
        pdf_example_base64: "data:application/pdf;base64,invalid="
      }
    },
    response: {
      request_id: "test_extract_failed_001",
      org_id: "test123",
      processing_stage: "EXTRACT_FAILED",
      error: "PDF sans texte natif — OCR requis",
      extracted_info: {
        values: {
          nom_entreprise: null,
          adresse: null,
          telephones: [],
          emails: [],
          website: null,
          ice: null,
          rc: null,
          forme_juridique: null,
          capital_social: null
        },
        confidence: {
          nom_entreprise: 0,
          adresse: 0,
          telephones: 0,
          emails: 0,
          website: 0,
          ice: 0,
          rc: 0,
          forme_juridique: 0,
          capital_social: 0
        },
        source: "pdf_text_no_ocr"
      },
      validation: {
        files: {
          pdf_example: {
            status: "failed",
            text_length: 0,
            extraction_method: "none"
          }
        }
      },
      errors: ["PDF illisible", "Aucun texte extrait"]
    }
  },

  // Test d'erreur validation
  validationError: {
    request: {
      request_id: "",
      org_id: "",
      assets: {}
    },
    response: {
      error: "Validation echouee: request_id manquant, org_id manquant, pdf_example_base64 manquant"
    }
  },

  // Test sans summary (edge case)
  noSummary: {
    response: {
      request_id: "test_no_summary_001",
      org_id: "test123",
      processing_stage: "READY_FOR_REVIEW",
      extracted_info: {
        values: {
          nom_entreprise: "TEST COMPANY",
          adresse: null,
          telephones: [],
          emails: ["test@example.com"],
          website: null,
          ice: null,
          rc: null,
          forme_juridique: null,
          capital_social: null
        },
        confidence: {
          nom_entreprise: 0.8,
          adresse: 0,
          telephones: 0,
          emails: 0.9,
          website: 0,
          ice: 0,
          rc: 0,
          forme_juridique: 0,
          capital_social: 0
        },
        source: "pdf_text_minimal"
      },
      validation: {
        files: {
          pdf_example: {
            status: "processed",
            text_length: 150,
            extraction_method: "native_pdf_text"
          }
        }
        // Pas de summary !
      },
      errors: []
    }
  }
};

// Fonction utilitaire pour tester l'adaptateur
export function testAdapter() {
  const { adaptExtractionPayload } = require('../utils/extraction-adapter');
  
  console.log('🧪 Test adaptateur avec payload succès...');
  const adapted = adaptExtractionPayload(TEST_PAYLOADS.success.response);
  console.log('✅ Adapté:', adapted);
  
  console.log('🧪 Test adaptateur avec payload sans summary...');
  const adaptedNoSummary = adaptExtractionPayload(TEST_PAYLOADS.noSummary.response);
  console.log('✅ Adapté sans summary:', adaptedNoSummary);
  
  console.log('🧪 Test adaptateur avec erreur validation...');
  const adaptedError = adaptExtractionPayload(TEST_PAYLOADS.validationError.response);
  console.log('✅ Adapté erreur:', adaptedError);
}