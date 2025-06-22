import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import CONFIG from "../../config.ts";

// Sayfa tipi
type Props = StackScreenProps<RootStackParamList, "Complaint">;

const ComplaintScreen: React.FC<Props> = ({ route, navigation }) => {
  const { supplierId, supplierName } = route.params || {};
  const isBusinessComplaint = !!supplierId;
  const { t, i18n } = useTranslation();
  const [complaintText, setComplaintText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!complaintText.trim()) {
      Alert.alert(t("complaint.warning"), t("complaint.emptyMessage"));
      return;
    }

    try {
      setIsSubmitting(true);
      const userIdStr = await AsyncStorage.getItem("user_id");

      if (!userIdStr) {
        Alert.alert(t("complaint.warning"), t("complaint.loginMessage"));
        navigation.navigate("Login");
        return;
      }

      const userId = parseInt(userIdStr);

      const response = await axios.post(`${CONFIG.API_BASE_URL}/submit-complaint`, {
        user_id: userId,
        complaint_text: complaintText,
        supplier_id: supplierId || null
      });

      if (response.data.success) {
        Alert.alert(t("complaint.thanks"), t("complaint.successMessage"));
        setComplaintText("");
        navigation.goBack();
      } else {
        Alert.alert(t("complaint.error"), response.data.message || t("complaint.errorMessage"));
      }
    } catch (error) {
      console.error("Şikayet gönderme hatası:", error);
      Alert.alert(t("complaint.error"), t("complaint.errorMessage"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('complaint.title')}</Text>

        <Text style={styles.subtext}>
          {t('complaint.arabulText')}
        </Text>

        {isBusinessComplaint && (
          <Text style={styles.supplierName}>{t('complaint.business')}: {supplierName}</Text>
        )}

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textArea}
            placeholder={
              isBusinessComplaint
                ? t('complaint.complaintPlaceHolder1')
                : t('complaint.complaintPlaceHolder2')
            }
            placeholderTextColor="#999"
            value={complaintText}
            onChangeText={setComplaintText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>{t('complaint.sendButton')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    flexGrow: 1,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 10,
    color: "#222",
  },
  subtext: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    lineHeight: 20,
  },
  supplierName: {
    fontSize: 16,
    marginBottom: 15,
    color: "#555",
    fontStyle: "italic",
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#444",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 15,
    fontSize: 15,
    backgroundColor: "#fff",
    height: 140,
  },
  submitButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "flex-start",
    minWidth: 120,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ComplaintScreen;
