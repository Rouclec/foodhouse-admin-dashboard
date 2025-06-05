import React, { useContext, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  KeyboardAvoidingView,
} from "react-native";
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
  profileFlowStyles,
  signupStyles,
  profileFlowStyles as styles,
} from "@/styles";
import i18n from "@/i18n";
import { Context, ContextType } from "@/app/_layout";

import { useMutation, useQuery } from "@tanstack/react-query";
import { usersGetUserActiveSubscriptionOptions, usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { FontAwesome } from "@expo/vector-icons";

export default function Profile() {
  const router = useRouter();
  const [visibleLogoutDialog, setVisibleLogoutDialog] = useState(false);
  const { user } = useContext(Context) as ContextType;

  const handleLogout = () => {
    router.replace("/(auth)/login");
  };

  const handleBecomeVIP = () => {
    router.push("/(auth)/subscribe");
  };
  
  const {data: userActiveSubscription} = useQuery({
    ...usersGetUserActiveSubscriptionOptions({
      path: {
        userId: user?.userId ?? ""
      }
    })
  })

  const shareApp = async () => {
    await Share.share({
      message: `Check out this awesome app: ${process.env.EXPO_PUBLIC_WEBSITE_URL}`,
      title: "Share App",
    });
  };

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
            <Appbar.Content
              title={i18n.t("(farmer).(profile-flow).profile.title")}
            />
          </Appbar.Header>
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
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={signupStyles.allInput}>
              {!userActiveSubscription?.userSubscription && (
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
              )}

              <View style={styles.navigateSection}>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push("/(farmer)/settings")}
                >
                  <View style={styles.navigationContent}>
                    <FontAwesome
                      name="cog"
                      size={20}
                      color={Colors.primary[500]}
                      style={styles.navigationIcon}
                    />
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).profile.tab1")}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={shareApp}
                >
                  <View style={styles.navigationContent}>
                    <FontAwesome
                      name="paper-plane"
                      size={20}
                      color={Colors.primary[500]}
                      style={styles.navigationIcon}
                    />
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).profile.tab2")}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={shareApp}
                >
                  <View style={styles.navigationContent}>
                    <FontAwesome
                      name="users"
                      size={20}
                      color={Colors.primary[500]}
                      style={styles.navigationIcon}
                    />
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).profile.tab4")}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>
                <Divider style={styles.divider} />
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => setVisibleLogoutDialog(true)}
                >
                  <View style={profileFlowStyles.row}>
                    <FontAwesome
                      name="sign-out"
                      size={20}
                      color="#ff0000"
                      style={styles.navigationIcon}
                    />

                    <Text style={styles.logout}>
                      {i18n.t("(farmer).(profile-flow).profile.tab3")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog
          visible={visibleLogoutDialog}
          onDismiss={() => setVisibleLogoutDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.heading}>
            {i18n.t("(farmer).(profile-flow).profile.tab3")}
          </Dialog.Title>
          <Dialog.Content>
            <Text>
              {i18n.t("(farmer).(profile-flow).profile.confirmation")}
            </Text>
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
