export interface DocumentationSection {
  title: string;
  url: string;
  content: string;
  examples?: CodeExample[];
  apiReference?: ApiReference[];
}

export interface CodeExample {
  title: string;
  code: string;
  language: string;
  description?: string;
}

export interface ApiReference {
  name: string;
  signature: string;
  description: string;
  parameters?: Parameter[];
  returns?: string;
  examples?: CodeExample[];
}

export interface Parameter {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
}

export interface CachedContent {
  data: any;
  timestamp: number;
  ttl: number;
}

export interface SearchResult {
  section: string;
  title: string;
  url: string;
  excerpt: string;
  relevance: number;
}