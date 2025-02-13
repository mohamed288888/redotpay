import axios from 'axios';

// جلب متغيرات البيئة من Vite
const MARQETA_BASE_URL = import.meta.env.VITE_MARQETA_BASE_URL;
const MARQETA_API_KEY = import.meta.env.VITE_MARQETA_API_KEY;
const MARQETA_SECRET = import.meta.env.VITE_MARQETA_SECRET;

// التحقق من أن جميع المتغيرات موجودة
if (!MARQETA_BASE_URL || !MARQETA_API_KEY || !MARQETA_SECRET) {
  console.error('Error: Missing Marqeta environment variables.');
  throw new Error('Please set VITE_MARQETA_BASE_URL, VITE_MARQETA_API_KEY, and VITE_MARQETA_SECRET in .env file');
}

// إنشاء عميل Axios مع التوثيق الأساسي
const marqetaClient = axios.create({
  baseURL: MARQETA_BASE_URL,
  auth: {
    username: MARQETA_API_KEY,
    password: MARQETA_SECRET
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

// دالة لإنشاء كارت افتراضي لمستخدم معين
interface VirtualCardResponse {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

interface MarqetaCardResponse {
  pan: string;
  expiration_month: string;
  expiration_year: string;
  cvv_number: string;
}

export const createVirtualCard = async (userId: string): Promise<VirtualCardResponse> => {
  try {
    const response = await marqetaClient.post<MarqetaCardResponse>('/cards', {
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
    if (axios.isAxiosError(error)) {
      console.error('Error creating virtual card:', error.response?.data || error.message);
    } else {
      console.error('Error creating virtual card:', (error as Error).message);
    }
    throw new Error('Failed to create virtual card');
  }
};
