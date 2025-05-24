import React, { useContext, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { TextInput } from "react-native-paper";
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from "@tanstack/react-query";
import { usersAuthenticateMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "../_layout";
import styles from "@/styles/(auth)/loginStyles";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
   const [userId, setUserId] = useState<string>();

  const { user, setUser } = useContext(Context) as ContextType;

  const { mutateAsync: authenticate } = useMutation({
    ...usersAuthenticateMutation(),
    onError: async (error) => {
      setErrorMessage(() => {
        const errorData = error?.response?.data;

        if (errorData?.message) {
          return errorData?.message;
        }

        let message = 'An unknown error occurred';

        if (typeof errorData === 'string') {
          try {
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
      setTimeout(() => setError(false), 5000);
    },
    onSuccess: async (data) => {
      try {
        const role = user?.role;
        
        if (role === "USER_ROLE_FARMER") {
          router.replace("/(farmer)/two");
        } else {
          router.replace("/(buyer)/two");
        }
      } catch (err) {
        console.error("Error handling login success:", err);
      }
    },
  });

  const handleInputChange = (name: string, value: string) => {
    setFields({ ...fields, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateFields = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!fields.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!fields.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (fields.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogIn = async () => {
    if (!validateFields()) return;

    try {
      setLoading(true);
      await authenticate({
        body: {
          factors: [{
            type: "FACTOR_TYPE_EMAIL_PASSWORD",
            id: fields.email,
            secretValue: fields.password,
          }],
        },
      });
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header with Circular Logo */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace('/onboarding')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>Food House</Text>
        </View>
      </View>

      {/* Login Form Content */}
      <View style={styles.content}>
        <Text style={styles.loginTitle}>Log in to your account</Text>
        
        {error && <Text style={styles.errorMessage}>{errorMessage}</Text>}
        
        <TextInput
          mode="outlined"
          label="Email"
          value={fields.email}
          onChangeText={(text) => handleInputChange("email", text)}
          error={!!errors.email}
          style={styles.input}
          theme={{ 
            colors: { 
              primary: '#6dcd47',
              background: '#FAFAFA',
              error: '#FF0000',
            },
            roundness: 10,
          }}
          outlineColor="#E0E0E0"
          left={
            <TextInput.Icon
              icon="email-outline"
              color="#9E9E9E"
              size={20}
            />
          }
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        
        <TextInput
          mode="outlined"
          label="Password"
          secureTextEntry={!showPassword}
          value={fields.password}
          onChangeText={(text) => handleInputChange("password", text)}
          error={!!errors.password}
          style={styles.input}
          theme={{ 
            colors: { 
              primary: '#6dcd47',
              background: '#FAFAFA',
              error: '#FF0000',
            },
            roundness: 10,
          }}
          outlineColor="#E0E0E0"
          left={
            <TextInput.Icon
              icon="lock-outline"
              color="#9E9E9E"
              size={20}
            />
          }
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword(!showPassword)}
              color="#9E9E9E"
              size={20}
            />
          }
        />
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <View style={styles.socialIconsContainer}>
          <TouchableOpacity style={styles.socialIcon}>
            <MaterialCommunityIcons name="facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <MaterialCommunityIcons name="apple" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/signup")}>
            <Text style={styles.registerLink}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

