// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
import React, { useContext, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image,
  Alert,
  Linking,
} from "react-native";
import {
  Appbar,
  Icon,
  TextInput,
  Button,
  Modal,
  Portal,
  Text,
  Avatar,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as Camera from "expo-camera";
import { signupStyles } from "@/styles";
import { router } from "expo-router";
import { Colors } from "@/constants";
import { usersCompleteRegistrationMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { useMutation } from "@tanstack/react-query";
import { delay } from "@/utils";
import { Context, ContextType } from "../_layout";
import { getDownloadURL, ref, storage, uploadBytes } from "@/firebase";

const profilePage = () => {
    const { user } = useContext(Context) as ContextType;
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [error, setError] = useState(false);
    const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
    //const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
    const [successModalVisible, setSuccessModalVisible] = useState(false);
  
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
  
    const uploadImageToFirebase = async (uri: string) => {
      try {
        // Fetch the image file
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Create a unique filename
        const filename = `profile_${user?.userId}_${Date.now()}.jpg`;
        const storageRef = ref(storage, `profile_images/${filename}`);
  
        // Upload the file
        await uploadBytes(storageRef, blob);
  
        // Get the download URL
        return await getDownloadURL(storageRef);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    };
  
    const handleCamera = async () => {
      try {
        const { status } = await requestCameraPermission();
        if (status !== 'granted') {
          Alert.alert(
            'Permission required',
            'Please allow camera access in settings to take photos',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
  
        let result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
  
        if (!result.canceled && result.assets?.length) {
          setProfileImage(result.assets[0].uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open camera');
      } finally {
        hideModal();
      }
    };
  
    const handleGallery = async () => {
      try {
        const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!galleryStatus.granted) {
          Alert.alert(
            "Permission required",
            "Please allow photo library access",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
  
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
  
        if (!result.canceled && result.assets?.length) {
          setProfileImage(result.assets[0].uri);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to open gallery");
      } finally {
        hideModal();
      }
    };
  
  
    const { mutateAsync: updateUserRegistration } = useMutation({
      ...usersCompleteRegistrationMutation(),
      onError: async error => {
        setErrorMessage(() => {
          const errorData = error?.response?.data;
  
          if (errorData?.message) {
            return errorData?.message;
          }
  
          let message = 'An unknown error occurred';
  
          if (typeof errorData === 'string') {
            try {
              // Extract only the first JSON object
              const firstObject = JSON.parse(
                (errorData as string).match(/\{.*?\}/s)?.[0] || '{}',
              );
              if (firstObject?.message) message = `${firstObject.message}`;
            } catch (parseError) {
              console.error('Error parsing error response:', parseError);
            }
          }
  
          return message;
        });
        setError(true);
        await delay(5000);
        setError(false);
      },
      onSuccess: async () => {
        setSuccessModalVisible(true);
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      },
    });
     const handleComplete = async () => {
      try {
        setLoading(true);
        
        let imageUrl = null;
        if (profileImage) {
          imageUrl = await uploadImageToFirebase(profileImage);
        }
  
        const data = {
          firstName,
          lastName,
          email,
          address,
          profileImage: imageUrl || undefined,
        };
  
        await updateUserRegistration({
          body: data,
          path: {
            userId: user?.userId ?? '',
          },
        });
      } catch (error) {
        console.error('Error completing registration:', error);
        Alert.alert('Error', 'Failed to complete registration');
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <>
        <Appbar.Header dark={false}>
          <TouchableOpacity
            style={signupStyles.closeIconContainer}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text variant="headlineMedium" style={signupStyles.heading}>
            Complete Registration
          </Text>
        </Appbar.Header>
  
        <KeyboardAvoidingView
          style={signupStyles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <SafeAreaView style={signupStyles.mainConatiner}>
              <ScrollView
                style={signupStyles.scrollContainer}
                showsVerticalScrollIndicator={false}
              >
                <View style={signupStyles.allInput}>
                  <View style={signupStyles.imageContainer}>
                    <TouchableOpacity
                      onPress={showModal}
                      style={signupStyles.imageUpload}
                    >
                      {profileImage ? (
                        <Image
                          source={{ uri: profileImage }}
                          style={signupStyles.profileImage}
                        />
                      ) : (
                        <View style={signupStyles.addImageContainer}>
                          <Avatar.Icon size={120} icon="account" style={signupStyles.account}/>
                          <Avatar.Icon
                            size={24}
                            icon="camera"
                            color="#fff"
                            style={signupStyles.cameraIcon}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
  
                  {/* <Text style={styles.sectionTitle}>First Name</Text> */}
                  <TextInput
                    placeholder="Enter First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    mode="outlined"
                    outlineStyle={signupStyles.outlineInput}
                    style={signupStyles.input}
                  />
  
                  {/* <Text style={styles.sectionTitle}>Last Name</Text> */}
                  <TextInput
                    placeholder="Enter Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    mode="outlined"
                    outlineStyle={signupStyles.outlineInput}
                    style={signupStyles.input}
                  />
  
                  {/* <Text style={styles.sectionTitle}>Email</Text> */}
                  <TextInput
                    placeholder="Enter Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    outlineStyle={signupStyles.outlineInput}
                    style={signupStyles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
  
                  {/* <Text style={styles.sectionTitle}>Address</Text> */}
                  <TextInput
                    placeholder="Enter Address"
                    value={address}
                    onChangeText={setAddress}
                    mode="outlined"
                    outlineStyle={signupStyles.outlineInput}
                    style={signupStyles.input}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>
            </SafeAreaView>
          </TouchableWithoutFeedback>
  
          <Portal>
            <Modal
              visible={visible}
              onDismiss={hideModal}
              contentContainerStyle={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Photo Gallery</Text>
                <Button
                  mode="contained"
                  onPress={handleCamera}
                  style={styles.modalButton}
                  icon="camera"
                >
                  Camera
                </Button>
                <Button
                  mode="contained"
                  onPress={handleGallery}
                  style={styles.modalButton}
                  icon="image"
                >
                  Gallery
                </Button>
                <Button
                  mode="outlined"
                  onPress={hideModal}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
              </View>
            </Modal>
          </Portal>
  
          <View style={styles.bottomContainer}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={[styles.button, styles.skipButton]}
              labelStyle={styles.skipButtonText}
            >
              Skip
            </Button>
  
            <Button
              mode="contained"
              onPress={handleComplete}
              style={styles.button}
              disabled={!firstName || !lastName || !email || !address}
            >
              Complete
            </Button>
          </View>
        </KeyboardAvoidingView>
  
        <Modal 
          visible={successModalVisible} 
          onDismiss={() => setSuccessModalVisible(false)}
          contentContainerStyle={styles.successModalContainer}
        >
          <View style={styles.successModalContent}>
            <Icon 
              name="check-circle" 
              size={48} 
              color="#4CAF50" 
              style={styles.successIcon}
            />
            <Text style={styles.successTitle}>Congratulations!</Text>
            <Text style={styles.successText}>
              Your account is ready to use. You will be redirected to the Home page in a few seconds.
            </Text>
            
            <View style={styles.successButtonContainer}>
              <Button
                mode="outlined"
                onPress={() => router.replace('/login')}
                style={styles.successButton}
              >
                Skip
              </Button>
              <Button
                mode="contained"
                onPress={() => router.replace('/login')}
                style={styles.successButton}
              >
                Complete
              </Button>
            </View>
          </View>
        </Modal>
      </>
  )
}

export default profilePage

// const styles = StyleSheet.create({})
const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 4,
  },
  input: {
    backgroundColor: "white",
  },
  outlineInput: {
    borderRadius: 8,
    borderWidth: 1,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 10,

    paddingVertical: 4,

    height: 50,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary[500],
    color: "fff",
  },
  skipButton: {
    borderColor: "#e8e8e8",
    backgroundColor: Colors.primary[300],
  },
  skipButtonText: {
    color: "black",
  },
  
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalContent: {
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    marginVertical: 8,
  },
   successModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  successModalContent: {
    width: '100%',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  successButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  successButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});