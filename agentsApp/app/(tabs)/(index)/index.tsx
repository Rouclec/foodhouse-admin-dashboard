import React, { useContext, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon, Text, TextInput } from "react-native-paper";
import { Context, ContextType } from "../../_layout";
import { defaultStyles, index1, farmerIndexStyles as styles } from "@/styles";
import { Colors } from "@/constants";
import i18n from "@/i18n";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

const HOUR_OF_DAY = new Date().getHours();

export default function Orders() {
  const { user } = useContext(Context) as ContextType;
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <KeyboardAvoidingView
      style={defaultStyles.flex}
      behavior={"padding"}
      keyboardVerticalOffset={0}
    >
      <View style={[defaultStyles.flex, styles.bgWhite]}>
        {/* Header without search field */}
        <View style={styles.appHeader}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.appHeaderContent}>
              <View style={styles.appHeaderTopContainer}>
                <View style={styles.appHeaderLeftContainer}>
                  <View style={styles.iconContainer}>
                    <Image
                      source={require("@/assets/images/carrots.png")}
                      tintColor={Colors.primary[500]}
                    />
                  </View>
                  <View>
                    <Text style={styles.greetingsText} variant="bodyLarge">
                      {HOUR_OF_DAY < 12
                        ? i18n.t("(farmer).(index).index.goodMorning")
                        : HOUR_OF_DAY < 17
                        ? i18n.t("(farmer).(index).index.goodAfternoon")
                        : i18n.t("(farmer).(index).index.goodEvening")}{" "}
                      👋
                    </Text>
                    <Text style={styles.nameText} variant="titleLarge">
                      {user?.firstName} {user?.lastName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.iconContainer}>
                  <View style={defaultStyles.relativeContainer}>
                    <Icon
                      source={"bell-outline"}
                      size={24}
                      color={Colors.dark[10]}
                    />
                    <View style={styles.noticiatonIndicator} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Body content */}
        <View style={[defaultStyles.container, { padding: 24 }]}>
          <Text>Enter verification number</Text>
          {/* Properly sized search field */}
          <View style={{ marginBottom: 20 }}>
            <TextInput
              placeholder={i18n.t("(farmer).(index).index.searchOrder")}
              placeholderTextColor={Colors.grey["bd"]}
              style={[
                defaultStyles.input, 
                { 
                  height: 48, // Fixed height
                  backgroundColor: Colors.grey["fa"],
                }
              ]}
              outlineStyle={{ borderRadius: 16 }}
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              mode="outlined"
              left={
                <TextInput.Icon
                  icon={() => (
                    <Feather
                      name="search"
                      size={20}
                      color={Colors.grey["bd"]}
                    />
                  )}
                />
              }
              theme={{
                colors: {
                  primary: Colors.primary[500],
                  background: Colors.grey["fa"],
                  error: Colors.error,
                },
                roundness: 16,
              }}
            />
          </View>

         

          <View style={index1.buttonContainer}>
        <TouchableOpacity
          style={[index1.button, index1.buttonbg]}
          onPress={() => router.replace("/order-details")}
          activeOpacity={0.8}
        >
          <Text style={index1.buttonText}>
            Get Details
          </Text>
        </TouchableOpacity>
      </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}