-- Tippety: Grants nachschaerfen (Supabase-Default-Privileges greifen bei neu angelegten Views/Funktionen)

revoke all on public.scored_tips, public.leaderboard_global, public.leaderboard_league,
  public.leaderboard_group from anon;
revoke insert, update, delete, truncate, references, trigger on public.scored_tips,
  public.leaderboard_global, public.leaderboard_league, public.leaderboard_group from authenticated;

-- Trigger-Funktionen sind keine RPCs
revoke execute on function public.handle_new_user(), public.enforce_tip_lock(),
  public.matches_before_update(), public.matches_after_change() from public, anon, authenticated;
