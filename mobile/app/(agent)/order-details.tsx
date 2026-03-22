import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  Linking,
} from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { agentOrderDetailsStyles as styles, defaultStyles } from '@/styles';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { mockDataStore, AgentOrder } from '@/data/mock-orders';

const AgentOrderDetails = () => {
  const params = useLocalSearchParams();
  const [order, setOrder] = useState<AgentOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSecurityCodeModal, setShowSecurityCodeModal] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [orderNotFound, setOrderNotFound] = useState(false);

  useEffect(() => {
    const orderId = params.orderId as string;
    if (orderId) {
      const foundOrder = mockDataStore.getOrderById(orderId);
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setOrderNotFound(true);
      }
    }
  }, [params.orderId]);

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
      'Accept Order',
      `Do you want to accept delivery of order #${order.orderNumber}?`,
      [
        { text: i18n.t('(agent).orders.cancel'), style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            mockDataStore.acceptOrder(order.id);
            setOrder({ ...order, status: 'assigned' });
            Alert.alert('Success', i18n.t('(agent).orders.orderAccepted'));
          },
        },
      ]
    );
  };

  const handlePickUp = () => {
    if (!order) return;
    
    Alert.alert(
      i18n.t('(agent).orders.confirmPickup'),
      `Mark order #${order.orderNumber} as picked up from ${order.farmerName}?`,
      [
        { text: i18n.t('(agent).orders.cancel'), style: 'cancel' },
        {
          text: i18n.t('(agent).orders.confirm'),
          onPress: () => {
            mockDataStore.confirmPickup(order.id);
            setOrder({ ...order, status: 'picked_up' });
            Alert.alert('Success', i18n.t('(agent).orders.pickupSuccess'));
          },
        },
      ]
    );
  };

  const handleConfirmDelivery = () => {
    setShowSecurityCodeModal(true);
    setEnteredCode('');
  };

  const handleSubmitSecurityCode = () => {
    if (!order) return;

    if (enteredCode.length !== 4) {
      Alert.alert(i18n.t('common.error'), i18n.t('(agent).orders.invalidCodeLength'));
      return;
    }

    if (enteredCode !== order.securityCode) {
      Alert.alert(i18n.t('common.error'), i18n.t('(agent).orders.incorrectCode'));
      setEnteredCode('');
      return;
    }

    setShowSecurityCodeModal(false);
    setLoading(true);
    
    setTimeout(() => {
      mockDataStore.confirmDelivery(order.id);
      setOrder({ ...order, status: 'delivered' });
      setLoading(false);
      Alert.alert(
        i18n.t('(agent).orders.deliverySuccess'),
        `${i18n.t('(agent).orders.paymentWillBeProcessed')}\n\n+${i18n.t('common.currency')} ${order.deliveryFee.toLocaleString()} earned!`
      );
    }, 500);
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
            style={[defaultStyles.button, { backgroundColor: Colors.primary[500] }]}
            loading={loading}
            disabled={loading}>
            {i18n.t('(agent).orders.acceptOrder')}
          </Button>
        );
      case 'assigned':
        return (
          <Button
            mode="contained"
            onPress={handlePickUp}
            style={[defaultStyles.button, { backgroundColor: Colors.primary[500] }]}
            loading={loading}
            disabled={loading}>
            {i18n.t('(agent).orders.confirmPickup')}
          </Button>
        );
      case 'picked_up':
        return (
          <Button
            mode="contained"
            onPress={handleConfirmDelivery}
            style={[defaultStyles.button, { backgroundColor: Colors.success }]}
            loading={loading}
            disabled={loading}>
            {i18n.t('(agent).orders.confirmDelivery')}
          </Button>
        );
      case 'delivered':
        return (
          <View style={[defaultStyles.button, { backgroundColor: Colors.success, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
            <Icon source="check-circle" size={24} color={Colors.light[10]} />
            <Text style={{ color: Colors.light[10], fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
              {i18n.t('(agent).orders.deliveryCompleted')}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (orderNotFound) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Icon source="package-variant-closed" size={64} color={Colors.grey['61']} />
        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 16, color: Colors.dark[10] }}>
          Order Not Found
        </Text>
        <Text style={{ fontSize: 14, color: Colors.grey['61'], marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
          The order you&apos;re looking for doesn&apos;t exist or has been removed.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={{ marginTop: 24 }}>
          Go Back
        </Button>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Icon source="arrow-left" size={24} color={Colors.light[10]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {i18n.t('(agent).orders.orderDetails')}
        </Text>
        <Text style={styles.headerSubtitle}>
          {i18n.t('(agent).orders.order')} #{order.orderNumber}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderLabel}>{i18n.t('(agent).orders.status')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderLabel}>{i18n.t('(agent).orders.yourEarning')}</Text>
            <Text style={styles.deliveryFee}>
              {i18n.t('common.currency')} {order.deliveryFee.toLocaleString()}
            </Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderLabel}>{i18n.t('(agent).orders.totalAmount')}</Text>
            <Text style={styles.orderValue}>
              {i18n.t('common.currency')} {order.totalAmount.toLocaleString()}
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
              <Text style={styles.locationAddress}>{order.pickupAddress}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[defaultStyles.button, styles.buttonSecondary, { flex: 1 }]}
              onPress={handleNavigateToPickup}>
              <Icon source="navigation" size={20} color={Colors.dark[0]} />
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                {i18n.t('(agent).orders.navigate')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[defaultStyles.button, { backgroundColor: Colors.success, flex: 1 }]}
              onPress={handleCallFarmer}>
              <Icon source="phone" size={20} color={Colors.light[10]} />
              <Text style={[styles.buttonText]}>
                {i18n.t('(agent).orders.call')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('(agent).orders.deliveryLocation')}
          </Text>
          <View style={styles.locationCard}>
            <View style={[styles.locationIcon, { backgroundColor: Colors.success + '20' }]}>
              <Icon source="home" size={20} color={Colors.success} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>
                {i18n.t('(agent).orders.customer')}: {order.customerName}
              </Text>
              <Text style={styles.locationAddress}>{order.deliveryAddress}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[defaultStyles.button, styles.buttonSecondary, { flex: 1 }]}
              onPress={handleNavigateToDelivery}>
              <Icon source="navigation" size={20} color={Colors.dark[0]} />
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                {i18n.t('(agent).orders.navigate')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[defaultStyles.button, { backgroundColor: '#25D366', flex: 1 }]}
              onPress={handleCallCustomer}>
              <Icon source="phone" size={20} color={Colors.light[10]} />
              <Text style={[styles.buttonText]}>
                {i18n.t('(agent).orders.call')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {order.status !== 'delivered' && (
          <View style={styles.securityCodeSection}>
            <Text style={styles.securityCodeLabel}>
              {i18n.t('(agent).orders.securityCodeLabel')}
            </Text>
            <Text style={styles.securityCode}>{order.securityCode}</Text>
            <Text style={{ fontSize: 12, color: Colors.grey['61'], marginTop: 8 }}>
              {i18n.t('(agent).orders.securityCodeHint')}
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
              keyboardType="number-pad"
              maxLength={4}
              placeholder="----"
              placeholderTextColor={Colors.grey['61']}
              textAlign="center"
              autoFocus
            />

            <Text style={styles.codeHint}>
              {i18n.t('(agent).orders.askCustomerForCode')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[defaultStyles.button, styles.cancelButton]}
                onPress={() => setShowSecurityCodeModal(false)}>
                <Text style={styles.cancelButtonText}>
                  {i18n.t('(agent).orders.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[defaultStyles.button, { backgroundColor: Colors.success }]}
                onPress={handleSubmitSecurityCode}>
                <Text style={[styles.buttonText]}>
                  {i18n.t('(agent).orders.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AgentOrderDetails;
