import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import tr from './locales/tr';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr }
    },
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Handle language detection and setting separately
const setupLanguageDetection = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem('user-language');
    if (storedLanguage) {
      await i18n.changeLanguage(storedLanguage);
    }
  } catch (error) {
    console.log('Error setting up language:', error);
  }
};

// Helper function to change and save language
export const changeLanguage = async (lng: string) => {
  try {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem('user-language', lng);
  } catch (error) {
    console.log('Error changing language:', error);
  }
};

// Run the setup function
setupLanguageDetection();

export default i18n;
