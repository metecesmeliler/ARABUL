import { ChatRequest, ChatResponse } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CONFIG from "../../config.ts";

// const BASE_URL = "http://10.144.228.195:8000"; // Telefonda açacaksan
// const BASE_URL = "http://10.143.30.30:8000"; // Emulator'de açacaksan

// CONFIG'deki API_BASE_URL'yi kullanın:
const BASE_URL = CONFIG.API_BASE_URL; 

// API istekleri için timeout ekleyin - 10 saniye
const TIMEOUT_MS = 10000;

// Basit timeout ile fetch fonksiyonu
const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

async function getFavorites(userId: number) {
  try {
    console.log(`Getting favorites for user ${userId} from ${BASE_URL}/favorites/${userId}`);
    const response = await fetchWithTimeout(`${BASE_URL}/favorites/${userId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get favorites: ${errorText}`);
      throw new Error("Favoriler alınamadı.");
    }
    
    const data = await response.json();
    console.log(`Retrieved favorites: `, data);
    return data.favorites;
  } catch (error) {
    console.error(`Get favorites exception:`, error);
    throw error;
  }
}

// Auth işlemleri
export const authService = {
googleAuth: async (token: string, platform: string = "android") => {
  try {
    console.log(`Sending Google auth request to ${BASE_URL}/google-auth with platform=${platform}`);
    
    // 15 saniye timeout olarak ayarlayalım
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/google-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, platform }),
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Hata durumunda, yanıtın içeriğini al
        let errorDetail = "Unknown error";
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
          // JSON parse edilemezse, yanıtın text halini al
          errorDetail = await response.text();
        }
        
        console.error(`Backend error (${response.status}): ${errorDetail}`);
        throw new Error(`${response.status} - ${errorDetail}`);
      }
      
      const data = await response.json();
      console.log("Google auth response:", data);
      
      // Note: User data storage is now handled by AuthContext
      if (!data.user_id) {
        console.warn("No user_id received in Google auth response");
      }
      
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Google authentication error:", error);
    
    // Hata türüne göre işlem yapalım
    if (error.name === 'AbortError') {
      console.log("Request aborted (timeout or user cancel)");
      throw new Error("Bağlantı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.");
    }
    
    // Test ortamı için: sadece development ortamında başarılı gibi davranın
    if (__DEV__) {
      console.log("Development ortamında mock yanıt dönüyoruz");
      return {
        message: "Test Google login successful",
        user_id: 1,
        is_new_user: false
      };
    } else {
      throw error;
    }
  }
},
  login: async (email: string, password: string) => {
    try {
      console.log(`Attempting login for ${email} at ${BASE_URL}/login`);
      
      const response = await fetchWithTimeout(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.detail || "Login failed");
        } catch (parseError) {
          throw new Error(`Login failed: ${response.status} - ${responseText}`);
        }
      }
      
      const data = JSON.parse(responseText);
      console.log("Login response:", data);
      
      // Note: User data storage is now handled by AuthContext
      if (!data.user_id) {
        console.warn("No user_id received in login response");
      }
      
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },
  
  register: async (email: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Read response only ONCE
      const responseText = await response.text();
      console.log("📄 Response status:", response.status);
      console.log("📄 Raw response (first 200 chars):", responseText.substring(0, 200));
      
      if (responseText.startsWith('<')) {
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.detail || "Registration failed");
        } catch (parseError) {
          throw new Error(`Registration failed: ${response.status} - ${responseText}`);
        }
      }
      
      // Parse the response text we already read
      return JSON.parse(responseText);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
  
  googleRegister: async (email: string) => {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/google-register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.detail || "Google registration failed");
        } catch (parseError) {
          throw new Error(`Google registration failed: ${response.status} - ${responseText}`);
        }
      }
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error("Google registration error:", error);
      throw error;
    }
  },
  

