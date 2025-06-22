// WebView için basit bir çözüm - basitleştirilmiş Google Auth

import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, SafeAreaView, Alert, Platform, Linking, Modal
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { useTranslation } from "react-i18next";
import { AntDesign } from "@expo/vector-icons";
import { authService } from "../services/apiService";
import { styles } from '../styles/RegisterScreen.styles';
// WebView için import ekleyin 
import { WebView } from 'react-native-webview';
import { useAuth } from "../context/AuthContext";

// Import config
import CONFIG from "../../config.ts";

type Props = StackScreenProps<RootStackParamList, "Register">;

const RegisterScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  
  // State tanımlamaları
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // WebView için state tanımlamaları
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");

  
  useEffect(() => {
    console.log("[RegisterScreen] Mounted!");
    console.log(`API_BASE_URL: ${CONFIG.API_BASE_URL}`);
  }, []);

  // Normal kayıt işlemi
  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError(t("register.emptyFields") || "Lütfen tüm alanları doldurun");
      return;
    }
    if (password !== confirmPassword) {
      setError(t("register.passwordMismatch") || "Şifreler eşleşmiyor");
      return;
    }
  
    setIsLoading(true);
    setError("");
  
    try {
      console.log("🔄 Register işlemi başlıyor...", { email });
      const response = await authService.register(email, password);
      console.log("✅ Register response:", response);
      console.log("✅ Register response type:", typeof response);
      console.log("✅ Register response keys:", Object.keys(response || {}));
      
      // Başarılı register sonrası Login sayfasına git
      console.log("✅ Navigating to Login screen...");
      navigation.replace("Login");
    } catch (error: any) {
      console.error("❌ Register hatası:", error.message);
      
      const message = error?.message?.toLowerCase?.();
      
      if (message?.includes("already exists") || message?.includes("email already registered")) {
        setError(t("register.emailExists") || "Bu e-posta adresi zaten kayıtlı");
      } else if (message?.includes("invalid email")) {
        setError(t("register.invalidEmail") || "Geçersiz e-posta adresi");
      } else if (message?.includes("network") || message?.includes("connection") || message?.includes("timeout")) {
        setError(t("register.networkError") || "Bağlantı hatası, lütfen internet bağlantınızı kontrol edin");
      } else if (message?.includes("server error") || message?.includes("internal error")) {
        setError(t("register.serverError") || "Sunucu hatası, lütfen tekrar deneyin");
      } else {
        setError(error.message || t("register.unknownError") || "Bir hata oluştu");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Auth işlemleri
  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    setError("");
    
    Alert.alert(
      "Google ile Giriş",
      "Google ile giriş yapmak için bir yöntem seçin:",
      [
        {
          text: "İptal",
          style: "cancel",
          onPress: () => setIsGoogleLoading(false)
        },
        {
          text: "Web Auth",
          onPress: () => {
            // Client ID'yi platform'a göre seçin
            const clientId = Platform.OS === 'ios' 
              ? '544806470345-m50b7u4s6vgnalv0tntbrb4r5380pej9.apps.googleusercontent.com' 
              : Platform.OS === 'android' 
                ? '544806470345-2jievuvct5fnoetfh6jslcn8bdqcufgc.apps.googleusercontent.com' 
                : '544806470345-unmu1lqq3sa6lbpsf8h5julea44vtoea.apps.googleusercontent.com'; // Web
            
            // ÖNEMLİ: redirect_uri'yi localhost olarak değiştirin
            const redirectUri = encodeURIComponent(`http://localhost:8000/auth/google/callback`);
            const scope = encodeURIComponent('profile email');
            
            // State ve nonce parametereleri güvenlik için
            const state = Math.random().toString(36).substring(2, 15);
            const nonce = Math.random().toString(36).substring(2, 15);
            
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=select_account&state=${state}&nonce=${nonce}&include_granted_scopes=true&access_type=offline`;
            
            console.log("Opening WebView with URL:", authUrl);
            
            // WebView'ı göster ve URL'yi ayarla
            setWebViewUrl(authUrl);
            setWebViewVisible(true);
          }
        },
        {
          text: "Test Modu",
          onPress: async () => {
            try {
              // Mock token ile oturum aç
              const mockResponse = await authService.googleAuth("mock_token_for_testing", Platform.OS === 'ios' ? 'ios' : 'android');
              console.log("Mock response:", mockResponse);
              
              navigation.replace("Home");
            } catch (error: any) {
              console.error("Mock auth error:", error);
              Alert.alert("Hata", `Mock auth hatası: ${error.message}`);
            } finally {
              setIsGoogleLoading(false);
            }
          }
        }
      ]
    );
  };

  // WebView'dan navigasyon değişikliklerini izle
  const handleNavigationStateChange = (navState: any) => {
    // Callback URL'yi izle
    const currentUrl = navState.url;
    console.log("WebView navigating to:", currentUrl);
    
    if (currentUrl.includes('/auth/google/callback')) {
      // URL'den authorization code'u çıkar
      const codeMatch = currentUrl.match(/[?&]code=([^&]+)/);
      
      if (codeMatch && codeMatch[1]) {
        // Code'u al ve WebView'ı kapat
        const code = codeMatch[1];
        console.log("Authorization code extracted:", code);
        
        // WebView'ı kapat
        setWebViewVisible(false);
        
        // Code ile oturum aç
        handleGoogleAuthComplete(code);
      } else {
        // Hata durumu
        const errorMatch = currentUrl.match(/[?&]error=([^&]+)/);
        const errorMsg = errorMatch ? errorMatch[1] : "Bilinmeyen hata";
        
        setWebViewVisible(false);
        setIsGoogleLoading(false);
        
        Alert.alert("Hata", `Google auth hatası: ${errorMsg}`);
      }
    }
  };

  // Google sign-in tamamlandıktan sonra backend'e istek gönder
  const handleGoogleAuthComplete = async (code: string) => {
    try {
      console.log("Processing Google auth code...");
      
      // Backend'e code gönder (veya direkt backend'e yönlendirip backend'den token al)
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      const response = await authService.googleAuth(code, platform);
      
      console.log("✅ Google auth successful:", response);
      
      if (response.user_id) {
        // Use AuthContext to login
        await login({
          id: response.user_id,
          email: response.email || "google_user@example.com"
        });
        
        // Başarılı mesajı göster
        Alert.alert(
          "Başarılı",
          `Google hesabınız ile ${response.is_new_user ? 'başarıyla kayıt oldunuz' : 'başarıyla giriş yaptınız'}!`,
          [{ text: "Tamam" }]
        );
      }
    } catch (error: any) {
      console.error("❌ Google auth error:", error);
      
      Alert.alert(
        "Hata",
        `Google auth hatası: ${error.message}`,
        [{ text: "Tamam" }]
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Google Auth WebView Modal */}
      <Modal
        visible={webViewVisible}
        onRequestClose={() => {
          setWebViewVisible(false);
          setIsGoogleLoading(false);
        }}
        animationType="slide"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
            <TouchableOpacity
              onPress={() => {
                setWebViewVisible(false);
                setIsGoogleLoading(false);
              }}
              style={{ padding: 10 }}
            >
              <AntDesign name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>Google ile Giriş</Text>
            <View style={{ width: 44 }}></View> {/* For balance */}
          </View>
          
          <WebView
            source={{ uri: webViewUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled" 
      >
        <Text style={styles.title}>{t("register.title") || "Kayıt Ol"}</Text>
        
        <TextInput
          style={styles.input}
          placeholder={t("register.email") || "E-posta"}
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading && !isGoogleLoading}
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t("register.password") || "Şifre"}
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!isLoading && !isGoogleLoading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <AntDesign 
              name={showPassword ? "eye" : "eyeo"} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t("register.confirmPassword") || "Şifreyi Doğrula"}
            placeholderTextColor="#888"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading && !isGoogleLoading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <AntDesign 
              name={showConfirmPassword ? "eye" : "eyeo"} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity
          style={[styles.button, (isLoading || isGoogleLoading) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading || isGoogleLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("register.button") || "Kayıt Ol"}</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.orText}>— {t("register.or") || "veya"} —</Text>
        
        <TouchableOpacity 
          style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]} 
          //onPress={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <AntDesign name="google" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.googleButtonText}>{t("register.google") || "Google ile Kayıt Ol"}</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate("Login")} 
          style={styles.link}
          disabled={isLoading || isGoogleLoading}
        >
          <Text style={styles.linkText}>{t("register.haveAccount") || "Zaten hesabınız var mı? Giriş yapın"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default RegisterScreen;