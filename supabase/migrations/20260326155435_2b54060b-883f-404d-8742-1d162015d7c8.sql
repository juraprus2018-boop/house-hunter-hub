-- Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid,
  subject text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  user_unread_count integer NOT NULL DEFAULT 0,
  admin_unread_count integer NOT NULL DEFAULT 0,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can see their own conversations
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own conversations (mark read)
CREATE POLICY "Users can update own conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins can manage conversations"
ON public.conversations FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages in their conversations
CREATE POLICY "Users can view own conversation messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

-- Users can insert messages in their conversations
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

-- Admins can do everything with messages
CREATE POLICY "Admins can manage messages"
ON public.chat_messages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;