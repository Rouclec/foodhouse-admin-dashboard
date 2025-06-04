import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Appbar,
  Text,
  List,
  Divider,
} from "react-native-paper";
import {
  defaultStyles,
  signupStyles,
  profileFlowStyles as styles,
} from "@/styles";
import i18n from "@/i18n";

export default function SettingsPage() {
  const router = useRouter();
  const [language, setLanguage] = React.useState("English (US)");

  // const handleDeleteAccount = () => {
  //   // Implement delete account logic
  //   console.log("Account deletion requested");
  // };

  return (
    <>
      <Appbar.Header dark={false} style={defaultStyles.appHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={i18n.t("(farmer).(profile-flow).(settings).heading")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={defaultStyles.scrollContainer}>
        <View style={signupStyles.allInput}>
          <View style={styles.navigateSection}>
            <TouchableOpacity
              style={styles.navigationItem}
              onPress={() => router.push("/(farmer)/personal-info")}
            >
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Profile.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).(settings).heading1")} </Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>

            {/* Share App */}
            <TouchableOpacity
              style={styles.navigationItem}
              onPress={() => router.push("/(farmer)/change-password")}
            >
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Lock.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).(settings).heading2")} </Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>

            {/* Invite Friends */}
            <TouchableOpacity style={styles.navigationItem}
            onPress={() => router.push("/(farmer)/language")}>
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Document.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).(settings).heading3")}</Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navigationItem}
              onPress={() => router.push("/(farmer)/contact-us")}
            >
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Setting.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).(settings).heading4")} </Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navigationItem}
              onPress={() => console.log("Share app")}
            >
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Send.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).(settings).heading6")} </Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>

            {/* Invite Friends */}
            <TouchableOpacity style={styles.navigationItem}>
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Send.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).(settings).heading7")}</Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navigationItem}>
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Send.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).(settings).heading8")} </Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>

            <Divider style={styles.divider} />
            <TouchableOpacity style={styles.navigationItem}>
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Send.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.logout}>{i18n.t("(farmer).(profile-flow).(settings).heading9")} </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const style = StyleSheet.create({
  container: {
    ...defaultStyles.container,
    paddingBottom: 24,
  },
  subheader: {
    fontSize: 14,
    // color: Colors.dark.text,
    paddingLeft: 16,
    paddingTop: 16,
  },
  divider: {
    marginVertical: 8,
    // backgroundColor: Colors.light.grey,
  },
  deleteSection: {
    padding: 16,
    alignItems: "center",
  },
  deleteButton: {
    marginBottom: 8,
  },
  deleteWarning: {
    // color: Colors.dark.grey,
    fontSize: 12,
    textAlign: "center",
  },
});
