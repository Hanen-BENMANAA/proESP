import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  first_name: string;
  last_name: string;
  specialty?: string;
  department?: string;
  graduation_year?: number;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
};

export type Report = {
  id: string;
  title: string;
  authors: { name: string; email: string }[];
  academic_supervisor: string;
  industrial_supervisor?: string;
  academic_year: string;
  specialty: string;
  department: string;
  keywords: string[];
  abstract: string;
  defense_date?: string;
  company?: string;
  pdf_url?: string;
  thumbnail_url?: string;
  video_url?: string;
  status: 'pending' | 'validated' | 'rejected';
  rejection_reason?: string;
  submitted_by: string;
  validated_by?: string;
  views_count: number;
  submitted_at: string;
  validated_at?: string;
  created_at: string;
  updated_at: string;
};

export type Draft = {
  id: string;
  user_id: string;
  draft_data: Record<string, unknown>;
  last_saved: string;
  created_at: string;
};

export type ValidationHistory = {
  id: string;
  report_id: string;
  validator_id: string;
  action: 'validated' | 'rejected' | 'modification_requested';
  comments?: string;
  checklist?: Record<string, boolean>;
  created_at: string;
};

export type Consultation = {
  id: string;
  report_id: string;
  user_id?: string;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  duration_seconds: number;
  watermark_text?: string;
  created_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  report_id: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
};
