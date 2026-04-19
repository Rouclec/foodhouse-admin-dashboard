import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Image, Keyboard, ScrollView, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Appbar, Button, Text, Icon, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { agentDemoState } from '@/contexts/AgentContext';
import { Context, type ContextType } from '@/app/_layout';
import {
  usersCompleteRegistrationMutation,
  usersRevokeRefreshTokenMutation,
} from '@/client/users.swagger/@tanstack/react-query.gen';
import type { usersgrpcKYCStatus } from '@/client/users.swagger';
import { ordersGetAgentStatsOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';
import {
  buyerProductsStyles,
  defaultStyles,
  profileFlowStyles,
} from '@/styles';
import {
  FilterBottomSheet,
  type FilterBottomSheetRef,
} from '@/components/(buyer)/(index)/FilterBottomSheet';
import { clearStorage, readData, updateAuthHeader, isLocalImageUri, uploadImage, useCompressImage } from '@/utils';
import { ImagePicker } from '@/components';

const AgentProfile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<FilterBottomSheetRef>(null);
  const { user, setUser } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoState, setDemoState] = useState(agentDemoState.getState());
  const [errorMessage, setErrorMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);

  useEffect(() => {
    const checkDemoMode = () => {
      const state = agentDemoState.getState();
      setIsDemo(state.isDemoMode && state.isLoggedIn);
      setDemoState(state);
    };
    checkDemoMode();
    const unsubscribe = agentDemoState.subscribe(checkDemoMode);
    return () => {
      unsubscribe();
    };
  }, []);

  const displayFirstName = isDemo ? demoState.agent?.firstName : user?.firstName;
  const displayLastName = isDemo ? demoState.agent?.lastName : user?.lastName;
  const displayEmail = isDemo ? demoState.agent?.email : user?.email;
  const userId = user?.userId ?? '';

  const { data: backendKycData } = useQuery({
    ...usersGetKycByUserIdOptions({
      path: { userId },
    }),
    enabled: !isDemo && !!userId,
  });

  const backendKycStatus = (() => {
    const status = backendKycData?.kycVerification?.status as usersgrpcKYCStatus | undefined;
    switch (status) {
      case 'KYC_STATUS_VERIFIED':
        return 'verified' as const;
      case 'KYC_STATUS_REJECTED':
        return 'rejected' as const;
      case 'KYC_STATUS_PENDING':
        return 'pending' as const;
      default:
        return backendKycData?.kycVerification ? ('pending' as const) : ('not_started' as const);
    }
  })();

  const kycStatus = isDemo ? demoState.kycStatus : backendKycStatus;
  const isKycVerified = kycStatus === 'verified';

  const { data: agentStatsData } = useQuery({
    ...ordersGetAgentStatsOptions({
      path: { userId },
    }),
    enabled: !isDemo && !!userId,
  });

  const totalEarnings = isDemo
    ? demoState.earnings
    : (agentStatsData?.totalEarnings?.value ?? 0);

  const completedDeliveries = isDemo
    ? demoState.completedDeliveries
    : (agentStatsData?.completedCount ?? 0);

  const ongoingDeliveries = isDemo
    ? demoState.pendingDeliveries
    : (agentStatsData?.ongoingCount ?? 0);

  const originalProfileImage = user?.profileImage ?? '';

  const handleImageSelect = async (asset: any) => {
    if (asset && asset.uri !== originalProfileImage) {
      setProfileImage(asset.uri);
    }
    setIsImagePickerVisible(false);
  };

  const { mutateAsync: updateProfile } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onSuccess: async () => {
      if (user && profileImage && profileImage !== originalProfileImage) {
        setUser({ ...user, profileImage: profileImage });
      }
    },
    onError: async error => {
      console.error('updateProfile onError:', error);
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t('(auth).profile.unknownError'),
      );
    },
  });

  const { compressImage } = useCompressImage(profileImage ?? '');

  const handleSave = useCallback(async (): Promise<void> => {
    try {
      let finalImageUrl = profileImage;

      if (
        profileImage &&
        profileImage !== originalProfileImage &&
        isLocalImageUri(profileImage)
      ) {
        const imageUri = await compressImage();
        if (!imageUri) {
          throw new Error('Image compression failed');
        }
        finalImageUrl = await uploadImage({
          uri: imageUri,
          filename: `profile_${user?.userId}_${Date.now()}.jpg`,
          directory: 'profile_images',
        });
      }

      const data = {
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        address: user?.address,
        profileImage: finalImageUrl,
        locationCoordinates: user?.locationCoordinates,
      };

      await updateProfile({ body: data, path: { userId: user?.userId || '' } });
    } catch (error) {
      console.error('handleSave error:', error);
    }
  }, [profileImage, originalProfileImage, user, compressImage, updateProfile]);

  const { mutate: revokeRefreshToken } = useMutation({
    ...usersRevokeRefreshTokenMutation(),
    onError: async error => {
      console.error('error logging out: ', error);
    },
  });

  const handleLogout = async () => {
    try {
      setLoading(true);

      const refreshToken = await readData('@refreshToken');
      revokeRefreshToken({
        body: {
          refreshToken: refreshToken ?? '',
        },
      });

      clearStorage();
      updateAuthHeader('');
      setUser(undefined);

      if (isDemo) {
        agentDemoState.logout();
      }

      router.replace('/(auth)/login');
      sheetRef.current?.close();
    } catch (error) {
      console.error({ error }, 'logging out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => setIsImagePickerVisible(true)}
          disabled={isDemo}>
          {(profileImage || user?.profileImage) ? (
            <Image
              source={{ uri: profileImage || user?.profileImage }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {(displayFirstName ?? 'A')?.[0] || 'A'}
            </Text>
          )}
          {!isDemo && (
            <View style={styles.editAvatarButton}>
              <Icon source="pencil" size={14} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>
          {(displayFirstName ?? i18n.t('(agent).profile.defaultName')) ||
            i18n.t('(agent).profile.defaultName')}{' '}
          {(displayLastName ?? '') || ''}
        </Text>
        <Text style={styles.email}>
          {displayEmail || (isDemo ? 'agent@foodhouse.demo' : '')}
        </Text>
        {isDemo && (
          <View style={{ backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 8 }}>
            <Text style={{ color: Colors.dark[0], fontSize: 10, fontWeight: '600' }}>
              DEMO
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('(agent).profile.accountStatus')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{i18n.t('(agent).profile.kycStatusLabel')}</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: isKycVerified ? Colors.success + '20' : Colors.gold + '20' 
            }]}>
              <Text style={[styles.statusText, { 
                color: isKycVerified ? Colors.success : Colors.gold 
              }]}>
                {i18n.t(`(agent).profile.kycStatus.${kycStatus}`)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('(agent).profile.statistics')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalEarnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>
                {i18n.t('(agent).profile.totalEarningsWithCurrency', {
                  currency: i18n.t('common.currency'),
                })}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedDeliveries}</Text>
              <Text style={styles.statLabel}>
                {i18n.t('(agent).profile.completed')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ongoingDeliveries}</Text>
              <Text style={styles.statLabel}>
                {i18n.t('(agent).profile.ongoing')}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 24, padding: 16 }}>
          <Button
            mode="outlined"
            onPress={() => {
              Keyboard.dismiss();
              sheetRef.current?.open();
            }}
            style={{ borderColor: Colors.error }}
            textColor={Colors.error}>
            {i18n.t('common.logout')}
          </Button>
        </View>
      </ScrollView>

<FilterBottomSheet ref={sheetRef} sheetHeight={200}>
        <View style={[buyerProductsStyles.filtersContainer]}>
          <View style={profileFlowStyles.content}>
            <Text variant="titleMedium" style={buyerProductsStyles.title}>
              {i18n.t('common.logout')}
            </Text>

            <Text style={defaultStyles.dialogSubtitle}>
              {i18n.t('(agent).profile.logoutConfirm')}
            </Text>
          </View>
          <View style={buyerProductsStyles.bottomButtonContainer}>
            <Button
              onPress={() => {
                sheetRef.current?.close();
              }}
              style={[
                defaultStyles.button,
                defaultStyles.secondaryButton,
                buyerProductsStyles.halfButton,
              ]}
              disabled={loading}>
              <Text style={defaultStyles.primaryText}>{i18n.t('common.cancel')}</Text>
            </Button>
            <Button
              onPress={handleLogout}
              loading={loading}
              disabled={loading}>
              <Text style={defaultStyles.buttonText}>{i18n.t('common.logout')}</Text>
            </Button>
          </View>
        </View>
      </FilterBottomSheet>
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage('')}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
      <ImagePicker
        visible={isImagePickerVisible}
        setImage={handleImageSelect}
        onClose={() => setIsImagePickerVisible(false)}
        aspect={[1, 1]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light['bg'],
  },
  header: {
    backgroundColor: Colors.primary[500],
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light[10],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 64,
    color: Colors.primary[500],
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light[10],
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: Colors.light[10],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark[0],
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey['e1'],
  },
  label: {
    fontSize: 14,
    color: Colors.grey['61'],
  },
  value: {
    fontSize: 14,
    color: Colors.dark[0],
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark[0],
  },
  statLabel: {
    fontSize: 12,
    color: Colors.grey['61'],
    marginTop: 4,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary[500],
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default AgentProfile;
