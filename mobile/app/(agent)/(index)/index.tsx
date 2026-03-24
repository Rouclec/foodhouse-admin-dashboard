import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Icon, Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { agentHomeStyles as styles, defaultStyles } from '@/styles';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { agentDemoState } from '@/contexts/AgentContext';
import { mockDataStore, AgentOrder } from '@/data/mock-orders';
import { Context, ContextType } from '@/app/_layout';
import {
  listAgentOrdersFromBackend,
} from '@/data/agent-orders-backend';
import { usersGetKycByUserIdOptions } from '@/client/users.swagger/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import type { usersgrpcKYCStatus } from '@/client/users.swagger';

const AgentHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useContext(Context) as ContextType;
  const [agentState, setAgentState] = useState(agentDemoState.getState());
  const [refreshing, setRefreshing] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<AgentOrder[]>([]);
  const [ongoingOrders, setOngoingOrders] = useState<AgentOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<AgentOrder[]>([]);
  const [stats, setStats] = useState({ totalEarnings: 0, completedDeliveries: 0, ongoingDeliveries: 0 });
  const isDemo = agentState.isDemoMode;
  const [tab, setTab] = useState<'available' | 'ongoing' | 'completed'>('available');
  const canAcceptNewOrders = ongoingOrders.length === 0;
  const userId = user?.userId ?? '';

  const { data: backendKycData } = useQuery({
    ...usersGetKycByUserIdOptions({
      path: { userId },
    }),
    enabled: !!userId && !isDemo,
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

  const kycStatus = isDemo ? agentState.kycStatus : backendKycStatus;
  const isKycVerified = kycStatus === 'verified';

  useEffect(() => {
    const unsubscribe = agentDemoState.subscribe(setAgentState);
    return () => { unsubscribe(); };
  }, []);

  const loadData = useCallback(async () => {
    // Demo mode: keep using the mock store.
    if (agentState.isDemoMode) {
      const demoAvailable = mockDataStore.getOrders();
      const accepted = mockDataStore.getAcceptedOrders();
      const demoOngoing = accepted.filter(o => o.status === 'assigned' || o.status === 'picked_up');
      const demoCompleted = accepted.filter(o => o.status === 'delivered');
      const mockStats = mockDataStore.getStats();

      setAvailableOrders(demoAvailable);
      setOngoingOrders(demoOngoing);
      setCompletedOrders(demoCompleted);
      setStats({
        totalEarnings: mockStats.totalEarnings,
        completedDeliveries: demoCompleted.length,
        ongoingDeliveries: demoOngoing.length,
      });
      return;
    }

    // Non-demo: try backend.
    const userId = user?.userId ?? '';
    if (!userId) {
      setAvailableOrders([]);
      setOngoingOrders([]);
      setCompletedOrders([]);
      setStats({ totalEarnings: 0, completedDeliveries: 0, ongoingDeliveries: 0 });
      return;
    }

    try {
      const [backendAvailable, backendOngoing, backendCompleted] = await Promise.all([
        listAgentOrdersFromBackend({
          userId,
          statuses: ['OrderStatus_APPROVED'],
        }),
        listAgentOrdersFromBackend({
          userId,
          statuses: ['OrderStatus_IN_TRANSIT'],
        }),
        listAgentOrdersFromBackend({
          userId,
          statuses: ['OrderStatus_DELIVERED'],
        }),
      ]);

      setAvailableOrders(backendAvailable);
      setOngoingOrders(backendOngoing);
      setCompletedOrders(backendCompleted);

      const completed = backendCompleted.length;
      const earnings = backendCompleted.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

      setStats({
        totalEarnings: earnings,
        completedDeliveries: completed,
        ongoingDeliveries: backendOngoing.length,
      });
    } catch (_e) {
      // If backend isn't ready for agent views yet, keep the screen usable.
      setAvailableOrders([]);
      setOngoingOrders([]);
      setCompletedOrders([]);
      setStats({ totalEarnings: 0, completedDeliveries: 0, ongoingDeliveries: 0 });
    }
  }, [agentState, user?.userId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      void loadData();
      setRefreshing(false);
    }, 500);
  }, [loadData]);

  const ordersForTab =
    tab === 'available' ? availableOrders : tab === 'ongoing' ? ongoingOrders : completedOrders;

  const handleAcceptOrder = (order: AgentOrder) => {
    router.push({
      pathname: '/(agent)/order-details',
      params: { orderId: order.id },
    });
  };

  const handleCardPrimaryAction = async (order: AgentOrder) => {
    // Available tab = accept (and transition to ongoing).
    if (tab === 'available') {
      if (!canAcceptNewOrders) {
        Alert.alert(
          'Ongoing delivery',
          'Finish your current delivery before accepting a new order.',
        );
        return;
      }
      if (!isKycVerified) {
        Alert.alert('KYC Required', 'Please complete your KYC verification first.');
        return;
      }

      if (isDemo) {
        mockDataStore.acceptOrder(order.id);
        setTab('ongoing');
        await loadData();
        handleAcceptOrder(order);
        return;
      }

      // Non-demo: current backend flow moves the order to in-transit via dispatch.
      // (We will improve this with a dedicated Accept endpoint + status.)
      handleAcceptOrder(order);
      return;
    }

    // Ongoing/Completed = view.
    handleAcceptOrder(order);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will reset all orders and earnings to their initial state. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            mockDataStore.resetAll();
            agentDemoState.resetDemo();
            loadData();
            Alert.alert('Success', 'Demo data has been reset.');
          },
        },
      ]
    );
  };

  const getKYCStatusMessage = () => {
    switch (kycStatus) {
      case 'not_started':
        return {
          title: 'Complete Your KYC',
          subtitle: 'You need to verify your identity before accepting deliveries',
          showKYCButton: true,
          type: 'warning' as const,
        };
      case 'pending':
        return {
          title: 'KYC Under Review',
          subtitle: 'Your documents are being reviewed. This usually takes 24-48 hours.',
          showKYCButton: false,
          type: 'info' as const,
        };
      case 'rejected':
        return {
          title: 'KYC Rejected',
          subtitle: 'Your documents were not accepted. Please resubmit.',
          showKYCButton: true,
          type: 'error' as const,
        };
      case 'verified':
        return null;
      default:
        return null;
    }
  };

  const kycMessage = getKYCStatusMessage();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.headerTitle}>{i18n.t('(agent).home.title')}</Text>
            {isDemo && (
              <View style={{ backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ color: Colors.dark[0], fontSize: 10, fontWeight: '600' }}>DEMO</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {i18n.t('common.currency')} {stats.totalEarnings.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>
              {i18n.t('(agent).home.totalEarnings')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.ongoingDeliveries}</Text>
            <Text style={styles.statLabel}>
              {i18n.t('(agent).home.ongoingDeliveries')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedDeliveries}</Text>
            <Text style={styles.statLabel}>
              {i18n.t('(agent).home.completedDeliveries')}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {kycMessage && (
          <View style={{ 
            backgroundColor: kycMessage.type === 'error' ? Colors.error + '20' : Colors.gold + '20',
            borderRadius: 12, 
            padding: 16, 
            marginBottom: 16,
            borderWidth: 1,
            borderColor: kycMessage.type === 'error' ? Colors.error : Colors.gold,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.dark[0], marginBottom: 4 }}>
              {kycMessage.title}
            </Text>
            <Text style={{ fontSize: 14, color: Colors.grey['61'], marginBottom: 12 }}>
              {kycMessage.subtitle}
            </Text>
            {kycMessage.showKYCButton && (
              <Button
                mode="contained"
                onPress={() => router.push('/(agent)/kyc')}
                buttonColor={Colors.primary[500]}
                style={{ borderRadius: 8 }}>
                {i18n.t('(agent).kyc.title')}
              </Button>
            )}
          </View>
        )}

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabPill, tab === 'available' && styles.tabPillActive]}
            activeOpacity={0.85}
            onPress={() => setTab('available')}>
            <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, tab === 'ongoing' && styles.tabPillActive]}
            activeOpacity={0.85}
            onPress={() => setTab('ongoing')}>
            <Text style={[styles.tabText, tab === 'ongoing' && styles.tabTextActive]}>
              Ongoing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, tab === 'completed' && styles.tabPillActive]}
            activeOpacity={0.85}
            onPress={() => setTab('completed')}>
            <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {tab === 'available'
              ? i18n.t('(agent).orders.title')
              : tab === 'ongoing'
              ? 'Ongoing deliveries'
              : 'Completed deliveries'}
          </Text>
          <Text style={{ color: Colors.grey['61'], fontSize: 14 }}>
            {ordersForTab.length} {i18n.t('(agent).orders.order')}
            {ordersForTab.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {ordersForTab.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon source="package-variant" size={40} color={Colors.grey['61']} />
            </View>
            <Text style={styles.emptyTitle}>
              {tab === 'available'
                ? i18n.t('(agent).orders.noOrdersAvailable')
                : tab === 'ongoing'
                ? 'No ongoing deliveries'
                : 'No completed deliveries yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'available'
                ? !isKycVerified
                  ? 'Complete your KYC verification to start accepting orders'
                  : 'New orders will appear here when customers request delivery'
                : tab === 'ongoing'
                ? 'Orders you’re currently delivering will appear here.'
                : 'Your completed deliveries will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {ordersForTab.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => handleAcceptOrder(order)}
                activeOpacity={0.7}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>
                    {i18n.t('(agent).orders.order')} #{order.orderNumber}
                  </Text>
                  <View style={styles.orderDistance}>
                    <Icon source="map-marker-distance" size={14} color={Colors.grey['61']} />
                    <Text style={styles.distanceText}>
                      {order.distance} {i18n.t('(agent).orders.km')}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderRoute}>
                  <View style={styles.routeRow}>
                    <View style={styles.routeIcon}>
                      <Icon source="store" size={16} color={Colors.primary[500]} />
                    </View>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeLabel}>
                        {i18n.t('(agent).orders.pickup')}
                      </Text>
                      <Text style={styles.routeAddress}>{order.farmerName}</Text>
                      <Text style={styles.routeAddress}>{order.pickupAddress}</Text>
                    </View>
                  </View>

                  <View style={styles.routeConnector} />

                  <View style={styles.routeRow}>
                    <View style={[styles.routeIcon, styles.routeDestinationIcon]}>
                      <Icon source="home" size={16} color={Colors.success} />
                    </View>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeLabel}>
                        {i18n.t('(agent).orders.delivery')}
                      </Text>
                      <Text style={styles.routeAddress}>{order.customerName}</Text>
                      <Text style={styles.routeAddress}>{order.deliveryAddress}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.earningContainer}>
                    <Text style={styles.earningLabel}>
                      {i18n.t('(agent).orders.yourEarning')}
                    </Text>
                    <Text style={styles.earningAmount}>
                      {i18n.t('common.currency')} {order.deliveryFee.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.acceptButton,
                      tab === 'available' && !canAcceptNewOrders
                        ? defaultStyles.greyButton
                        : undefined,
                    ]}
                    onPress={() => void handleCardPrimaryAction(order)}>
                    <Text style={styles.acceptButtonText}>
                      {tab === 'available' ? i18n.t('(agent).orders.acceptOrder') : 'View'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={{ marginTop: 24, padding: 16 }}
          onLongPress={() => {
            if (!agentState.isDemoMode) return;
            handleResetData();
          }}
          delayLongPress={2000}>
          <Text style={{ textAlign: 'center', color: Colors.grey['61'], fontSize: 12 }}>
            {agentState.isDemoMode ? 'Long press to reset demo data' : ''}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AgentHomeScreen;
