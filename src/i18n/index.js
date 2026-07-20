import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Localization from 'expo-localization'

import en from './locales/en.json'
import fr from './locales/fr.json'

const STORE_LANGUAGE_KEY = 'settings.lang'

const languageDetectorPlugin = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async function (callback) {
    try {
      // get stored language from Async storage
      await AsyncStorage.getItem(STORE_LANGUAGE_KEY).then((language) => {
        if (language) {
          // if language was stored before, use this language in the app
          return callback(language)
        } else {
          // default to device language or French
          const deviceLang = Localization.getLocales()[0]?.languageCode || 'fr'
          return callback(deviceLang)
        }
      })
    } catch (error) {
      console.log('Error reading language', error)
      return callback('fr')
    }
  },
  cacheUserLanguage: async function (language) {
    try {
      // save a user's language choice in Async storage
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language)
    } catch (error) {
      console.log('Error saving language', error)
    }
  },
}

const resources = {
  en: { translation: en },
  fr: { translation: fr },
}

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    compatibilityJSON: 'v3',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })

export default i18n
