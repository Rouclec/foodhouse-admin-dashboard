import { router } from 'expo-router';
import { Dimensions, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { index1 } from '@/styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Define image dimensions
const imageWidth = screenWidth / 3.5;
const imageHeight = (imageWidth * 14) / 11;

export default function TabOneScreen() {
  return (
    <View style={index1.container}>
      <ScrollView contentContainerStyle={index1.scrollContent}>
        <SafeAreaView style={index1.safeArea}>
          {/* Image container */}
          <View style={index1.imageContainer}>
            {/* columns and rows of the image container */}
            <View style={[index1.imageRows]}>
              {[
                require("@/assets/images/rectangle11.png"),
                require("@/assets/images/rectangle12.png"),
              ].map((source, index) => (
                <View key={index} style={index1.imageWrapper}>
                  <ImageBackground source={source} style={index1.image}/>
                </View>
              ))}
            </View>

            <View style={[index1.imageRows]}>
              {[
                require("@/assets/images/rectangle13.png"),
                require("@/assets/images/rectangle17.png"),
                require("@/assets/images/rectangle14.png"),
              ].map((source, index) => (
                <View key={index} style={index1.imageWrapper}>
                  <ImageBackground source={source} style={index1.image}/>
                </View>
              ))}
            </View>

            <View style={[index1.imageRows]}>
              {[
                require("@/assets/images/rectangle16.png"),
                require("@/assets/images/rectangle16.png"),
              ].map((source, index) => (
                <View key={index} style={index1.imageWrapper}>
                  <ImageBackground source={source} style={index1.image}/>
                </View>
              ))}
            </View>

            <View style={[index1.imageRows]}>
              {[
                require("@/assets/images/rectangle19.png"),
                require("@/assets/images/rectangle18.png"),
                require("@/assets/images/rectangle15.png"),
              ].map((source, index) => (
                <View key={index} style={index1.imageWrapper}>
                  <ImageBackground source={source} style={index1.image}/>
                </View>
              ))}
            </View>
          </View>

          <View style={index1.textContainer}>
            <Text style={index1.headingH1}>
              Welcome To{"\n"}
              <Text style={{ fontWeight: "bold" }}>FoodHouse</Text>
            </Text>
            
            <Text style={index1.subText}>
              Discover fresh local produce and essentials delivered right to your doorstep, 
              while supporting our community of farmers and local sellers who bring their 
              best products to a wider audience.
            </Text>
          </View>
        </SafeAreaView>
      </ScrollView>

      <View style={index1.buttonContainer}>
        <TouchableOpacity 
          style={index1.button}
          onPress={() => router.replace("/onboarding")}
          activeOpacity={0.8}
        >
          <Text style={index1.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

