// In chatApi.ts
import axios from 'axios';
import CONFIG from "../../config.ts";


export const chatService = {  
  getBusinesses: async (data: any, endpoint: string = '/chat/get_businesses') => {
    try {
      // If data is already a string, parse it back to an object
      let processedData = data;
      
      if (typeof data === 'string') {
        try {
          processedData = JSON.parse(data);
          console.log("Parsed string data back to object");
        } catch (parseError) {
          console.error("Failed to parse data string:", parseError);
          // Continue with the string if parsing fails
          processedData = data;
        }
      } else {
        // Make a copy of the object data to avoid modifying the original
        processedData = { ...data };
      }
      
      // Ensure naceCode is a string if present
      if (processedData.naceCode && typeof processedData.naceCode === 'object') {
        processedData.naceCode = processedData.naceCode.code || "";
        console.log("Converting naceCode object to string:", processedData.naceCode);
      }
      
      console.log(`Sending data to ${CONFIG.API_BASE_URL}${endpoint}:`, JSON.stringify(processedData, null, 2));
      
      // Don't stringify the data - Axios will do it automatically
      const response = await axios.post(`${CONFIG.API_BASE_URL}${endpoint}`, processedData, {
      headers: {
        'Content-Type': 'application/json',
        },
          });
      
      return response.data;
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      
      // Log detailed error information
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Request config:', JSON.stringify({
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }, null, 2));
        
        // Log actual sent data (not as individual characters)
        if (error.config?.data) {
          console.error('Request data (as sent):', error.config.data);
        }
      }
      
      return { success: false };
    }
  },
  
  getNaceCodes: async (query: string, language: string, endpoint: string = '/chat/get_nace_codes') => {
    try {
      const response = await axios.post(`${CONFIG.API_BASE_URL}${endpoint}`, { query, language });


      console.log("✅ Backend Response:", response.data);
      
      // Based on the updated response structure: {"data": {"naceCodes": [{code, description}, ...]}, "success": true}
      if (response.data && response.data.success && response.data.data && response.data.data.naceCodes) {
        // If backend already returns objects with code and description
        if (typeof response.data.data.naceCodes[0] === 'object' && 
            response.data.data.naceCodes[0].code && 
            response.data.data.naceCodes[0].description) {
          return {
            success: true,
            data: response.data.data.naceCodes
          };
        } 
        // If backend still returns just strings (for backward compatibility)
        else if (typeof response.data.data.naceCodes[0] === 'string') {
          const naceCodes = response.data.data.naceCodes.map((description: string, index: number) => ({
            code: `NACE${index + 1}`, // Generate temporary codes
            description: description
          }));
          
          return {
            success: true,
            data: naceCodes
          };
        } else {
          throw new Error("Unexpected data format from server");
        }
      } else {
        // Handle case where response is successful but doesn't contain expected data
        console.warn("An error occurred with semantic search or the query couldn't pass the threshold:", response.data);
        return { success: false, data: response.data.data };
      }
    } catch (error) {
      console.error('Error fetching NACE codes:', error);
      return { success: false, data: [] };
    }
  },
};
