import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Appbar, Button } from "react-native-paper";
import { defaultStyles, loginstyles, signupStyles } from "@/styles";
import i18n from "@/i18n";

const VarietyPage = () => {
  const router = useRouter();
  const [selectedVarieties, setSelectedVarieties] = useState<string[]>([]);

  const varieties = [
    { 
      name: "Fruits", 
      icon: require("@/assets/images/dummy_product_2.png"),
    },
    { 
      name: "Vegetables", 
      icon: require("@/assets/images/vegetable.png") 
    },
    { 
      name: "Fish", 
      icon: require("@/assets/images/fish-1.png") 
    },
    { 
      name: "Animals", 
      icon: require("@/assets/images/cow.png"),
    },
    { 
      name: "Grains", 
      icon: require("@/assets/images/flour.png") 
    },
    { 
      name: "Fowls", 
      icon: require("@/assets/images/hen.png") 
    },
  ];

  const toggleVarietySelection = (varietyName: string) => {
    setSelectedVarieties(prev => {
      if (prev.includes(varietyName)) {
        return prev.filter(name => name !== varietyName);
      } else {
        return [...prev, varietyName];
      }
    });
  };

  const handleContinue = () => {
    router.push("/(auth)/subscribe");
  };

  return (
    <>
    
      <Appbar.Header dark={false}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={i18n.t("(auth).variety.header")} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={defaultStyles.container}>
          <Text style={signupStyles.subheading}>
            {i18n.t("(auth).variety.description")}
          </Text>

        <View style={loginstyles.varietiesContainer}>
          {varieties.map((variety, index) => {
            const isSelected = selectedVarieties.includes(variety.name);
            return (
              <TouchableOpacity 
                key={index}
                style={[
                  loginstyles.varietyCard,
                  isSelected ? loginstyles.selectedVarietyCard : null
                ]}
                onPress={() => toggleVarietySelection(variety.name)}
              >
                <Image 
                  source={variety.icon} 
                  style={[
                    loginstyles.varietyImage,
                  ]} 
                />
                <Text style={[
                  loginstyles.varietyName,
                  isSelected ? loginstyles.selectedVarietyText : null
                ]}>
                  {variety.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          style={loginstyles.loginButton}
          labelStyle={defaultStyles.buttonText}
        >
          Continue ({selectedVarieties.length})
        </Button>
      </View>
    </>
  );
};

export default VarietyPage;