import { StyleSheet, TouchableOpacity, View, Image, ImageBackground, SafeAreaView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { defaultStyles, loginstyles, signupStyles } from '@/styles'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants'
import { Appbar, Button, Icon, Text } from 'react-native-paper'


const Register = () => {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);

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
          Create Account
        </Text>
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <SafeAreaView style={styles.mainContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={loginstyles.logoCircle}>
                <Text style={loginstyles.logoText}>Food House</Text>
              </View>
              
              <View style={styles.content}>
                <Text style={styles.title}>Register New Account</Text>
                <Text style={styles.subtitle}>What describes you the best?</Text>
                
                <View style={styles.roleContainer}>
                  {/* Buyer Option */}
                  <TouchableOpacity 
                    style={[
                      styles.roleCard, 
                      selectedRole === 'buyer' && styles.selectedRoleCard
                    ]}
                    onPress={() => setSelectedRole('buyer')}
                  >
                    <ImageBackground
                      source={require("@/assets/images/buyer.png")}
                      style={styles.roleImageBackground}
                      imageStyle={styles.roleImage}
                    >
                      <View style={styles.textOverlay}>
                        <Text style={styles.roleText}>Buyer</Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                  
                  {/* Seller Option */}
                  <TouchableOpacity 
                    style={[
                      styles.roleCard, 
                      selectedRole === 'seller' && styles.selectedRoleCard
                    ]}
                    onPress={() => setSelectedRole('seller')}
                  >
                    <ImageBackground
                      source={require("@/assets/images/farmer.png")}
                      style={styles.roleImageBackground}
                      imageStyle={styles.roleImage}
                    >
                      <View style={styles.textOverlay}>
                        <Text style={styles.roleText}>Farmer or Seller</Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.bottomContainer}>
              <Button
                mode="contained"
                onPress={() => router.push('/info')}
                textColor={Colors.light["10"]}
                buttonColor={Colors.primary["500"]}
                style={defaultStyles.button}
                disabled={!selectedRole}
              >
                Next
              </Button>
            </View>

            <SafeAreaView style={styles.checkboxContainer}>
              <Text style={styles.accountText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/profilePage')}>
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1, 
  },
  
  content: {
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: Colors.grey['3c'],
    textAlign: "center",
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fff',
  },
  selectedRoleCard: {
    borderColor: Colors.primary['500'],
    borderWidth: 3,
    backgroundColor: 'rgba(109, 205, 71, 0.2)'
  },
  roleImageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  roleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  roleText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 150,
  },
  accountText: {
    color: Colors.grey['3c'],
  },
  link: {
    color: Colors.primary['500'],
    fontWeight: 'bold',
    marginLeft: 5,
  },
    
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 180,
    paddingHorizontal: 20,
  },

});

export default Register;