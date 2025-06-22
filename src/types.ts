export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Chat: undefined;
  BusinessList: {
    jsonData: string;
    userLatitude: number;
    userLongitude: number;
  };
  
  BusinessDetail: {
    supplier: Supplier;
    userLatitude: number;
    userLongitude: number;
  };
  Profile: undefined;
  // Şikayet parametreleri opsiyonel yapıldı - hem işletme şikayeti hem de genel şikayet için kullanılabilir
  Complaint: {
    supplierId?: string;
    supplierName?: string;
  } | undefined;
  Favorites: undefined;
};


export interface ChatRequest {
  query: string;
  cities: string[]; // ✅ Artık bir dizi olarak tutuluyor
  latitude: number;
  longitude: number;
}


export interface SearchResult {
  code: string;
  description: string;
  distance?: number;
  city: string;
}

export interface ChatResponse {
  data: {
    data: any[];
  };
  success: boolean;
}

export type Message = {
  id: string;
  text: string;
  sender: "user" | "system";
  timestamp: number;
  naceOptions?: NaceCode[];
};

export type NaceCode = {
  code: string; 
  description: string;
};

export interface Supplier {
  SupplierID: string;
  SupplierName: string;
  Address: string;
  City: string;
  Region: string;
  PhoneNumber: string;
  ContactPerson: string;
  distance_km?: number;
  duration?: string;
  latitude?: number; // ✅ Konum bilgisi eklendi
  longitude?: number; // ✅ Konum bilgisi eklendi
  created_at: string;
}


export type SortingOption = "nearest" | "mostPopular" | "byRanking";