-- Push token sur les users
alter table users add column if not exists push_token text;

-- Table notifications
create table if not exists notifications (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references users(id) on delete cascade not null,
  type        text not null,
  -- types: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'tournament_new' | 'video_new'
  title       text not null,
  body        text not null,
  data        jsonb,
  read        boolean default false not null,
  created_at  timestamptz default now() not null
);

create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_read_idx on notifications(user_id, read);

-- RLS
alter table notifications enable row level security;

create policy "Users read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Service role insert notifications"
  on notifications for insert
  with check (true);
