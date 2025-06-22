import React, { useState, useEffect } from "react";
import { View, FlatList, Text } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList, Supplier, SortingOption } from "../types";
import styles from "../styles/BusinessListScreen.styles";
import SupplierCard from "../components/SupplierCard";
import SortingPicker from "../components/SortingPicker";
import { supplierService } from "../services/apiService";
import { ratingService } from "../services/apiService";

type Props = StackScreenProps<RootStackParamList, "BusinessList">;

const BusinessListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { jsonData, userLatitude, userLongitude } = route.params;

  let parsedData;
  try {
    parsedData = JSON.parse(jsonData);
  } catch (error) {
    return <Text>Error: Failed to parse data.</Text>;
  }

  const originalSuppliers: Supplier[] = parsedData.data.flatMap(
    (business: any) => business.Suppliers
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>(originalSuppliers);
  const [selectedOption, setSelectedOption] = useState<SortingOption>("nearest");

  // Sıralama fonksiyonu
  const sortSuppliers = async (option: SortingOption) => {
    console.log("sortSuppliers fonksiyonu çağrıldı, seçenek:", option);
    
    let sorted = [...originalSuppliers];

    if (option === "nearest") {
      console.log("Mesafeye göre sıralama yapılıyor");
      sorted.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
    }

    if (option === "byRanking") {
      console.log("📊 [RANKING] Toplu puan sıralaması başlatılıyor");

      try {
        const supplierIds = sorted.map(s => String(s.SupplierID));
        console.log("📊 [RANKING] İstek gönderilecek supplier ID'leri:", supplierIds);
        
        const bulkRatings = await ratingService.getBulkRatings(supplierIds);
        console.log("📊 [RANKING] API'den dönen yanıt:", bulkRatings);

        // Map: { supplier_id: average_rating }
        const ratingMap: Record<string, number> = {};
        if (bulkRatings && Array.isArray(bulkRatings)) {
          bulkRatings.forEach((entry: { supplier_id: string; average_rating: number }) => {
            ratingMap[String(entry.supplier_id)] = entry.average_rating ?? 0;
          });
        }

        console.log("✅ [RANKING] Alınan ratingMap:", ratingMap);

        // Eğer tüm rating değerleri 0 ise orijinal sıralamayı koru
        if (!bulkRatings || bulkRatings.length === 0) {
          console.log("📊 [RANKING] Hiç rating bulunamadı, mesafeye göre sıralama yapılacak");
          sorted.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
          setSuppliers(sorted);
          return;
        }
        
        // Tüm rating değerlerinin 0 olup olmadığını kontrol et
        const hasAnyRatings = bulkRatings.some((entry: { supplier_id: string; average_rating: number }) => (entry.average_rating ?? 0) > 0);
        if (!hasAnyRatings) {
          console.log("📊 [RANKING] Tüm supplier'ların rating'i 0, mesafeye göre sıralama yapılacak");
          sorted.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
          setSuppliers(sorted);
          return;
        }

        sorted.sort((a, b) => {
          const aRating = ratingMap[String(a.SupplierID)] || 0;
          const bRating = ratingMap[String(b.SupplierID)] || 0;
          return bRating - aRating;
        });

        console.log("✅ [RANKING] Sıralanmışlar:", sorted.map(s => `${s.SupplierID}(${ratingMap[String(s.SupplierID)] || 0})`));
      } catch (error) {
        console.error("❌ [RANKING] Hata oluştu, mesafeye göre sıralama yapılacak:", error);
        // Hata durumunda mesafeye göre sırala
        sorted.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
      }
    }

    if (option === "mostPopular") {
      console.log("📊 [POPULAR] Popülerliğe göre sıralama başlatılıyor");
      try {
        // Gerçek API'den popular suppliers verilerini al
        const popularSuppliers = await supplierService.getPopularSuppliers();
        console.log("📊 [POPULAR] API'den alınan veriler:", popularSuppliers);
        
        // Eğer favorites tablosu boşsa veya tüm count'lar 0 ise, hiçbir değişiklik yapma
        if (!popularSuppliers || popularSuppliers.length === 0) {
          console.log("📊 [POPULAR] Hiç popüler supplier bulunamadı, sıralama değiştirilmeyecek");
          return; // Mevcut sıralamayı koru
        }
        
        // Tüm count değerlerinin 0 olup olmadığını kontrol et
        const hasAnyFavorites = popularSuppliers.some((entry: { supplier_id: string; count: number }) => entry.count > 0);
        if (!hasAnyFavorites) {
          console.log("📊 [POPULAR] Tüm supplier'ların favorite count'u 0, sıralama değiştirilmeyecek");
          return; // Mevcut sıralamayı koru
        }
        
        // Popularity map oluştur
        const popularityMap: Record<string, number> = {};
        popularSuppliers.forEach((entry: { supplier_id: string; count: number }) => {
          popularityMap[String(entry.supplier_id)] = entry.count;
        });
        
        console.log("📊 [POPULAR] Popülerlik haritası:", popularityMap);
        console.log("📊 [POPULAR] Tüm supplier ID'leri:", sorted.map(s => s.SupplierID));
        
        // Favorilere göre sırala
        sorted.sort((a, b) => {
          const aId = String(a.SupplierID);
          const bId = String(b.SupplierID);
          
          // Varsayılan olarak 0 kullan (favorisi olmayan tedarikçiler için)
          const aCount = popularityMap[aId] || 0;
          const bCount = popularityMap[bId] || 0;
          
          console.log(`📊 [POPULAR] Karşılaştırma: ${aId}(${aCount}) vs ${bId}(${bCount})`);
          
          // Favori sayısına göre azalan sırada sırala
          return bCount - aCount;
        });
        
        console.log("✅ [POPULAR] Sıralanmış supplier ID'leri:", sorted.map(s => `${s.SupplierID}(${popularityMap[String(s.SupplierID)] || 0})`));
      } catch (error) {
        console.error("❌ [POPULAR] Favorilere göre sıralama hatası:", error);
        // Hata durumunda varsayılan sıralama (mesafeye göre)
        sorted.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
      }
    }

    console.log("Sıralamanın son hali:", option, sorted.map(s => s.SupplierID));
    setSuppliers(sorted);
  };

  // useEffect hook'unu ekleyin - bu, selectedOption değiştiğinde sortSuppliers'ı çağıracak
  useEffect(() => {
    console.log("🔄 [SORT] useEffect çalıştı, seçenek:", selectedOption);
    sortSuppliers(selectedOption);
  }, [selectedOption]);

  const handleCompanyPress = (supplier: Supplier) => {
    navigation.navigate("BusinessDetail", { supplier, userLatitude, userLongitude });
  };

  return (
    <View style={styles.container}>
      <SortingPicker
        selectedOption={selectedOption}
        onChange={(option) => {
          console.log("🎯 [SORT] SORTING OPTION CHANGED:", option);
          setSelectedOption(option);
        }}
      />

      <FlatList
        data={suppliers}
        renderItem={({ item }) => (
          <SupplierCard supplier={item} onPress={handleCompanyPress} />
        )}
        keyExtractor={(item) => item.SupplierID}
      />
    </View>
  );
};

export default BusinessListScreen;