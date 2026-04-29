import { supabase } from "@/lib/supabase";
import { SentinelConfig, SentinelState } from "./types";
import { SYSTEM_MANIFEST } from "./manifest";

/**
 * Generates a unique fingerprint of the current code manifest.
 * This allows Sentinel to detect if a developer has changed the 
 * feature structure directly in the source code.
 */
export function getCodeFingerprint(): string {
  const content = JSON.stringify(SYSTEM_MANIFEST.features);
  // Simple hash function for the environment
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}

/**
 * Checks if a feature is enabled for a specific user based on:
 * 1. Global toggle (value)
 * 2. Role targeting (whitelist)
 * 3. Rollout percentage (canary hashing)
 */
export function checkFeatureAccess(
  config: SentinelConfig, 
  user?: { id?: string; role?: string },
  anonymousId?: string,
  allConfigs?: Record<string, any> // Needed for dependency checking
): boolean {
  // 1. If global toggle is off, feature is off for everyone
  if (config.value !== true) return false;

  // 2. Check Dependencies (Item 2)
  if (config.dependencies && config.dependencies.length > 0 && allConfigs) {
    const missingDep = config.dependencies.find(depKey => allConfigs[depKey] !== true);
    if (missingDep) return false;
  }

  // 3. Check Auto-Kill Switch (Item 3)
  if (config.error_threshold && config.error_threshold > 0) {
    if ((config.current_errors || 0) >= config.error_threshold) {
      return false; // Automatically disabled due to high error rate
    }
  }

  // 4. If user is an admin or has a targeted role, bypass canary and give 100% access
  if (user) {
    if (user.role === 'admin') return true;
    if (user.role && config.targeting_roles && config.targeting_roles.includes(user.role)) return true;
  }

  // 5. Handle Rollout Percentage (Canary)
  if (config.rollout_percentage >= 100) return true;
  if (config.rollout_percentage <= 0) return false;

  // Sticky Canary: Hash(id + key) % 100
  const targetId = user?.id || anonymousId;
  
  if (!targetId) return false;

  const combined = targetId + config.key;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = Math.abs(hash & hash);
  }
  
  return (hash % 100) < config.rollout_percentage;
}

/**
 * Fetches all public sentinel configurations.
 * Optimized for frontend/middleware usage.
 * Automatically applies scheduled changes if release_at has passed.
 */
export async function getPublicSentinelConfigs(): Promise<SentinelState> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('sentinel_configs')
    .select('key, value, pending_value, release_at')
    .eq('is_public', true);

  if (error) {
    console.error('Error fetching sentinel configs:', error);
    return {};
  }

  return (data || []).reduce((acc, curr) => {
    // If there's a scheduled release that has passed, use the pending_value
    if (curr.release_at && curr.release_at <= now && curr.pending_value !== null) {
      acc[curr.key] = curr.pending_value;
    } else {
      acc[curr.key] = curr.value;
    }
    return acc;
  }, {} as SentinelState);
}

/**
 * Compares the Code Manifest with the Database and detects changes.
 * This is the "Auto-Detection" engine.
 */
