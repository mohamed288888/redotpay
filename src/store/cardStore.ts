import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export interface VirtualCard {
  id: string;
  card_number: string;
  expiry_date: string;
  status: 'active' | 'frozen' | 'cancelled';
  balance: number;
}

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

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { 'Content-Type': 'application/json' }
});

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
      console.error('❌ Error fetching cards:', error);
      set({ error: 'Failed to fetch cards' });
    } finally {
      set({ loading: false });
    }
  },

  createCard: async () => {
    try {
      set({ loading: true, error: null });
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(authError.message);
      if (!user) throw new Error("No user logged in");

      console.log("🔹 Sending request to backend...");
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/create-card`, { 
        userId: user.id
      });
            
      console.log("✅ Response from backend:", response.data);
      const { last_four, expiration, token } = response.data;
      if (!token) throw new Error("Invalid card data received from backend");
      
      const { error } = await supabase.from("virtual_cards").insert({
        user_id: user.id,
        card_token: token,
        card_number: `**** **** **** ${last_four}`,
        expiry_date: expiration,
        status: "active",
      });
      
      if (error) throw new Error(error.message);
      await get().fetchCards();
    } catch (error) {
      console.error("❌ Error creating card:", error);
      set({ error: (error as any).message || "Failed to create card" });
    } finally {
      set({ loading: false });
    }
  },

  freezeCard: async (cardId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post('/api/freeze-card', { cardId });
      if (!response.data.success) throw new Error("Failed to freeze card");
      await get().fetchCards();
    } catch (error) {
      console.error('❌ Error freezing card:', error);
      set({ error: 'Failed to freeze card' });
    } finally {
      set({ loading: false });
    }
  },

  unfreezeCard: async (cardId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post('/api/unfreeze-card', { cardId });
      if (!response.data.success) throw new Error("Failed to unfreeze card");
      await get().fetchCards();
    } catch (error) {
      console.error('❌ Error unfreezing card:', error);
      set({ error: 'Failed to unfreeze card' });
    } finally {
      set({ loading: false });
    }
  },

  cancelCard: async (cardId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post('/api/cancel-card', { cardId });
      if (!response.data.success) throw new Error("Failed to cancel card");
      await get().fetchCards();
    } catch (error) {
      console.error('❌ Error canceling card:', error);
      set({ error: 'Failed to cancel card' });
    } finally {
      set({ loading: false });
    }
  }, 
}));
