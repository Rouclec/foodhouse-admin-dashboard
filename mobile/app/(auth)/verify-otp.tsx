import Colors from '@/constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { FC, useContext, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Appbar,
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
} from 'react-native-paper';
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


const VerifyOtpScreen: FC = () => {
  const { requestId, email, password, phoneNumber } = useLocalSearchParams();
  const [requestIdState, setRequestIdState] = useState<string>(
    (requestId as string) ?? '',
  );

  const router = useRouter();
  const [currentTimeLeft, setCurrentTimeLeft] = useState(120);

  const [, setRetries] = useState(0);
  const [timeLeft, setTimeLeft] = useState(currentTimeLeft);
  const [otp, setOtp] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [error, setError] = useState(false);
  const [userId, setUserId] = useState<string>();

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
          
        },
      });

      setShowModal(true);
    } catch (error) {
      console.error('Error verifying otp', error);
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
      setLoading(true);
      await resendOtp({
        body: {
          phoneNumber: phoneNumber as string,
        },
      });
    } catch (error) {
      console.error('Error signing up: ', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft < 1) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer); // Cleanup interval on component unmount
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
    onSuccess: async data => {
      setTimeLeft(0);
      updateAuthHeader(data.tokens?.accessToken!);
      await storeData('@refreshToken', data?.tokens?.refreshToken);
      await storeData('@userId', data?.userId);
      setUserId(data?.userId);
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.container}>
            <Appbar.Header dark={false} style={styles.appHeader}>
              <Appbar.BackAction
                onPress={() => router.back()}
                style={styles.backArrow}
              />
              <Text style={styles.headingText} variant="headlineMedium">
                Verify your phone number
              </Text>
            </Appbar.Header>
            <View style={styles.headingTextContainer}>
              
              <Text style={styles.subHeadingText}>
                Code has been sent to {phoneNumber}
              </Text>
            </View>
            <ScrollView style={styles.scrollView}>
              <View style={styles.otpContainer}>
                <PaperOtpInput
                  maxLength={6}
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
                <View style={styles.resendTextContainer}>
                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={timeLeft > 0}>
                    <Text style={styles.link}>
                      Resend code in 
                      {timeLeft > 0 && (
                        <Text style={styles.link}>
                          {' '}
                          in{' '}
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
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
        <View style={defaultStyles.bottomContainer}>
          <Button
            mode="contained"
            textColor={Colors.light['0']}
            buttonColor={Colors.primary['500']}
            style={defaultStyles.button}
            disabled={otp.length < 6 || loading}
            loading={loading}
            onPress={handleVerifyOtp}
            labelStyle={styles.dialogLabel}>
            Verify
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog
          visible={showModal}
          onDismiss={() => {}}
          style={styles.dialogContainer}>
          <Dialog.Icon icon="check-circle" color={Colors.success} size={40} />
          <Dialog.Title style={styles.dialogTitle}>
            Phone number verified!
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogContent}>
              You can now proceed to setup your VsorPay profile
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActionContainer}>
            <Button
              mode="contained"
              textColor={Colors.light['0']}
              buttonColor={Colors.grey['3c']}
              style={styles.dialogActionButton}
              onPress={() => {
                setShowModal(false);
                router.push('/profile');
              }}
              labelStyle={styles.dialogLabel}>
              Continue
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
