import React, { useContext, useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { defaultStyles } from '@/styles';
import { useQuery } from '@tanstack/react-query';
import {
  ordersListSubscriptionPlansOptions,
  ordersSubscribeMutation,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { ordersgrpcSubscription } from '@/client/orders.swagger';
import { Context, ContextType } from '@/app/_layout';
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import { useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import i18n from '@/i18n';

const { width } = Dimensions.get('window');

export default function SubscriptionPlans() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useContext(Context) as ContextType;
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(
    params.planId as string | undefined
  );

  const {
    data: subscriptionPlansData,
    isLoading: isSubscriptionPlansLoading,
  } = useQuery({
    ...ordersListSubscriptionPlansOptions({
      path: {
        userId: user?.userId ?? '',
      },
    }),
  });

  const { mutateAsync: subscribe, isPending: isSubscribing } = useMutation({
    ...ordersSubscribeMutation(),
  });

  const handleSubscribe = async (planId: string) => {
    try {
      const result = await subscribe({
        body: {
          subscriptionPlanId: planId,
        },
        path: {
          userId: user?.userId ?? '',
        },
      });
      // Navigate to payment screen with the subscription's public ID
      if (result?.subscription?.publicId) {
        router.push({
          pathname: '/(payment)',
          params: { subscriptionId: result.subscription.publicId },
        });
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  const handleCreateCustom = () => {
    router.push('/(buyer)/create-custom-subscription');
  };

  if (isSubscriptionPlansLoading) {
    return (
      <SafeAreaView style={[defaultStyles.container, defaultStyles.center]}>
        <Chase size={56} color={Colors.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={defaultStyles.container}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
          }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={Colors.dark[10]} />
          </TouchableOpacity>
          <Text
            variant="headlineSmall"
            style={{
              marginLeft: 16,
              fontWeight: '600',
            }}>
            Subscription Plans
          </Text>
        </View>

        {/* Custom Subscription Card */}
        <Card
          style={{
            marginBottom: 24,
            backgroundColor: Colors.primary[50],
            borderWidth: 2,
            borderColor: Colors.primary[500],
          }}>
          <Card.Content>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: '700',
                marginBottom: 8,
                color: Colors.primary[500],
              }}>
              Create Custom Package
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: Colors.light['10.87'],
                marginBottom: 16,
              }}>
              Select products according to your budget. We'll split your order
              into multiple deliveries to ensure smooth service.
            </Text>
            <Button
              mode="contained"
              onPress={handleCreateCustom}
              buttonColor={Colors.primary[500]}
              style={{ borderRadius: 8 }}>
              Create Custom Package
            </Button>
          </Card.Content>
        </Card>

        {/* Available Plans */}
        <Text
          variant="titleMedium"
          style={{
            fontWeight: '600',
            marginBottom: 16,
          }}>
          Available Plans
        </Text>

        {subscriptionPlansData?.subscriptionPlans &&
        subscriptionPlansData.subscriptionPlans.length > 0 ? (
          <FlatList
            data={subscriptionPlansData.subscriptionPlans}
            scrollEnabled={false}
            keyExtractor={(item, index) => item?.id ?? index.toString()}
            renderItem={({ item }) => {
              const plan = item as ordersgrpcSubscription;
              const isSelected = selectedPlanId === plan?.id;
              return (
                <Card
                  style={{
                    marginBottom: 16,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected
                      ? Colors.primary[500]
                      : Colors.grey['f8'],
                  }}>
                  <Card.Content>
                    <Text
                      variant="titleLarge"
                      style={{
                        fontWeight: '700',
                        marginBottom: 4,
                      }}>
                      {plan?.title}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: Colors.light['10.87'],
                        marginBottom: 12,
                      }}>
                      {plan?.description}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'baseline',
                        marginBottom: 12,
                      }}>
                      <Text
                        variant="headlineMedium"
                        style={{
                          fontWeight: '700',
                          color: Colors.primary[500],
                        }}>
                        {plan?.amount?.currencyIsoCode}{' '}
                        {plan?.amount?.value?.toLocaleString()}
                      </Text>
                      {plan?.duration && (
                        <Text
                          variant="bodySmall"
                          style={{
                            color: Colors.light['10.87'],
                            marginLeft: 8,
                          }}>
                          / {plan.duration} weeks
                        </Text>
                      )}
                    </View>
                    {plan?.subscriptionItems &&
                      plan.subscriptionItems.length > 0 && (
                        <View style={{ marginBottom: 12 }}>
                          <Text
                            variant="bodySmall"
                            style={{
                              fontWeight: '600',
                              marginBottom: 4,
                            }}>
                            Includes:
                          </Text>
                          {plan.subscriptionItems.slice(0, 3).map((item, idx) => (
                            <Text
                              key={idx}
                              variant="bodySmall"
                              style={{
                                color: Colors.light['10.87'],
                              }}>
                              • {item?.productName} x{item?.quantity}
                            </Text>
                          ))}
                          {plan.subscriptionItems.length > 3 && (
                            <Text
                              variant="bodySmall"
                              style={{
                                color: Colors.light['10.87'],
                              }}>
                              • +{plan.subscriptionItems.length - 3} more
                              products
                            </Text>
                          )}
                        </View>
                      )}
                    <Button
                      mode={isSelected ? 'contained' : 'outlined'}
                      onPress={() => {
                        if (isSelected) {
                          handleSubscribe(plan?.id ?? '');
                        } else {
                          setSelectedPlanId(plan?.id);
                        }
                      }}
                      loading={isSubscribing && selectedPlanId === plan?.id}
                      disabled={isSubscribing}
                      buttonColor={Colors.primary[500]}
                      style={{ borderRadius: 8 }}>
                      {isSelected ? 'Subscribe & Pay' : 'Select Plan'}
                    </Button>
                  </Card.Content>
                </Card>
              );
            }}
          />
        ) : (
          <View style={defaultStyles.noItemsContainer}>
            <Text style={defaultStyles.noItems}>
              No subscription plans available
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

