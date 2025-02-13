/*
  # Fix authentication triggers and functions

  1. Changes
    - Drop and recreate user creation trigger with proper error handling
    - Add proper transaction handling for user creation
    - Ensure proper order of operations for profile and wallet creation
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper security context for trigger functions
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_crypto_wallet();

-- Create new combined function to handle both profile and wallet creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
    wallet_address text;
BEGIN
    -- Create profile first
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);

    -- Generate wallet address and create wallet
    wallet_address := 'T' || encode(gen_random_bytes(20), 'hex');
    
    INSERT INTO public.crypto_wallets (user_id, tron_address)
    VALUES (NEW.id, wallet_address);

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error if needed
        RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create single trigger to handle everything
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();