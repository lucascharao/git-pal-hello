import { supabase } from '@/integrations/supabase/client';

interface AuditLogParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook para registrar ações de auditoria
 */
export const useAuditLog = () => {
  const logAction = async (params: AuditLogParams) => {
    try {
      const { error } = await supabase.rpc('log_audit', {
        p_action: params.action,
        p_resource_type: params.resourceType,
        p_resource_id: params.resourceId || null,
        p_metadata: params.metadata ? params.metadata : null,
      });

      if (error) {
        console.error('Failed to log audit:', error);
      }
    } catch (err) {
      console.error('Audit logging error:', err);
    }
  };

  return { logAction };
};
