create table public.leaderboard_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  player_name text not null,
  updated_at timestamptz not null default now(),
  constraint leaderboard_player_name_format check (
    char_length(player_name) between 3 and 16
    and player_name ~ '^[A-Za-z0-9_ğüşöçıİĞÜŞÖÇ]+$'
  )
);

create table public.leaderboard_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  level_number integer not null,
  score integer not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, level_number),
  constraint leaderboard_level_range check (level_number between 1 and 100),
  constraint leaderboard_score_range check (score between 1 and 2200)
);

create index leaderboard_scores_total_index
  on public.leaderboard_scores (user_id, score desc);

alter table public.leaderboard_profiles enable row level security;
alter table public.leaderboard_scores enable row level security;

grant select, insert, update on public.leaderboard_profiles to authenticated;
grant select, insert, update on public.leaderboard_scores to authenticated;

create policy "Authenticated players can read leaderboard profiles"
  on public.leaderboard_profiles for select
  to authenticated
  using (true);

create policy "Players can create their own leaderboard profile"
  on public.leaderboard_profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Players can update their own leaderboard profile"
  on public.leaderboard_profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Authenticated players can read leaderboard scores"
  on public.leaderboard_scores for select
  to authenticated
  using (true);

create policy "Players can create their own leaderboard scores"
  on public.leaderboard_scores for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players can improve their own leaderboard scores"
  on public.leaderboard_scores for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.sync_leaderboard_score(
  p_player_name text,
  p_level_numbers integer[],
  p_scores integer[]
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if char_length(p_player_name) not between 3 and 16
     or p_player_name !~ '^[A-Za-z0-9_ğüşöçıİĞÜŞÖÇ]+$' then
    raise exception 'Invalid player name';
  end if;

  if coalesce(array_length(p_level_numbers, 1), 0)
     <> coalesce(array_length(p_scores, 1), 0) then
    raise exception 'Level and score arrays must have equal length';
  end if;

  insert into public.leaderboard_profiles (id, player_name, updated_at)
  values (auth.uid(), p_player_name, now())
  on conflict (id) do update
    set player_name = excluded.player_name,
        updated_at = now();

  insert into public.leaderboard_scores (
    user_id,
    level_number,
    score,
    updated_at
  )
  select auth.uid(), submitted.level_number, submitted.score, now()
  from unnest(p_level_numbers, p_scores)
    as submitted(level_number, score)
  where submitted.level_number between 1 and 100
    and submitted.score between 1 and 2200
  on conflict (user_id, level_number) do update
    set score = greatest(public.leaderboard_scores.score, excluded.score),
        updated_at = case
          when excluded.score > public.leaderboard_scores.score then now()
          else public.leaderboard_scores.updated_at
        end;
end;
$$;

revoke all on function public.sync_leaderboard_score(
  text,
  integer[],
  integer[]
) from public;

grant execute on function public.sync_leaderboard_score(
  text,
  integer[],
  integer[]
) to authenticated;

create view public.global_leaderboard
with (security_invoker = true)
as
select
  dense_rank() over (
    order by sum(scores.score) desc, max(scores.updated_at) asc
  ) as rank,
  profiles.id as player_id,
  profiles.player_name,
  sum(scores.score)::bigint as total_score,
  count(scores.level_number)::integer as levels_completed
from public.leaderboard_profiles as profiles
join public.leaderboard_scores as scores on scores.user_id = profiles.id
group by profiles.id, profiles.player_name;

grant select on public.global_leaderboard to authenticated;
