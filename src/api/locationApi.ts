import axios from "axios";
import CONFIG from "../../config.ts"; // ✅ Backend URL burada tanımlı olmalı

export const getLocationInfo = async (latitude: number, longitude: number) => {
  try {
    const response = await axios.get(`${CONFIG.API_BASE_URL}/location`, {
      params: { lat: latitude, lon: longitude },
    });

    return response.data;
  } catch (error) {
    console.error("API Hatası:", error);
    return { error: "Sunucu hatası veya bağlantı sorunu" };
  }
};
