import React, { useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { agentDemoState } from '@/contexts/AgentContext';
import { Context, type ContextType } from '@/app/_layout';
import { usersRevokeRefreshTokenMutation } from '@/client/users.swagger/@tanstack/react-query.gen';
import {
  buyerProductsStyles,
  defaultStyles,
  profileFlowStyles,
} from '@/styles';
import {
  FilterBottomSheet,
  type FilterBottomSheetRef,
} from '@/components/(buyer)/(index)/FilterBottomSheet';
import { clearStorage, readData, updateAuthHeader } from '@/utils';

const AgentProfile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<FilterBottomSheetRef>(null);
  const { user, setUser } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(agentDemoState.getState());

  useEffect(() => {
    const unsubscribe = agentDemoState.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  const displayFirstName = state.isDemoMode ? state.agent?.firstName : user?.firstName;
  const displayLastName = state.isDemoMode ? state.agent?.lastName : user?.lastName;
  const displayEmail = state.isDemoMode ? state.agent?.email : user?.email;

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

      if (state.isDemoMode) {
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(displayFirstName ?? 'A')?.[0] || 'A'}
          </Text>
        </View>
        <Text style={styles.name}>
          {(displayFirstName ?? i18n.t('(agent).profile.defaultName')) ||
            i18n.t('(agent).profile.defaultName')}{' '}
          {(displayLastName ?? '') || ''}
        </Text>
        <Text style={styles.email}>{displayEmail || 'agent@foodhouse.demo'}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('(agent).profile.accountStatus')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{i18n.t('(agent).profile.kycStatusLabel')}</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: state.kycStatus === 'verified' ? Colors.success + '20' : Colors.gold + '20' 
            }]}>
              <Text style={[styles.statusText, { 
                color: state.kycStatus === 'verified' ? Colors.success : Colors.gold 
              }]}>
                {i18n.t(`(agent).profile.kycStatus.${state.kycStatus}`)}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{i18n.t('(agent).profile.agentStatusLabel')}</Text>
            <Text style={styles.value}>
              {i18n.t(`(agent).profile.agentStatus.${state.agentStatus}`)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('(agent).profile.statistics')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.earnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>
                {i18n.t('(agent).profile.totalEarningsWithCurrency', {
                  currency: i18n.t('common.currency'),
                })}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.completedDeliveries}</Text>
              <Text style={styles.statLabel}>
                {i18n.t('(agent).profile.completed')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.pendingDeliveries}</Text>
              <Text style={styles.statLabel}>
                {i18n.t('(agent).profile.pending')}
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
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                buyerProductsStyles.halfButton,
              ]}
              loading={loading}
              disabled={loading}>
              <Text style={defaultStyles.buttonText}>{i18n.t('common.logout')}</Text>
            </Button>
          </View>
        </View>
      </FilterBottomSheet>
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
});

export default AgentProfile;
