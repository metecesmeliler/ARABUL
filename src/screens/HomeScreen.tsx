import React, { useLayoutEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import { getCurrentLocation } from "../services/locationService";
import { getLocationInfo } from "../api/locationApi"; 
import styles from "../styles/HomeScreen.styles";
import { Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

type Props = StackScreenProps<RootStackParamList, "Home">;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [city, setCity] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#FFA000',
        height: 80, // Header yüksekliğini azalt
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTitleStyle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
      },
      headerLeft: () => (
        <TouchableOpacity 
          style={{
            marginLeft: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
            elevation: 3,
          }}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={{ fontSize: 18 }}>👤</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  

  const handleGetLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert("Konum Alınamadı", "Lütfen konum izinlerini kontrol edin.");
        setLoading(false);
        return;
      }

      console.log("Kullanıcı Konumu:", location);
      console.log("Latitude:", location.latitude);
      console.log("Longitude:", location.longitude);

      const locationData = await getLocationInfo(location.latitude, location.longitude);

      if (locationData.error) {
        Alert.alert("Hata", "Şehir bilgisi alınamadı.");
      } else {
        setCity(locationData.city);
        setRegion(locationData.region);
      }

    } catch (error) {
      console.error("Konum Hatası:", error);
      Alert.alert("Hata", "Konum alınırken bir hata oluştu.");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFA000" barStyle="light-content" />
      <View style={styles.container}>
        <LanguageSelector />

        <Text style={styles.welcomeTitle}>{t("home.welcomeTitle")}</Text>
        <Text style={styles.welcomeText}>{t("home.welcomeText")}</Text>

        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => navigation.navigate("Chat")}
        >
          <Text style={styles.chatButtonText}>{t("home.startChatButton")}</Text>
        </TouchableOpacity>

        {city && region && (
          <View style={styles.locationInfoContainer}>
            <Text style={styles.locationInfoText}>Şehir: {city}</Text>
            <Text style={styles.locationInfoText}>Bölge: {region}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
