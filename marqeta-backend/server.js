import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";

// تحميل متغيرات البيئة
dotenv.config();

// إنشاء تطبيق Express
const app = express();
app.use(express.json());
app.use(cors());

const MARQETA_BASE_URL = process.env.MARQETA_BASE_URL;
const MARQETA_API_KEY = process.env.MARQETA_API_KEY;
const MARQETA_SECRET = process.env.MARQETA_SECRET;

// تأكد أن جميع القيم البيئية تم تحميلها
if (!MARQETA_BASE_URL || !MARQETA_API_KEY || !MARQETA_SECRET) {
  console.error("❌ خطأ: تأكد من ضبط متغيرات البيئة في ملف .env");
  process.exit(1);
}

const marqetaClient = axios.create({
  baseURL: MARQETA_BASE_URL,
  auth: {
    username: MARQETA_API_KEY,
    password: MARQETA_SECRET,
  },
});

// اختبار الاتصال بـ Marqeta
app.get("/api/test", async (req, res) => {
  try {
    const response = await marqetaClient.get("/ping");
    res.json({ success: true, message: response.data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response?.data || error.message });
  }
});

const checkUserExists = async (userId) => {
  try {
    const response = await marqetaClient.get(`/users/${userId}`);
    return response.data; // المستخدم موجود
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // المستخدم غير موجود
    }
    throw error;
  }
};

const createUserIfNotExists = async (userId) => {
  const userExists = await checkUserExists(userId);
  if (!userExists) {
    console.log("🔹 User not found, creating new user in Marqeta...");
    const response = await marqetaClient.post("/users", {
      token: userId,
      first_name: "Default",
      last_name: "User",
      email: `user_${userId}@example.com`,
      active: true,
      address: {  
        address1: "123 Main St",
        city: "Cairo",
        state: "C",
        postal_code: "12345",
        country_code: "EG"
      }
    });
    return response.data;
  }
  return userExists;
};

// تعديل `/api/create-card`
app.post("/api/create-card", async (req, res) => {
  console.log("📥 Received request body:", req.body);
  const { userId } = req.body;

  if (!userId) {
    console.error("❌ Missing userId in request body");
    return res.status(400).json({ success: false, error: "userId is required" });
  }

  try {
    const user = await createUserIfNotExists(userId);  

    console.log("🔹 Creating card for userId:", userId);
    const response = await marqetaClient.post("/cards", {
      user_token: user.token, 
      card_product_token: "4ced22ea-0d16-4e75-acf7-b877b63d0719",
      fulfillment: {
        card_fulfillment_reason: "NEW",
        shipping: {  
          recipient_address: {
            address1: "123 Main St",
            city: "Cairo",
            state: "C",
            postal_code: "12345",
            country: "EG"  // 🔹 استبدال country_code بـ country
          }
        }
      }
    });

    console.log("✅ Card created successfully:", response.data);
    res.json({
      success: true,
      token: response.data.token,
      last_four: response.data.last_four,
      expiryDate: `${response.data.expiration_month}/${response.data.expiration_year}`,
      cvv: response.data.cvv_number,
    });

  } catch (error) {
    console.error("❌ Error creating card:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});



// إنشاء كارت افتراضي
app.post("/api/create-card", async (req, res) => {
  console.log("📥 Received request body:", req.body); // عرض كل البيانات القادمة
  const { userId } = req.body; // استخراج userId

  if (!userId) {
    console.error("❌ Missing userId in request body");
    return res
      .status(400)
      .json({ success: false, error: "userId is required" });
  }

  try {
    console.log("🔹 Creating card for userId:", userId);
    const response = await marqetaClient.post("/cards", {
      user_token: userId,
      card_product_token: "4ced22ea-0d16-4e75-acf7-b877b63d0719",
      fulfillment: {
        card_fulfillment_reason: "NEW",
      },
    });

    console.log("✅ Card created successfully:", response.data);
    res.json({
      success: true,
      token: response.data.token,
      last_four: response.data.last_four,
      expiryDate: `${response.data.expiration_month}/${response.data.expiration_year}`,
      cvv: response.data.cvv_number,
    });
  } catch (error) {
    console.error(
      "❌ Error creating card:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ success: false, error: error.response?.data || error.message });
  }
});

// تشغيل الخادم
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
