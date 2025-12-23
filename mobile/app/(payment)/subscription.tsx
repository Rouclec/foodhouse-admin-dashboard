import { KeyboardAvoidingView, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import React, { useContext, useState } from 'react';
import { defaultStyles, selectionSubscriptionStyles as styles } from '@/styles';
import { Image } from 'expo-image';
import { Text, Button, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { ordersListSubscriptionPlansOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { ordersgrpcSubscription } from '@/client/orders.swagger';
import { Context, ContextType } from '@/app/_layout';
import { Chase } from 'react-native-animated-spinkit';

export default function Subscriptions() {
  const [selectedPlan, setSelectedPlan] = useState<string>();
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;

  const {
    data: subscriptionPlansData,
    isLoading: isSubscriptionPlansLoading,
  } = useQuery({
    ...ordersListSubscriptionPlansOptions({
      path: {
        adminUserId: user?.userId ?? '',
      },
    }),
  });

  const plans = subscriptionPlansData?.subscriptionPlans || [];

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

            {isSubscriptionPlansLoading ? (
              <View style={[defaultStyles.center, { marginVertical: 40 }]}>
                <Chase size={32} color={Colors.primary[500]} />
              </View>
            ) : (
              plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.planCard}
                  onPress={() => router.push({
                    pathname: '/(payment)/subscription-checkout',
                    params: { planId: plan.id }
                  })}>
                  <View style={styles.planHeader}>
                    <View style={styles.planHeaderLeft}>
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{plan.description || 'Special Offer'}</Text>
                      </View>
                      <Text style={styles.planDuration}>{plan.estimatedDeliveryTimeDays || 'N/A'} Days Delivery</Text>
                    </View>
                    <Icon source="chevron-right" size={24} color={Colors.primary[500]} />
                  </View>
                  <Text style={styles.planName}>{plan.title}</Text>
                  <View style={styles.planDetailsRow}>
                    <View style={styles.planDetailItem}>
                      <Icon source="check" size={24} color={Colors.primary[500]} />
                      <Text style={styles.planDetailText}>{plan.subscriptionItems?.length || 0} items</Text>
                    </View>
                    <Text style={styles.planPrice}>{plan.amount?.value?.toLocaleString()} {plan.amount?.currencyIsoCode}</Text>
                  </View>
                  <View style={styles.planDetailsRow}>
                    <View style={styles.planDetailItem}>
                      <Icon source="truck-delivery-outline" size={24} color={Colors.primary[500]} />
                      <Text style={styles.planDetailText}>1 free delivery</Text>
                    </View>
                    <Text style={styles.planPricePerMonth}>{plan.duration} weeks</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
          
        </ScrollView>

       
    </View>
  );
}
