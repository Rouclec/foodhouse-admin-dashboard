import { router } from "expo-router";
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { index1 } from "@/styles";
import i18n from "@/i18n";

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
                  <ImageBackground source={source} style={index1.image} />
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
                  <ImageBackground source={source} style={index1.image} />
                </View>
              ))}
            </View>

            <View style={[index1.imageRows]}>
              {[
                require("@/assets/images/rectangle16.png"),
                require("@/assets/images/rectangle16.png"),
              ].map((source, index) => (
                <View key={index} style={index1.imageWrapper}>
                  <ImageBackground source={source} style={index1.image} />
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
                  <ImageBackground source={source} style={index1.image} />
                </View>
              ))}
            </View>
          </View>

          <View style={index1.textContainer}>
            <Text style={index1.headingH1}>
              {i18n.t("(auth).index.welcomeTo")}
              {"\n"}
              <Text style={{ fontWeight: "bold" }}>FoodHouse</Text>
            </Text>

            <Text style={index1.subText}>
              {i18n.t("(auth).index.discoverFresh")}
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
          <Text style={index1.buttonText}>
            {i18n.t("(auth).index.continue")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
