import { z } from "zod";

export const ValuesSchema = z.object({
  nom_entreprise: z.string().nullable(),
  adresse: z.string().nullable(),
  telephones: z.array(z.string()).default([]),
  emails: z.array(z.string()).default([]),
  website: z.string().nullable(),
  ice: z.string().nullable(),
  rc: z.string().nullable(),
  forme_juridique: z.string().nullable(),
  capital_social: z.number().nullable(),
});

export const ConfidenceSchema = z.object({
  nom_entreprise: z.number().min(0).max(1),
  adresse: z.number().min(0).max(1),
  telephones: z.number().min(0).max(1),
  emails: z.number().min(0).max(1),
  website: z.number().min(0).max(1),
  ice: z.number().min(0).max(1),
  rc: z.number().min(0).max(1),
  forme_juridique: z.number().min(0).max(1),
  capital_social: z.number().min(0).max(1),
});

export const ExtractionInfoSchema = z.object({
  values: ValuesSchema,
  confidence: ConfidenceSchema,
  source: z.string(),
});

export const FileInfoSchema = z.object({
  status: z.enum(["processed","processing","failed"]),
  text_length: z.number().nullable().optional(),
  extraction_method: z.string().nullable().optional(),
});

export const ValidationSchema = z.object({
  files: z.object({
    pdf_example: FileInfoSchema
  }).optional(),
  field_validations: z.record(z.object({
    status: z.enum(["found","missing"]),
    message: z.string().nullable(),
    normalized: z.any(),
    count: z.number().nullable().optional(),
  })).optional(),
  summary: z.object({
    extracted_count: z.number(),
    total_fields: z.number(),
    extraction_rate: z.number().optional(),
    keys_found: z.array(z.string()).optional(),
  }).optional(),
});

// Structure réelle retournée par le workflow n8n
export const ExtractionResponseSchema = z.object({
  request_id: z.string(),
  org_id: z.string(),
  processing_stage: z.enum(["READY_FOR_REVIEW","EXTRACT_FAILED","VALIDATION_FAILED"]),
  extracted_values: z.record(z.any()).optional(),
  field_validations: z.record(z.object({
    status: z.enum(["found","missing"]),
    message: z.string().nullable(),
    normalized: z.any(),
    count: z.number().optional(),
  })).optional(),
  confidence_scores: z.record(z.number()).optional(),
  extraction_summary: z.object({
    extracted_count: z.number(),
    total_fields: z.number(),
    extraction_rate: z.number().optional(),
    keys_found: z.array(z.string()).optional(),
  }).optional(),
  errors: z.array(z.string()).default([]),
}).or(
  // cas erreur validation
  z.object({
    error: z.string(),
  })
);

export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;
export type Values = z.infer<typeof ValuesSchema>;