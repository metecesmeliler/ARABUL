import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
} from "react-native";
import { favoritesService } from "../services/apiService";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, Supplier } from "../types";
import SupplierCard from "../components/SupplierCard";
import { useTranslation } from "react-i18next";

// Konum fonksiyonunu import et
import { getCurrentLocation } from "../services/locationService"; // Dosya yolunu kendi yapına göre ayarla

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList, "BusinessDetail">;

const FavoritesScreen = () => {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const [details, setDetails] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Favorileri çek
        console.log("Favoriler sayfası açıldı 🚀");
        const detailedFavorites = await favoritesService.getFavoritesDetailed();
        setDetails(detailedFavorites);

        // Konumu al
        const currentLocation = await getCurrentLocation();
        if (currentLocation) {
          setLocation(currentLocation);
        }
      } catch (err: any) {
        console.error("Favoriler ekranı HATA:", err.message);
        Alert.alert(t("favorite.error"), err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePress = (supplier: Supplier) => {
    try {
      console.log("🔍 Favorilerden BusinessDetail'a geçiliyor:", {
        supplier: supplier,
        userLatitude: location?.latitude ?? 0,
        userLongitude: location?.longitude ?? 0,
      });
      
      navigation.navigate("BusinessDetail", {
        supplier,
        userLatitude: location?.latitude ?? 0,
        userLongitude: location?.longitude ?? 0,
      });
    } catch (error) {
      console.error("❌ BusinessDetail'a geçiş hatası:", error);
      Alert.alert("Hata", "İş yeri detayları açılırken bir hata oluştu.");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#000" style={{ marginTop: 100 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('favorite.title')}</Text>
      {details.length === 0 ? (
        <Text style={styles.emptyText}>{t('favorite.noFavorites')}</Text>
      ) : (
        <FlatList
          data={details}
          keyExtractor={(item) => item.SupplierID}
          renderItem={({ item }) => (
            <SupplierCard supplier={item} onPress={handlePress} />
          )}
        />
      )}
    </View>
  );
};

export default FavoritesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 40,
  },
});
