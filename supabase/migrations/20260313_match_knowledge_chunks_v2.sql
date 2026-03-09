-- Enhanced similarity search that includes document metadata for RAG transparency.
-- Keeps v1 function intact for backward compatibility.
create or replace function match_knowledge_chunks_v2(
  query_embedding extensions.vector(1536),
  match_agent_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  similarity float,
  document_id uuid,
  source_name text,
  source_type text
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.id as document_id,
    d.source_name,
    d.source_type
  from public.agent_knowledge_chunks c
  join public.agent_knowledge_documents d on d.id = c.document_id
  where c.agent_id = match_agent_id
    and d.status = 'ready'
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
