import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Appbar,
  Button,
  Text,
  Divider,
  List,
  Icon,
  Snackbar,
} from 'react-native-paper';
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

import {
  useMutation,
  // useQuery
} from '@tanstack/react-query';
import {
  usersCompleteRegistrationMutation,
  // usersGetUserActiveSubscriptionOptions,
  usersRevokeRefreshTokenMutation,
} from '@/client/users.swagger/@tanstack/react-query.gen';
import { FontAwesome } from '@expo/vector-icons';
import {
  FilterBottomSheet,
  FilterBottomSheetRef,
} from '@/components/(buyer)/(index)/FilterBottomSheet';
import {
  clearStorage,
  readData,
  updateAuthHeader,
  uploadImage,
  useCompressImage,
} from '@/utils';
import { ImagePicker } from '@/components';

const isLocalImageUri = (uri: string) =>
  uri.startsWith('file://') ||
  uri.startsWith('content://') ||
  uri.startsWith('ph://') ||
  uri.startsWith('assets-library://');

export default function Profile() {
  const router = useRouter();
  const sheetRef = useRef<FilterBottomSheetRef>(null);
  const didMountRef = useRef(false);
  const { user, setUser } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);
  const [originalProfileImage, setOriginalProfileImage] = useState(
    user?.profileImage || '',
  );
  const [profileImage, setProfileImage] = useState(originalProfileImage);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleLogout = async () => {
    try {
      setLoading(true);

      readData('@refreshToken').then(refreshToken => {
        revokeRefreshToken({
          body: {
            refreshToken,
          },
        });

        clearStorage();
        updateAuthHeader('');
        setUser(undefined);
      });

      router.replace('/(auth)/login');
      sheetRef?.current?.close();
    } catch (error) {
      console.error({ error }, 'logging out');
    } finally {
      setLoading(false);
    }
  };

  const { mutate: revokeRefreshToken } = useMutation({
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

  const handleImageSelect = async (asset: any) => {
    console.log('handleImageSelect: Asset received:', asset?.uri);
    if (asset && asset.uri !== originalProfileImage) {
      setProfileImage(asset.uri);
    }
    setIsImagePickerVisible(false);
  };

  const { mutateAsync: updateProfile } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onSuccess: async () => {},
    onError: async error => {
      console.error('updateProfile onError:', error);
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t('(auth).profile.unknownError'),
      );
    },
  });

  const {
    compressImage,
    // loading: isCompressing,
    // error: compressionError,
  } = useCompressImage(profileImage ?? '');

  const handleSave = useCallback(async (): Promise<void> => {
    try {
      // Only upload if the user actually picked a NEW local image.
      if (
        !profileImage ||
        profileImage === originalProfileImage ||
        !isLocalImageUri(profileImage)
      ) {
        return;
      }

      setLoading(true);

      const imageUri = await compressImage();
      if (!imageUri) {
        throw new Error('Image compression failed');
      }

      const uploadedUrl = await uploadImage({
        uri: imageUri,
        filename: `profile_${user?.userId}_${Date.now()}.jpg`,
        directory: 'profile_images',
      });

      const data = {
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        address: user?.address,
        profileImage: uploadedUrl,
        locationCoordinates: user?.locationCoordinates,
      };

      await updateProfile({ body: data, path: { userId: user?.userId || '' } });

      setUser({ ...user, ...data });
      setOriginalProfileImage(uploadedUrl);
    } catch (error) {
      console.error('handleSave: Error updating profile:', error);
      setErrorMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [
    profileImage,
    originalProfileImage,
    compressImage,
    updateProfile,
    user,
    setUser,
  ]);

  useEffect(() => {
    // Prevent running the save flow on the initial render (when `profileImage`
    // is seeded from `user?.profileImage`).
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (profileImage) {
      handleSave();
    }
  }, [profileImage, handleSave]);

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
            <TouchableOpacity
              style={signupStyles.imageUpload}
              onPress={() => {
                setIsImagePickerVisible(true);
              }}>
              <View style={signupStyles.addImageContainer}>
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.primary[500]} />
                ) : profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={signupStyles.profileImage}
                  />
                ) : user?.profileImage ? (
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
              {/* {!userActiveSubscription?.userSubscription && (
                <View style={styles.sectionCard}>
                  <View style={styles.vip}>
                    <Text
                      variant="titleMedium"
                      style={[styles.shrinkHeading, { color: '#fff' }]}>
                      {i18n.t('(farmer).(profile-flow).profile.heading')}
                    </Text>
                    <Text style={[{ color: '#fff', marginBottom: 12 }]}>
                      {i18n.t('(farmer).(profile-flow).profile.description')}
                    </Text>
                    <Button
                      mode="contained"
                      onPress={handleBecomeVIP}
                      style={styles.vipButton}
                      labelStyle={{ color: Colors.primary[500] }}>
                      {i18n.t('(farmer).(profile-flow).profile.button')}
                    </Button>
                  </View>

                  <View style={{ justifyContent: 'center' }}>
                    <Image
                      source={require('@/assets/images/icons/vip1.png')}
                      style={{ width: 100, height: 100 }}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              )} */}

              <View style={styles.navigateSection}>
                <TouchableOpacity
                  style={styles.navigationItem}
                  onPress={() => router.push('/(buyer)/settings')}>
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
                handleLogout();
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
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
      <ImagePicker
        visible={isImagePickerVisible}
        setImage={handleImageSelect}
        onClose={() => {
          setIsImagePickerVisible(false);
        }}
        aspect={[1, 1]}
      />
    </>
  );
}
