/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.39.0'
    }
  },
  db: {
    schema: 'public'
  }
})

export type Profile = {
  id: string
  full_name: string | null
  phone_number: string | null
  kyc_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export type VirtualCard = {
  id: string
  user_id: string
  card_number: string
  expiry_date: string
  cvv: string
  status: 'active' | 'frozen' | 'cancelled'
  balance: number
  created_at: string
  updated_at: string
}

export type CryptoWallet = {
  id: string
  user_id: string
  tron_address: string
  usdt_balance: number
  created_at: string
  updated_at: string
}

export type CryptoTransaction = {
  id: string
  wallet_id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  tx_hash: string | null
  created_at: string
  updated_at: string
}

export type Transaction = {
  id: string
  user_id: string
  card_id: string | null
  amount: number
  type: 'deposit' | 'withdrawal' | 'payment'
  status: 'pending' | 'completed' | 'failed'
  description: string | null
  created_at: string
}