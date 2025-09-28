// Types pour l'intégration n8n workflows

export interface N8nQuoteData {
  id: string;
  number: string;
  date: string;
  valid_until?: string;
  currency: string;
  customer_id: string;
  customer: {
    name: string;
    address?: string;
    postal_code?: string;
    city?: string;
    phone?: string;
    email?: string;
    ice?: string;
    rc?: string;
  };
  company: {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    ice?: string;
    rc?: string;
    if?: string;
  };
  items: N8nQuoteItem[];
  global_discount?: number;
  tax_rate: number;
  payment_terms?: string;
  notes?: string;
}

export interface N8nQuoteItem {
  sku?: string;
  label: string;
  qty: number;
  unit?: string;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  notes?: string;
}

export interface N8nQuoteRequest {
  quote_data: N8nQuoteData;
  template_id?: string;
  org_id: string;
}

export interface N8nQuoteResponse {
  success: boolean;
  quote?: {
    id: string;
    number: string;
    pdf_url: string;
    file_name: string;
    file_size: number;
    file_size_kb: number;
    pages: number;
  };
  upload?: {
    successful: boolean;
    url: string;
  };
  database_update?: {
    successful: boolean;
    updated_records: number;
  };
  template_used?: string;
  generation_time?: string;
  calculations?: {
    items_count: number;
    subtotal: number;
    discount_applied: number;
    tax_applied: number;
    grand_total: number;
  };
  error?: string;
  error_type?: string;
  stage?: string;
  quote_number?: string;
  timestamp?: string;
  troubleshooting?: {
    possible_causes: string[];
    next_steps: string[];
  };
}

export interface QuoteDraft {
  id?: string;
  number: string;
  customer_id: string;
  date: string;
  valid_until?: string;
  items: N8nQuoteItem[];
  global_discount: number;
  tax_rate: number;
  payment_terms: string;
  notes: string;
  template_id?: string;
  saved_at: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}