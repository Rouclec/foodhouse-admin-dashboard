import React, { useContext, useState } from 'react';
import {
  View,
  ScrollView,
  Linking,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Appbar,
  Text,
  List,
  Divider,
  Icon,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import {
  defaultStyles,
  profileFlowStyles,
  signupStyles,
  profileFlowStyles as styles,
} from '@/styles';
import i18n from '@/i18n';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Context, ContextType } from '../_layout';

import { useMutation } from '@tanstack/react-query';
import { clearStorage, readData, updateAuthHeader } from '@/utils';
import { usersRevokeRefreshTokenMutation } from '@/client/users.swagger/@tanstack/react-query.gen';

export default function SettingsPage() {
  const router = useRouter();

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const { user, setUser } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const { mutate: revokeRefreshTokenMutation } = useMutation({
    ...usersRevokeRefreshTokenMutation(),
    onError: async error => {
      console.error('Error logging out during cleanup:', error);
    },
  });

  const deleteAccountMutation = useMutation({
    ...deleteAccountOptions(),

    onSuccess: async () => {
      try {
        setLoading(true);

        const refreshToken = await readData('@refreshToken');
        if (refreshToken) {
          revokeRefreshTokenMutation({
            body: { refreshToken },
          });
        }

        clearStorage();
        updateAuthHeader('');
        setUser(undefined);

        router.replace('/(auth)/login');

      
      } catch (error) {
        console.error({ error }, 'Error during post-deletion cleanup process');
      } finally {
        setLoading(false);
      }
    },

    onError: error => {
      console.error('Account Deletion Failed:', error);
      Alert.alert(
        'Deletion Failed',
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while trying to delete your account.',
      );
    },
  });

  const handleDeleteAccount = () => {
    if (!user?.userId) {
      Alert.alert('Error', 'User ID is missing. Cannot delete account.');
      return;
    }

    setShowDeleteAccountModal(false);

    const request = new DeleteUserAccountRequest();
    request.setUserId(user.userId);

    deleteAccountMutation.mutate(request);
  };

  return (
    <>
      <KeyboardAvoidingView
        style={[
          defaultStyles.container,
          {
            paddingBottom: insets.bottom,
          },
        ]}
        // behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              {i18n.t('(farmer).(profile-flow).(settings).heading')}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View style={signupStyles.allInput}>
              <View style={styles.navigateSection}>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push('/(farmer)/personal-info')}>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="user"
                        size={20}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t('(farmer).(profile-flow).(settings).heading1')}{' '}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push('/(farmer)/language')}>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="language"
                        size={20}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t('(farmer).(profile-flow).(settings).heading3')}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push('/(farmer)/contact-us')}>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="envelope"
                        size={20}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t('(farmer).(profile-flow).(settings).heading4')}{' '}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() =>
                    Linking.openURL(process.env.EXPO_PUBLIC_TC_URL!)
                  }>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="file-text"
                        size={20}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t('(farmer).(profile-flow).(settings).heading6')}{' '}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() =>
                    Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL!)
                  }>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="shield"
                        size={20}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t('(farmer).(profile-flow).(settings).heading7')}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() =>
                    Linking.openURL(process.env.EXPO_PUBLIC_ABOUT_URL!)
                  }>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="info-circle"
                        size={20}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t('(farmer).(profile-flow).(settings).heading8')}{' '}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <Divider style={profileFlowStyles.divider} />
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => setShowDeleteAccountModal(true)}
                  disabled={deleteAccountMutation.isPending}>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.dangerContainer}>
                      <FontAwesome
                        name="trash"
                        size={20}
                        color={Colors.error}
                      />
                    </View>
                    <Text style={styles.logout}>
                      {deleteAccountMutation.isPending
                        ? 'Deleting...'
                        : i18n.t('(farmer).(profile-flow).(settings).heading9')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog
          visible={showDeleteAccountModal}
          onDismiss={() => setShowDeleteAccountModal(false)}
          style={defaultStyles.location}>
          <Dialog.Title style={defaultStyles.headText}>
            {i18n.t('(farmer).(profile-flow).(settings).deleteModalTitle')}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t('(farmer).(profile-flow).(settings).deleteModalBody1')}
            </Text>
            <Text
              style={[
                defaultStyles.bodyText,
                { marginTop: 10, fontWeight: 'bold' },
              ]}>
              {i18n.t('(farmer).(profile-flow).(settings).deleteModalBody2')}
            </Text>
          </Dialog.Content>

          <Dialog.Actions style={defaultStyles.actions}>
            <Button
              style={[defaultStyles.button, defaultStyles.halfContainer]}
              textColor={Colors.primary[500]}
              onPress={() => setShowDeleteAccountModal(false)}
              disabled={deleteAccountMutation.isPending}>
              {i18n.t('(farmer).(profile-flow).(settings).deleteModalCancel')}
            </Button>
            <Button
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                { backgroundColor: Colors.error },
              ]}
              textColor={Colors.light['10']}
              onPress={handleDeleteAccount}
              loading={deleteAccountMutation.isPending}
              disabled={deleteAccountMutation.isPending}>
              {deleteAccountMutation.isPending
                ? 'Deleting...'
                : i18n.t(
                    '(farmer).(profile-flow).(settings).deleteModalConfirm',
                  )}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
