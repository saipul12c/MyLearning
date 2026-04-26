"use client";

/**
 * Utility to track and retrieve user interests based on categories visited.
 * Uses localStorage to persist data across sessions.
 */

const INTERESTS_KEY = "my_learning_user_interests";
const MAX_INTERESTS = 5;
const DECAY_FACTOR = 0.9; // Scores are multiplied by this periodically

interface InterestProfile {
  [categoryId: string]: number; // categoryId -> score
}

/**
 * Record interest in a category.
 * If categoryId is missing or "all", it will be ignored.
 */
export function recordInterest(categoryId?: string | null) {
  if (typeof window === "undefined" || !categoryId || categoryId === "all") return;

  try {
    const data = localStorage.getItem(INTERESTS_KEY);
    const profile: InterestProfile = data ? JSON.parse(data) : {};

    // Increment score (max score 50 to prevent overflow and maintain relativity)
    profile[categoryId] = Math.min(50, (profile[categoryId] || 0) + 1);

    // Save back
    localStorage.setItem(INTERESTS_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn("Failed to record interest:", err);
  }
}

/**
 * Get top categories the user is interested in.
 * Returns an array of category IDs sorted by score descending.
 */
export function getTopInterests(limit: number = 3): string[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(INTERESTS_KEY);
    if (!data) return [];

    const profile: InterestProfile = JSON.parse(data);
    
    // Sort by score descending
    return Object.entries(profile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => id);
  } catch (err) {
    return [];
  }
}

/**
 * Apply decay to interest scores to ensure recent activity matters more.
 * This should be called occasionally (e.g., when retrieving top interests).
 */
export function applyInterestDecay() {
  if (typeof window === "undefined") return;

  try {
    const data = localStorage.getItem(INTERESTS_KEY);
    if (!data) return;

    const profile: InterestProfile = JSON.parse(data);
    const newProfile: InterestProfile = {};
    let hasChanges = false;

    Object.entries(profile).forEach(([id, score]) => {
      const newScore = score * DECAY_FACTOR;
      if (newScore > 0.1) {
        newProfile[id] = newScore;
      }
      if (Math.abs(newScore - score) > 0.01) hasChanges = true;
    });

    if (hasChanges) {
      localStorage.setItem(INTERESTS_KEY, JSON.stringify(newProfile));
    }
  } catch (err) {
    // Ignore
  }
}
