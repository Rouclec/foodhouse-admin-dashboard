import React, { useContext, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar, Button, Text, Divider, List, Icon } from 'react-native-paper';
import { Colors } from '@/constants';
import {
  buyerProductsStyles,
  defaultStyles,
  profileFlowStyles,
  signupStyles,
  profileFlowStyles as styles,
} from '@/styles';
import i18n from '@/i18n';
import { Context, ContextType } from '@/app/_layout';

import { useMutation } from '@tanstack/react-query';
import { usersRevokeRefreshTokenMutation } from '@/client/users.swagger/@tanstack/react-query.gen';
import { FontAwesome } from '@expo/vector-icons';
import {
  FilterBottomSheet,
  FilterBottomSheetRef,
} from '@/components/(buyer)/(index)/FilterBottomSheet';
import { clearStorage, readData, updateAuthHeader } from '@/utils';

export default function Profile() {
  const router = useRouter();
  const sheetRef = useRef<FilterBottomSheetRef>(null);
  const { user, setUser } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const refreshToken = await readData('@refreshToken');

      await revokeRefreshToken({
        body: {
          refreshToken,
        },
      });

      await clearStorage();
      updateAuthHeader('');
      setUser(undefined);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error({ error }, 'logging out');
    } finally {
      setLoading(false);
    }
  };

  const { mutateAsync: revokeRefreshToken } = useMutation({
    ...usersRevokeRefreshTokenMutation(),
    onError: async error => {
      console.error('error logging out: ', error);
    },
  });

  const shareApp = async () => {
    const shareMessage = `Check out Foodhouse - your trusted source for fresh, farm-to-home food items!\n
    Download now:\n
    📱 Android: ${process.env.EXPO_PUBLIC_APP_ANDROID_URL}\n
    🍏 iOS: ${process.env.EXPO_PUBLIC_APP_IOS_URL}\n
    Eat clean, Live well!`;

    await Share.share({
      message: shareMessage,
      title: 'FOODHOUSE',
    });
  };

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        // behavior={Platform.OS === "ios" ? "padding" : undefined}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <Appbar.Content
              title={i18n.t('(farmer).(profile-flow).profile.title')}
            />
          </Appbar.Header>
          <View style={signupStyles.imageContainer}>
            <TouchableOpacity style={signupStyles.imageUpload}>
              <View style={signupStyles.addImageContainer}>
                {user?.profileImage ? (
                  <Image
                    source={{ uri: user?.profileImage }}
                    style={signupStyles.profileImage}
                  />
                ) : (
                  <Image
                    source={require('@/assets/images/avatar.png')}
                    style={signupStyles.avatar}
                  />
                )}
                <View style={signupStyles.cameraIcon}>
                  <Icon size={16} source="camera" color={Colors.light[10]} />
                </View>
              </View>
            </TouchableOpacity>
            <Text variant="titleLarge">
              {`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View style={signupStyles.allInput}>
              <View style={styles.navigateSection}>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push('/(farmer)/settings')}>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="cog"
                        size={20}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t('(farmer).(profile-flow).profile.tab1')}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={shareApp}>
                  <View style={styles.navigationContent}>
                    <View style={profileFlowStyles.iconContainer}>
                      <FontAwesome
                        name="paper-plane"
                        size={20}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.navigationText}>
                      {i18n.t('(farmer).(profile-flow).profile.tab2')}
                    </Text>
                  </View>
                  <List.Icon icon="chevron-right" />
                </TouchableOpacity>
                <Divider style={styles.divider} />
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={e => {
                    Keyboard.dismiss();
                    sheetRef.current?.open();
                  }}>
                  <View style={profileFlowStyles.row}>
                    <View style={profileFlowStyles.dangerContainer}>
                      <FontAwesome
                        name="sign-out"
                        size={20}
                        color={Colors.error}
                      />
                    </View>

                    <Text style={styles.logout}>
                      {i18n.t('(farmer).(profile-flow).profile.tab3')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <FilterBottomSheet ref={sheetRef} sheetHeight={200}>
        <View style={[buyerProductsStyles.filtersContainer]}>
          <View style={profileFlowStyles.content}>
            <Text variant="titleMedium" style={buyerProductsStyles.title}>
              {i18n.t('(farmer).(profile-flow).profile.tab3')}
            </Text>

            <Text style={defaultStyles.dialogSubtitle}>
              {i18n.t('(farmer).(profile-flow).profile.confirmation')}
            </Text>
          </View>
          <View style={buyerProductsStyles.bottomButtonContainer}>
            <Button
              onPress={() => {
                sheetRef?.current?.close();
              }}
              style={[
                defaultStyles.button,
                defaultStyles.secondaryButton,
                buyerProductsStyles.halfButton,
              ]}
              disabled={loading}>
              <Text style={defaultStyles.primaryText}>
                {i18n.t('(farmer).(profile-flow).profile.button1')}
              </Text>
            </Button>
            <Button
              onPress={() => {
                handleLogout(), sheetRef?.current?.close();
              }}
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                buyerProductsStyles.halfButton,
              ]}
              loading={loading}
              disabled={loading}>
              <Text style={defaultStyles.buttonText}>
                {i18n.t('(farmer).(profile-flow).profile.button2')}
              </Text>
            </Button>
          </View>
        </View>
      </FilterBottomSheet>
    </>
  );
}
