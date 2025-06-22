import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Supplier } from "../types";
import { useTranslation } from "react-i18next";
import styles from "../styles/BusinessListScreen.styles";

interface SupplierCardProps {
  supplier: Supplier;
  onPress: (supplier: Supplier) => void;
}

// Telefonla arama fonksiyonu
const handleCall = (phoneNumber: string) => {
  Linking.openURL(`tel:${phoneNumber}`).catch((err) => console.error("Failed to make a call", err));
};

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity testID={`supplier-${supplier.SupplierID}`} style={styles.card} onPress={() => onPress(supplier)}>
      <Text style={styles.title}>{supplier.SupplierName}</Text>
      <Text style={styles.text}>{t("supplier.address")}: {supplier.Address}</Text>
      <Text style={styles.text}>{t("supplier.city")}: {supplier.City} - {supplier.Region}</Text>
      <Text style={styles.text}>{t("supplier.phone")}: {supplier.PhoneNumber}</Text>
      <Text style={styles.text}>{t("supplier.distance")}: {supplier.distance_km} km</Text>
      <Text style={styles.text}>{t("supplier.duration")}: {supplier.duration}</Text>

      <TouchableOpacity style={styles.callButton} onPress={() => handleCall(supplier.PhoneNumber)}>
        <MaterialIcons name="call" size={20} color="#ffffff" />
        <Text style={styles.callButtonText}>
          {t("supplier.call")}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default SupplierCard;
