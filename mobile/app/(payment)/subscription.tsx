import { KeyboardAvoidingView, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { defaultStyles, selectionSubscriptionStyles as styles } from '@/styles';
import { Image } from 'expo-image';
import { Text, Button, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';

type Plan = {
  id: string;
  badge: string;
  name: string;
  categories: number;
  freeDelivery: boolean;
  price: string;
  pricePerMonth: string;
};

const plans: Plan[] = [
  {
    id: 'household',
    badge: '10% off',
    name: 'Household Tier',
    categories: 4,
    freeDelivery: true,
    price: '30,000',
    pricePerMonth: '30,000',
  },
  {
    id: 'small',
    badge: '10% off',
    name: 'Small Business Tier',
    categories: 8,
    freeDelivery: true,
    price: '70,000',
    pricePerMonth: '70,000',
  },
  {
    id: 'medium',
    badge: '10% off',
    name: 'Medium Business Tier',
    categories: 12,
    freeDelivery: true,
    price: '180,000',
    pricePerMonth: '180,000',
  },
  {
    id: 'corporate',
    badge: '10% off',
    name: 'Corporate Tier',
    categories: 0,
    freeDelivery: true,
    price: '0',
    pricePerMonth: '0',
  },
];

export default function Subscriptions() {
  const [selectedPlan, setSelectedPlan] = useState<string>('household');
  const router = useRouter();

  return (
    <View style={defaultStyles.flex}>
      {/* <View style={styles.header}> */}
        
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text variant="titleMedium"  style={styles.headerTitle}>
                Let FoodHouse do the shopping & delivery for you!
              </Text>
              <Text style={styles.headerSubtitle}>
                Pick a package that fits your needs and get fresh produce delivered straight to your door- fast, easy and hassle-free
              </Text>
            </View>
            <Image
              source={require('@/assets/images/subscription.png')}
              style={styles.headerImage}
              contentFit="cover"
            />
          </View>
       
      {/* </View> */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
          <View style={styles.customizeCard}>
            <View style={styles.customizeContent}>
                <View style={styles.iconContainer}>
                    <Icon source="shopping-outline" size={28} color={Colors.light[10]} />
                </View>
              
              <View style={styles.customizeTextContainer}>
                <Text  variant="titleMedium" style={styles.customizeTitle}>
                  Customize Your Package
                </Text>
                <Text style={styles.customizeSubtitle}>
                  Pick your own products, set your budget, and choose when you'd like your deliveries. It's your call!
                </Text>
              </View>
            </View>
            <Button
              mode="contained"
              style={styles.customizeButton}
              labelStyle={styles.customizeButtonLabel}
              onPress={() => router.push('/(payment)/custom-package')}>
              Start Customizing 
            </Button>
          </View>

          <View style={styles.plansSection}>
            <Text variant="titleMedium" style={styles.plansTitle}>Choose Your Plan</Text>
            <Text style={styles.plansSubtitle}>
              Pick a ready-made package based on your needs
            </Text>

            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => setSelectedPlan(plan.id)}>
                <View style={styles.planHeader}>
                  <View style={styles.planHeaderLeft}>
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                    <Text style={styles.planDuration}>10 Days Delivery</Text>
                  </View>
                  <Icon source="chevron-right" size={24} color={Colors.primary[500]} />
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planDetailsRow}>
                  <View style={styles.planDetailItem}>
                    <Icon source="check" size={24} color={Colors.primary[500]} />
                    <Text style={styles.planDetailText}>{plan.categories} categories</Text>
                  </View>
                  <Text style={styles.planPrice}>{plan.price} XAF</Text>
                </View>
                <View style={styles.planDetailsRow}>
                  <View style={styles.planDetailItem}>
                    <Icon source="truck-delivery-outline" size={24} color={Colors.primary[500]} />
                    <Text style={styles.planDetailText}>1 free delivery</Text>
                  </View>
                  <Text style={styles.planPricePerMonth}>{plan.pricePerMonth} XAF</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
        </ScrollView>

       
    </View>
  );
}
