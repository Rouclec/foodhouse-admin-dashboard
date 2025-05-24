import { router } from 'expo-router';
import { Dimensions, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import styles from '@/styles/(auth)/indexstyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Define image dimensions
const imageWidth = screenWidth / 3.5;
const imageHeight = (imageWidth * 14) / 11;

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SafeAreaView style={styles.safeArea}>
          {/* Image container */}
          <View style={styles.imageContainer}>
            {/* columns and rows of the image container */}
            <View style={[styles.imageRows]}>
              {[
                require("@/assets/images/rectangle11.png"),
                require("@/assets/images/rectangle12.png"),
              ].map((source, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <ImageBackground source={source} style={styles.image}/>
                </View>
              ))}
            </View>

            <View style={[styles.imageRows]}>
              {[
                require("@/assets/images/rectangle13.png"),
                require("@/assets/images/rectangle17.png"),
                require("@/assets/images/rectangle14.png"),
              ].map((source, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <ImageBackground source={source} style={styles.image}/>
                </View>
              ))}
            </View>

            <View style={[styles.imageRows]}>
              {[
                require("@/assets/images/rectangle16.png"),
                require("@/assets/images/rectangle16.png"),
              ].map((source, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <ImageBackground source={source} style={styles.image}/>
                </View>
              ))}
            </View>

            <View style={[styles.imageRows]}>
              {[
                require("@/assets/images/rectangle19.png"),
                require("@/assets/images/rectangle18.png"),
                require("@/assets/images/rectangle15.png"),
              ].map((source, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <ImageBackground source={source} style={styles.image}/>
                </View>
              ))}
            </View>
          </View>

          {/* Text container */}
          <View style={styles.textContainer}>
            <Text style={styles.headingH1}>
              Welcome To{"\n"}
              <Text style={{ fontWeight: "bold" }}>FoodHouse</Text>
            </Text>
            
            {/* New descriptive text */}
            <Text style={styles.subText}>
              Discover fresh local produce and essentials delivered right to your doorstep, 
              while supporting our community of farmers and local sellers who bring their 
              best products to a wider audience.
            </Text>
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Button fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace("/onboarding")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

