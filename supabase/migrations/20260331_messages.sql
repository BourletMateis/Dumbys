-- Conversations (1:1 DMs between friends)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references auth.users(id) on delete cascade,
  user2_id uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  constraint unique_conversation unique (user1_id, user2_id),
  constraint different_users check (user1_id < user2_id)
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_conversations_user1 on conversations(user1_id);
create index if not exists idx_conversations_user2 on conversations(user2_id);
create index if not exists idx_messages_conversation on messages(conversation_id, created_at desc);
create index if not exists idx_messages_sender on messages(sender_id);

-- RLS
alter table conversations enable row level security;
alter table messages enable row level security;

-- Conversations: only participants can see
create policy "Users can view own conversations"
  on conversations for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can insert conversations they are part of"
  on conversations for insert
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- Messages: only conversation participants can see/send
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    )
  );

create policy "Users can send messages in their conversations"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    )
  );

-- Enable realtime
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
