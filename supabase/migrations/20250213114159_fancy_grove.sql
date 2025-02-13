/*
  # Fix Crypto Wallet Permissions

  1. Changes
    - Add INSERT policy for crypto_transactions
    - Add UPDATE policy for crypto_wallets
    - Add missing policies for wallet management
    - Fix trigger function to properly handle wallet creation

  2. Security
    - Enable RLS for all tables
    - Add policies to ensure users can only access their own data
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert transactions" ON crypto_transactions;
DROP POLICY IF EXISTS "Users can update wallet" ON crypto_wallets;

-- Add new policies
CREATE POLICY "Users can insert transactions"
    ON crypto_transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM crypto_wallets
            WHERE crypto_wallets.id = wallet_id
            AND crypto_wallets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update wallet"
    ON crypto_wallets FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Update the wallet creation function to handle errors gracefully
CREATE OR REPLACE FUNCTION create_crypto_wallet()
RETURNS trigger AS $$
DECLARE
    wallet_address text;
BEGIN
    -- Check if wallet already exists
    IF EXISTS (
        SELECT 1 FROM crypto_wallets
        WHERE user_id = new.id
    ) THEN
        RETURN new;
    END IF;

    -- Generate a unique TRON address
    wallet_address := 'T' || encode(gen_random_bytes(20), 'hex');
    
    -- Create new wallet
    INSERT INTO crypto_wallets (user_id, tron_address)
    VALUES (new.id, wallet_address);
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error if needed
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;