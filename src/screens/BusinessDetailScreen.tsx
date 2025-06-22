import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Linking, Alert, ActivityIndicator, ScrollView } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList, Supplier } from "../types";
import styles from "../styles/BusinessDetailsScreen.styles";
import { useTranslation } from 'react-i18next';
import { authService, favoritesService, ratingService } from "../services/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

type BusinessDetailScreenProps = StackScreenProps<RootStackParamList, "BusinessDetail">;

const BusinessDetailScreen: React.FC<BusinessDetailScreenProps> = ({ route, navigation }) => {
  const { supplier, userLatitude, userLongitude } = route.params;
  const { t } = useTranslation();

  // Supplier verilerini kontrol et
  if (!supplier) {
    console.error("❌ Supplier verisi eksik");
    Alert.alert(t("businessDetail.error"), t("businessDetail.businessNotFound"));
    navigation.goBack();
    return null;
  }

  console.log("📋 BusinessDetailScreen supplier verileri:", {
    SupplierID: supplier.SupplierID,
    SupplierName: supplier.SupplierName,
    latitude: supplier.latitude,
    longitude: supplier.longitude,
    userLatitude,
    userLongitude
  });

  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [screenOpenedAt, setScreenOpenedAt] = useState<number>(Date.now());
  const [isToggling, setIsToggling] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  const supplierId = String(supplier.SupplierID);

  if (!supplierId || supplierId.trim() === "") {
    console.warn("⚠️ Geçersiz supplierId:", supplier.SupplierID);
    Alert.alert(t("businessDetail.error"), t("businessDetail.invalidBusinessInfo"));
    navigation.goBack();
    return null;
  }

  // Check login, favorite status and user rating on component mount
  useEffect(() => {
    const now = Date.now();
    setScreenOpenedAt(now);
    console.log(`Screen opened at: ${new Date(now).toISOString()}`);
    console.log(`SupplierID: ${supplierId}`);

    const checkLoginAndStatus = async () => {
      try {
        setIsLoading(true);
        const loggedIn = await authService.isLoggedIn();
        console.log(`User is logged in: ${loggedIn}`);
        setIsLoggedIn(loggedIn);
        
        if (loggedIn) {
          // Check favorite status
          console.log(`Checking favorite status for supplier: ${supplierId}`);
          try {
            const favoriteResponse = await favoritesService.checkFavorite(supplierId);
            console.log("Favorite check response:", favoriteResponse);
            setIsFavorite(favoriteResponse.is_favorite);
          } catch (favError) {
            console.error("Favori durumu kontrol hatası:", favError);
            // Favori kontrolü başarısız olsa bile devam et, sadece varsayılan olarak false kabul et
          }
          
          // Check if user has already rated this supplier
          try {
            const ratingResponse = await ratingService.getUserRating(supplierId);
            console.log("User rating response:", ratingResponse);
            if (ratingResponse && ratingResponse.rating) {
              setUserRating(ratingResponse.rating);
            }
          } catch (ratingError) {
            console.error("Kullanıcı puanlaması kontrol hatası:", ratingError);
            // Puanlama kontrolü başarısız olsa bile devam et (userRating null kalacak)
          }
        }
      } catch (error) {
        console.error("Giriş durumu kontrol hatası:", error);
        // Hata durumunda kullanıcıya gösterme, sessizce devam et
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginAndStatus();
  }, [supplierId]);

  const handleCall = () => {
    const phoneUrl = `tel:${supplier.PhoneNumber}`;
    Linking.openURL(phoneUrl).catch((err) => console.error("Failed to make a call", err));
  };

  const handleOpenGoogleMaps = () => {
    if (!supplier.latitude || !supplier.longitude) {
      Alert.alert(t("businessDetail.error"), t("businessDetail.noLocationData"));
      return;
    }
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLatitude},${userLongitude}&destination=${supplier.latitude},${supplier.longitude}&travelmode=driving`;
    Linking.openURL(googleMapsUrl);
  };

  const handleComplaint = () => {
    navigation.navigate("Complaint", { supplierId: supplierId, supplierName: supplier.SupplierName });
  };

  const toggleFavorite = async () => {
    if (isToggling) return; // Prevent multiple requests
    
    try {
      setIsToggling(true);
      
      const loggedIn = await authService.isLoggedIn();
      if (!loggedIn) {
        Alert.alert(t("businessDetail.loginRequired"), t("businessDetail.loginRequiredForFavorites"));
        return;
      }
    
      const user_id = await AsyncStorage.getItem("user_id");
      if (!user_id) {
        throw new Error("Kullanıcı ID'si yok");
      }
    
      const now = Date.now();
      const timeSinceOpen = now - screenOpenedAt;
    
      const payload = {
        user_id: parseInt(user_id),
        supplier_id: supplierId,
        favorited_at: new Date(now).toISOString(),
        screen_opened_at: new Date(screenOpenedAt).toISOString(),
        is_valid_favorite: timeSinceOpen >= 10000 // 10 seconds
      };
      
      console.log("Favorite toggle payload:", JSON.stringify(payload, null, 2));
    
      try {
        const response = await favoritesService.toggleFavorite(payload);
        console.log("Favorite toggle response:", response);
        
        // Sunucu yanıtı başarısız olsa bile, frontend'de favorileri toggle et
        setIsFavorite((prev) => !prev);
        Alert.alert(t("businessDetail.success"), isFavorite ? t("businessDetail.removedFromFavorites") : t("businessDetail.addedToFavorites"));
      } catch (apiError) {
        console.error("API hatası:", apiError);
        
        // API hatası olsa bile, kullanıcı deneyimini iyileştirmek için 
        // frontend'de favorileri toggle et
        setIsFavorite((prev) => !prev);
        console.log("Favori durumu güncellendi (yerel olarak)");
      }
      
    } catch (error) {
      console.error("Favori işlem hatası:", error);
      Alert.alert(t("businessDetail.info"), t("businessDetail.favoriteProcessError"));
    } finally {
      setIsToggling(false);
    }
  };

  const handleRatingSubmit = async (rating: number) => {
    if (isRatingSubmitting) return;
    
    try {
      setIsRatingSubmitting(true);
      
      const loggedIn = await authService.isLoggedIn();
      if (!loggedIn) {
        Alert.alert(t("businessDetail.loginRequired"), t("businessDetail.loginRequiredForRating"));
        return;
      }
      
      const user_id = await AsyncStorage.getItem("user_id");
      if (!user_id) {
        throw new Error("Kullanıcı ID'si yok");
      }
      
      const payload = {
        user_id: parseInt(user_id),
        supplier_id: supplierId,
        rating: rating,
        rated_at: new Date().toISOString()
      };
      
      console.log("Rating submission payload:", JSON.stringify(payload, null, 2));

      // 🔴 BU SATIRI EKLEMEN GEREKİYOR
      await ratingService.submitRating(payload);

      const ratingResponse = await ratingService.getUserRating(supplierId);
      if (ratingResponse && typeof ratingResponse.rating === 'number') {
        setUserRating(ratingResponse.rating);
        Alert.alert(
          t("businessDetail.success"), 
          userRating ? t("businessDetail.ratingUpdated") : t("businessDetail.ratingSubmitted")
        );
      } else {
        console.log("No valid rating found, keeping as null");
      }
    } catch (error) {
      console.error("Puanlama işlem hatası:", error);
      Alert.alert(t("businessDetail.error"), t("businessDetail.ratingError"));
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  
  // Star Rating Component
  const StarRating = () => {
    const renderStar = (position: number) => {
      const filled = userRating !== null && position <= userRating;
      return (
        <TouchableOpacity 
          key={position} 
          style={styles.starContainer}
          onPress={() => handleRatingSubmit(position)}
          disabled={isRatingSubmitting}
        >
          <MaterialIcons 
            name={filled ? "star" : "star-border"} 
            size={36} 
            color={filled ? "#FFD700" : "#aaa"} 
          />
        </TouchableOpacity>
      );
    };
    
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingTitle}>{t("businessDetail.rateThisPlace")}</Text>
        <View style={styles.starsContainer}>
          {isRatingSubmitting ? (
            <ActivityIndicator size="large" color="#FFD700" />
          ) : (
            <>
              {[1, 2, 3, 4, 5].map(renderStar)}
            </>
          )}
        </View>
        {userRating !== null && (
          <Text style={styles.ratingText}>
            {t("businessDetail.yourRating")}: {userRating}/5
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.companyName}>{supplier.SupplierName}</Text>
          <Text style={styles.infoText}>📍 {t("businessDetail.address")}: {supplier.Address}</Text>
          <Text style={styles.infoText}>🌍 {t("businessDetail.city")}: {supplier.City} - {supplier.Region}</Text>
          <Text style={styles.infoText}>📏 {t("businessDetail.distance")}: {supplier.distance_km} km</Text>
          <Text style={styles.infoText}>📞 {t("businessDetail.phone")}: {supplier.PhoneNumber}</Text>
        </View>

        {/* Rating Component */}
        <StarRating />

        {supplier.latitude != null && supplier.longitude != null ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: supplier.latitude,
              longitude: supplier.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: supplier.latitude,
                longitude: supplier.longitude,
              }}
              title={supplier.SupplierName}
              description={supplier.Address}
            />
          </MapView>
        ) : (
          <View style={styles.map}>
            <Text>{t("businessDetail.noLocation")}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <MaterialIcons name="phone" size={24} color="white" />
            <Text style={styles.buttonText}>{t("businessDetail.callButton")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.directionsButton} onPress={handleOpenGoogleMaps}>
            <MaterialIcons name="directions" size={24} color="white" />
            <Text style={styles.buttonText}>{t("businessDetail.directions")}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.favoriteButton, isToggling ? styles.disabledButton : null]} 
            onPress={toggleFavorite}
            disabled={isLoading || isToggling}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name={isFavorite ? "star" : "star-border"} size={24} color="white" />
                <Text style={styles.buttonText}>
                  {isFavorite ? t("businessDetail.removeFavorite") : t("businessDetail.addFavorite")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Complaint Button */}
        <TouchableOpacity style={styles.complaintButton} onPress={handleComplaint}>
          <MaterialIcons name="report-problem" size={24} color="white" />
          <Text style={styles.buttonText}>{t("businessDetail.sendComplaint")}</Text>
        </TouchableOpacity>
        
        {/* Ekranın altına biraz boşluk ekleyin (özellikle küçük ekranlarda) */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default BusinessDetailScreen;