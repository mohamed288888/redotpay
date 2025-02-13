/*
  # Add Cryptocurrency Wallet Support

  1. New Tables
    - `crypto_wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tron_address` (text, unique)
      - `usdt_balance` (decimal)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. New Types
    - `crypto_transaction_type` ENUM for deposit/withdrawal
    - `crypto_transaction_status` ENUM for transaction states

  3. Security
    - Enable RLS on new tables
    - Add policies for wallet access and transactions
*/

-- Create new ENUM types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crypto_transaction_type') THEN
        CREATE TYPE crypto_transaction_type AS ENUM ('deposit', 'withdrawal');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crypto_transaction_status') THEN
        CREATE TYPE crypto_transaction_status AS ENUM ('pending', 'completed', 'failed');
    END IF;
END$$;

-- Create crypto wallets table
CREATE TABLE IF NOT EXISTS crypto_wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    tron_address text UNIQUE NOT NULL,
    usdt_balance decimal DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create crypto transactions table
CREATE TABLE IF NOT EXISTS crypto_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id uuid REFERENCES crypto_wallets ON DELETE CASCADE NOT NULL,
    type crypto_transaction_type NOT NULL,
    amount decimal NOT NULL,
    status crypto_transaction_status DEFAULT 'pending',
    tx_hash text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own wallet"
    ON crypto_wallets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
    ON crypto_transactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM crypto_wallets
            WHERE crypto_wallets.id = crypto_transactions.wallet_id
            AND crypto_wallets.user_id = auth.uid()
        )
    );

-- Function to create wallet on user creation
CREATE OR REPLACE FUNCTION create_crypto_wallet()
RETURNS trigger AS $$
DECLARE
    wallet_address text;
BEGIN
    -- Generate a unique TRON address (this is a placeholder - you'll need to implement actual address generation)
    wallet_address := 'T' || encode(gen_random_bytes(20), 'hex');
    
    INSERT INTO crypto_wallets (user_id, tron_address)
    VALUES (new.id, wallet_address);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for wallet creation
CREATE TRIGGER on_auth_user_created_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_crypto_wallet();