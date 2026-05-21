-- ─── Fonction générique d'insertion de notification ─────────────
create or replace function create_notification(
  p_user_id  uuid,
  p_type     text,
  p_title    text,
  p_body     text,
  p_data     jsonb default null
) returns void language plpgsql security definer as $$
begin
  -- Ne pas notifier soi-même
  if p_user_id = auth.uid() then return; end if;
  insert into notifications (user_id, type, title, body, data)
  values (p_user_id, p_type, p_title, p_body, p_data);
end;
$$;

-- ─── Trigger : Like (table reactions) ────────────────────────────
create or replace function trg_notif_like() returns trigger language plpgsql security definer as $$
declare
  v_owner_id  uuid;
  v_liker     text;
begin
  if NEW.emoji <> 'like' then return NEW; end if;

  select submitter_id into v_owner_id from videos where id = NEW.video_id;
  select username     into v_liker    from users  where id = NEW.user_id;

  if v_owner_id is not null and v_owner_id <> NEW.user_id then
    insert into notifications (user_id, type, title, body, data)
    values (
      v_owner_id,
      'like',
      '❤️ Nouveau like !',
      v_liker || ' a aimé ta vidéo',
      jsonb_build_object('video_id', NEW.video_id, 'user_id', NEW.user_id)
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists notif_like on reactions;
create trigger notif_like
  after insert on reactions
  for each row execute function trg_notif_like();

-- ─── Trigger : Commentaire ────────────────────────────────────────
create or replace function trg_notif_comment() returns trigger language plpgsql security definer as $$
declare
  v_owner_id  uuid;
  v_commenter text;
begin
  select submitter_id into v_owner_id  from videos where id = NEW.video_id;
  select username     into v_commenter from users  where id = NEW.user_id;

  if v_owner_id is not null and v_owner_id <> NEW.user_id then
    insert into notifications (user_id, type, title, body, data)
    values (
      v_owner_id,
      'comment',
      '💬 Nouveau commentaire !',
      v_commenter || ' : ' || left(NEW.text, 80),
      jsonb_build_object('video_id', NEW.video_id, 'user_id', NEW.user_id)
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists notif_comment on comments;
create trigger notif_comment
  after insert on comments
  for each row execute function trg_notif_comment();

-- ─── Trigger : Demande d'ami ──────────────────────────────────────
create or replace function trg_notif_friendship() returns trigger language plpgsql security definer as $$
declare
  v_requester text;
begin
  if TG_OP = 'INSERT' and NEW.status = 'pending' then
    select username into v_requester from users where id = NEW.requester_id;
    insert into notifications (user_id, type, title, body, data)
    values (
      NEW.addressee_id,
      'friend_request',
      '👋 Demande d''ami !',
      v_requester || ' veut t''ajouter en ami',
      jsonb_build_object('user_id', NEW.requester_id)
    );

  elsif TG_OP = 'UPDATE' and NEW.status = 'accepted' and OLD.status = 'pending' then
    select username into v_requester from users where id = NEW.addressee_id;
    insert into notifications (user_id, type, title, body, data)
    values (
      NEW.requester_id,
      'friend_accepted',
      '🤝 Ami accepté !',
      v_requester || ' a accepté ta demande d''ami',
      jsonb_build_object('user_id', NEW.addressee_id)
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists notif_friendship on friendships;
create trigger notif_friendship
  after insert or update on friendships
  for each row execute function trg_notif_friendship();

-- ─── Trigger : Nouveau tournoi dans un groupe ─────────────────────
create or replace function trg_notif_tournament() returns trigger language plpgsql security definer as $$
declare
  v_member record;
  v_creator text;
begin
  select username into v_creator from users where id = NEW.created_by;

  for v_member in
    select user_id from group_members
    where group_id = NEW.group_id and user_id <> NEW.created_by
  loop
    insert into notifications (user_id, type, title, body, data)
    values (
      v_member.user_id,
      'tournament_new',
      '🏆 Nouveau tournoi !',
      v_creator || ' a lancé "' || NEW.title || '"',
      jsonb_build_object('group_id', NEW.group_id, 'tournament_id', NEW.id)
    );
  end loop;
  return NEW;
end;
$$;

drop trigger if exists notif_tournament on group_tournaments;
create trigger notif_tournament
  after insert on group_tournaments
  for each row execute function trg_notif_tournament();

-- ─── Trigger : Nouvelle vidéo dans un groupe ─────────────────────
create or replace function trg_notif_video() returns trigger language plpgsql security definer as $$
declare
  v_member  record;
  v_poster  text;
begin
  if NEW.group_id is null then return NEW; end if;

  select username into v_poster from users where id = NEW.submitter_id;

  for v_member in
    select user_id from group_members
    where group_id = NEW.group_id and user_id <> NEW.submitter_id
  loop
    insert into notifications (user_id, type, title, body, data)
    values (
      v_member.user_id,
      'video_new',
      '🎬 Nouvelle vidéo !',
      v_poster || ' a posté dans ton groupe',
      jsonb_build_object('group_id', NEW.group_id, 'video_id', NEW.id, 'user_id', NEW.submitter_id)
    );
  end loop;
  return NEW;
end;
$$;

drop trigger if exists notif_video on videos;
create trigger notif_video
  after insert on videos
  for each row execute function trg_notif_video();
