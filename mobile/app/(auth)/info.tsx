import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useState } from 'react';
import { CountrySelect } from '@/components/general/CountrySelect';
import { CAMEROON, Colors, countries } from '@/constants';
import {
  Appbar,
  Button,
  Icon,
  TextInput,
  Text,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import PhoneNumberInput from '@/components/general/PhoneNumberInput';
import { useRouter } from 'expo-router';
import { usersSendSignupSmsOtpMutation } from '@/client/users.swagger/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { defaultStyles } from '@/styles';
import { signupStyles } from '@/styles';
import i18n from '@/i18n';
import { Context, ContextType } from '../_layout';
import { delay } from '@/utils';

const Info = () => {
  const [country, setCountry] = useState(CAMEROON);
  const [callingCode, setCallingCode] = useState(
    country?.dial_code || CAMEROON.dial_code,
  );
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const router = useRouter();
  const { role } = useContext(Context) as ContextType;

  const handleSignUp = async () => {
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

  const { mutateAsync } = useMutation({
    ...usersSendSignupSmsOtpMutation(),
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
        pathname: '/verify-otp',
        params: {
          requestId: data.requestId,
          phoneNumber: `${callingCode}${mobile}`,
          password,
          residenceCountryIsoCode: country?.code,
          role: role || 'USER_ROLE_UNSPECIFIED',
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
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t(
                `(auth).createAccount.${
                  role === 'USER_TYPE_FARMER' ? 'farmerAccount' : 'buyerAccount'
                }`,
              )}
            </Text>
            <View />
          </Appbar.Header>

          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View style={signupStyles.allInput}>
              <CountrySelect
                setCountry={setCountry}
                containerStyle={signupStyles.countryCodeContainer}
                countries={countries}
                country={country}
              />
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
        <Button
          mode="contained"
          onPress={handleSignUp}
          textColor={Colors.light['10']}
          buttonColor={Colors.primary['500']}
          style={defaultStyles.button}
          loading={loading}
          disabled={loading || !country || !mobile}>
          {i18n.t('(auth).createAccount.createAccount')}
        </Button>
      </View>

      <Snackbar
        visible={error}
        testID="signup_error_toast"
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
};

export default Info;
