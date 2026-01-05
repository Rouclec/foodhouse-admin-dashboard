import { SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { defaultStyles, customPackageStyles as styles } from '@/styles';
import { Text, Button, Icon, Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';
import i18n from '@/i18n';

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
          {i18n.t('(subscription).(customPackage).header')}
        </Text>
        <View style={{ width: 64 }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text variant="titleMedium" style={styles.headerCardTitle}>
            {i18n.t('(subscription).(customPackage).title')}
          </Text>
          <Text style={styles.headerCardSubtitle}>
            {i18n.t('(subscription).(customPackage).subtitle')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('(subscription).(customPackage).monthlyBudget')}</Text>
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
          <Text style={styles.sectionTitle}>{i18n.t('(subscription).(customPackage).deliveriesPerMonth')}</Text>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setDeliveries(Math.max(1, deliveries - 1))}>
              <Icon source="minus" size={20} color={Colors.grey[61]} />
            </TouchableOpacity>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{deliveries}</Text>
              <Text style={styles.valueSubtext}>
                {deliveries === 1 ? i18n.t('(subscription).(customPackage).delivery') : i18n.t('(subscription).(customPackage).deliveries')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.controlButtonGreen}
              onPress={() => setDeliveries(deliveries + 1)}>
              <Icon source="plus" size={20} color={Colors.light[10]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{i18n.t('(subscription).(customPackage).totalBudget')}</Text>
            <Text style={styles.summaryValue}>
              {totalBudget.toLocaleString()} XAF
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{i18n.t('(subscription).(customPackage).deliveries')}</Text>
            <Text style={styles.summaryValue}>{deliveries}x per month</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{i18n.t('(subscription).(customPackage).discount')}</Text>
            <Text style={styles.summaryValue}>10% off</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{i18n.t('(subscription).(customPackage).total')}</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} XAF</Text>
          </View>
        </View>
      </ScrollView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          style={[defaultStyles.button, defaultStyles.primaryButton]}
          contentStyle={[defaultStyles.center]}
          onPress={() => {
            router.push({
              pathname: '/(payment)/select-products',
              params: {
                budget: monthlyBudget.toString(),
                deliveries: deliveries.toString(),
              },
            });
          }}>
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
            {i18n.t('(subscription).(customPackage).continueToProducts')}
          </Text>
        </Button>
      </View>
    </View>
  );
}
