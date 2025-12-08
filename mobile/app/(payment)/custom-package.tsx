import { SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { defaultStyles, customPackageStyles as styles } from '@/styles';
import { Text, Button, Icon, Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';

export default function CustomPackage() {
  const [monthlyBudget, setMonthlyBudget] = useState(75000);
  const [deliveries, setDeliveries] = useState(2);
  const router = useRouter();

  const pricePerDelivery = 37500;
  const totalBudget = monthlyBudget;
  const discount = monthlyBudget * 0.1;
  const total = totalBudget - discount;

  return (
    <View style={defaultStyles.flex}>
      <Appbar.Header style={styles.appHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={defaultStyles.backButtonContainer}>
          <Icon source={'arrow-left'} size={24} color={Colors.dark[0]} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>
          Build Custom Package
        </Text>
        <View style={{ width: 64 }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text variant="titleMedium" style={styles.headerCardTitle}>
            Build Your Custom Package
          </Text>
          <Text style={styles.headerCardSubtitle}>
            Set your budget and deliveries to get started with personalized
            shopping
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Budget</Text>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() =>
                setMonthlyBudget(Math.max(0, monthlyBudget - 5000))
              }>
              <Icon source="minus" size={20} color={Colors.grey[61]} />
            </TouchableOpacity>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>
                {monthlyBudget.toLocaleString()}
              </Text>
              <Text style={styles.valueSubtext}>XAF</Text>
            </View>
            <TouchableOpacity
              style={styles.controlButtonGreen}
              onPress={() => setMonthlyBudget(monthlyBudget + 5000)}>
              <Icon source="plus" size={20} color={Colors.light[10]} />
            </TouchableOpacity>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${(monthlyBudget / 200000) * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deliveries Per Month</Text>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setDeliveries(Math.max(1, deliveries - 1))}>
              <Icon source="minus" size={20} color={Colors.grey[61]} />
            </TouchableOpacity>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{deliveries}</Text>
              <Text style={styles.valueSubtext}>
                {deliveries === 1 ? 'Delivery' : 'Deliveries'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.controlButtonGreen}
              onPress={() => setDeliveries(deliveries + 1)}>
              <Icon source="plus" size={20} color={Colors.light[10]} />
            </TouchableOpacity>
          </View>
          <View style={styles.pricePerDelivery}>
            <Text style={styles.pricePerDeliveryText}>
              {pricePerDelivery.toLocaleString()} XAF per delivery
            </Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={styles.summaryValue}>
              {totalBudget.toLocaleString()} XAF
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Deliveries</Text>
            <Text style={styles.summaryValue}>{deliveries}x per month</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryValue}>10% off</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
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
          onPress={() => router.push('/(payment)/select-products')}>
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
            Continue to Products
          </Text>
        </Button>
      </SafeAreaView>
    </View>
  );
}
