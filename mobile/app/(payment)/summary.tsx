import { SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { defaultStyles, summaryStyles as styles } from '@/styles';
import { Text, Button, Icon, Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';

export default function Summary() {
  const router = useRouter();

  const deliveries = [
    {
      id: 1,
      items: [{ name: 'Irish Potatoes', unit: '14x Kg Bag', price: 37500 }],
      total: 37500,
    },
    {
      id: 2,
      items: [{ name: 'Irish Potatoes', unit: '14x Kg Bag', price: 37500 }],
      total: 37500,
    },
  ];

  const amount = 75000;
  const discount = 7500;
  const total = 67500;

  return (
    <View style={defaultStyles.flex}>
      <Appbar.Header style={styles.appHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={defaultStyles.backButtonContainer}>
          <Icon source={'arrow-left'} size={24} color={Colors.dark[0]} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>
          Summary
        </Text>
        <View style={{ width: 64 }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.packageCard}>
          <Text style={styles.packageTitle}>Custom Package</Text>
          <View style={styles.packageDetails}>
            <Text style={styles.packageDetailText}>30 Items</Text>
            <View style={styles.packageDivider} />
            <Icon source="truck-delivery" size={16} color={Colors.light[10]} />
            <Text style={styles.packageDetailText}>2 Deliveries</Text>
          </View>
        </View>

        {deliveries.map(delivery => (
          <View key={delivery.id} style={styles.deliverySection}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryTitle}>Delivery {delivery.id}</Text>
              <Text style={styles.deliveryTotal}>
                {delivery.total.toLocaleString()} XAF
              </Text>
            </View>
            {delivery.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemUnit}>{item.unit}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {item.price.toLocaleString()} XAF
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Payment Summary</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount</Text>
            <Text style={styles.paymentValue}>
              {amount.toLocaleString()} XAF
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Delivery</Text>
            <Text style={styles.paymentValueFree}>Free</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Discount (10%)</Text>
            <Text style={styles.paymentValueDiscount}>
              -{discount.toLocaleString()} XAF
            </Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} XAF</Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.footer}>
        <Button
          mode="contained"
          style={[defaultStyles.button, defaultStyles.primaryButton]}
          contentStyle={[defaultStyles.center]}
          onPress={() => {}}>
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
            Confirm Payment
          </Text>
        </Button>
      </SafeAreaView>
    </View>
  );
}
