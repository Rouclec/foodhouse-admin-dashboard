import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Appbar, Icon, Snackbar, TextInput } from 'react-native-paper';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  usersAuthenticateMutation,
  usersGetUserByIdOptions,
  usersOAuthMutation,
  usersSendSmsOtpMutation,
} from '@/client/users.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '../_layout';
import { defaultStyles, loginstyles, signupStyles } from '@/styles';
import { CAMEROON, Colors } from '@/constants';
import i18n from '@/i18n';
import { delay, storeData, updateAuthHeader } from '@/utils';
import { auth } from '@/firebase';
import {
  AuthCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { Prompt } from 'expo-auth-session';
import PhoneNumberInput from '@/components/general/PhoneNumberInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Login() {
  const [country, setCountry] = useState(CAMEROON);
  const [callingCode, setCallingCode] = useState(
    country?.dial_code || CAMEROON.dial_code,
  );
  const [mobile, setMobile] = useState('');
  const [fields, setFields] = useState({ phoneNumber: '', password: '' });
  const [errors, setErrors] = useState({ phoneNumber: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState<string>();
  const [firebaseUserId, setFirebaseUserId] = useState<string>();
  const { user, setUser } = useContext(Context) as ContextType;
  const { requestId } = useLocalSearchParams();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    prompt: Prompt.SelectAccount,
  });

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
      } else {
        return router.replace('/(buyer)/(index)');
      }
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

  const { mutateAsync: authenticate } = useMutation({
    ...usersAuthenticateMutation(),
    onError: async error => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t('(auth).login.anUnknownError'),
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: async data => {
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

  useEffect(() => {
    if (!response) {
      return;
    }

    switch (response.type) {
      case 'success':
        if (response.authentication) {
          const { idToken } = response.authentication;

          if (idToken) {
            setLoading(true);
            const credential = GoogleAuthProvider.credential(idToken);
            signInWithFirebase(credential);
          }
        }
        break;

      case 'error':
        console.error('Expo Google Auth Error:', response.error);
        setErrorMessage(
          response.error?.message || i18n.t('(auth).login.googleSignInFailed'),
        );
        setError(true);
        setLoading(false);
        break;

      case 'cancel':
        console.log('Google Sign-In cancelled by user.');
        setLoading(false);
        break;
    }
  }, [response]);

  const signInWithFirebase = async (credential: AuthCredential) => {
    try {
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      const firebaseIdToken = await firebaseUser.getIdToken(true);

      if (!firebaseUser) {
        setErrorMessage(i18n.t('(auth).login.invalidUser'));
        setError(true);
        await delay(5000);
        setError(false);
        return;
      }

      // update the auth header with the firebase token
      updateAuthHeader(firebaseIdToken);

      setFirebaseUserId(firebaseUser.uid);

      // set the user data with the response from firebase
      setUser({
        email: firebaseUser?.email ?? '',
        phoneNumber: firebaseUser?.phoneNumber ?? '',
        firstName: firebaseUser?.displayName?.split(' ')[0],
        lastName: firebaseUser?.displayName?.split(' ')[1],
      });

      // call the oAuth endpoint
      await oAuth({
        body: {
          user: {
            email: firebaseUser?.email ?? '',
            phoneNumber: firebaseUser?.phoneNumber ?? '',
            firstName: firebaseUser?.displayName?.split(' ')[0],
            lastName: firebaseUser?.displayName?.split(' ')[1],
          },
          factor: {
            type: 'FACTOR_TYPE_GOOGLE',
          },
        },
        path: {
          'factor.id': firebaseUser.uid,
        },
      });
    } catch (firebaseError: any) {
      console.error(' Firebase Google Sign-In Error:', firebaseError);
      setErrorMessage(
        firebaseError.message || i18n.t('(auth).login.googleSignInFailed'),
      );
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInPress = async () => {
    if (!request) {
      Alert.alert(
        i18n.t('(auth).login.configurationError'),
        i18n.t('(auth).login.googleConfigMissing'),
      );
      return;
    }
    await promptAsync();
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);

      // Request Apple credentials
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, fullName, email } = appleCredential;
      if (!identityToken) {
        throw new Error('Apple Sign-In failed: no identity token returned');
      }

      // Firebase credential
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: identityToken });

      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      const firebaseIdToken = await firebaseUser.getIdToken(true);

      setFirebaseUserId(firebaseUser.uid);

      // Update auth header
      updateAuthHeader(firebaseIdToken);

      // Set user context
      setUser({
        email: firebaseUser.email ?? email ?? '',
        phoneNumber: firebaseUser.phoneNumber ?? '',
        firstName:
          firebaseUser.displayName?.split(' ')[0] ?? fullName?.givenName ?? '',
        lastName:
          firebaseUser.displayName?.split(' ')[1] ?? fullName?.familyName ?? '',
      });

      // Call existing oAuth mutation
      await oAuth({
        body: {
          user: {
            email: firebaseUser.email ?? email ?? '',
            phoneNumber: firebaseUser.phoneNumber ?? '',
            firstName:
              firebaseUser.displayName?.split(' ')[0] ??
              fullName?.givenName ??
              '',
            lastName:
              firebaseUser.displayName?.split(' ')[1] ??
              fullName?.familyName ??
              '',
          },
          factor: {
            type: 'FACTOR_TYPE_APPLE',
          },
        },
        path: {
          'factor.id': firebaseUser.uid,
        },
      });
    } catch (error: any) {
      console.error('Apple Sign-In Error:', error);
      setErrorMessage(
        error.message || i18n.t('(auth).login.appleSignInFailed'),
      );
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            {/* <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity> */}
            <View />
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
              {errors.phoneNumber ? (
                <Text style={loginstyles.errorText}>{errors.phoneNumber}</Text>
              ) : null}
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

        <View style={loginstyles.socialIconsContainer}>
          <TouchableOpacity
            style={[
              loginstyles.socialIcon,
              loading && defaultStyles.greyButton,
            ]}
            onPress={handleGoogleSignInPress}
            disabled={loading || !request}>
            {loading ? (
              <ActivityIndicator color={Colors.primary[200]} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="google"
                  size={24}
                  color={Colors.primary[200]}
                />
                <Text>{i18n.t('(auth).login.continueWith')} Google</Text>
              </>
            )}
          </TouchableOpacity>
          

          {Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={5}
              style={{ width: 200, height: 44, marginTop: 10 }}
              onPress={handleAppleSignIn}
            />
          ) : (
            <TouchableOpacity style={loginstyles.socialIcon}>
              <MaterialCommunityIcons name="apple" size={24} />
              <Text>{i18n.t('(auth).login.continueWith')} Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={loginstyles.registerContainer}>
          <Text style={loginstyles.registerText}>
            {i18n.t('(auth).login.dontHaveAnAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
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
