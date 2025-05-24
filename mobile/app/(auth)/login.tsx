import React, { useContext, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { TextInput } from "react-native-paper";
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from "@tanstack/react-query";
import { usersAuthenticateMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "../_layout";
import { loginstyles } from "@/styles";
import { Colors } from "@/constants";


export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    <View style={loginstyles.container}>
      <View style={loginstyles.header}>
        <TouchableOpacity 
          style={loginstyles.backButton}
          onPress={() => router.replace('/onboarding')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={loginstyles.logoCircle}>
          <Text style={loginstyles.logoText}>Food House</Text>
        </View>
      </View>
      <View style={loginstyles.content}>
        <Text style={loginstyles.loginTitle}>Log in to your account</Text>
        
        {error && <Text style={loginstyles.errorMessage}>{errorMessage}</Text>}
        
        <TextInput
          mode="outlined"
          label="Email"
          value={fields.email}
          onChangeText={(text) => handleInputChange("email", text)}
          error={!!errors.email}
          style={loginstyles.input}
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
        {errors.email ? <Text style={loginstyles.errorText}>{errors.email}</Text> : null}
        
        <TextInput
          mode="outlined"
          label="Password"
          secureTextEntry={!showPassword}
          value={fields.password}
          onChangeText={(text) => handleInputChange("password", text)}
          error={!!errors.password}
          style={loginstyles.input}
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
        {errors.password ? <Text style={loginstyles.errorText}>{errors.password}</Text> : null}
        
        <TouchableOpacity style={loginstyles.forgotPassword}>
          <Text style={loginstyles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={loginstyles.loginButton}
          onPress={handleLogIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={loginstyles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <View style={loginstyles.dividerContainer}>
          <View style={loginstyles.dividerLine} />
          <Text style={loginstyles.dividerText}>or continue with</Text>
          <View style={loginstyles.dividerLine} />
        </View>
        
        <View style={loginstyles.socialIconsContainer}>
          <TouchableOpacity style={loginstyles.socialIcon}>
            <MaterialCommunityIcons name="facebook" size={24} color={Colors.primary[100]} />
          </TouchableOpacity>
          <TouchableOpacity style={loginstyles.socialIcon}>
            <MaterialCommunityIcons name="google" size={24} color={Colors.primary[200]} />
          </TouchableOpacity>
          <TouchableOpacity style={loginstyles.socialIcon}>
            <MaterialCommunityIcons name="apple" size={24}  />
          </TouchableOpacity>
        </View>
        
        <View style={loginstyles.registerContainer}>
          <Text style={loginstyles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/signup")}>
            <Text style={loginstyles.registerLink}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

