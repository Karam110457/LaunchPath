-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Documents table (one row per uploaded file / scraped URL / FAQ)
create table if not exists public.agent_knowledge_documents (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.ai_agents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_type text not null check (source_type in ('file', 'website', 'faq')),
  source_name text not null,
  file_path text,
  content text not null default '',
  chunk_count int not null default 0,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Chunks table (one row per text chunk with embedding)
create table if not exists public.agent_knowledge_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.agent_knowledge_documents(id) on delete cascade not null,
  agent_id uuid not null,
  chunk_index int not null,
  content text not null,
  embedding extensions.vector(1536),
  token_count int not null default 0,
  created_at timestamptz default now() not null
);

-- RLS on documents
alter table public.agent_knowledge_documents enable row level security;

create policy "Users can read own knowledge documents"
  on public.agent_knowledge_documents
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own knowledge documents"
  on public.agent_knowledge_documents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own knowledge documents"
  on public.agent_knowledge_documents
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own knowledge documents"
  on public.agent_knowledge_documents
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS on chunks
alter table public.agent_knowledge_chunks enable row level security;

create policy "Users can read own knowledge chunks"
  on public.agent_knowledge_chunks
  for select
  to authenticated
  using (
    exists (
      select 1 from public.agent_knowledge_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users can insert own knowledge chunks"
  on public.agent_knowledge_chunks
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.agent_knowledge_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users can delete own knowledge chunks"
  on public.agent_knowledge_chunks
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.agent_knowledge_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

-- Indexes
create index idx_knowledge_docs_agent on public.agent_knowledge_documents(agent_id);
create index idx_knowledge_docs_user on public.agent_knowledge_documents(user_id);
create index idx_knowledge_chunks_document on public.agent_knowledge_chunks(document_id);
create index idx_knowledge_chunks_agent on public.agent_knowledge_chunks(agent_id);

-- Updated_at trigger
create trigger on_knowledge_documents_updated
  before update on public.agent_knowledge_documents
  for each row
  execute function public.handle_updated_at();

-- Similarity search function for RAG
create or replace function match_knowledge_chunks(
  query_embedding extensions.vector(1536),
  match_agent_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.agent_knowledge_chunks c
  where c.agent_id = match_agent_id
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
