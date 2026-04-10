import React, { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageSourcePropType,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, Button, Icon, Text } from 'react-native-paper';
import { Colors } from '@/constants';
import { defaultStyles, selectionSubscriptionStyles } from '@/styles';
import { ordersgrpcPaymentMethodType } from '@/client/orders.swagger';
import { KeyboardAvoidingView } from 'react-native';
import i18n from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { ordersGetAvailablePaymentMethodsOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';

const PaymentMethodsPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] =
    useState<ordersgrpcPaymentMethodType>();

  const { data: availableMethodsData } = useQuery({
    ...ordersGetAvailablePaymentMethodsOptions({}),
  });

  const availableMethods = useMemo(() => {
    return availableMethodsData?.availableMethods ?? [];
  }, [availableMethodsData]);

  const isMethodAvailable = (methodId: string): boolean => {
    return availableMethods.includes(methodId as ordersgrpcPaymentMethodType);
  };

  const paymentMethods: Array<{
    id: ordersgrpcPaymentMethodType;
    name: string;
    icon: ImageSourcePropType;
  }> = [
    {
      id: 'PaymentMethodType_MOBILE_MONEY',
      name: 'MTN Mobile Money',
      icon: require('@/assets/images/icons/momo.png'),
    },
    {
      id: 'PaymentMethodType_ORANGE_MONEY',
      name: 'Orange Money',
      icon: require('@/assets/images/icons/orangeMoney.png'),
    },
  ];

  const handleMethodPress = (methodId: ordersgrpcPaymentMethodType) => {
    if (!isMethodAvailable(methodId)) {
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('(subscription).(paymentMethods).methodUnavailable'),
      );
      return;
    }
    setSelectedMethod(methodId);
  };

  const handleNext = () => {
    if (selectedMethod && isMethodAvailable(selectedMethod)) {
      router.push({
        pathname: '/(payment)/payment-account',
        params: {
          ...params,
          paymentMethod: selectedMethod,
        },
      });
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(subscription).(paymentMethods).header')}
            </Text>
            <View />
          </Appbar.Header>

          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <Text>{i18n.t('(subscription).(paymentMethods).description')}</Text>

            <View style={selectionSubscriptionStyles.plansContainer}>
              {paymentMethods.map(method => {
                const available = isMethodAvailable(method.id);
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      selectionSubscriptionStyles.planCard,
                      selectionSubscriptionStyles.methodCard,
                      !available && styles.unavailableCard,
                    ]}
                    onPress={() => handleMethodPress(method.id)}
                    activeOpacity={0.7}>
                    <View style={selectionSubscriptionStyles.flexRow}>
                      <View style={styles.iconContainer}>
                        <Image
                          source={method.icon}
                          style={selectionSubscriptionStyles.methodIcon}
                        />
                        {/* {!available && <View style={styles.blurOverlay} />} */}
                      </View>
                      <Text style={selectionSubscriptionStyles.methodName}>
                        {method.name}
                      </Text>
                      <View style={selectionSubscriptionStyles.planSelector}>
                        <View
                          style={[selectionSubscriptionStyles.selectionCircle]}>
                          {selectedMethod === method.id && (
                            <View
                              style={selectionSubscriptionStyles.innerCircle}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                    {!available && (
                      <Text style={styles.unavailableText}>
                        {i18n.t('(subscription).(paymentMethods).unavailable')}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={handleNext}
          textColor={Colors.light['10']}
          buttonColor={Colors.primary['500']}
          style={defaultStyles.button}
          disabled={!selectedMethod || !isMethodAvailable(selectedMethod)}>
          {i18n.t('(subscription).(paymentMethods).next')}
        </Button>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  unavailableCard: {
    opacity: 0.6,
  },
  iconContainer: {
    position: 'relative',
  },
  unavailableIcon: {},
  unavailableImage: {
    opacity: 0.5,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  unavailableText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
});

export default PaymentMethodsPage;
