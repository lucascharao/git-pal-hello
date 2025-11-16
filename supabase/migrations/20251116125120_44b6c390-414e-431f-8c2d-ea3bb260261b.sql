-- Remove a política que permite leitura pública de e-mails
DROP POLICY IF EXISTS "Anyone can check if email is freemium" ON public.freemium_users;

-- A função is_freemium_user já existe e usa SECURITY DEFINER
-- Ela pode ser chamada pelas edge functions com segurança
-- Não é necessário acesso direto à tabela freemium_users pelo cliente

-- Garantir que a tabela freemium_users não tem acesso público
-- (RLS já está habilitado, apenas removemos a política pública)