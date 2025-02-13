import React from 'react';
import { useCardStore } from '@/store/cardStore';
import { PlusIcon, PauseIcon, PlayIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Cards() {
  const { cards, loading, error, fetchCards, createCard, freezeCard, unfreezeCard, cancelCard } = useCardStore();

  React.useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Virtual Cards</h1>
        <button
          onClick={() => createCard()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Create New Card
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-gray-500">Card Number</div>
                  <div className="mt-1 text-lg font-semibold">
                    •••• •••• •••• {card.card_number.slice(-4)}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    card.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : card.status === 'frozen'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {card.status}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-gray-500">Expiry Date</div>
                <div className="mt-1">{card.expiry_date}</div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-gray-500">Balance</div>
                <div className="mt-1">
  ${card.balance ? Number(card.balance).toFixed(2) : "0.00"}
</div>

              </div>
            </div>

            <div className="px-4 py-4 sm:px-6">
              <div className="flex justify-end space-x-3">
                {card.status !== 'cancelled' && (
                  <>
                    {card.status === 'active' ? (
                      <button
                        onClick={() => freezeCard(card.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <PauseIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                        Freeze
                      </button>
                    ) : (
                      <button
                        onClick={() => unfreezeCard(card.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <PlayIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                        Unfreeze
                      </button>
                    )}
                    <button
                      onClick={() => cancelCard(card.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XMarkIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No virtual cards</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new virtual card.</p>
        </div>
      )}
    </div>
  );
}