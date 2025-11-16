// Sistema de Audit Logging
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

interface AuditLogParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(
  supabaseClient: any,
  params: AuditLogParams
): Promise<void> {
  try {
    const { error } = await supabaseClient.rpc('log_audit', {
      p_action: params.action,
      p_resource_type: params.resourceType,
      p_resource_id: params.resourceId || null,
      p_metadata: params.metadata || null,
    });

    if (error) {
      console.error('Failed to log audit:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}
