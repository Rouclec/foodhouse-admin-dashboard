import React from "react";
import {
  View,
  ScrollView,
  Linking,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { Appbar, Text, List, Divider, Icon } from "react-native-paper";
import {
  defaultStyles,
  profileFlowStyles,
  signupStyles,
  profileFlowStyles as styles,
} from "@/styles";
import i18n from "@/i18n";
import { FontAwesome } from "@expo/vector-icons";
import { Colors } from "@/constants";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        // behavior={Platform.OS === "ios" ? "padding" : undefined}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      >
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}
            >
              <Icon source={"arrow-left"} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t("(farmer).(profile-flow).(settings).heading")}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={signupStyles.allInput}>
              <View style={styles.navigateSection}>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push("/(farmer)/personal-info")}
                >
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="user"
                        size={20}
                        color={Colors.primary[500]}
                       
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).(settings).heading1")}{" "}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push("/(farmer)/change-password")}
                >
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="lock"
                        size={20}
                        color={Colors.primary[500]}
                        
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).(settings).heading2")}{" "}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push("/(farmer)/language")}
                >
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="language"
                        size={20}
                        color={Colors.primary[500]}
                       
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).(settings).heading3")}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push("/(farmer)/contact-us")}
                >
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="envelope"
                        size={20}
                        color={Colors.primary[500]}
                        
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).(settings).heading4")}{" "}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() =>
                    Linking.openURL(process.env.EXPO_PUBLIC_WEBSITE_URL!)
                  }
                >
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="file-text"
                        size={20}
                        color={Colors.primary[500]}
                       
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).(settings).heading6")}{" "}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() =>
                    Linking.openURL(process.env.EXPO_PUBLIC_WEBSITE_URL!)
                  }
                >
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="shield"
                        size={20}
                        color={Colors.primary[500]}
                        
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).(settings).heading7")}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() =>
                    Linking.openURL(
                      `${process.env.EXPO_PUBLIC_WEBSITE_URL!}/about`
                    )
                  }
                >
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="info-circle"
                        size={20}
                        color={Colors.primary[500]}
                       
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).(settings).heading8")}{" "}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <Divider style={profileFlowStyles.divider} />
                <TouchableOpacity style={styles.navigationItem}>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.dangerContainer}>
                      <FontAwesome
                        name="trash"
                        size={20}
                        color={Colors.error}
                        
                      />
                    </View>
                    <Text style={styles.logout}>
                      {i18n.t("(farmer).(profile-flow).(settings).heading9")}{" "}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
