import React, { useContext, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Icon, Text, TextInput } from "react-native-paper";
import { Context, ContextType } from "../../_layout";
import { defaultStyles, index1, loginstyles, farmerIndexStyles as styles } from "@/styles";
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

        <View style={[defaultStyles.container, { padding: 24 }]}>

          <View style={defaultStyles.mainContainer}>
            <TextInput
              label="Enter order number"
              placeholderTextColor={Colors.grey["bd"]}
              mode="outlined"
              theme={{
                roundness: 15,
                colors: {
                  onSurfaceVariant: Colors.grey["e8"],
                  primary: Colors.primary[500],
                },
              }}
              outlineColor={Colors.grey["bg"]}
              style={loginstyles.input}
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
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
              
            />
          </View>

          <View style={defaultStyles.bottomButtonContainer}>
            <Button
              style={defaultStyles.primaryButton}
              onPress={() => {
                if (searchQuery.trim()) {
                  router.push({
                    pathname: "/order-details",
                    params: { orderNumber: searchQuery },
                  });
                }
              }}
              disabled={!searchQuery.trim()}
            >
              <Text style={defaultStyles.buttonText}>Get Details</Text>
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
