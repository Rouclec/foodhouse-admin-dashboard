import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

 export default function(){
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English (US)' },
    { code: 'fr', name: 'Français' },
    // Add this when ready:
    // { code: 'ar', name: 'العربية (تونس)' }
  ];

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    // The languageDetector will automatically cache this to AsyncStorage
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('language')}</Text>
      <Text style={styles.subheader}>{t('suggested')}</Text>
      
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageItem,
            i18n.language === lang.code && styles.selectedLanguage
          ]}
          onPress={() => changeLanguage(lang.code)}
        >
          <Text style={styles.languageText}>{lang.name}</Text>
          {i18n.language === lang.code && (
            <View style={styles.checkmark} />
          )}
        </TouchableOpacity>
      ))}
      
      <Text style={styles.subheader}>{t('others')}</Text>
      {/* Add other languages here when needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    marginTop: 8,
  },
  languageItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedLanguage: {
    backgroundColor: '#f5f5f5',
  },
  languageText: {
    fontSize: 16,
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
});

