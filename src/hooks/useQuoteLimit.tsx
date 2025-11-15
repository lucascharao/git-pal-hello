import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const useQuoteLimit = () => {
  const { user } = useAuth();
  const [canCreateQuote, setCanCreateQuote] = useState(true);
  const [isFreemium, setIsFreemium] = useState(false);
  const [quoteCount, setQuoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkQuoteLimit = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user's profile to check email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        // Check if user is freemium
        const { data: freemiumCheck } = await supabase
          .from('freemium_users')
          .select('email')
          .eq('email', profile.email)
          .maybeSingle();

        const isFreemiumUser = !!freemiumCheck;
        setIsFreemium(isFreemiumUser);

        // If freemium, user can always create quotes
        if (isFreemiumUser) {
          setCanCreateQuote(true);
          setLoading(false);
          return;
        }

        // For non-freemium users, check quote count
        const { data: quotes } = await supabase
          .from('quotes')
          .select('id')
          .eq('user_id', user.id);

        const count = quotes?.length || 0;
        setQuoteCount(count);
        
        // Non-freemium users can only create 1 quote
        setCanCreateQuote(count < 1);
      } catch (error) {
        console.error('Error checking quote limit:', error);
      } finally {
        setLoading(false);
      }
    };

    checkQuoteLimit();
  }, [user]);

  const refreshQuoteLimit = async () => {
    if (!user) return;

    try {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id')
        .eq('user_id', user.id);

      const count = quotes?.length || 0;
      setQuoteCount(count);
      
      if (!isFreemium) {
        setCanCreateQuote(count < 1);
      }
    } catch (error) {
      console.error('Error refreshing quote limit:', error);
    }
  };

  return {
    canCreateQuote,
    isFreemium,
    quoteCount,
    loading,
    refreshQuoteLimit,
  };
};
