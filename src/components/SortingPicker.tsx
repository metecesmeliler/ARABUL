import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native";
import { SortingOption } from "../types";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface SortingPickerProps {
  selectedOption: SortingOption;
  onChange: (option: SortingOption) => void;
}

const SORTING_OPTIONS: SortingOption[] = ["nearest", "mostPopular", "byRanking"];

const SortingPicker: React.FC<SortingPickerProps> = ({ selectedOption, onChange }) => {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [label, setLabel] = useState(t(`sorting.${selectedOption}`));

  // update when option **or** language changes
  useEffect(() => {
    setLabel(t(`sorting.${selectedOption}`));
  }, [selectedOption, i18n.language]);

  const labelFor = (opt: SortingOption) => t(`sorting.${opt}`);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>{label}</Text>
        <MaterialIcons name="arrow-drop-down" size={22} color="white" />
      </TouchableOpacity>

      <Modal transparent animationType="fade" visible={modalVisible}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <FlatList
              data={SORTING_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{labelFor(item)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#f5f5f5", // Header ile uyumlu hale getirmek için arka plan
  },
  dropdownButton: {
    backgroundColor: "#ffad00",
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    borderRadius: 5,
    marginTop: 5, // Header ile arasında boşluk bırak
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 100, // Menü üstten başlamasın
  },
  modalContainer: {
    backgroundColor: "white",
    width: "90%",
    borderRadius: 10,
    paddingVertical: 10,
    elevation: 5,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  optionText: {
    fontSize: 16,
    textAlign: "center",
  },
});

export default SortingPicker;
