import React from 'react'
import { useCryptoStore } from '@/store/cryptoStore'
import { useForm } from 'react-hook-form'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

type TransactionForm = {
  amount: number
  toAddress?: string
}

export default function Wallet() {
  const { wallet, transactions, loading, error, fetchWallet, fetchTransactions, initiateDeposit, initiateWithdrawal } = useCryptoStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransactionForm>()
  const [mode, setMode] = React.useState<'deposit' | 'withdrawal'>('deposit')

  React.useEffect(() => {
    fetchWallet()
    fetchTransactions()
  }, [fetchWallet, fetchTransactions])

  const onSubmit = async (data: TransactionForm) => {
    try {
      if (mode === 'deposit') {
        await initiateDeposit(data.amount)
      } else {
        if (!data.toAddress) return
        await initiateWithdrawal(data.amount, data.toAddress)
      }
      reset()
    } catch (error) {
      console.error('Transaction error:', error)
    }
  }

  if (loading && !wallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">USDT Wallet (TRON Network)</h3>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Wallet Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {wallet?.tron_address}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">USDT Balance</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {wallet?.usdt_balance.toFixed(2)} USDT
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setMode('deposit')}
              className={`px-4 py-2 rounded-md ${
                mode === 'deposit'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setMode('withdrawal')}
              className={`px-4 py-2 rounded-md ${
                mode === 'withdrawal'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Withdraw
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (USDT)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: true, min: 0.01 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid amount</p>
              )}
            </div>

            {mode === 'withdrawal' && (
              <div>
                <label htmlFor="toAddress" className="block text-sm font-medium text-gray-700">
                  To Address (TRON)
                </label>
                <input
                  type="text"
                  {...register('toAddress', { required: mode === 'withdrawal' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.toAddress && (
                  <p className="mt-1 text-sm text-red-600">Please enter a valid TRON address</p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {mode === 'deposit' ? 'Deposit USDT' : 'Withdraw USDT'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction History</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <li key={tx.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {tx.type === 'deposit' ? (
                      <ArrowDownIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUpIcon className="h-5 w-5 text-red-500" />
                    )}
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm ${
                      tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'deposit' ? '+' : '-'}{tx.amount} USDT
                    </span>
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      tx.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
                {tx.tx_hash && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">
                      TX: {tx.tx_hash}
                    </span>
                  </div>
                )}
              </li>
            ))}
            {transactions.length === 0 && (
              <li className="px-4 py-4 text-sm text-gray-500 text-center">
                No transactions yet
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}