import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  BackHandler,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { authService } from "../services/apiService";
import styles from "../styles/ProfileScreen.styles";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

type Props = StackScreenProps<RootStackParamList, "Profile">;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState<"email" | "password" | null>(null);
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email güncelleme işlemi
  const handleUpdateEmail = async () => {
    // Form doğrulama
    if (!email.trim() || !password.trim() || !newEmail.trim()) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun");
      return;
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert("Hata", "Geçerli bir e-posta adresi giriniz");
      return;
    }

    // Eğer mevcut email ile yeni email aynıysa
    if (email === newEmail) {
      Alert.alert("Hata", "Yeni e-posta adresi mevcut e-posta adresinden farklı olmalıdır");
      return;
    }

    try {
      console.log("Updating email with:", {
        oldEmail: email,
        oldPassword: "***", // Şifreyi gizle
        newEmail: newEmail,
        newPassword: null // Şifre güncellemesi yapmıyoruz
      });

      // Email güncelleme - şifre değişikliği yok, newPassword null olmalı
      const result = await authService.updateProfile(email, password, newEmail, null);
      
      Alert.alert("Başarılı", result.message || "E-posta adresiniz başarıyla güncellendi");
      setModalVisible(null);
      
      // Formu temizle
      setEmail("");
      setPassword("");
      setNewEmail("");
      setShowCurrentPassword(false);
    } catch (error: any) {
      console.error("❌ [UPDATE_EMAIL] Error:", error);
      console.error("❌ [UPDATE_EMAIL] Error type:", typeof error);
      console.error("❌ [UPDATE_EMAIL] Error message:", error?.message);
      
      let errorMessage = t("profile.errorMessage") || "Bir hata oluştu";
      
      if (error && error.message) {
        if (error.message.includes("Invalid credentials") || error.message.includes("geçersiz")) {
          errorMessage = "Mevcut email veya şifre hatalı";
        } else if (error.message.includes("already exists") || error.message.includes("zaten mevcut")) {
          errorMessage = "Bu email adresi zaten kullanımda";
        } else if (error.message.includes("network") || error.message.includes("ağ")) {
          errorMessage = "Ağ bağlantısı hatası. Lütfen tekrar deneyin.";
        } else {
          errorMessage = error.message;
        }
      }
      
      console.log("❌ [UPDATE_EMAIL] Final error message:", errorMessage);
      Alert.alert(t("profile.error") || "Hata", errorMessage);
    }
  };

  // Şifre güncelleme işlemi
  const handleUpdatePassword = async () => {
    // Form doğrulama
    if (!email.trim() || !password.trim() || !newPassword.trim()) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun");
      return;
    }

    // Şifre uzunluğu kontrolü
    if (newPassword.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır");
      return;
    }

    // Mevcut şifre ile yeni şifre aynıysa
    if (password === newPassword) {
      Alert.alert("Hata", "Yeni şifre mevcut şifreden farklı olmalıdır");
      return;
    }

    try {
      console.log("Updating password with:", {
        oldEmail: email,
        oldPassword: "***", // Şifreyi gizle
        newEmail: null, // Email güncellemesi yapmıyoruz
        newPassword: "***" // Şifreyi gizle
      });

      // Şifre güncelleme - email değişikliği yok, newEmail null olmalı
      const result = await authService.updateProfile(email, password, null, newPassword);
      
      Alert.alert("Başarılı", result.message || "Şifreniz başarıyla güncellendi");
      setModalVisible(null);
      
      // Formu temizle
      setEmail("");
      setPassword("");
      setNewPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    } catch (error: any) {
      console.error("❌ [UPDATE_PASSWORD] Error:", error);
      console.error("❌ [UPDATE_PASSWORD] Error type:", typeof error);
      console.error("❌ [UPDATE_PASSWORD] Error message:", error?.message);
      
      let errorMessage = t("profile.errorMessage") || "Bir hata oluştu";
      
      if (error && error.message) {
        if (error.message.includes("Invalid credentials") || error.message.includes("geçersiz")) {
          errorMessage = "Mevcut email veya şifre hatalı";
        } else if (error.message.includes("weak password") || error.message.includes("zayıf şifre")) {
          errorMessage = "Şifre çok zayıf. Daha güçlü bir şifre seçin.";
        } else if (error.message.includes("network") || error.message.includes("ağ")) {
          errorMessage = "Ağ bağlantısı hatası. Lütfen tekrar deneyin.";
        } else {
          errorMessage = error.message;
        }
      }
      
      console.log("❌ [UPDATE_PASSWORD] Final error message:", errorMessage);
      Alert.alert(t("profile.error") || "Hata", errorMessage);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t("profile.logout") || "Çıkış Yap",
      "Çıkış yapmak istediğinizden emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🚪 [LOGOUT] User logging out...");
              await logout();
              console.log("✅ [LOGOUT] User logged out successfully");
              // Navigation will happen automatically via AuthContext
            } catch (error: any) {
              console.error("❌ [LOGOUT] Error during logout:", error);
              Alert.alert(t("profile.error"), t("profile.errorMessage"));
            }
          }
        }
      ]
    );
  };

  const handleFavorites = () => {
    navigation.navigate("Favorites");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <MaterialIcons
            name="account-circle"
            size={100}
            color="#9ca3af"
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalVisible("email")}
          >
            <Text style={styles.buttonText}>{t('profile.updateEmail')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalVisible("password")}
          >
            <Text style={styles.buttonText}>{t('profile.changePassword')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFavorites}
          >
            <Text style={styles.buttonText}>{t('profile.favorites')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.complaintButton}
            onPress={() => navigation.navigate("Complaint")}
          >
            <MaterialIcons name="email" size={20} color="#000" />
            <Text style={styles.complaintButtonText}>{t('profile.complaint')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>{t('profile.logoutButton')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* E-mail Güncelle Modal */}
      <Modal visible={modalVisible === "email"} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalBackground}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('profile.updateEmail')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('profile.emailPlaceHolder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#999"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('profile.passwordPlaceHolder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showCurrentPassword}
                autoCorrect={false}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <AntDesign
                  name={showCurrentPassword ? "eye" : "eyeo"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('profile.newEmail')}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleUpdateEmail}>
              <Text style={styles.modalButtonText}>{t('profile.updateButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setModalVisible(null);
              // Formu temizle
              setEmail("");
              setPassword("");
              setNewEmail("");
              setShowCurrentPassword(false);
            }}>
              <Text style={styles.cancelLink}>İptal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Şifre Değiştir Modal */}
      <Modal visible={modalVisible === "password"} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalBackground}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('profile.changePassword')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('profile.emailPlaceHolder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#999"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('profile.passwordPlaceHolder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showCurrentPassword}
                autoCorrect={false}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <AntDesign
                  name={showCurrentPassword ? "eye" : "eyeo"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('profile.newPassword')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCorrect={false}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <AntDesign
                  name={showNewPassword ? "eye" : "eyeo"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleUpdatePassword}>
              <Text style={styles.modalButtonText}>{t('profile.updateButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setModalVisible(null);
              // Formu temizle
              setEmail("");
              setPassword("");
              setNewPassword("");
              setShowCurrentPassword(false);
              setShowNewPassword(false);
            }}>
              <Text style={styles.cancelLink}>İptal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;