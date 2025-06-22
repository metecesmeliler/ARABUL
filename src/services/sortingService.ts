import { Supplier, SortingOption } from "../types";

export const sortSuppliers = (
  suppliers: Supplier[],
  option: SortingOption
): Supplier[] => {
  switch (option) {
    case "nearest":
      return [...suppliers].sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    case "mostPopular":
      return [...suppliers].sort((a, b) => getFavoriteStatus(b) - getFavoriteStatus(a));
    case "byRanking":
      return [...suppliers].sort((a, b) => getSupplierRating(b) - getSupplierRating(a));
    default:
      return suppliers;
  }
};

// Favori durumu kontrol fonksiyonu (Bu artık backend'den kontrol ediliyor)
const getFavoriteStatus = (supplier: Supplier): number => {
  // Bu fonksiyon artık sadece sıralama için kullanılıyor
  // Gerçek favori durumu BusinessCard ve FavoritesScreen'den kontrol ediliyor
  return 0; // Favori sıralaması için backend'den gelen veri kullanılmalı
};

// Şirketlerin puanını döndüren mock fonksiyon
const getSupplierRating = (supplier: Supplier): number => {
  return Math.random() * 5; // Gerçek API veya veritabanı entegrasyonu gerekebilir
};
