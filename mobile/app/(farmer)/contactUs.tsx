import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Appbar } from 'react-native-paper';
import { router } from 'expo-router';
import { defaultStyles } from '@/styles';

const ContactUsScreen = () => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@foodhouse.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+15551234567');
  };

  const handleWhatsAppPress = () => {
    const phoneNumber = '+15551234567';
    const message = 'Hello, I need support.';
    Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
  };

  return (
    <>
    <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Contact Us" />
          </Appbar.Header>
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>

        <TouchableOpacity style={styles.row} onPress={handleEmailPress}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={20} color="#1db954" />
          </View>
          <Text style={styles.text}>support@foodhouse.com</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={handlePhonePress}>
          <View style={styles.iconContainer}>
            <Ionicons name="call" size={20} color="#1db954" />
          </View>
          <Text style={styles.text}>+1 (555)123-4567</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={handleWhatsAppPress}>
          <View style={styles.iconContainer}>
            <FontAwesome name="whatsapp" size={20} color="#1db954" />
          </View>
          <Text style={styles.text}>Chat on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </>
  );
};

export default ContactUsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  innerContainer: {
    padding: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    backgroundColor: '#e9fbe9',
    padding: 10,
    borderRadius: 30,
    marginRight: 15,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});
