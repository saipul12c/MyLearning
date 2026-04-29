export type SentinelCategory = 'security' | 'feature' | 'system' | 'general';

export interface SentinelConfig {
  key: string;
  value: any;
  pending_value?: any;
  release_at?: string;
  rollout_percentage: number;
  targeting_roles: string[];
  description: string;
  category: SentinelCategory;
  is_public: boolean;
  metadata: {
    changelog?: string;
    impact?: 'low' | 'medium' | 'high' | 'critical';
    devNotes?: string;
    proposedVersion?: string;
  };
  dependencies?: string[];
  error_threshold?: number;
  current_errors?: number;
  last_error_at?: string;
  locked_by?: string;
  locked_at?: string;
  updated_at: string;
  updated_by?: string;
}

export type SentinelState = Record<string, any>;
