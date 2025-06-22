import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Image,
  TouchableWithoutFeedback
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

const FLAGS = {
  en: require('../../assets/flags/uk-flag.png'),
  tr: require('../../assets/flags/turkey-flag.png')
};

type LanguageOption = {
  code: string;
  name: string;
  flag: any;
};

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: FLAGS.en },
  { code: 'tr', name: 'Türkçe', flag: FLAGS.tr }
];

const FlagLanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  
  const currentLanguage = i18n.language;
  const currentFlag = currentLanguage === 'tr' ? FLAGS.tr : FLAGS.en;

  const selectLanguage = (lng: string) => {
    changeLanguage(lng);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Language button/icon */}
      <TouchableOpacity 
        style={styles.languageButton} 
        onPress={() => setModalVisible(true)}
      >
        <Image 
          source={currentFlag} 
          style={styles.flagIcon} 
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Language selection modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Language / Dil Seçin</Text>
                
                {LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      currentLanguage === lang.code && styles.activeLanguage
                    ]}
                    onPress={() => selectLanguage(lang.code)}
                  >
                    <Image 
                      source={lang.flag} 
                      style={styles.optionFlag} 
                      resizeMode="contain"
                    />
                    <Text style={[
                      styles.languageName,
                      currentLanguage === lang.code && styles.activeLanguageText
                    ]}>
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  flagIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: '#f5f5f5',
  },
  activeLanguage: {
    backgroundColor: '#FFA000',
  },
  optionFlag: {
    width: 24,
    height: 24,
    marginRight: 12,
    borderRadius: 12,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
  },
  activeLanguageText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default FlagLanguageSelector;
