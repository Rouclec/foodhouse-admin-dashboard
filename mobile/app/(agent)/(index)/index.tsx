import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { Icon, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { agentHomeStyles as styles, defaultStyles } from '@/styles';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { useAgent, AgentKYCStatus } from '@/contexts/AgentContext';
import { mockDataStore, AgentOrder } from '@/data/mock-orders';

const AgentHomeScreen = () => {
  const { state: agentState, goOnline, goOffline, resetDemo } = useAgent();
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<AgentOrder[]>([]);
  const [stats, setStats] = useState({ totalEarnings: 0, completedDeliveries: 0, pendingOrders: 0 });

  const loadData = useCallback(() => {
    const availableOrders = mockDataStore.getOrders();
    const mockStats = mockDataStore.getStats();
    
    setOrders(availableOrders);
    setStats({
      totalEarnings: agentState.earnings || mockStats.totalEarnings,
      completedDeliveries: agentState.completedDeliveries || mockStats.completedDeliveries,
      pendingOrders: agentState.pendingDeliveries || mockStats.pendingOrders,
    });
  }, [agentState.earnings, agentState.completedDeliveries, agentState.pendingDeliveries]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      loadData();
      setRefreshing(false);
    }, 500);
  }, [loadData]);

  const handleToggleOnline = () => {
    if (agentState.agentStatus === 'online') {
      goOffline();
      Alert.alert(
        i18n.t('(agent).home.offline'),
        'You are now offline and will not receive new orders.',
        [{ text: 'OK' }]
      );
    } else {
      goOnline();
      Alert.alert(
        i18n.t('(agent).home.online'),
        'You are now online and can receive delivery orders!',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAcceptOrder = (order: AgentOrder) => {
    router.push({
      pathname: '/order-details',
      params: { orderId: order.id },
    });
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
            resetDemo();
            loadData();
            Alert.alert('Success', 'Demo data has been reset.');
          },
        },
      ]
    );
  };

  const getKYCStatusMessage = () => {
    switch (agentState.kycStatus) {
      case 'not_started':
        return {
          title: 'Complete Your KYC',
          subtitle: 'You need to verify your identity before accepting deliveries',
          showKYCButton: true,
        };
      case 'pending':
        return {
          title: 'KYC Under Review',
          subtitle: 'Your documents are being reviewed. This usually takes 24-48 hours.',
          showKYCButton: false,
        };
      case 'rejected':
        return {
          title: 'KYC Rejected',
          subtitle: 'Your documents were not accepted. Please resubmit.',
          showKYCButton: true,
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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{i18n.t('(agent).home.title')}</Text>
          {agentState.kycStatus === 'verified' && (
            <View style={styles.statusToggle}>
              <View
                style={
                  agentState.agentStatus === 'online'
                    ? styles.onlineIndicator
                    : styles.offlineIndicator
                }
              />
              <Text style={styles.statusLabel}>
                {agentState.agentStatus === 'online'
                  ? i18n.t('(agent).home.online')
                  : i18n.t('(agent).home.offline')}
              </Text>
              <Switch
                value={agentState.agentStatus === 'online'}
                onValueChange={handleToggleOnline}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.3)' }}
                thumbColor={agentState.agentStatus === 'online' ? '#4ADE80' : Colors.light[10]}
                disabled={agentState.kycStatus !== 'verified'}
              />
            </View>
          )}
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
            <Text style={styles.statValue}>{stats.completedDeliveries}</Text>
            <Text style={styles.statLabel}>
              {i18n.t('(agent).home.completedDeliveries')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>
              {i18n.t('(agent).home.pendingOrders')}
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
            backgroundColor: agentState.kycStatus === 'rejected' ? Colors.error + '20' : Colors.gold + '20',
            borderRadius: 12, 
            padding: 16, 
            marginBottom: 16,
            borderWidth: 1,
            borderColor: agentState.kycStatus === 'rejected' ? Colors.error : Colors.gold,
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
                onPress={() => router.push('/(agent)/(kyc)')}
                buttonColor={Colors.primary[500]}
                style={{ borderRadius: 8 }}>
                {i18n.t('(agent).kyc.title')}
              </Button>
            )}
            {agentState.kycStatus === 'pending' && agentState.isDemoMode && (
              <Text style={{ fontSize: 12, color: Colors.grey['61'], fontStyle: 'italic', marginTop: 8 }}>
                Demo Mode: KYC auto-approves after 3 seconds
              </Text>
            )}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {agentState.agentStatus === 'online'
              ? i18n.t('(agent).orders.title')
              : i18n.t('(agent).home.offline')}
          </Text>
          <Text style={{ color: Colors.grey['61'], fontSize: 14 }}>
            {orders.length} {i18n.t('(agent).orders.order')}
            {orders.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon source="package-variant" size={40} color={Colors.grey['61']} />
            </View>
            <Text style={styles.emptyTitle}>
              {i18n.t('(agent).orders.noOrdersAvailable')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {agentState.agentStatus === 'online'
                ? 'New orders will appear here when customers request delivery'
                : agentState.kycStatus !== 'verified'
                ? 'Complete your KYC verification to start accepting orders'
                : 'Go online to start receiving orders'}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => (
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
                    style={[styles.acceptButton, { opacity: agentState.kycStatus === 'verified' ? 1 : 0.5 }]}
                    onPress={() => {
                      if (agentState.kycStatus !== 'verified') {
                        Alert.alert('KYC Required', 'Please complete your KYC verification first.');
                        return;
                      }
                      if (agentState.agentStatus !== 'online') {
                        Alert.alert('Go Online', 'Please go online to accept orders.');
                        return;
                      }
                      handleAcceptOrder(order);
                    }}>
                    <Text style={styles.acceptButtonText}>
                      {i18n.t('(agent).orders.acceptOrder')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
          <Button
            mode="outlined"
            onPress={handleResetData}
            style={{ borderColor: Colors.grey['bd'], borderWidth: 1 }}
            textColor={Colors.grey['61']}>
            Reset Demo Data
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

export default AgentHomeScreen;
