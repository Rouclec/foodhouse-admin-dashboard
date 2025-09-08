import Colors from '@/constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { FC, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Appbar, Button, Icon, Snackbar, Text } from 'react-native-paper';

import { PaperOtpInput } from 'react-native-paper-otp-input';

import {
  usersGetUserByIdOptions,
  usersSendSignupSmsOtpMutation,
  usersSignupMutation,
} from '@/client/users.swagger/@tanstack/react-query.gen';
import { defaultStyles, verifyOtpStyles as styles } from '@/styles';
import { delay, storeData, updateAuthHeader } from '@/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Context, ContextType } from '../_layout';
import i18n from '@/i18n';
import { usersGetUserById } from '@/client/users.swagger';

const VerifyOtpScreen: FC = () => {
  const { requestId, email, password, phoneNumber, residenceCountryIsoCode } =
    useLocalSearchParams();
  const [requestIdState, setRequestIdState] = useState<string>(
    (requestId as string) ?? '',
  );

  const router = useRouter();
  const [currentTimeLeft, setCurrentTimeLeft] = useState(120);
  const [, setRetries] = useState(0);
  const [timeLeft, setTimeLeft] = useState(currentTimeLeft);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string>();
  const [error, setError] = useState(false);
  const [userId, setUserId] = useState<string>();
  const { role } = useContext(Context) as ContextType;

  const { setUser } = useContext(Context) as ContextType;

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {
          phoneFactor: {
            type: 'FACTOR_TYPE_SMS_OTP',
            secretValue: otp,
            id: requestIdState as string,
          },
          email: email as string,
          password: password as string,
          residenceCountryIsoCode: residenceCountryIsoCode as string,
          userType: role,
        },
      });
    } catch (error) {
      console.error('Error verifying otp', error);
      setError(true);
      await delay(5000);
      setError(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setRetries(prev => {
        const newRetries = prev + 1;
        setCurrentTimeLeft(prevTimeLeft => prevTimeLeft + newRetries * 60);
        return newRetries;
      });
      setIsResending(true);
      await resendOtp({
        body: {
          phoneNumber: phoneNumber as string,
        },
      });
    } catch (error) {
      console.error('Error signing up: ', error);
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (timeLeft < 1) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const { mutateAsync } = useMutation({
    ...usersSignupMutation(),
    onError: async error => {
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
      await delay(5000);
      setError(false);
    },
    onSuccess: async data => {
      setTimeLeft(0);
      updateAuthHeader(data.tokens?.accessToken!);
      await storeData('@userId', data?.userId);
      await storeData('@refreshToken', data?.tokens?.refreshToken);
      setUserId(data?.userId);
      setUser({
        userId: data.userId,
        phoneNumber: phoneNumber as string,
      });
      router.push('/profile-page');
    },
  });

  useEffect(() => {
    setTimeLeft(currentTimeLeft);
  }, [currentTimeLeft]);

  const { mutateAsync: resendOtp } = useMutation({
    ...usersSendSignupSmsOtpMutation(),
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
    onSuccess: data => {
      setRequestIdState(data?.requestId ?? '');
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
    if (userData) {
      setUser(userData.user);
    }
  }, [userData]);

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
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(auth).verifyOtp.verifyNumber')}
            </Text>
            <View />
          </Appbar.Header>
          <View style={styles.headingTextContainer}>
            <Text style={styles.subHeadingText}>
              {i18n.t('(auth).verifyOtp.codeSent')} {phoneNumber}
            </Text>
          </View>
          <ScrollView style={styles.scrollView}>
            <View style={styles.otpContainer}>
              <PaperOtpInput
                maxLength={4}
                onPinChange={pin => {
                  setOtp(pin);
                  if (pin.length === 4) {
                    Keyboard.dismiss();
                  }
                }}
                otpBoxStyle={styles.otpBoxStyle}
                otpBorderFocusedColor={Colors.primary[500]}
                otpBorderColor={Colors.grey['border']}
              />
            </View>
            <TouchableOpacity
              onPress={handleResendOTP}
              style={styles.resendTextContainer}
              disabled={timeLeft > 0}>
              {isResending ? (
                <ActivityIndicator color={Colors.primary[500]} />
              ) : (
                <Text style={timeLeft > 0 ? styles.text : styles.link}>
                  {i18n.t('(auth).verifyOtp.resendCode')}{' '}
                  {timeLeft > 0 && (
                    <Text style={styles.text}>
                      {i18n.t('(auth).verifyOtp.in')}{' '}
                      {Math.floor(timeLeft / 60).toLocaleString('en-US', {
                        minimumIntegerDigits: 2,
                        useGrouping: false,
                      })}
                      :
                      {Math.ceil(timeLeft % 60).toLocaleString('en-US', {
                        minimumIntegerDigits: 2,
                        useGrouping: false,
                      })}
                    </Text>
                  )}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          textColor={Colors.light['0']}
          buttonColor={Colors.primary['500']}
          style={defaultStyles.button}
          disabled={otp.length < 4 || loading}
          loading={loading}
          onPress={handleVerifyOtp}
          labelStyle={styles.dialogLabel}>
          Verify
        </Button>
      </View>
      <Snackbar
        visible={error}
        onDismiss={() => {}}
        duration={3000}
        style={styles.snackbar}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
};

export default VerifyOtpScreen;
