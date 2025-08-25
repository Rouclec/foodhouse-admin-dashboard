import React, { useContext, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Appbar, Button, Icon, Text, TextInput } from 'react-native-paper';
import { Link, router } from 'expo-router';
import {
  defaultStyles,
  loginstyles,
  profileFlowStyles,
  signupStyles,
} from '@/styles';
import { useMutation } from '@tanstack/react-query';
import { usersChangePasswordMutation } from '@/client/users.swagger/@tanstack/react-query.gen';
import { delay } from '@/utils';
import i18n from '@/i18n';
import { Colors } from '@/constants';
import { Context, ContextType } from '../_layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(Context) as ContextType;

  const { mutateAsync: updatePassword } = useMutation({
    ...usersChangePasswordMutation(),
    onError: async error => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t('(auth).login.anUnknownError'),
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: async data => {
      router.back();
    },
  });

  const handleSaveChanges = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      setError(true);
      await delay(5000);
      setError(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords don't match");
      setError(true);
      await delay(5000);
      setError(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      setError(true);
      await delay(5000);
      setError(false);
      return;
    }

    try {
      setLoading(true);
      await updatePassword({
        body: {
          newPassword,
          emailFactor: {
            id: user?.email,
            type: 'FACTOR_TYPE_EMAIL_PASSWORD',
            secretValue: currentPassword,
          },
        },
      });
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <>
      <KeyboardAvoidingView
        style={[
          defaultStyles.container,
          {
            paddingBottom: insets.bottom,
          },
        ]}
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
              {i18n.t('(auth).(forgot-password).index.forgotPassword')}
            </Text>
            <View />
          </Appbar.Header>

          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            {error && (
              <View style={profileFlowStyles.errorContainer}>
                <Text style={profileFlowStyles.errorText}>{errorMessage}</Text>
              </View>
            )}
            <View style={signupStyles.allInput}>
              <View>
                <TextInput
                  mode="outlined"
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  label={i18n.t(
                    '(farmer).(profile-flow).(change-password).currentPassword',
                  )}
                  autoCapitalize="none"
                  style={loginstyles.input}
                  outlineColor={Colors.grey['bg']}
                  theme={{
                    roundness: 15,
                    colors: {
                      onSurfaceVariant: Colors.grey['e8'],
                      primary: Colors.primary[500],
                      error: Colors.error,
                    },
                  }}
                  error={!!currentPassword && currentPassword.length < 3}
                  right={
                    <TextInput.Icon
                      icon={showCurrent ? 'eye-off' : 'eye'}
                      onPress={() => setShowCurrent(!showCurrent)}
                      color={Colors.grey['61']}
                      size={20}
                    />
                  }
                />
              </View>

              <View>
                <TextInput
                  mode="outlined"
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  label={i18n.t(
                    '(farmer).(profile-flow).(change-password).newPassword',
                  )}
                  autoCapitalize="none"
                  style={loginstyles.input}
                  outlineColor={Colors.grey['bg']}
                  theme={{
                    roundness: 15,
                    colors: {
                      onSurfaceVariant: Colors.grey['e8'],
                      primary: Colors.primary[500],
                      error: Colors.error,
                    },
                  }}
                  error={!!newPassword && newPassword.length < 3}
                  right={
                    <TextInput.Icon
                      icon={showNew ? 'eye-off' : 'eye'}
                      onPress={() => setShowNew(!showNew)}
                      color={Colors.grey['61']}
                      size={20}
                    />
                  }
                />
              </View>

              <View>
                <TextInput
                  mode="outlined"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  label={i18n.t(
                    '(farmer).(profile-flow).(change-password).confirmPassword',
                  )}
                  autoCapitalize="none"
                  style={loginstyles.input}
                  outlineColor={Colors.grey['bg']}
                  theme={{
                    roundness: 15,
                    colors: {
                      onSurfaceVariant: Colors.grey['e8'],
                      primary: Colors.primary[500],
                      error: Colors.error,
                    },
                  }}
                  error={!!confirmPassword && confirmPassword != newPassword}
                  right={
                    <TextInput.Icon
                      icon={showConfirm ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirm(!showConfirm)}
                      color={Colors.grey['61']}
                      size={20}
                    />
                  }
                />
              </View>
              {/* <Link
                style={loginstyles.forgotPassword}
                href={'/(auth)/(forgot-password)'}>
                <Text style={loginstyles.forgotPasswordText}>
                  {i18n.t(
                    '(farmer).(profile-flow).(change-password).forgotPassword',
                  )}
                </Text>
              </Link> */}
            </View>
          </ScrollView>
          <View style={defaultStyles.bottomButtonContainer}>
            <Button
              mode="contained"
              onPress={handleSaveChanges}
              style={defaultStyles.button}
              buttonColor={Colors.primary['500']}
              loading={loading}
              disabled={
                loading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                (!!currentPassword && currentPassword.length < 3) ||
                (!!newPassword && newPassword.length < 3) ||
                (!!confirmPassword && confirmPassword != newPassword)
              }>
              Save changes
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
