/**
 * TypeScript interfaces for Mistral OCR API requests and responses
 * Based on Mistral AI documentation: https://docs.mistral.ai/capabilities/document/
 */

// Document type interfaces
export interface DocumentUrl {
  type: 'document_url';
  document_url: string;
}

export interface ImageUrl {
  type: 'image_url';
  image_url: string;
}

export interface Base64Document {
  type: 'document_base64';
  document_base64: string;
}

export interface Base64Image {
  type: 'image_base64';
  image_base64: string;
}

export type DocumentInput = DocumentUrl | ImageUrl | Base64Document | Base64Image;

// OCR request interface
export interface MistralOCRRequest {
  model: string; // Typically "mistral-ocr-latest"
  document: DocumentInput;
  include_image_base64?: boolean;
}

// OCR response interfaces
export interface OCRDimensions {
  dpi: number;
  height: number;
  width: number;
}

export interface OCRImage {
  data?: string; // Base64-encoded image data (when include_image_base64 is true)
}

export interface OCRPage {
  index: number;
  markdown: string;
  images: OCRImage[];
  dimensions: OCRDimensions;
}

export interface MistralOCRResponse {
  pages: OCRPage[];
}

// Document understanding interfaces (for chat with documents)
export interface TextContent {
  type: 'text';
  text: string;
}

export interface DocumentUrlContent {
  type: 'document_url';
  document_url: string;
}

export type MessageContent = TextContent | DocumentUrlContent;

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent | MessageContent[];
}

export interface DocumentUnderstandingRequest {
  model: string; // e.g., "mistral-small-latest", "mistral-large-latest"
  messages: Message[];
  document_image_limit?: number;
  document_page_limit?: number;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  random_seed?: number;
  safe_prompt?: boolean;
}

export interface Choice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: 'stop' | 'length' | 'model_length' | null;
}

export interface DocumentUnderstandingResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
} 