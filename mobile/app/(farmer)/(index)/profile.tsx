import React, { useContext, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  KeyboardAvoidingView,
  Keyboard,
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
  buyerProductsStyles,
  defaultStyles,
  profileFlowStyles,
  signupStyles,
  profileFlowStyles as styles,
} from "@/styles";
import i18n from "@/i18n";
import { Context, ContextType } from "@/app/_layout";

import {  useQuery } from "@tanstack/react-query";
import {
  usersGetUserActiveSubscriptionOptions,
  
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { FontAwesome } from "@expo/vector-icons";
import {
  FilterBottomSheet,
  FilterBottomSheetRef,
} from "@/components/(buyer)/(index)/FilterBottomSheet";

export default function Profile() {
  const router = useRouter();
  const sheetRef = useRef<FilterBottomSheetRef>(null);
  const { user } = useContext(Context) as ContextType;

  const handleLogout = () => {
    router.replace("/(auth)/login");
  };

  const handleBecomeVIP = () => {
    router.push("/(auth)/subscribe");
  };

  const { data: userActiveSubscription } = useQuery({
    ...usersGetUserActiveSubscriptionOptions({
      path: {
        userId: user?.userId ?? "",
      },
    }),
  });

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

              <View style={styles.navigateSection}>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push("/(farmer)/settings")}
                >
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                    <FontAwesome
                      name="cog"
                      size={20}
                      color={Colors.primary[500]}
                      style={styles.navigationIcon}
                    />
                    </View>
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
                    <View style={profileFlowStyles.iconContainer}>
                    <FontAwesome
                      name="paper-plane"
                      size={20}
                      color={Colors.primary[500]}
                      style={styles.navigationIcon}
                    />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t("(farmer).(profile-flow).profile.tab2")}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>
                <Divider style={styles.divider} />
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={(e) => {
                    Keyboard.dismiss(); 
                    sheetRef.current?.open();
                  }}
                >
                  <View style={profileFlowStyles.row}>
                    <View style={profileFlowStyles.dangerContainer}>
                    <FontAwesome
                      name="sign-out"
                      size={20}
                      color={Colors.error}
                      style={styles.navigationIcon}
                    />
                    </View>

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

      <FilterBottomSheet ref={sheetRef} sheetHeight={200}>
        <View style={[buyerProductsStyles.filtersContainer]}>
          <View style={profileFlowStyles.content}>
            <Text variant="titleMedium" style={buyerProductsStyles.title}>
              {i18n.t("(farmer).(profile-flow).profile.tab3")}
            </Text>

            <Text style={defaultStyles.dialogSubtitle}>
              {i18n.t("(farmer).(profile-flow).profile.confirmation")}
            </Text>
          </View>
          <View style={buyerProductsStyles.bottomButtonContainer}>
            <Button
              onPress={() => {
                sheetRef?.current?.close();
              }}
              style={[
                defaultStyles.button,
                defaultStyles.secondaryButton,
                buyerProductsStyles.halfButton,
              ]}
            >
              <Text style={defaultStyles.secondaryButtonText}>
                {i18n.t("(farmer).(profile-flow).profile.button1")}
              </Text>
            </Button>
            <Button
              onPress={() => {
                handleLogout(), sheetRef?.current?.close();
              }}
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                buyerProductsStyles.halfButton,
              ]}
            >
              <Text style={defaultStyles.buttonText}>
                {i18n.t("(farmer).(profile-flow).profile.button2")}
              </Text>
            </Button>
          </View>
        </View>
      </FilterBottomSheet>
    </>
  );
}
