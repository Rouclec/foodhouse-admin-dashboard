import { router } from "expo-router";
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { defaultStyles, index1 } from "@/styles";
import i18n from "@/i18n";
import React from "react";

export default function TabOneScreen() {
  return (
    <>
      <ScrollView
        contentContainerStyle={[
          defaultStyles.scrollContainer,
          index1.nopadding,
        ]}
      >
        <View style={index1.safeArea}>
          <View style={index1.imageContainer}>
            <View style={[index1.imageRows]}>
              {[
                require("@/assets/images/rectangle11.png"),
                require("@/assets/images/image4.png"),
              ].map((source, index) => (
                <View key={index} style={index1.imageWrapper}>
                  <ImageBackground source={source} style={index1.image} />
                </View>
              ))}
            </View>

            <View style={[index1.imageRows]}>
              {[
                require("@/assets/images/image3.png"),
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
                require("@/assets/images/rectangle20.jpeg"),
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
                require("@/assets/images/image2.png"),
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

            {/* <Text style={index1.subText}>
              {i18n.t("(auth).index.discoverFresh")}
            </Text> */}
          </View>
        </View>
      </ScrollView>

      <View style={index1.buttonContainer}>
        <TouchableOpacity
          style={index1.button}
          onPress={() => router.replace("/login")}
          activeOpacity={0.8}
        >
          <Text style={index1.buttonText}>
            {i18n.t("(auth).index.continue")}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
