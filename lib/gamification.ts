import { supabase } from "./supabase";

export interface UserGamification {
  xp: number;
  level: number;
  streak_count: number;
  last_streak_at: string | null;
  total_lessons_completed: number;
}

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserBadge extends Badge {
  earned_at: string;
}

/**
 * Update user streak. Should be called when user performs an active learning action.
 */
export async function updateStreak(userId: string) {
  const { error } = await supabase.rpc('update_user_streak', { p_user_id: userId });
  if (error) console.error('Error updating streak:', error);
  return !error;
}

/**
 * Fetch user gamification stats
 */
export async function getUserGamification(userId: string): Promise<UserGamification | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('xp, level, streak_count, last_streak_at, total_lessons_completed')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching gamification stats:', error);
    return null;
  }

  return data;
}

/**
 * Fetch user earned badges
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      earned_at,
      badges (
        id, name, slug, description, icon_name, xp_reward, rarity
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }

  return data.map((item: any) => ({
    ...item.badges,
    earned_at: item.earned_at
  }));
}

/**
 * Calculate progress to next level
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Formula: Level = floor(sqrt(xp/100)) + 1
 * Inverse: XP = (Level - 1)^2 * 100
 */
export function calculateLevelProgress(xp: number, level: number) {
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  
  const percentage = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
  
  return {
    percentage,
    xpRemaining: nextLevelXP - xp,
    currentLevelXP,
    nextLevelXP
  };
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  rank?: number;
}

/**
 * Get top users by XP for the leaderboard
 */
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, avatar_url, xp, level')
    .order('xp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

/**
 * Get color based on rarity
 */
export function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    case 'rare': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    case 'epic': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'legendary': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
}
