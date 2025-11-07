-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Project data
  client_value TEXT NOT NULL,
  client_size TEXT NOT NULL,
  duration INTEGER NOT NULL,
  complexity TEXT NOT NULL,
  urgency TEXT NOT NULL,
  integration_needs TEXT NOT NULL,
  security_level TEXT NOT NULL,
  team_size INTEGER NOT NULL,
  team_seniority TEXT NOT NULL,
  support_level TEXT NOT NULL,
  desired_margin INTEGER NOT NULL,
  annual_revenue TEXT NOT NULL,
  process_to_optimize TEXT NOT NULL,
  time_spent INTEGER NOT NULL,
  people_involved INTEGER NOT NULL,
  estimated_loss DECIMAL NOT NULL,
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Quote results
  implementation_fee DECIMAL NOT NULL,
  recurring_fee DECIMAL NOT NULL,
  reasoning TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create counter_offers table
CREATE TABLE public.counter_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  
  -- Client counter offer
  client_implementation DECIMAL NOT NULL,
  client_recurring DECIMAL NOT NULL,
  
  -- Analysis
  recommendation TEXT NOT NULL CHECK (recommendation IN ('ACCEPT', 'COUNTER', 'DECLINE')),
  analysis TEXT NOT NULL,
  suggested_response TEXT NOT NULL,
  
  -- New offer (if COUNTER or ACCEPT)
  new_implementation_fee DECIMAL,
  new_recurring_fee DECIMAL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counter_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotes
CREATE POLICY "Users can view their own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON public.quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON public.quotes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for counter_offers
CREATE POLICY "Users can view counter offers for their quotes"
  ON public.counter_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = counter_offers.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert counter offers for their quotes"
  ON public.counter_offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = counter_offers.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view chat messages for their quotes"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = chat_messages.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chat messages for their quotes"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = chat_messages.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX idx_counter_offers_quote_id ON public.counter_offers(quote_id);
CREATE INDEX idx_chat_messages_quote_id ON public.chat_messages(quote_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quotes updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();