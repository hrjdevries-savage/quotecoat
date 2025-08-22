export type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blobUrl?: string;
  file?: File;
};

export type LineItem = {
  id: string;
  attachmentId?: string;
  fileName?: string;
  description: string;
  drawingNumber: string;
  price: number | null;
};

export type QuoteMeta = {
  clientName: string;
  clientReference?: string;
  quoteNumber: string;
  validityDays: number;
  terms?: string;
  createdAt: string;
};

export type EmailParseInfo = {
  subject?: string;
  from?: string;
  to?: string[];
  date?: string;
};

export type QuoteDraft = {
  meta: QuoteMeta;
  lineItems: LineItem[];
  attachments: Attachment[];
  emailParseInfo?: EmailParseInfo;
};