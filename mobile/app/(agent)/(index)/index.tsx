import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  View,
  FlatList,
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
  listAgentAvailableOrdersPage,
  listAgentDeliveredOrdersPage,
  listAgentOngoingOrdersPage,
} from '@/data/agent-orders-backend';
import { usersGetKycByUserIdOptions } from '@/client/users.swagger/@tanstack/react-query.gen';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const pageSize = 20;
  const infiniteEnabled = !!userId && !isDemo;

  const availableQuery = useInfiniteQuery({
    queryKey: ['agentAvailableOrders', userId],
    enabled: infiniteEnabled,
    initialPageParam: undefined as string | undefined,
    retry: 3,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: ({ pageParam }) =>
      listAgentAvailableOrdersPage({
        userId,
        count: pageSize,
        startKey: pageParam,
        radiusKm: 300,
      }),
    getNextPageParam: (lastPage) => lastPage.nextKey,
  });

  const ongoingQuery = useInfiniteQuery({
    queryKey: ['agentOngoingOrders', userId],
    enabled: infiniteEnabled,
    initialPageParam: undefined as string | undefined,
    retry: 3,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: ({ pageParam }) =>
      listAgentOngoingOrdersPage({
        userId,
        count: pageSize,
        startKey: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextKey,
  });

  const completedQuery = useInfiniteQuery({
    queryKey: ['agentCompletedOrders', userId],
    enabled: infiniteEnabled,
    initialPageParam: undefined as string | undefined,
    retry: 3,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: ({ pageParam }) =>
      listAgentDeliveredOrdersPage({
        userId,
        count: pageSize,
        startKey: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextKey,
  });

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

  const derivedAvailable = isDemo
    ? availableOrders
    : (availableQuery.data?.pages ?? []).flatMap(p => p.orders);
  const derivedOngoing = isDemo
    ? ongoingOrders
    : (ongoingQuery.data?.pages ?? []).flatMap(p => p.orders);
  const derivedCompleted = isDemo
    ? completedOrders
    : (completedQuery.data?.pages ?? []).flatMap(p => p.orders);

  const effectiveCanAcceptNewOrders = derivedOngoing.length === 0;

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
  }, [agentState]);

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
    setTimeout(async () => {
      void loadData();

      // Hard refresh: clear error state + refetch from first page.
      if (!isDemo && userId) {
        await Promise.all([
          queryClient.resetQueries({ queryKey: ['agentAvailableOrders', userId] }),
          queryClient.resetQueries({ queryKey: ['agentOngoingOrders', userId] }),
          queryClient.resetQueries({ queryKey: ['agentCompletedOrders', userId] }),
        ]);
      }

      setRefreshing(false);
    }, 500);
  }, [loadData, isDemo, queryClient, userId]);

  const ordersForTab =
    tab === 'available' ? derivedAvailable : tab === 'ongoing' ? derivedOngoing : derivedCompleted;

  const handleAcceptOrder = (order: AgentOrder) => {
    router.push({
      pathname: '/(agent)/order-details',
      params: { orderId: order.id },
    });
  };

  const handleCardPrimaryAction = async (order: AgentOrder) => {
    // Available tab = accept (and transition to ongoing).
    if (tab === 'available') {
      if (!effectiveCanAcceptNewOrders) {
        Alert.alert(
          i18n.t('(agent).home.alert.ongoingDeliveryTitle'),
          i18n.t('(agent).home.alert.ongoingDeliveryMessage'),
        );
        return;
      }
      if (!isKycVerified) {
        Alert.alert(
          i18n.t('(agent).home.alert.kycRequiredTitle'),
          i18n.t('(agent).home.alert.kycRequiredMessage'),
        );
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
      i18n.t('(agent).home.resetDemo.title'),
      i18n.t('(agent).home.resetDemo.message'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('(agent).home.resetDemo.resetButton'),
          style: 'destructive',
          onPress: () => {
            mockDataStore.resetAll();
            agentDemoState.resetDemo();
            loadData();
            Alert.alert(
              i18n.t('common.success'),
              i18n.t('(agent).home.resetDemo.successMessage'),
            );
          },
        },
      ]
    );
  };

  const getKYCStatusMessage = () => {
    switch (kycStatus) {
      case 'not_started':
        return {
          title: i18n.t('(agent).home.kycBanner.notStarted.title'),
          subtitle: i18n.t('(agent).home.kycBanner.notStarted.subtitle'),
          showKYCButton: true,
          type: 'warning' as const,
        };
      case 'pending':
        return {
          title: i18n.t('(agent).home.kycBanner.pending.title'),
          subtitle: i18n.t('(agent).home.kycBanner.pending.subtitle'),
          showKYCButton: false,
          type: 'info' as const,
        };
      case 'rejected':
        return {
          title: i18n.t('(agent).home.kycBanner.rejected.title'),
          subtitle: i18n.t('(agent).home.kycBanner.rejected.subtitle'),
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

  const activeQuery =
    tab === 'available' ? availableQuery : tab === 'ongoing' ? ongoingQuery : completedQuery;

  const handleEndReached = () => {
    if (isDemo) return;
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      void activeQuery.fetchNextPage();
    }
  };

  useEffect(() => {
    if (isDemo) return;
    const completed = derivedCompleted.length;
    const earnings = derivedCompleted.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    setStats({
      totalEarnings: earnings,
      completedDeliveries: completed,
      ongoingDeliveries: derivedOngoing.length,
    });
  }, [isDemo, derivedCompleted, derivedOngoing]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.headerTitle}>{i18n.t('(agent).home.title')}</Text>
            {isDemo && (
              <View style={{ backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ color: Colors.dark[0], fontSize: 10, fontWeight: '600' }}>
                  {i18n.t('(agent).home.demoBadge')}
                </Text>
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

      <FlatList
        style={styles.content}
        showsVerticalScrollIndicator={false}
        data={ordersForTab}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.6}
        onEndReached={handleEndReached}
        ListHeaderComponent={
          <View>
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
                  {i18n.t('(agent).home.tabs.available')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabPill, tab === 'ongoing' && styles.tabPillActive]}
                activeOpacity={0.85}
                onPress={() => setTab('ongoing')}>
                <Text style={[styles.tabText, tab === 'ongoing' && styles.tabTextActive]}>
                  {i18n.t('(agent).home.tabs.ongoing')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabPill, tab === 'completed' && styles.tabPillActive]}
                activeOpacity={0.85}
                onPress={() => setTab('completed')}>
                <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>
                  {i18n.t('(agent).home.tabs.completed')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {tab === 'available'
                  ? i18n.t('(agent).orders.title')
                  : tab === 'ongoing'
                  ? i18n.t('(agent).home.sectionTitle.ongoing')
                  : i18n.t('(agent).home.sectionTitle.completed')}
              </Text>
              <Text style={{ color: Colors.grey['61'], fontSize: 14 }}>
                {i18n.t('(agent).orders.order', { count: ordersForTab.length })}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon source="package-variant" size={40} color={Colors.grey['61']} />
            </View>
            <Text style={styles.emptyTitle}>
              {tab === 'available'
                ? i18n.t('(agent).orders.noOrdersAvailable')
                : tab === 'ongoing'
                ? i18n.t('(agent).home.empty.ongoingTitle')
                : i18n.t('(agent).home.empty.completedTitle')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'available'
                ? !isKycVerified
                  ? i18n.t('(agent).home.empty.availableKycRequiredSubtitle')
                  : i18n.t('(agent).home.empty.availableSubtitle')
                : tab === 'ongoing'
                ? i18n.t('(agent).home.empty.ongoingSubtitle')
                : i18n.t('(agent).home.empty.completedSubtitle')}
            </Text>
          </View>
        }
        renderItem={({ item: order }) => (
          <TouchableOpacity
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
                  tab === 'available' && !effectiveCanAcceptNewOrders
                    ? defaultStyles.greyButton
                    : undefined,
                ]}
                onPress={() => void handleCardPrimaryAction(order)}>
                <Text style={styles.acceptButtonText}>
                  {tab === 'available'
                    ? i18n.t('(agent).orders.acceptOrder')
                    : i18n.t('common.view')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.ordersList}
        ListFooterComponent={
          <TouchableOpacity
            style={{ marginTop: 24, padding: 16 }}
            onLongPress={() => {
              if (!agentState.isDemoMode) return;
              handleResetData();
            }}
            delayLongPress={2000}>
            <Text style={{ textAlign: 'center', color: Colors.grey['61'], fontSize: 12 }}>
              {agentState.isDemoMode ? i18n.t('(agent).home.resetDemo.longPressHint') : ''}
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
};

export default AgentHomeScreen;
