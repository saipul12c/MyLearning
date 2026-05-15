"use server";

import { issueSentinelVerificationToken } from "@/lib/sentinel/actions";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getSignedSentinelToken(accessKey?: string) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const ua = headersList.get('user-agent') || '';

  // Verify access key if required (High Security Mode)
  const EXPECTED_KEY = process.env.SENTINEL_ACCESS_KEY; // Fallback for dev

  if (accessKey !== EXPECTED_KEY) {
    throw new Error("Invalid Sentinel Access Key");
  }

  return await issueSentinelVerificationToken(ip, ua);
}

/**
 * Tracks failed login attempts and triggers auto-lockdown if threshold is reached.
 */
export async function recordFailedLoginAttempt(email: string) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';

  // 0. Check IP Whitelist
  const { data: config } = await supabase
    .from('sentinel_configs')
    .select('value')
    .eq('key', 'ip_whitelist')
    .single();
  
  const whitelist = config?.value as string[] || [];
  if (whitelist.includes(ip)) {
    return { blocked: false, whitelisted: true };
  }

  // 1. Log the attempt
  // Note: This requires a DB function increment_login_attempt
  const { data, error } = await supabase.rpc('increment_login_attempt', { 
    p_ip: ip, 
    p_email: email 
  });

  // 2. Check if threshold reached (5 attempts)
  if (data >= 5) {
    await supabase.from('sentinel_threat_intelligence').upsert({
      ip_address: ip,
      threat_level: 'high',
      reason: `Auto-Lockdown: Multiple failed login attempts (${email})`,
      is_blocked: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Block for 24h
    }, { onConflict: 'ip_address' });
    
    return { blocked: true };
  }

  return { blocked: false, attempts: data };
}

