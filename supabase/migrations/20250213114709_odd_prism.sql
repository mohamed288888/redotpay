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
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

    -- Check if wallet already exists
    IF NOT EXISTS (
        SELECT 1 FROM public.crypto_wallets
        WHERE user_id = NEW.id
    ) THEN
        -- Generate wallet address and create wallet
        wallet_address := 'T' || encode(gen_random_bytes(20), 'hex');
        
        INSERT INTO public.crypto_wallets (user_id, tron_address)
        VALUES (NEW.id, wallet_address);
    END IF;

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

-- Ensure all existing users have profiles and wallets
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id 
        FROM auth.users 
        WHERE id NOT IN (SELECT id FROM public.profiles)
    LOOP
        -- Create missing profile
        INSERT INTO public.profiles (id)
        VALUES (user_record.id)
        ON CONFLICT (id) DO NOTHING;

        -- Create missing wallet if needed
        IF NOT EXISTS (
            SELECT 1 FROM public.crypto_wallets
            WHERE user_id = user_record.id
        ) THEN
            INSERT INTO public.crypto_wallets (user_id, tron_address)
            VALUES (
                user_record.id,
                'T' || encode(gen_random_bytes(20), 'hex')
            );
        END IF;
    END LOOP;
END;
$$;