import {
  TouchableOpacity,
  View,
  ImageBackground,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { defaultStyles, loginstyles, signupStyles } from '@/styles';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';
import { Appbar, Button, Icon, Snackbar, Text } from 'react-native-paper';
import i18n from '@/i18n';
import { Context, ContextType } from '../_layout';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  usersGetUserByIdOptions,
  usersOAuthMutation,
} from '@/client/users.swagger/@tanstack/react-query.gen';
import { delay, storeData, updateAuthHeader } from '@/utils';
import { useLocalSearchParams } from 'expo-router';

const SelectRoleForOAuth = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { role, setUserRole } = useContext(Context) as ContextType;
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [userId, setUserId] = useState<string>();
  const { user, setUser } = useContext(Context) as ContextType;

  const { firebaseUserId } = useLocalSearchParams();

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
        setErrorMessage(i18n.t('(auth).login.anUnknownError'));
        setError(true);
        await delay(5000);
        setError(false);
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
      router.replace('/(auth)/profile-page');
    }
  }, [userData]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await oAuth({
        body: {
          user: user,
          factor: {
            type: 'FACTOR_TYPE_GOOGLE',
          },
          userType: role,
        },
        path: {
          'factor.id': (firebaseUserId as string) ?? '',
        },
      });
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(auth).register.createAccount')}
            </Text>
            <View />
          </Appbar.Header>

          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View style={loginstyles.logoCircle}>
              <Text style={loginstyles.logoText}>{i18n.t('common.appName')}</Text>
            </View>

            <View style={signupStyles.content}>
              <Text style={loginstyles.loginTitle}>
                {i18n.t('(auth).register.registerNewAccount')}
              </Text>
              <Text style={signupStyles.subheading}>
                {i18n.t('(auth).register.description')}
              </Text>

              <View style={signupStyles.roleContainer}>
                <TouchableOpacity
                  style={[
                    signupStyles.roleCard,
                    role === 'USER_TYPE_BUYER' && signupStyles.selectedRoleCard,
                  ]}
                  onPress={() => setUserRole('USER_TYPE_BUYER')}>
                  <ImageBackground
                    source={require('@/assets/images/buyer.png')}
                    style={signupStyles.roleImageBackground}
                    imageStyle={signupStyles.roleImage}>
                    <View style={signupStyles.textOverlay}>
                      <Text style={signupStyles.roleText}>
                        {' '}
                        {i18n.t('(auth).register.buyer')}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    signupStyles.roleCard,
                    role === 'USER_TYPE_FARMER' &&
                      signupStyles.selectedRoleCard,
                  ]}
                  onPress={() => setUserRole('USER_TYPE_FARMER')}>
                  <ImageBackground
                    source={require('@/assets/images/farmer.png')}
                    style={signupStyles.roleImageBackground}
                    imageStyle={signupStyles.roleImage}>
                    <View style={signupStyles.textOverlay}>
                      <Text style={signupStyles.roleText}>
                        {' '}
                        {i18n.t('(auth).register.farmer')}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    signupStyles.roleCard,
                    role === 'USER_TYPE_AGENT' &&
                      signupStyles.selectedRoleCard,
                  ]}
                  onPress={() => setUserRole('USER_TYPE_AGENT')}>
                  <ImageBackground
                    source={require('@/assets/images/farmer.png')}
                    style={signupStyles.roleImageBackground}
                    imageStyle={signupStyles.roleImage}>
                    <View style={signupStyles.textOverlay}>
                      <Text style={signupStyles.roleText}>
                        {' '}
                        {i18n.t('(auth).register.agent')}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </View>

              {role && (
                <View style={signupStyles.roleDescriptionContainer}>
                  <Text style={signupStyles.roleDescription}>
                    {role === 'USER_TYPE_BUYER' && i18n.t('(auth).register.buyerDescription')}
                    {role === 'USER_TYPE_FARMER' && i18n.t('(auth).register.farmerDescription')}
                    {role === 'USER_TYPE_AGENT' && i18n.t('(auth).register.agentDescription')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={defaultStyles.bottomContainerWithContent}>
            <Button
              mode="contained"
              onPress={handleLogin}
              textColor={Colors.light['10']}
              buttonColor={Colors.primary['500']}
              style={defaultStyles.button}
              loading={loading}
              disabled={!role || loading}>
              {i18n.t('(auth).register.button')}
            </Button>

            <View style={loginstyles.registerContainer}>
              <Text style={loginstyles.registerText}>
                {i18n.t('(auth).register.havingAccount')}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={loginstyles.registerLink}>
                  {' '}
                  {i18n.t('(auth).register.login')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Snackbar
        visible={!!error}
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
};
export default SelectRoleForOAuth;
