import { StyleSheet, Text, TouchableOpacity, View, Image, ImageBackground } from 'react-native'
import React, { useState } from 'react'
import { loginstyles } from '@/styles'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

const Register = () => {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <View style={styles.container}>
      <View style={loginstyles.header}>
        <TouchableOpacity 
          style={loginstyles.backButton}
          onPress={() => router.replace('/login')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={loginstyles.logoCircle}>
          <Text style={loginstyles.logoText}>Food House</Text>
        </View>
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
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            !selectedRole && styles.disabledButton
          ]}
          disabled={!selectedRole}
          onPress={() => router.push('/info')}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 200,

  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
    textAlign: "center",
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 100,
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
  borderColor: '#6DCD47',
  borderWidth: 4,
  borderRadius: 12,
  // backgroundColor: 'rgba(109, 205, 71, 0.3)'
  backgroundColor: '#6DCD47',
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  nextButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#6dcd47",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
})