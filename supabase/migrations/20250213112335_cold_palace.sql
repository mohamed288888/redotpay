/*
  # Initial Schema Setup for RedotPay Clone

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - full_name (text)
      - phone_number (text)
      - kyc_status (enum: pending, approved, rejected)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - virtual_cards
      - id (uuid)
      - user_id (uuid, references auth.users)
      - card_number (text)
      - expiry_date (text)
      - cvv (text)
      - status (enum: active, frozen, cancelled)
      - balance (decimal)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - transactions
      - id (uuid)
      - user_id (uuid, references auth.users)
      - card_id (uuid, references virtual_cards)
      - amount (decimal)
      - type (enum: deposit, withdrawal, payment)
      - status (enum: pending, completed, failed)
      - description (text)
      - created_at (timestamp)
    
    - kyc_documents
      - id (uuid)
      - user_id (uuid, references auth.users)
      - document_type (enum: passport, id_card, driving_license)
      - document_url (text)
      - status (enum: pending, approved, rejected)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Secure document storage
*/

-- Create custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
        CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_status') THEN
        CREATE TYPE card_status AS ENUM ('active', 'frozen', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'payment');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM ('passport', 'id_card', 'driving_license');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  phone_number text,
  kyc_status kyc_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS virtual_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  card_number text NOT NULL,
  expiry_date text NOT NULL,
  cvv text NOT NULL,
  status card_status DEFAULT 'active',
  balance decimal DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  card_id uuid REFERENCES virtual_cards ON DELETE SET NULL,
  amount decimal NOT NULL,
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  document_type document_type NOT NULL,
  document_url text NOT NULL,
  status document_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (idempotent)
DO $$
BEGIN
    EXECUTE 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE transactions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY';
EXCEPTION
    WHEN OTHERS THEN NULL;
END$$;

-- Drop existing policies if they exist and create new ones
DO $$
BEGIN
    -- Profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);

    -- Virtual cards policies
    DROP POLICY IF EXISTS "Users can view own cards" ON virtual_cards;
    DROP POLICY IF EXISTS "Users can manage own cards" ON virtual_cards;
    
    CREATE POLICY "Users can view own cards"
      ON virtual_cards FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own cards"
      ON virtual_cards FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);

    -- Transactions policies
    DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
    
    CREATE POLICY "Users can view own transactions"
      ON transactions FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create transactions"
      ON transactions FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    -- KYC documents policies
    DROP POLICY IF EXISTS "Users can view own documents" ON kyc_documents;
    DROP POLICY IF EXISTS "Users can upload documents" ON kyc_documents;
    
    CREATE POLICY "Users can view own documents"
      ON kyc_documents FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can upload documents"
      ON kyc_documents FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
END$$;

-- Create or replace function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();