updateProfile: async (
  oldEmail: string,
  oldPassword: string,
  newEmail: string | null,
  newPassword: string | null
) => {
  try {
    // Gönderilecek veriyi hazırla
    const requestData: any = {
      old_email: oldEmail,
      old_password: oldPassword
    };
    
    // Eğer newEmail varsa ekle
    if (newEmail !== null) {
      requestData.new_email = newEmail;
    }
    
    // Eğer newPassword varsa ekle
    if (newPassword !== null) {
      requestData.new_password = newPassword;
    }
    
    console.log(`Updating profile for ${oldEmail} at ${BASE_URL}/update-profile`);
    console.log("Request data (sensitive info hidden):", {
      ...requestData,
      old_password: "***",
      new_password: requestData.new_password ? "***" : undefined
    });
    
    const response = await fetchWithTimeout(`${BASE_URL}/update-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
  
    const responseText = await response.text();
    
    if (!response.ok) {
      // Hata durumunda, yanıtın içeriğini al
      let errorDetail = "Profile update failed";
      
      try {
        // JSON olarak parse etmeyi dene
        const errorData = JSON.parse(responseText);
        
        // Hata dizisi durumu (FastAPI validation error)
        if (Array.isArray(errorData) && errorData.length > 0) {
          errorDetail = errorData[0].msg || JSON.stringify(errorData);
        } 
        // Standart hata objesi
        else if (errorData.detail) {
          errorDetail = errorData.detail;
        }
        // Diğer JSON hataları
        else {
          errorDetail = JSON.stringify(errorData);
        }
      } catch (e) {
        // JSON olarak parse edilemezse, text olarak kullan
        if (responseText) {
          errorDetail = responseText;
        }
      }
      
      console.error(`Profile update error: ${errorDetail}`);
      throw new Error(errorDetail);
    }
  
    const data = JSON.parse(responseText);
    console.log("Profile update successful:", data);
    return data;
  } catch (error) {
    // Hatayı doğru şekilde işle
    if (error instanceof Error) {
      console.error("Profile update error:", error.message);
      throw error;
    }
    
    console.error("Profile update unknown error:", error);
    throw new Error("Bilinmeyen bir hata oluştu");
  }
},
  
  logout: async () => {
    try {
      // User ID'yi temizle
      await AsyncStorage.removeItem("user_id");
      console.log("User logged out, cleared AsyncStorage");
      return { message: "Başarıyla çıkış yapıldı" };
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Çıkış yapılamadı");
    }
  },
  
  // Kullanıcının giriş durumunu kontrol et
  isLoggedIn: async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      return userId !== null;
    } catch (error) {
      console.error("isLoggedIn check error:", error);
      return false;
    }
  },

  checkFavorite: async (supplier_id: number) => {
    const userId = await AsyncStorage.getItem("user_id");
  
    if (!userId) {
      throw new Error("Kullanıcı ID'si bulunamadı.");
    }
  
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/is-favorite?user_id=${userId}&supplier_id=${supplier_id}`
      );
    
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Favori durumu kontrol hatası:", errorText);
        throw new Error(errorText || "Favori durumu kontrol edilemedi");
      }
    
      return await response.json(); // { is_favorite: true/false }
    } catch (error) {
      console.error("Check favorite error:", error);
      throw error;
    }
  },
  
  
  // Kullanıcı ID'sini getir
  getUserId: async () => {
    try {
      return await AsyncStorage.getItem("user_id");
    } catch (error) {
      console.error("getUserId error:", error);
      return null;
    }
  }
};

