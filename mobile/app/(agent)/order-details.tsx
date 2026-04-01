import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Text, Button, Icon, Snackbar } from 'react-native-paper';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { agentOrderDetailsStyles as styles, defaultStyles } from '@/styles';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { mockDataStore, AgentOrder } from '@/data/mock-orders';
import { agentDemoState } from '@/contexts/AgentContext';
import { Context, type ContextType } from '@/app/_layout';
import {
  ordersConfirmDeliveryMutation,
  ordersDispatchOrderMutation,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { useAppRating } from '@/hooks/useAppRating';

const AgentOrderDetails = () => {
  const insets = useSafeAreaInsets();
  const { user } = useContext(Context) as ContextType;
  const params = useLocalSearchParams();
  const [isDemo, setIsDemo] = useState(false);
  const [order, setOrder] = useState<AgentOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSecurityCodeModal, setShowSecurityCodeModal] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [orderNotFound, setOrderNotFound] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const userId = user?.userId ?? '';
  const { requestReview } = useAppRating();

  useEffect(() => {
    const checkDemoMode = () => {
      const state = agentDemoState.getState();
      setIsDemo(state.isDemoMode && state.isLoggedIn);
    };
    checkDemoMode();
    const unsubscribe = agentDemoState.subscribe(checkDemoMode);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const orderId = (params.orderId as string) ?? '';
    if (!orderId) return;

    if (isDemo) {
      const foundOrder = mockDataStore.getOrderById(orderId);
      if (foundOrder) {
        setOrder(foundOrder);
        setOrderNotFound(false);
      } else {
        setOrder(null);
        setOrderNotFound(true);
      }
      return;
    }

    if (!userId) {
      setOrder(null);
      setOrderNotFound(true);
      return;
    }

    setLoading(true);
    setOrderNotFound(false);

    void (async () => {
      try {
        const { getAgentOrderDetailsFromBackend } =
          await import('@/data/agent-orders-backend');
        const details = await getAgentOrderDetailsFromBackend({
          userId,
          orderNumber: orderId,
        });
        if (!details) {
          setOrder(null);
          setOrderNotFound(true);
          return;
        }
        setOrder(details);
      } catch (_e) {
        setOrder(null);
        setOrderNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [isDemo, params.orderId, userId]);

  const { mutateAsync: acceptOrder } = useMutation({
    ...ordersDispatchOrderMutation(),
    onSuccess: () => {
      if (order) {
        setOrder({ ...order, status: 'picked_up' });
      }
      Alert.alert(i18n.t('(agent).orders.orderAccepted'));
    },
    onError: error => {
      setSnackbarMessage(
        (error?.response?.data as { message?: string })?.message ??
          i18n.t('(auth).login.anUnknownError'),
      );
      setSnackbarVisible(true);
    },
  });

  const { mutateAsync: confirmDelivery } = useMutation({
    ...ordersConfirmDeliveryMutation(),
    onSuccess: () => {
      if (order) {
        setOrder({ ...order, status: 'delivered' });
      }
      Alert.alert(i18n.t('(agent).orders.deliverySuccess'));
      void requestReview();
    },
    onError: error => {
      const errorMessage =
        (error?.response?.data as { message?: string })?.message ??
        error?.message ??
        '';
      if (errorMessage.toLowerCase().includes('no rows in result set')) {
        setSnackbarMessage(i18n.t('(agent).orders.incorrectCode'));
      } else if (!!errorMessage) {
        setSnackbarMessage(errorMessage);
      } else {
        setSnackbarMessage(i18n.t('(auth).login.anUnknownError'));
      }
      setSnackbarVisible(true);
      setEnteredCode('');
    },
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return i18n.t('(agent).orders.statusPending');
      case 'assigned':
        return i18n.t('(agent).orders.statusAssigned');
      case 'picked_up':
        return i18n.t('(agent).orders.statusPickedUp');
      case 'delivered':
        return i18n.t('(agent).orders.statusDelivered');
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return Colors.gold;
      case 'assigned':
        return Colors.primary[500];
      case 'picked_up':
        return Colors.blue;
      case 'delivered':
        return Colors.success;
      default:
        return Colors.grey['61'];
    }
  };

  const handleAcceptOrder = () => {
    if (!order) return;

    Alert.alert(
      i18n.t('(agent).orders.acceptOrderTitle'),
      i18n.t('(agent).orders.acceptOrderMessage', {
        orderNumber: order.orderNumber,
      }),
      [
        { text: i18n.t('(agent).orders.cancel'), style: 'cancel' },
        {
          text: i18n.t('(agent).orders.accept'),
          onPress: () => {
            if (isDemo) {
              mockDataStore.acceptOrder(order.id);
              setOrder({ ...order, status: 'picked_up' });
              Alert.alert(
                i18n.t('common.success'),
                i18n.t('(agent).orders.orderAccepted'),
              );
              return;
            }

            if (!userId) {
              setSnackbarMessage(i18n.t('(auth).login.anUnknownError'));
              setSnackbarVisible(true);
              return;
            }

            acceptOrder({
              body: {
                agentId: userId,
              },
              path: {
                orderNumber: String(order.orderNumber),
                userId,
              },
            });
          },
        },
      ],
    );
  };

  const handleConfirmDelivery = () => {
    setShowSecurityCodeModal(true);
    setEnteredCode('');
  };

  const handleSubmitSecurityCode = () => {
    if (!order) return;

    const secretKey = enteredCode.trim().toUpperCase();

    if (secretKey.length !== 6) {
      setSnackbarMessage(i18n.t('(agent).orders.invalidCodeLength'));
      setSnackbarVisible(true);
      return;
    }

    if (isDemo) {
      if (secretKey !== order.securityCode.toUpperCase()) {
        setSnackbarMessage(i18n.t('(agent).orders.incorrectCode'));
        setSnackbarVisible(true);
        setEnteredCode('');
        return;
      }
      mockDataStore.confirmDelivery(order.id);
      setOrder({ ...order, status: 'delivered' });
      Alert.alert(
        i18n.t('(agent).orders.deliverySuccess'),
        i18n.t('(agent).orders.deliveryEarningsMessage', {
          currency: i18n.t('common.currency'),
          amount: order.deliveryFee.toLocaleString(),
        }),
      );
      return;
    }

    if (!userId) {
      setSnackbarMessage(i18n.t('(auth).login.anUnknownError'));
      setSnackbarVisible(true);
      return;
    }

    setShowSecurityCodeModal(false);
    confirmDelivery({
      body: {},
      path: { secretKey, userId },
    });
  };

  const handleCallFarmer = () => {
    if (!order) return;
    Linking.openURL(`tel:${order.farmerPhone}`);
  };

  const handleCallCustomer = () => {
    if (!order) return;
    Linking.openURL(`tel:${order.customerPhone}`);
  };

  const handleNavigateToPickup = () => {
    if (!order) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${order.pickupLocation.lat},${order.pickupLocation.lng}`;
    Linking.openURL(url);
  };

  const handleNavigateToDelivery = () => {
    if (!order) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`;
    Linking.openURL(url);
  };

  const renderActionButton = () => {
    if (!order) return null;

    switch (order.status) {
      case 'available':
        return (
          <Button
            mode="contained"
            onPress={handleAcceptOrder}
            style={defaultStyles.button}
            buttonColor={loading ? Colors.grey['bg'] : Colors.primary[500]}
            loading={loading}
            disabled={loading}>
            {i18n.t('(agent).orders.acceptOrder')}
          </Button>
        );
      case 'assigned':
        return (
          <Button
            mode="contained"
            onPress={handleConfirmDelivery}
            buttonColor={Colors.primary[500]}
            style={defaultStyles.button}
            loading={loading}
            disabled={loading}>
            {i18n.t('(agent).orders.confirmDelivery')}
          </Button>
        );
      case 'picked_up':
        return (
          <Button
            mode="contained"
            onPress={handleConfirmDelivery}
            buttonColor={Colors.primary[500]}
            style={defaultStyles.button}
            loading={loading}
            disabled={loading}>
            {i18n.t('(agent).orders.confirmDelivery')}
          </Button>
        );
      case 'delivered':
        return null;
      default:
        return null;
    }
  };

  if (orderNotFound) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Icon
          source="package-variant-closed"
          size={64}
          color={Colors.grey['61']}
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            marginTop: 16,
            color: Colors.dark[10],
          }}>
          {i18n.t('(agent).orders.orderNotFoundTitle')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: Colors.grey['61'],
            marginTop: 8,
            textAlign: 'center',
            paddingHorizontal: 32,
          }}>
          {i18n.t('(agent).orders.orderNotFoundMessage')}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={{ marginTop: 24 }}>
          {i18n.t('common.goBack')}
        </Button>
      </View>
    );
  }

  if (!order) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text>{i18n.t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}>
            <Icon source="arrow-left" size={22} color={Colors.light[10]} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {i18n.t('(agent).orders.orderDetails')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {i18n.t('(agent).orders.order')} #{order.orderNumber}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderLabel}>
              {i18n.t('(agent).orders.status')}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + '20' },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderLabel}>
              {i18n.t('(agent).orders.yourEarning')}
            </Text>
            <Text style={styles.deliveryFee}>
              {i18n.t('common.currency')} {order.deliveryFee.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('(agent).orders.items')}
          </Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Icon source="circle-small" size={20} color={Colors.grey['61']} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>

        {order.status !== 'delivered' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {i18n.t('(agent).orders.pickupLocation')}
              </Text>
              <View style={styles.locationCard}>
                <View style={styles.locationIcon}>
                  <Icon source="store" size={20} color={Colors.primary[500]} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>
                    {i18n.t('(agent).orders.farmer')}: {order.farmerName}
                  </Text>
                  <Text style={styles.locationAddress}>
                    {order.pickupAddress}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[
                    defaultStyles.button,
                    styles.buttonSecondary,
                    { flex: 1 },
                  ]}
                  onPress={handleNavigateToPickup}>
                  <View style={defaultStyles.innerButtonContainer}>
                    <Icon
                      source="navigation"
                      size={20}
                      color={Colors.dark[0]}
                    />
                    <Text
                      style={[styles.buttonText, styles.buttonSecondaryText]}>
                      {i18n.t('(agent).orders.navigate')}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    defaultStyles.button,
                    { backgroundColor: Colors.primary[500], flex: 1 },
                  ]}
                  onPress={handleCallFarmer}>
                  <View style={defaultStyles.innerButtonContainer}>
                    <Icon source="phone" size={20} color={Colors.light[10]} />
                    <Text style={styles.buttonText}>
                      {i18n.t('(agent).orders.call')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {i18n.t('(agent).orders.deliveryLocation')}
              </Text>
              <View style={styles.locationCard}>
                <View
                  style={[
                    styles.locationIcon,
                    { backgroundColor: Colors.success + '20' },
                  ]}>
                  <Icon source="home" size={20} color={Colors.success} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>
                    {i18n.t('(agent).orders.customer')}: {order.customerName}
                  </Text>
                  <Text style={styles.locationAddress}>
                    {order.deliveryAddress}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[
                    defaultStyles.button,
                    styles.buttonSecondary,
                    { flex: 1 },
                  ]}
                  onPress={handleNavigateToDelivery}>
                  <View style={defaultStyles.innerButtonContainer}>
                    <Icon
                      source="navigation"
                      size={20}
                      color={Colors.dark[0]}
                    />
                    <Text
                      style={[styles.buttonText, styles.buttonSecondaryText]}>
                      {i18n.t('(agent).orders.navigate')}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    defaultStyles.button,
                    { backgroundColor: Colors.primary[500], flex: 1 },
                  ]}
                  onPress={handleCallCustomer}>
                  <View style={defaultStyles.innerButtonContainer}>
                    <Icon source="phone" size={20} color={Colors.light[10]} />
                    <Text style={styles.buttonText}>
                      {i18n.t('(agent).orders.call')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {isDemo && order.status !== 'delivered' && (
          <View style={styles.securityCodeSection}>
            <Text style={styles.securityCodeLabel}>
              {i18n.t('(agent).orders.demoSecurityCodeLabel')}
            </Text>
            <Text
              style={[
                styles.securityCodeHint,
                { fontSize: 13, lineHeight: 26 },
              ]}>
              {i18n.t('(agent).orders.demoSecurityCodeHint')}
            </Text>
            <Text
              style={[styles.securityCode, { lineHeight: 48, marginTop: 10 }]}>
              {order.securityCode}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={defaultStyles.bottomButtonContainer}>
        {renderActionButton()}
      </View>

      <Modal
        visible={showSecurityCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSecurityCodeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowSecurityCodeModal(false)}>
              <Icon source="close" size={24} color={Colors.dark[10]} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {i18n.t('(agent).orders.confirmDelivery')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {i18n.t('(agent).orders.enterSecurityCode')}
            </Text>

            <TextInput
              style={styles.codeInput}
              value={enteredCode}
              onChangeText={setEnteredCode}
              keyboardType="default"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              placeholder="------"
              placeholderTextColor={Colors.grey['61']}
              textAlign="center"
              autoFocus
            />

            <Text style={styles.codeHint}>
              {i18n.t('(agent).orders.askCustomerForCode')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  defaultStyles.button,
                  defaultStyles.secondaryButton,
                  { flex: 1 },
                ]}
                onPress={() => setShowSecurityCodeModal(false)}>
                <Text
                  style={[
                    defaultStyles.buttonText,
                    defaultStyles.secondaryButtonText,
                  ]}>
                  {i18n.t('(agent).orders.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  defaultStyles.button,
                  defaultStyles.primaryButton,
                  { flex: 1 },
                ]}
                onPress={handleSubmitSecurityCode}>
                <Text style={defaultStyles.buttonText}>
                  {i18n.t('(agent).orders.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{snackbarMessage}</Text>
      </Snackbar>
    </View>
  );
};

export default AgentOrderDetails;