export async function syncManifestWithDatabase(): Promise<{
  newFeatures: any[];
  orphanedFeatures: string[]; // Features in DB but NOT in Manifest
  versionMismatch: boolean;
  currentDbVersion: string;
  fingerprintMismatch: boolean;
  codeFingerprint: string;
  driftedFeatures: string[]; // Features where proposedValue != DB value (Item 1)
}> {
  const dbConfigs = await getAllSentinelConfigs();
  const dbKeys = Array.from(new Set(dbConfigs.map(c => c.key)));
  const manifestKeys = new Set(SYSTEM_MANIFEST.features.map(f => f.key));
  
  // 1. Detect New Features (In Manifest, NOT in DB)
  const newFeatures = SYSTEM_MANIFEST.features.filter(f => !dbKeys.includes(f.key));
  
  // 2. Detect Orphaned Features (In DB, NOT in Manifest)
  // Ignore core system keys like version and fingerprint
  const coreKeys = ['system_version', 'code_fingerprint'];
  const orphanedFeatures = dbKeys.filter(key => !manifestKeys.has(key) && !coreKeys.includes(key));
  
  const dbVersionConfig = dbConfigs.find(c => c.key === 'system_version');
  const currentDbVersion = dbVersionConfig ? String(dbVersionConfig.value).replace(/"/g, '') : "0.0.0";
  const versionMismatch = SYSTEM_MANIFEST.version !== currentDbVersion;

  // Code Fingerprint detection
  const codeFingerprint = getCodeFingerprint();
  const dbFingerprintConfig = dbConfigs.find(c => c.key === 'code_fingerprint');
  const currentDbFingerprint = dbFingerprintConfig ? String(dbFingerprintConfig.value).replace(/"/g, '') : "";
  const fingerprintMismatch = currentDbFingerprint !== codeFingerprint;

  // 3. Detect Value Drift (Item 1)
  const driftedFeatures = SYSTEM_MANIFEST.features
    .filter(f => {
      const dbConfig = dbConfigs.find(c => c.key === f.key);
      if (!dbConfig) return false;
      return JSON.stringify(dbConfig.value) !== JSON.stringify(f.proposedValue);
    })
    .map(f => f.key);

  return {
    newFeatures,
    orphanedFeatures,
    versionMismatch,
    currentDbVersion,
    fingerprintMismatch,
    codeFingerprint,
    driftedFeatures
  };
}

/**
 * Removes configurations from the database that are no longer in the code.
 */
export async function cleanupOrphanedFeatures(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  
  const { error } = await supabase
    .from('sentinel_configs')
    .delete()
    .in('key', keys);

  if (error) {
    throw new Error(`Failed to cleanup features: ${error.message}`);
  }
}

/**
 * Schedules a value change for a configuration.
 */
export async function scheduleRelease(
  key: string,
  pendingValue: any,
  releaseAt: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('sentinel_configs')
    .update({ 
      pending_value: pendingValue,
      release_at: releaseAt,
      updated_by: userId,
      updated_at: new Date().toISOString() 
    })
    .eq('key', key);

  if (error) {
    throw new Error(`Failed to schedule release: ${error.message}`);
  }
}

/**
 * Force apply a pending release immediately.
 */
export async function applyReleaseNow(key: string, userId: string): Promise<void> {
  const { data: config } = await supabase
    .from('sentinel_configs')
    .select('pending_value')
    .eq('key', key)
    .single();

  if (!config || config.pending_value === null) return;

  const { error } = await supabase
    .from('sentinel_configs')
    .update({ 
      value: config.pending_value,
      pending_value: null,
      release_at: null,
      updated_by: userId,
      updated_at: new Date().toISOString() 
    })
    .eq('key', key);

  if (error) throw error;
}

/**
 * Fetches all sentinel configurations (Admin only).
 */
export async function getAllSentinelConfigs(): Promise<SentinelConfig[]> {
  const { data, error } = await supabase
    .from('sentinel_configs')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch sentinel configs: ${error.message}`);
  }

  return data || [];
}

/**
 * Updates a sentinel configuration (Admin only).
 */
export async function updateSentinelConfig(
  key: string, 
  value: any, 
  userId: string,
  rolloutPercentage?: number,
  targetingRoles?: string[]
): Promise<void> {
  // 1. Check Lock (Item 6)
  const { data: current } = await supabase
    .from('sentinel_configs')
    .select('locked_by, locked_at')
    .eq('key', key)
    .single();

  if (current?.locked_by && current.locked_by !== userId) {
    const lockAge = Date.now() - new Date(current.locked_at).getTime();
    if (lockAge < 300000) { // Lock valid for 5 minutes
      throw new Error("Konfigurasi ini sedang dikunci oleh administrator lain.");
    }
  }

  const updateData: any = { 
    value, 
    pending_value: null,
    release_at: null,
    locked_by: null, // Auto-release lock on save
    locked_at: null,
    updated_by: userId,
    updated_at: new Date().toISOString() 
  };

  if (rolloutPercentage !== undefined) {
    updateData.rollout_percentage = rolloutPercentage;
  }

  if (targetingRoles !== undefined) {
    updateData.targeting_roles = targetingRoles;
  }

  const { error } = await supabase
    .from('sentinel_configs')
    .update(updateData)
    .eq('key', key);

  if (error) {
    throw new Error(`Failed to update sentinel config: ${error.message}`);
  }
}

/**
 * AQUAIRE LOCK (Item 6)
 * Prevents other admins from editing for 5 minutes.
 */
export async function acquireLock(key: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('sentinel_configs')
    .update({ 
      locked_by: userId,
      locked_at: new Date().toISOString()
    })
    .eq('key', key)
    .or(`locked_by.eq.${userId},locked_by.is.null,locked_at.lt.${new Date(Date.now() - 300000).toISOString()}`);

  if (error) throw new Error("Gagal mengunci konfigurasi. Mungkin sudah dikunci admin lain.");
}

/**
 * AUTO-KILL SWITCH (Item 3)
 * Reports an error for a feature. Automatically disables if threshold is reached.
 */
export async function reportFeatureError(key: string): Promise<void> {
  // Use RPC for atomic increment if possible, or simple fetch-then-update
  const { data: config } = await supabase
    .from('sentinel_configs')
    .select('value, current_errors, error_threshold')
    .eq('key', key)
    .single();

  if (!config || !config.error_threshold) return;

  const newErrors = (config.current_errors || 0) + 1;
  const updateData: any = {
    current_errors: newErrors,
    last_error_at: new Date().toISOString()
  };

  // If threshold reached, kill the feature
  if (newErrors >= config.error_threshold && config.value === true) {
    updateData.value = false;
    updateData.metadata = { 
      auto_disabled: true, 
      reason: `Error threshold (${config.error_threshold}) exceeded.` 
    };
  }

  await supabase
    .from('sentinel_configs')
    .update(updateData)
    .eq('key', key);
}

/**
 * RESET ERRORS (Item 3)
 * Admin manually resets the error count after fixing the issue.
 */
export async function resetErrorCount(key: string, userId: string): Promise<void> {
  await supabase
    .from('sentinel_configs')
    .update({ 
      current_errors: 0,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('key', key);
}
