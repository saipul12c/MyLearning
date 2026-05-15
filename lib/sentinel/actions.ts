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
  allConfigs?: Record<string, any>, // Needed for dependency checking
  countryCode?: string // Added for Geo-Fencing
): boolean {
  // 1. If global toggle is off, feature is off for everyone
  if (config.value !== true) return false;

  // 1.1 Check Expiry
  if (config.expire_at && new Date(config.expire_at) <= new Date()) {
    return false;
  }

  // 1.2 Check Geo-Fencing
  if (countryCode && config.allowed_countries && config.allowed_countries.length > 0) {
    if (!config.allowed_countries.includes(countryCode)) {
      return false;
    }
  }

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
 * Server-side helper: Check if a feature is enabled for a specific user.
 * Wraps checkFeatureAccess with automatic config fetching.
 * Use this in server lib modules instead of simple boolean checks
 * when you need canary rollout, dependency, or kill-switch awareness.
 */
export async function isFeatureEnabled(
  key: string, 
  user?: { id?: string; role?: string }
): Promise<boolean> {
  const { data: config } = await supabase
    .from('sentinel_configs')
    .select('*')
    .eq('key', key)
    .single();

  if (!config) {
    // Fail-closed for security/module keys, fail-open for features
    return !(key.startsWith('module_') || key.startsWith('security_') || key.includes('ddos'));
  }

  // Build allConfigs map for dependency checking
  let allConfigs: Record<string, any> | undefined;
  if (config.dependencies && config.dependencies.length > 0) {
    const { data: deps } = await supabase
      .from('sentinel_configs')
      .select('key, value')
      .in('key', config.dependencies);
    if (deps) {
      allConfigs = {};
      deps.forEach(d => { allConfigs![d.key] = d.value; });
    }
  }

  return checkFeatureAccess(config as SentinelConfig, user, undefined, allConfigs);
}

/**
 * Issues a signed verification token for the DDoS challenge.
 * This MUST be a server-side action.
 */
export async function issueSentinelVerificationToken(ip: string, userAgent: string): Promise<string> {
  const SENTINEL_SECRET = process.env.SENTINEL_SECRET || 'fallback-secret-for-dev-only';
  const timestamp = Date.now().toString(36);
  const payload = `${timestamp}.${ip}.${userAgent.slice(0, 20)}`;
  
  // Use SubtleCrypto for Edge compatibility if needed, 
  // but here we are in a standard Node/Serverless environment.
  // We'll use a simple node crypto approach or match the Edge implementation.
  const { createHmac } = await import('crypto');
  const sig = createHmac('sha256', SENTINEL_SECRET)
    .update(payload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${timestamp}.${sig}`;
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
    .select('key, value, pending_value, release_at, expire_at, allowed_countries')
    .eq('is_public', true);

  if (error) {
    console.error('Error fetching sentinel configs:', error);
    return {};
  }

  const result: SentinelState = {};
  const releasesToApply: { key: string; value: any }[] = [];

  for (const curr of (data || [])) {
    // 1. Handle Expiry (Item: Ephemeral Features)
    if (curr.expire_at && new Date(curr.expire_at) <= new Date()) {
      result[curr.key] = false; // Force disabled if expired
      continue;
    }

    if (curr.release_at && curr.release_at <= now && curr.pending_value !== null) {
      result[curr.key] = curr.pending_value;
      releasesToApply.push({ key: curr.key, value: curr.pending_value });
    } else {
      result[curr.key] = curr.value;
    }
  }

  // Auto-commit scheduled releases that have passed (fire-and-forget)
  for (const release of releasesToApply) {
    Promise.resolve(
      supabase
        .from('sentinel_configs')
        .update({ 
          value: release.value, 
          pending_value: null, 
          release_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('key', release.key)
    ).catch((err: any) => console.error('Failed to auto-apply release for', release.key, err));
  }

  return result;
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
 * Respects the is_protected flag to prevent accidental deletion of critical configs.
 */
export async function cleanupOrphanedFeatures(keys: string[]): Promise<{ deleted: string[]; protected: string[] }> {
  if (keys.length === 0) return { deleted: [], protected: [] };

  // 1. Check which keys are protected
  const { data: protectedConfigs } = await supabase
    .from('sentinel_configs')
    .select('key')
    .in('key', keys)
    .eq('is_protected', true);

  const protectedKeys = new Set((protectedConfigs || []).map(c => c.key));
  const deletableKeys = keys.filter(k => !protectedKeys.has(k));

  // 2. Only delete non-protected keys
  if (deletableKeys.length > 0) {
    const { error } = await supabase
      .from('sentinel_configs')
      .delete()
      .in('key', deletableKeys);

    if (error) {
      throw new Error(`Failed to cleanup features: ${error.message}`);
    }
  }

  return { 
    deleted: deletableKeys, 
    protected: Array.from(protectedKeys) 
  };
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

  // Map metadata.impact to top-level impact for UI convenience
  return (data || []).map(config => ({
    ...config,
    impact: (config.metadata as any)?.impact || 'low'
  })) as SentinelConfig[];
}

/**
 * Updates a sentinel configuration (Admin only).
 */
export async function updateSentinelConfig(
  key: string, 
  value: any, 
  userId: string,
  rolloutPercentage?: number,
  targetingRoles?: string[],
  allowedCountries?: string[],
  rateLimitOverrides?: Record<string, number>,
  expireAt?: string | null,
  broadcastOnDisable?: boolean,
  broadcastMessage?: string
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

  if (rolloutPercentage !== undefined) updateData.rollout_percentage = rolloutPercentage;
  if (targetingRoles !== undefined) updateData.targeting_roles = targetingRoles;
  if (allowedCountries !== undefined) updateData.allowed_countries = allowedCountries;
  if (rateLimitOverrides !== undefined) updateData.rate_limit_overrides = rateLimitOverrides;
  if (expireAt !== undefined) updateData.expire_at = expireAt;
  if (broadcastOnDisable !== undefined) updateData.broadcast_on_disable = broadcastOnDisable;
  if (broadcastMessage !== undefined) updateData.broadcast_message = broadcastMessage;

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
  const { data, error } = await supabase
    .from('sentinel_configs')
    .update({ 
      locked_by: userId,
      locked_at: new Date().toISOString()
    })
    .eq('key', key)
    .or(`locked_by.eq.${userId},locked_by.is.null,locked_at.lt.${new Date(Date.now() - 300000).toISOString()}`)
    .select('key');

  if (error) throw new Error("Gagal mengunci konfigurasi. Mungkin sudah dikunci admin lain.");
  if (!data || data.length === 0) throw new Error("Konfigurasi sedang dikunci oleh admin lain. Coba lagi dalam 5 menit.");
}

/**
 * AUTO-KILL SWITCH (Item 3)
 * Reports an error for a feature. Automatically disables if threshold is reached.
 */
export async function reportFeatureError(key: string): Promise<void> {
  // Fetch current state including metadata for safe merge
  const { data: config } = await supabase
    .from('sentinel_configs')
    .select('value, current_errors, error_threshold, metadata')
    .eq('key', key)
    .single();

  if (!config || !config.error_threshold) return;

  const prevErrors = config.current_errors || 0;
  const newErrors = prevErrors + 1;
  const updateData: any = {
    current_errors: newErrors,
    last_error_at: new Date().toISOString()
  };

  // If threshold reached, kill the feature
  if (newErrors >= config.error_threshold && config.value === true) {
    updateData.value = false;
    // Merge with existing metadata instead of overwriting
    const existingMeta = (typeof config.metadata === 'object' && config.metadata) ? config.metadata : {};
    updateData.metadata = { 
      ...existingMeta,
      auto_disabled: true, 
      reason: `Error threshold (${config.error_threshold}) exceeded.` 
    };
  }

  // Optimistic locking: only update if current_errors hasn't changed (mitigates race condition)
  await supabase
    .from('sentinel_configs')
    .update(updateData)
    .eq('key', key)
    .eq('current_errors', prevErrors);
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

/**
 * RELEASE LOCK (Item 6)
 * Explicitly releases a lock without saving changes.
 */
export async function releaseLock(key: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('sentinel_configs')
    .update({ 
      locked_by: null, 
      locked_at: null 
    })
    .eq('key', key)
    .eq('locked_by', userId) // Only the lock holder can release
    .select('key');

  if (error) throw new Error("Gagal melepas kunci konfigurasi.");
  if (!data || data.length === 0) throw new Error("Anda bukan pemilik kunci ini.");
}

/**
 * UPDATE ERROR THRESHOLD (Item 3)
 * Allows admin to configure the auto-kill threshold from the dashboard.
 */
export async function updateErrorThreshold(
  key: string, 
  threshold: number, 
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('sentinel_configs')
    .update({ 
      error_threshold: Math.max(0, Math.floor(threshold)),
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('key', key);

  if (error) {
    throw new Error(`Failed to update error threshold: ${error.message}`);
  }
}

/**
 * THREAT INTELLIGENCE ACTIONS
 */

export async function getBlockedIPs(): Promise<any[]> {
  const { data, error } = await supabase
    .from('sentinel_threat_intelligence')
    .select('*')
    .eq('is_blocked', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function unblockIP(ip: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('sentinel_threat_intelligence')
    .update({ 
      is_blocked: false,
      blocked_until: new Date().toISOString(), // Expire immediately
      metadata: { unblocked_by: userId, unblocked_at: new Date().toISOString() }
    })
    .eq('ip_address', ip);

  if (error) throw error;

  // Log the unblock action
  await supabase.from('sentinel_logs').insert({
    event_type: 'ip_unblock',
    ip_address: ip,
    user_id: userId,
    details: { action: 'manual_unblock' }
  });
}

export async function getSentinelLogs(limit: number = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from('sentinel_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

