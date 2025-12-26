import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

/**
 * Plano pago removido: todos os usuários têm acesso ilimitado.
 * Mantemos `quoteCount` apenas como informação (não limita nada).
 */
export const useQuoteLimit = () => {
  const { user } = useAuth();
  const [quoteCount, setQuoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setQuoteCount(0);
        setLoading(false);
        return;
      }

      try {
        const { data: quotes } = await supabase
          .from('quotes')
          .select('id')
          .eq('user_id', user.id);

        setQuoteCount(quotes?.length || 0);
      } catch (error) {
        console.error('Error checking quote count:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const refreshQuoteLimit = async () => {
    if (!user) return;

    try {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id')
        .eq('user_id', user.id);

      setQuoteCount(quotes?.length || 0);
    } catch (error) {
      console.error('Error refreshing quote count:', error);
    }
  };

  return {
    canCreateQuote: true,
    isFreemium: true,
    quoteCount,
    loading,
    refreshQuoteLimit,
  };
};
