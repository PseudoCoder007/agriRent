-- Phase 02.1 chat persistence schema. New: chat_messages table (with RLS).
-- This migration is purely additive -- safe to run after 0006_phase3_reviews.sql.

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- A user can only ever read their own chat messages.
CREATE POLICY "chat_messages select own" ON public.chat_messages
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- A user can only ever insert chat messages attributed to themselves.
CREATE POLICY "chat_messages insert own" ON public.chat_messages
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- Index for fast per-user ordered reads (RLS policies reference user_id,
-- and history is always read ordered by created_at).
CREATE INDEX idx_chat_messages_user_created
  ON public.chat_messages (user_id, created_at);
