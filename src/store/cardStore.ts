import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { createVirtualCard } from '@/lib/marqeta';
import type { VirtualCard } from '@/lib/supabase';

interface CardState {
  cards: VirtualCard[];
  loading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  createCard: () => Promise<void>;
  freezeCard: (cardId: string) => Promise<void>;
  unfreezeCard: (cardId: string) => Promise<void>;
  cancelCard: (cardId: string) => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  loading: false,
  error: null,

  fetchCards: async () => {
    try {
      set({ loading: true, error: null });
      const { data: cards, error } = await supabase
        .from('virtual_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ cards: cards || [] });
    } catch (error) {
      set({ error: 'Failed to fetch cards' });
    } finally {
      set({ loading: false });
    }
  },

  createCard: async () => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const cardDetails = await createVirtualCard(user.id);
      
      const { error } = await supabase
        .from('virtual_cards')
        .insert({
          user_id: user.id,
          card_number: cardDetails.cardNumber,
          expiry_date: cardDetails.expiryDate,
          cvv: cardDetails.cvv
        });

      if (error) throw error;
      await get().fetchCards();
    } catch (error) {
      set({ error: 'Failed to create card' });
    } finally {
      set({ loading: false });
    }
  },

  freezeCard: async (cardId: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('virtual_cards')
        .update({ status: 'frozen' })
        .eq('id', cardId);

      if (error) throw error;
      await get().fetchCards();
    } catch (error) {
      set({ error: 'Failed to freeze card' });
    } finally {
      set({ loading: false });
    }
  },

  unfreezeCard: async (cardId: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('virtual_cards')
        .update({ status: 'active' })
        .eq('id', cardId);

      if (error) throw error;
      await get().fetchCards();
    } catch (error) {
      set({ error: 'Failed to unfreeze card' });
    } finally {
      set({ loading: false });
    }
  },

  cancelCard: async (cardId: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('virtual_cards')
        .update({ status: 'cancelled' })
        .eq('id', cardId);

      if (error) throw error;
      await get().fetchCards();
    } catch (error) {
      set({ error: 'Failed to cancel card' });
    } finally {
      set({ loading: false });
    }
  },
}));