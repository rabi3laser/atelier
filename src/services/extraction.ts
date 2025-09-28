import { adaptExtractionPayload } from "../utils/extraction-adapter";

export async function extractFromPdf(input: {
  request_id: string;
  org_id: string;
  pdf_example_base64: string; // avec ou sans data:
}) {
  const body = {
    request_id: input.request_id,
    org_id: input.org_id,
    assets: { pdf_example_base64: input.pdf_example_base64 },
  };

  console.log('🚀 Appel workflow company-intake:', body.request_id);

  const res = await fetch(`https://n8n.srv782553.hstgr.cloud/webhook/company-intake`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Erreur de communication');
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  const raw = await res.json().catch(() => ({ error: "Invalid JSON response" }));
  return adaptExtractionPayload(raw);
}

export async function saveExtraction(resp: any) {
  if ("error" in resp) return { error: resp.error };

  const { supabase } = await import("../lib/supabase");
  
  const { data, error } = await supabase
    .from("extractions")
    .insert({
      request_id: resp.request_id,
      org_id: resp.org_id,
      processing_stage: resp.processing_stage,
      values: resp.extracted_info.values,
      confidence: resp.extracted_info.confidence,
      validation: resp.validation ?? null,
      errors: resp.errors ?? [],
      source: resp.extracted_info.source ?? null,
    })
    .select("*")
    .single();

  return { data, error };
}