// Favoriler ile ilgili işlemler
export const favoritesService = {
  toggleFavorite: async ({
    user_id,
    supplier_id,
    favorited_at,
    screen_opened_at,
    is_valid_favorite,
  }: {
    user_id: number;
    supplier_id: string; // 👈 BURASI string
    favorited_at: string;
    screen_opened_at: string;
    is_valid_favorite: boolean;
  }) => {
    try {
      console.log(`Sending toggle favorite to ${BASE_URL}/add-favourite with supplier_id=${supplier_id}`);
      
      const response = await fetchWithTimeout(`${BASE_URL}/add-favourite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          supplier_id,
          favorited_at,
          screen_opened_at,
          is_valid_favorite,
        }),
      });
    
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Favorite toggle error response:", errorText);
        throw new Error(errorText || "Favori API hatası");
      }
    
      const result = await response.json();
      console.log("Favorite toggle success response:", result);
      return result;
    } catch (error) {
      console.error("Favorite toggle exception:", error);
      throw error;
    }
  },
  
  checkFavorite: async (supplier_id: string) => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
    
      if (!userId) {
        throw new Error("Kullanıcı ID'si bulunamadı.");
      }
    
      console.log(`Checking favorite status for user ${userId} and supplier ${supplier_id}`);
      
      const response = await fetchWithTimeout(
        `${BASE_URL}/is-favorite?user_id=${userId}&supplier_id=${supplier_id}`
      );
    
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Check favorite error:", errorText);
        throw new Error(errorText || "Favori durumu kontrol edilemedi");
      }
    
      const result = await response.json();
      console.log("Check favorite result:", result);
      return result; // { is_favorite: true/false }
    } catch (error) {
      console.error("Check favorite exception:", error);
      // Default olarak favori değil dön
      return { is_favorite: false };
    }
  },
  
  getFavorites: async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) throw new Error("Kullanıcı ID'si bulunamadı.");
  
      const response = await fetchWithTimeout(`${BASE_URL}/favorites/${userId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Get favorites error:", errorText);
        throw new Error("Favoriler alınamadı.");
      }
  
      const data = await response.json();
      console.log("Retrieved favorites:", data);
      return data.favorites; 
    } catch (error) {
      console.error("Get favorites exception:", error);
      return []; // Hata durumunda boş dizi dön
    }
  },

    //Eray
  getFavoritesDetailed: async () => {
  try {
    const userId = await AsyncStorage.getItem("user_id");
    if (!userId) {
      console.log("[DEBUG] No user ID found in storage");
      throw new Error("Kullanıcı ID'si bulunamadı.");
    }

    console.log(`[DEBUG] Fetching detailed favorites for user: ${userId}`);
    const url = `${BASE_URL}/favorites-detailed/${userId}`;
    console.log(`[DEBUG] Request URL: ${url}`);
    
    const response = await fetchWithTimeout(url);
    
    console.log(`[DEBUG] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Get detailed favorites error:", errorText);
      console.error(`Response status: ${response.status}, Response text: ${errorText}`);
      throw new Error(`Favori detayları alınamadı. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[DEBUG] Retrieved detailed favorites response:", data);
    console.log(`[DEBUG] Number of detailed favorites: ${data.data ? data.data.length : 0}`);
    
    if (data.success && data.data) {
    return data.data;
    } else {
      console.warn("[DEBUG] API returned success=false or no data");
      return [];
    }
  } catch (error) {
    console.error("Get detailed favorites exception:", error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}
};


// Puanlama işlemleri
export const ratingService = {
  
  // Kullanıcının bir tedarikçi için puanını getir
  getUserRating: async (supplier_id: string) => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      
      if (!userId) {
        console.log("getUserRating: Kullanıcı ID'si bulunamadı");
        return null;
      }
      
      console.log(`Getting user rating for user ${userId} and supplier ${supplier_id}`);
      
      try {
        const response = await fetchWithTimeout(`${BASE_URL}/rating/user?user_id=${userId}&supplier_id=${encodeURIComponent(supplier_id)}`);

        
        // 404 durumunu sessizce işle - kullanıcı henüz puanlama yapmamış
        if (response.status === 404) {
          console.log(`User ${userId} has not rated supplier ${supplier_id} yet (404)`);
          return null;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`API error (${response.status}): ${errorText}`);
          return null;
        }
        
        const result = await response.json();
        console.log("User rating result:", result);
        return result; // { rating: number }
      } catch (fetchError: any) {
        // AbortError (Timeout) durumunu ele al
        if (fetchError.name === 'AbortError') {
          console.log("Request timed out");
          return null;
        }
        
        // Hata "Not Found" içeriyorsa
        if (fetchError.message && fetchError.message.includes("Not Found")) {
          console.log("User has not rated this supplier yet (404 Not Found)");
          return null;
        }
        
        throw fetchError; // Diğer hata türlerini dışarı yeniden fırlat
      }
    } catch (error) {
      // Tüm hata durumlarını ele al
      console.error("Get user rating exception:", error);
      
      // Herhangi bir hata durumunda null döndür - yani henüz puanlama yok
      return null;
    }
    
  },
  
  // Puanlama gönder veya güncelle
  submitRating: async ({
    user_id,
    supplier_id,
    rating,
    rated_at
  }: {
    user_id: number;
    supplier_id: string;
    rating: number;
    rated_at: string;
  }) => {
    try {
      console.log(`Sending rating to ${BASE_URL}/rating with supplier_id=${supplier_id} and rating=${rating}`);
      
      const token = await AsyncStorage.getItem("token");
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      
      // Token varsa ekle
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      try {
        const response = await fetchWithTimeout(`${BASE_URL}/rating`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            user_id,
            supplier_id,
            rating,
            rated_at
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Rating submission error (${response.status}):`, errorText);
          
          // Backend henüz rating endpoint'ini desteklemiyorsa, sessizce başarılı davran
          if (response.status === 404) {
            console.log("Rating endpoint not found (404). Simulating success for better UX.");
            return { success: true, simulated: true };
          }
          
          throw new Error(errorText || "Puanlama API hatası");
        }
        
        const result = await response.json();
        console.log("Rating submission success response:", result);
        return result;
      } catch (fetchError: any) {
        // AbortError (Timeout) durumunu ele al
        if (fetchError.name === 'AbortError') {
          console.log("Request timed out");
          throw new Error("Bağlantı zaman aşımına uğradı");
        }
        
        // Not Found hatasını kontrol et
        if (fetchError.message && (
          fetchError.message.includes("Not Found") || 
          fetchError.message.includes("404")
        )) {
          console.log("Rating endpoint not implemented yet. Simulating success for better UX.");
          return { success: true, simulated: true };
        }
        
        throw fetchError; // Diğer hata türlerini dışarı yeniden fırlat
      }
    } catch (error: any) {
      // Not Found hatasını kontrol et ve sessizce başarılı gibi davran
      if (error.message && (
          error.message.includes("Not Found") || 
          error.message.includes("404")
        )) {
        console.log("Rating endpoint not implemented yet. Simulating success for better UX.");
        return { success: true, simulated: true };
      }
      
      console.error("Rating submission exception:", error);
      throw error;
    }
  },
  
  // Tedarikçinin ortalama puanını getir
  getSupplierRating: async (supplier_id: string) => {
    try {
      console.log(`Getting supplier average rating for supplier ${supplier_id}`);
      
      try {
        const response = await fetchWithTimeout(`${BASE_URL}/rating/supplier/${supplier_id}`);
        
        // 404 durumunu sessizce işle - henüz puanlama yok
        if (response.status === 404) {
          console.log(`Supplier ${supplier_id} has not been rated yet (404)`);
          return { average_rating: 0, count: 0 };
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Get supplier rating error (${response.status}):`, errorText);
          return { average_rating: 0, count: 0 };
        }
        
        const result = await response.json();
        console.log("Supplier rating result:", result);
        return result; // { average_rating: number, count: number }
      } catch (fetchError: any) {
        // AbortError (Timeout) durumunu ele al
        if (fetchError.name === 'AbortError') {
          console.log("Request timed out");
          return { average_rating: 0, count: 0 };
        }
        
        // Not Found hatasını kontrol et
        if (fetchError.message && fetchError.message.includes("Not Found")) {
          console.log("Supplier rating endpoint not found. Returning default values.");
          return { average_rating: 0, count: 0 };
        }
        
        throw fetchError; // Diğer hata türlerini dışarı yeniden fırlat
      }
    } catch (error) {
      console.error("Get supplier rating exception:", error);
      // Hata durumunda varsayılan değerler dön
      return { average_rating: 0, count: 0 };
    }
  },

  getBulkRatings: async (supplier_ids: string[]) => {
    try {
      console.log(`📊 [RATING] Bulk ratings isteği gönderiliyor: ${BASE_URL}/rating/rankings`);
      console.log(`📊 [RATING] Supplier IDs: ${JSON.stringify(supplier_ids)}`);
      
      const response = await fetchWithTimeout(`${BASE_URL}/rating/rankings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "AraBul-Mobile-App/1.0",
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify(supplier_ids)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`📊 [RATING] API hatası (${response.status}): ${errorText}`);
        
        // Eğer endpoint bulunamazsa veya sunucu hatası varsa boş dizi döndür
        if (response.status === 404 || response.status >= 500) {
          console.log("📊 [RATING] Endpoint bulunamadı veya sunucu hatası, boş dizi döndürülüyor");
          return [];
        }
        
        throw new Error(errorText || "Rating bulk fetch failed");
      }

      const data = await response.json();
      console.log(`📊 [RATING] Başarılı yanıt alındı: ${JSON.stringify(data)}`);
      return data; // [{ supplier_id, average_rating, count }, ...]
    } catch (error: any) {
      console.error("📊 [RATING] getBulkRatings error:", error);
      
      // Ağ hatası veya timeout durumunda
      if (error.name === 'AbortError') {
        console.log("📊 [RATING] İstek zaman aşımına uğradı");
      } else if (error.message && error.message.includes('FortiGate')) {
        console.log("📊 [RATING] Güvenlik duvarı tarafından engellendi");
      }
      
      return []; // hata varsa boş dizi döner
    }
  }
};

// Chat API
export const chatService = {
  // Chat mesajı gönder
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      return response.json();
    } catch (error) {
      console.error("Send message error:", error);
      throw error;
    }
  }
};

// Supplier API
export const supplierService = {
  
  // Yakındaki tedarikçileri getir
  getNearbySuppliers: async (latitude: number, longitude: number, radius: number = 50) => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/location/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to get nearby suppliers");
      }
      
      return response.json();
    } catch (error) {
      console.error("Get nearby suppliers error:", error);
      throw error;
    }
  },

  getPopularSuppliers: async () => {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/popular-suppliers`);
      
      if (!response.ok) {
        throw new Error("Failed to get popular suppliers");
      }
      
      return await response.json(); // [{ supplier_id: "101", count: 3 }, ...]
    } catch (error) {
      console.error("Get popular suppliers error:", error);
      return []; // Hata durumunda boş dizi dön
    }
  },
  
  
  // Tedarikçi detaylarını getir
  getSupplierDetails: async (supplierId: number) => {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/supplier/${supplierId}`);
      
      if (!response.ok) {
        throw new Error("Failed to get supplier details");
      }
      
      return response.json();
    } catch (error) {
      console.error("Get supplier details error:", error);
      throw error;
    }
  },


};

export default {
  auth: authService,
  favorites: favoritesService,
  chat: chatService,
  supplier: supplierService,
  rating: ratingService
};