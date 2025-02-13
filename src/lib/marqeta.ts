import axios from 'axios';

const MARQETA_BASE_URL = import.meta.env.VITE_MARQETA_BASE_URL;
const MARQETA_API_KEY = import.meta.env.VITE_MARQETA_API_KEY;
const MARQETA_SECRET = import.meta.env.VITE_MARQETA_SECRET;

const marqetaClient = axios.create({
  baseURL: MARQETA_BASE_URL,
  auth: {
    username: MARQETA_API_KEY,
    password: MARQETA_SECRET
  }
});

export const createVirtualCard = async (userId: string) => {
  try {
    const response = await marqetaClient.post('/cards', {
      user_token: userId,
      card_product_token: 'default_card_product',
      fulfillment: {
        payment_instrument: 'VIRTUAL_PAN'
      }
    });
    
    return {
      cardNumber: response.data.pan,
      expiryDate: `${response.data.expiration_month}/${response.data.expiration_year}`,
      cvv: response.data.cvv_number
    };
  } catch (error) {
    console.error('Error creating virtual card:', error);
    throw new Error('Failed to create virtual card');
  }
};