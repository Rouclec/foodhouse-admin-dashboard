import React, { useContext, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants';
import { agentDemoState } from '@/contexts/AgentContext';
import { Context, type ContextType } from '@/app/_layout';

const AgentProfile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useContext(Context) as ContextType;
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

  const handleLogout = () => {
    if (state.isDemoMode) {
      agentDemoState.logout();
    }
    router.replace('/login');
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
          {(displayFirstName ?? 'Agent') || 'Agent'} {(displayLastName ?? '') || ''}
        </Text>
        <Text style={styles.email}>{displayEmail || 'agent@foodhouse.demo'}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>KYC Status</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: state.kycStatus === 'verified' ? Colors.success + '20' : Colors.gold + '20' 
            }]}>
              <Text style={[styles.statusText, { 
                color: state.kycStatus === 'verified' ? Colors.success : Colors.gold 
              }]}>
                {state.kycStatus.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Agent Status</Text>
            <Text style={styles.value}>{state.agentStatus}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.earnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Earnings (XAF)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.completedDeliveries}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.pendingDeliveries}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 24, padding: 16 }}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={{ borderColor: Colors.error }}
            textColor={Colors.error}>
            Logout
          </Button>
        </View>
      </ScrollView>
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
