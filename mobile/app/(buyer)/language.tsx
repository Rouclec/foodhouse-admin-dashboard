import { defaultStyles, selectionSubscriptionStyles } from "@/styles";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Appbar, Icon, Text } from "react-native-paper";

export default function () {
  const { t, i18n } = useTranslation();
  const languages = [
    {
      code: "en",
      name: i18n.t("(farmer).(profile-flow).(settings).english"),
    },
    {
      code: "fr",
      name: i18n.t("(farmer).(profile-flow).(settings).french"),
    },
    {
      code: "sw",
      name: i18n.t("(farmer).(profile-flow).(settings).swahili"),
    }
    // Add this when ready:
    // { code: "ar", name: i18n.t("(farmer).(profile-flow).(settings).arabic") }
  ];

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}
            >
              <Icon source={"arrow-left"} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t("(farmer).(profile-flow).(settings).language")}{" "}
            </Text>
            <View />
          </Appbar.Header>
             <ScrollView
                        contentContainerStyle={defaultStyles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
              
              <View>
                {languages.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[selectionSubscriptionStyles.languageItem]}
                    onPress={() => changeLanguage(lang.code)}
                  >
                    <Text style={selectionSubscriptionStyles.planPrice}>
                      {lang.name}
                    </Text>
                    <View style={selectionSubscriptionStyles.planSelector}>
                      <View
                        style={[selectionSubscriptionStyles.selectionCircle]}
                      >
                        {i18n.language === lang.code && (
                          <View
                            style={selectionSubscriptionStyles.innerCircle}
                          />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={selectionSubscriptionStyles.planPrice}>
                {t("others")}
              </Text>
            </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
