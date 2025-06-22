import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
  Alert
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { useTranslation } from 'react-i18next';
import { authService } from "../services/apiService";
import { AntDesign } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// Import config
import CONFIG from "../../config.ts";

type Props = StackScreenProps<RootStackParamList, "Login">;

const LoginScreen = ({ navigation }: Props) => {
  useEffect(() => {
    console.log("[LoginScreen] Mounted!");
  }, []);
  
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("login.emptyFields"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login(email, password);
      console.log("✅ Login response:", response);

      if (response.message === "Login successful" && response.user_id) {
        // Use AuthContext to login and store user data
        await login({
          id: response.user_id,
          email: email
        });
        
        // Navigation will happen automatically via AuthContext
        console.log("✅ User logged in successfully via AuthContext");
      } else {
        setError(t("login.invalidCredentials") || "Giriş başarısız");
      }
    } catch (err: any) {
        console.error("❌ Login Error:", err);

        const message = err?.message?.toLowerCase?.();

        if (message?.includes("invalid credentials") || message?.includes("wrong password") || message?.includes("user not found")) {
          setError(t("login.invalidCredentials") || "E-posta veya şifre hatalı");
        } else if (message?.includes("network") || message?.includes("connection") || message?.includes("timeout")) {
          setError(t("login.networkError") || "Bağlantı hatası, lütfen internet bağlantınızı kontrol edin");
        } else {
          setError(t("login.serverError") || "Sunucu hatası, lütfen tekrar deneyin");
        }
      } finally {
      setIsLoading(false);
    }
  };

  
  // Basitleştirilmiş Google Auth - backend mock
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    
    try {
      // Mock bir Google token kullanılacak
      const mockGoogleToken = "mock_token_for_testing";
      
      // Backend'e mock token gönder
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      const response = await authService.googleAuth(mockGoogleToken, platform);
      
      console.log("✅ Mock Google auth successful:", response);
      
      if (response.user_id) {
        // Use AuthContext to login
        await login({
          id: response.user_id,
          email: response.email || "google_user@example.com"
        });
        
        console.log("✅ Google user logged in successfully via AuthContext");
      }
    } catch (error: any) {
      // Backend hatayı yakalamazsa bile devam et
      console.error("❌ Google auth error:", error);
      console.log("Hataya rağmen devam ediliyor...");
      
      // Test kullanıcısı oluştur ve AuthContext'e kaydet
      await login({
        id: 1,
        email: "test_google_user@example.com"
      });
      
      Alert.alert(
        "Test Modu",
        "Google ile giriş işlemi test modunda başarılı oldu.",
        [{ text: "Tamam" }]
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
          style={styles.inner}
        >
          <Text style={styles.title}>{t("login.title")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("login.email")}
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
              placeholder={t("login.password")}
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
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.loginButton, (isLoading || isGoogleLoading) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading || isGoogleLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>{t("login.button")}</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.orText}>— {t("login.or") || "veya"} —</Text>
          
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
                <Text style={styles.googleButtonText}>{t("login.google") || "Google ile Giriş Yap"}</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            style={styles.registerLink}
            disabled={isLoading || isGoogleLoading}
          >
            <Text style={styles.registerText}>{t("login.noAccount")}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  inner: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    color: "#333",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    paddingRight: 15,
    paddingLeft: 5,
  },
  loginButton: {
    backgroundColor: "#ffad00",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  registerLink: {
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#007bff",
  },
  orText: {
    color: "#666",
    textAlign: "center",
    marginVertical: 15,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    flexDirection: "row",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;