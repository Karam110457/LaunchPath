-- Add full-text search column to chunks for hybrid (BM25 + vector) retrieval.
-- The fts column is auto-generated from content — no backfill needed.

ALTER TABLE public.agent_knowledge_chunks
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_fts
  ON public.agent_knowledge_chunks USING gin(fts);

-- Hybrid search function combining vector similarity + BM25 with Reciprocal Rank Fusion.
-- Returns results ranked by combined relevance from both search methods.
CREATE OR REPLACE FUNCTION hybrid_match_knowledge_chunks(
  query_text text,
  query_embedding extensions.vector(1536),
  match_agent_id uuid,
  match_count int default 5,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 50
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  document_id uuid,
  source_name text,
  source_type text
)
LANGUAGE sql
AS $$
WITH semantic AS (
  SELECT
    c.id,
    c.content,
    c.document_id,
    d.source_name,
    d.source_type,
    ROW_NUMBER() OVER (ORDER BY c.embedding <=> query_embedding) AS rank_ix
  FROM public.agent_knowledge_chunks c
  JOIN public.agent_knowledge_documents d ON d.id = c.document_id
  WHERE c.agent_id = match_agent_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count * 2
),
keyword AS (
  SELECT
    c.id,
    c.content,
    c.document_id,
    d.source_name,
    d.source_type,
    ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.fts, websearch_to_tsquery('english', query_text)) DESC) AS rank_ix
  FROM public.agent_knowledge_chunks c
  JOIN public.agent_knowledge_documents d ON d.id = c.document_id
  WHERE c.agent_id = match_agent_id
    AND c.fts @@ websearch_to_tsquery('english', query_text)
  ORDER BY ts_rank_cd(c.fts, websearch_to_tsquery('english', query_text)) DESC
  LIMIT match_count * 2
)
SELECT
  COALESCE(s.id, k.id) AS id,
  COALESCE(s.content, k.content) AS content,
  (
    COALESCE(semantic_weight / (rrf_k + s.rank_ix), 0.0) +
    COALESCE(full_text_weight / (rrf_k + k.rank_ix), 0.0)
  )::float AS similarity,
  COALESCE(s.document_id, k.document_id) AS document_id,
  COALESCE(s.source_name, k.source_name) AS source_name,
  COALESCE(s.source_type, k.source_type) AS source_type
FROM semantic s
FULL OUTER JOIN keyword k ON s.id = k.id
ORDER BY similarity DESC
LIMIT match_count;
$$;
