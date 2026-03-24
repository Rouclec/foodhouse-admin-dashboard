import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { Appbar, Icon, Snackbar, TextInput } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  usersGetUserByIdOptions,
  usersOAuthMutation,
  usersSendSmsOtpMutation,
} from '@/client/users.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '../_layout';
import { defaultStyles, loginstyles, signupStyles } from '@/styles';
import { CAMEROON, Colors } from '@/constants';
import i18n from '@/i18n';
import { delay, storeData, updateAuthHeader } from '@/utils';
import { canEnableDemoMode } from '@/constants/demo';
import { agentDemoState } from '@/contexts/AgentContext';

import PhoneNumberInput from '@/components/general/PhoneNumberInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Login() {
  const [country, setCountry] = useState(CAMEROON);
  const [callingCode, setCallingCode] = useState(
    country?.dial_code || CAMEROON.dial_code,
  );
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState<string>();
  const [firebaseUserId, setFirebaseUserId] = useState<string>();
  const { user, setUser } = useContext(Context) as ContextType;

 

  const { data: userData } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: userId ?? '',
      },
    }),
    enabled: !!userId,
  });

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
      const role = userData?.user?.role;
      let isProfileComplete = false;

      switch (role) {
        case 'USER_ROLE_BUYER': {
          isProfileComplete = !!userData?.user?.firstName;
          break;
        }
        default: {
          isProfileComplete =
            !!userData?.user?.firstName &&
            !!userData?.user.profileImage &&
            !!userData?.user.locationCoordinates &&
            !!userData?.user.locationCoordinates.lat &&
            !!userData?.user.locationCoordinates.lon &&
            !!userData?.user.locationCoordinates.address;
        }
      }

      if (!isProfileComplete) {
        return router.push('/(auth)/profile-page');
      }
      if (role === 'USER_ROLE_FARMER') {
        return router.replace('/(farmer)/(index)');
      }
      if (role === 'USER_ROLE_AGENT') {
        return router.replace('/(agent)/(index)');
      }
      return router.replace('/(buyer)/(index)');
    }
  }, [userData]);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {
          phoneNumber: `${callingCode}${mobile}`,
        },
      });
    } catch (error) {
      console.error('Error signing up: ', error);
    } finally {
      setLoading(false);
    }
  };



  const { mutateAsync: oAuth } = useMutation({
    ...usersOAuthMutation(),
    onError: async error => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t('(auth).login.anUnknownError'),
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: async data => {
      if (!data.loginComplete) {
        return router.push({
          pathname: '/(auth)/select-role-for-oauth',
          params: {
            firebaseUserId,
          },
        });
      }
      try {
        updateAuthHeader(data?.tokens?.accessToken ?? '');
        await storeData('@refreshToken', data?.tokens?.refreshToken);
        storeData('@userId', data?.userId);
        setUserId(data?.userId ?? '');
      } catch (err) {
        console.error('Error handling login success:', err);
      }
    },
  });

  const { mutateAsync } = useMutation({
    ...usersSendSmsOtpMutation(),
    onError: async error => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t('(auth).login.anUnknownError'),
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: data => {
      router.push({
        pathname: '/signin-verify-otp',
        params: {
          requestId: data.requestId,
          phoneNumber: `${callingCode}${mobile}`,
        },
      });
    },
  });

 

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View style={loginstyles.logoCircle}>
              <Text style={loginstyles.logoText}>Food House</Text>
            </View>
            <View style={defaultStyles.inputsContainer}>
              <Text style={loginstyles.loginTitle}>
                {i18n.t('(auth).login.loginTo')}
              </Text>

              <PhoneNumberInput
                setCountryCode={setCallingCode}
                countryCode={callingCode}
                setPhoneNumber={setMobile}
                phoneNumber={mobile}
                containerStyle={signupStyles.phoneNumberInputContainerStyle}
              />
             
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <TouchableOpacity
          style={[loginstyles.loginButton, loading && defaultStyles.greyButton]}
          onPress={handleSendOtp}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={loginstyles.loginButtonText}>
              {i18n.t('(auth).login.login')}
            </Text>
          )}
        </TouchableOpacity>

        <View style={loginstyles.dividerContainer}>
          <View style={loginstyles.dividerLine} />
          <Text style={loginstyles.dividerText}>
            {i18n.t('(auth).login.or')}
          </Text>
          <View style={loginstyles.dividerLine} />
        </View>

        <View style={loginstyles.registerContainer}>
          <Text style={loginstyles.registerText}>
            {i18n.t('(auth).login.dontHaveAnAccount')}{' '}
          </Text>
          <TouchableOpacity 
            onPress={() => router.push('/register')}
            onLongPress={() => {
              if (!canEnableDemoMode) return;
              
              Alert.alert(
                'Demo Mode',
                'Start agent demo with mock data?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Start Demo', 
                    onPress: () => {
                      agentDemoState.loginAsAgent(true);
                      agentDemoState.approveKYC();
                      router.replace('/(agent)/(index)');
                    }
                  },
                ]
              );
            }}
          >
            <Text style={loginstyles.registerLink}>
              {i18n.t('(auth).login.registerNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Snackbar
        visible={!!error}
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
}
