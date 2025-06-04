import React, { useContext, useState } from "react";
import { View, ScrollView, Image, TouchableOpacity, Share } from "react-native";
import { useRouter } from "expo-router";
import {
  Appbar,
  Button,
  Text,
  Divider,
  Avatar,
  List,
  Portal,
  Dialog,
} from "react-native-paper";
import { Colors } from "@/constants";
import {
  defaultStyles,
  imagePickerStyles,
  signupStyles,
  profileFlowStyles as styles,
} from "@/styles";
import i18n from "@/i18n";
import { Context, ContextType } from "@/app/_layout";

export default function Profile() {
  const router = useRouter();
  const [visibleLogoutDialog, setVisibleLogoutDialog] = useState(false);
  const { user } = useContext(Context) as ContextType;

  const handleLogout = () => {
    router.replace("/(auth)/login");
  };

  const handleBecomeVIP = () => {
    router.push("/(auth)/(subsciption-flow)");
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: "Check out this awesome app: https://myfoodhouse.com",
        title: "Share App",
      });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <Appbar.Header dark={false} style={defaultStyles.appHeader}>
        <Appbar.Content title={i18n.t("(farmer).(profile-flow).profile.title")} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={defaultStyles.scrollContainer}>
        <View style={signupStyles.allInput}>
          <View style={signupStyles.imageContainer}>
            <TouchableOpacity style={signupStyles.imageUpload}>
              <View style={signupStyles.addImageContainer}>
                <Image
                  source={{ uri: user?.profileImage }}
                  style={signupStyles.profileImage}
                />
                <Avatar.Icon
                  size={24}
                  icon="camera"
                  color="#fff"
                  style={signupStyles.cameraIcon}
                />
              </View>
            </TouchableOpacity>
            <Text variant="titleLarge">
              {`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
            </Text>
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.vip}>
              <Text
                variant="titleMedium"
                style={[defaultStyles.heading, { color: "#fff" }]}
              >
                {i18n.t("(farmer).(profile-flow).profile.heading")}
              </Text>
              <Text
                style={[
                  defaultStyles.subheaderText,
                  { color: "#fff", marginBottom: 12 },
                ]}
              >
               {i18n.t("(farmer).(profile-flow).profile.description")}
              </Text>
              <Button
                mode="contained"
                onPress={handleBecomeVIP}
                style={styles.vipButton}
                labelStyle={{ color: Colors.primary[500] }}
              >
                {i18n.t("(farmer).(profile-flow).profile.button")}
              </Button>
            </View>

            <View style={{ justifyContent: "center" }}>
              <Image
                source={require("@/assets/images/icons/vip1.png")}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.navigateSection}>
            <TouchableOpacity
              style={styles.navigationItem}
              onPress={() => router.push("/(farmer)/settings")}
            >
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Setting.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).profile.tab1")}</Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navigationItem} onPress={shareApp}>
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Send.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).profile.tab2")}</Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navigationItem}>
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/3 User.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.navigationText}>{i18n.t("(farmer).(profile-flow).profile.tab4")}</Text>
              </View>
              <List.Icon icon="chevron-right" />
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <TouchableOpacity
              style={styles.navigationItem}
              onPress={() => setVisibleLogoutDialog(true)}
            >
              <View style={styles.navigationContent}>
                <Image
                  source={require("@/assets/images/icons/Send.png")}
                  style={styles.navigationIcon}
                />
                <Text style={styles.logout}>{i18n.t("(farmer).(profile-flow).profile.tab3")}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={visibleLogoutDialog}
          onDismiss={() => setVisibleLogoutDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.heading}>{i18n.t("(farmer).(profile-flow).profile.tab3")}</Dialog.Title>
          <Dialog.Content>
            <Text>{i18n.t("(farmer).(profile-flow).profile.confirmation")}</Text>
          </Dialog.Content>
          <Dialog.Actions style={imagePickerStyles.bottomContainer}>
            <Button
              onPress={() => setVisibleLogoutDialog(false)}
              style={[imagePickerStyles.button1, imagePickerStyles.skipButton]}
              labelStyle={imagePickerStyles.skipButtonText}
            >
              {i18n.t("(farmer).(profile-flow).profile.button1")}
            </Button>
            <Button onPress={handleLogout} style={imagePickerStyles.button1}>
              {i18n.t("(farmer).(profile-flow).profile.button2")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
