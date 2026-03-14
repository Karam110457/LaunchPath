-- Fix hybrid search: switch keyword branch from AND to OR logic.
--
-- Problem: websearch_to_tsquery('english', 'how many awards has medspa won')
-- produces 'mani' & 'award' & 'medspa' & 'won' — ALL terms must match.
-- One synonym mismatch (e.g. "multiple" vs "many") kills the entire match,
-- making the keyword branch return zero results for most natural queries.
-- This means hybrid search degrades to vector-only, losing the BM25 signal.
--
-- Fix: Convert AND tsquery to OR by replacing & with |. This lets chunks
-- that match *most* terms rank highly via ts_rank_cd instead of requiring
-- ALL terms to match. Also adds length normalization (flag 2) to ts_rank_cd
-- so short FAQ chunks aren't penalized vs long website chunks.

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
WITH
-- Build an OR-based tsquery: 'mani' & 'award' & 'medspa' → 'mani' | 'award' | 'medspa'
-- This ensures chunks matching MOST terms rank highly without requiring ALL terms.
or_query AS (
  SELECT replace(websearch_to_tsquery('english', query_text)::text, ' & ', ' | ')::tsquery AS q
),
semantic AS (
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
    -- Normalization flag 2: divide rank by document length, so short FAQ
    -- chunks aren't penalized vs long website chunks.
    ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.fts, oq.q, 2) DESC) AS rank_ix
  FROM public.agent_knowledge_chunks c
  JOIN public.agent_knowledge_documents d ON d.id = c.document_id
  CROSS JOIN or_query oq
  WHERE c.agent_id = match_agent_id
    AND c.fts @@ oq.q
  ORDER BY ts_rank_cd(c.fts, oq.q, 2) DESC
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
