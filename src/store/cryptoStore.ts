import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { CryptoWallet, CryptoTransaction } from '@/lib/supabase'

interface CryptoState {
  wallet: CryptoWallet | null
  transactions: CryptoTransaction[]
  loading: boolean
  error: string | null
  fetchWallet: () => Promise<void>
  fetchTransactions: () => Promise<void>
  initiateDeposit: (amount: number) => Promise<void>
  initiateWithdrawal: (amount: number, toAddress: string) => Promise<void>
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  wallet: null,
  transactions: [],
  loading: false,
  error: null,

  fetchWallet: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ error: 'Please sign in to access your wallet' })
        return
      }

      const { data: wallet, error } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Wallet fetch error:', error)
        set({ error: 'Failed to fetch wallet' })
        return
      }

      set({ wallet, error: null })
    } catch (error) {
      console.error('Wallet fetch error:', error)
      set({ error: 'Failed to fetch wallet' })
    } finally {
      set({ loading: false })
    }
  },

  fetchTransactions: async () => {
    try {
      const { wallet } = get()
      if (!wallet) {
        set({ transactions: [] })
        return
      }

      const { data: transactions, error } = await supabase
        .from('crypto_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Transactions fetch error:', error)
        set({ error: 'Failed to fetch transactions' })
        return
      }

      set({ transactions: transactions || [], error: null })
    } catch (error) {
      console.error('Transactions fetch error:', error)
      set({ error: 'Failed to fetch transactions' })
    }
  },

  initiateDeposit: async (amount: number) => {
    try {
      const { wallet } = get()
      if (!wallet) {
        set({ error: 'Wallet not found' })
        return
      }

      const { error } = await supabase
        .from('crypto_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'deposit',
          amount,
          status: 'pending'
        })

      if (error) {
        console.error('Deposit error:', error)
        set({ error: 'Failed to initiate deposit' })
        return
      }

      await get().fetchTransactions()
      await get().fetchWallet()
      set({ error: null })
    } catch (error) {
      console.error('Deposit error:', error)
      set({ error: 'Failed to initiate deposit' })
    }
  },

  initiateWithdrawal: async (amount: number, toAddress: string) => {
    try {
      const { wallet } = get()
      if (!wallet) {
        set({ error: 'Wallet not found' })
        return
      }

      if (wallet.usdt_balance < amount) {
        set({ error: 'Insufficient balance' })
        return
      }

      const { error } = await supabase
        .from('crypto_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'withdrawal',
          amount,
          status: 'pending',
          tx_hash: null, // Will be updated by backend process
          to_address: toAddress
        })

      if (error) {
        console.error('Withdrawal error:', error)
        set({ error: 'Failed to initiate withdrawal' })
        return
      }

      await get().fetchTransactions()
      await get().fetchWallet()
      set({ error: null })
    } catch (error) {
      console.error('Withdrawal error:', error)
      set({ error: 'Failed to initiate withdrawal' })
    }
  },
}))