export interface ApiError {
  detail?: string;
  message?: string;
}

export interface CollectionNodeTemplateField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'file';
  required: boolean;
}

export interface CollectionNodeTemplate {
  type: string;
  label: string;
  description: string;
  fields: CollectionNodeTemplateField[];
}

export interface CollectionNodeTemplateCategory {
  title: string;
  nodes: CollectionNodeTemplate[];
}

export interface CollectionNodeTemplatesResponse {
  categories: CollectionNodeTemplateCategory[];
}

export interface SkillClassification {
  file_type: string | null;
  skill_name: string | null;
  confidence: number;
  reasoning?: string;
}

export interface SkillRecordResult {
  chunk_id: string;
  status: 'success' | 'failed' | 'skipped';
  record_id?: string | null;
  data?: Record<string, unknown>;
  table_type?: string | null;
  error?: string | null;
}

export interface SkillOrchestrateItem {
  file_name: string;
  classification: SkillClassification;
  success: boolean;
  error?: string | null;
  data: Record<string, unknown>[] | null;
  records: SkillRecordResult[];
  run_id?: string;
  source_hash?: string;
}

export interface SkillOrchestrateResponse {
  total_files: number;
  successful: number;
  failed: number;
  results: SkillOrchestrateItem[];
}

export interface SkillRunResponse {
  success: boolean;
  error?: string | null;
  data: Record<string, unknown>[];
  records: SkillRecordResult[];
  metadata?: Record<string, unknown>;
  script_result?: Record<string, unknown>;
  run_id: string;
  source_hash?: string;
}

export interface SkillConfirmRequest {
  project_id: string;
  node_id: string;
  source_hash: string;
  skill_name: string;
  run_id?: string;
  records: Array<Record<string, unknown>>;
}

export interface SkillConfirmResponse {
  success: boolean;
  run_id: string;
  records: Array<{
    record_id?: string | null;
    status: 'success' | 'failed';
    data?: Record<string, unknown>;
  }>;
}

export interface SkillsListResponse {
  imperative: string[];
  declarative: string[];
}

export interface SkillInfoResponse {
  name: string;
  type: 'imperative' | 'declarative';
  display_name?: string;
  description?: string;
  version?: string;
  has_script?: boolean;
  group?: string;
}

export interface ReportGenerateRequest {
  project_id: string;
  chapter_config: {
    node_id?: string;
    chapter_id?: string;
    title?: string;
    dataset_key?: string;
    sourceNodeId?: string | null;
    context?: Record<string, unknown>;
    [k: string]: unknown;
  };
  project_context: Record<string, unknown>;
}

export interface ReportBlock {
  type: 'text' | 'table' | 'kv_list' | 'note' | string;
  [k: string]: unknown;
}

export interface ReportChapter {
  chapter_id: string;
  title: string;
  chapter_content: {
    blocks: ReportBlock[];
  };
  summary?: Record<string, unknown>;
  evidence_refs?: Array<Record<string, unknown>>;
}

export interface ReportGenerateResponse {
  report_id: string;
  chapters: ReportChapter[];
}
