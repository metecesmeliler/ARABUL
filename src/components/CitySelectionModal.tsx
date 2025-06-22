import React, { useState } from "react";
import { Modal, View, Text, FlatList, TouchableOpacity } from "react-native";
import styles from "../styles/CitySelectionModel.styles"
import { useTranslation } from "react-i18next";

const availableCities = ["Lefkoşa", "Girne", "Gazi Mağusa", "Güzelyurt", "İskele","Lefke"];

interface Props {
  visible: boolean;
  onSelectCities: (cities: string[]) => void;
  onClose: () => void;
}

const CitySelectionModal: React.FC<Props> = ({ visible, onSelectCities, onClose }) => {
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const { t } = useTranslation();

  const toggleCitySelection = (city: string) => {
    setSelectedCities((prevCities) =>
      prevCities.includes(city) ? prevCities.filter((c) => c !== city) : [...prevCities, city]
    );
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t("citySelection.selectCity")}</Text>
          <FlatList
            data={availableCities}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.cityItem, selectedCities.includes(item) && styles.selectedCity]}
                onPress={() => toggleCitySelection(item)}
              >
                <Text style={[styles.cityText, selectedCities.includes(item) && styles.selectedText]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton} testID="cancel-button">
              <Text style={styles.buttonText}>{t("citySelection.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="confirm-button"
              onPress={() => onSelectCities(selectedCities)}
              style={[styles.confirmButton, selectedCities.length === 0 && styles.disabledButton]}
              disabled={selectedCities.length === 0}
            >
              <Text style={styles.buttonText}>{t("citySelection.confirm")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CitySelectionModal;
