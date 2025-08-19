import React, { FC, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, Text, TextInput } from 'react-native-paper';
import { Context, ContextType } from '../../_layout';
import { defaultStyles, farmerIndexStyles as styles } from '@/styles';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { Feather } from '@expo/vector-icons';
import { ordersListFarmerOrdersOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { ordersgrpcOrderStatus } from '@/client/orders.swagger';
import { Chase } from 'react-native-animated-spinkit';
import { OrderItem } from '@/components';

const HOUR_OF_DAY = new Date().getHours();

export default function Orders() {
  const TAB_ITEMS: Array<{
    name: string;
    value: Array<ordersgrpcOrderStatus>;
  }> = [
    {
      name: i18n.t('(farmer).(index).index.pending'),
      value: [
        'OrderStatus_PAYMENT_SUCCESSFUL',
        'OrderStatus_APPROVED',
        'OrderStatus_IN_TRANSIT',
      ],
    },
    {
      name: i18n.t('(farmer).(index).index.completed'),
      value: ['OrderStatus_DELIVERED'],
    },
  ];

  const { user } = useContext(Context) as ContextType;
  const { role } = useContext(Context) as ContextType;
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState('');
  const [count, setCount] = useState(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const router = useRouter();
  const [tabItem, setTabItem] = useState<{
    name: string;
    value: Array<ordersgrpcOrderStatus>;
  }>(TAB_ITEMS[0]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (user && role) {
      const isFarmerMissingLocation =
        role === 'USER_TYPE_FARMER' &&
        (!user.locationCoordinates ||
          !user.locationCoordinates.lat ||
          !user.locationCoordinates.lon ||
          !user.locationCoordinates.address) && user.firstName && user.lastName && user.profileImage && user.phoneNumber;

      if (isFarmerMissingLocation) {
        setErrorMessage(i18n.t('(auth).profile.locationRequiredForFarmer')); 
        setErrorVisible(true);
        router.replace('/(auth)/profile-page'); 
      }
    }
  }, [user, role, router]);

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    ...ordersListFarmerOrdersOptions({
      path: {
        farmerId: user?.userId ?? '',
      },
      query: {
        count: count,
        startKey: '',
        statuses: tabItem.value,
      },
    }),
  });

 

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.flex}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View
          style={[
            defaultStyles.flex,
            styles.bgWhite,
            defaultStyles.relativeContainer,
          ]}>
          <View style={styles.appHeader}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.appHeaderContent}>
                <View style={styles.appHeaderTopContainer}>
                  <View style={styles.appHeaderLeftContainer}>
                    <TouchableOpacity
                      style={styles.iconContainer}
                      onPress={() => router.push('/(farmer)/(index)/profile')}>
                      {user?.profileImage ? (
                        <Image
                          source={{ uri: user?.profileImage }}
                          style={styles.profileImage}
                        />
                      ) : (
                        <Image
                          source={require('@/assets/images/avatar.png')}
                          style={styles.avatarImage}
                        />
                      )}
                    </TouchableOpacity>
                    <View>
                      <Text style={styles.greetingsText} variant="bodyLarge">
                        {HOUR_OF_DAY < 12
                          ? i18n.t('(farmer).(index).index.goodMorning')
                          : HOUR_OF_DAY < 17
                          ? i18n.t('(farmer).(index).index.goodAfternoon')
                          : i18n.t('(farmer).(index).index.goodEvening')}{' '}
                        👋
                      </Text>
                      <Text style={styles.nameText} variant="titleLarge">
                        {user?.firstName} {user?.lastName}
                      </Text>
                    </View>
                  </View>
                  {/* <TouchableOpacity style={styles.iconContainer}>
                    <View style={defaultStyles.relativeContainer}>
                      <Icon
                        source={'bell-outline'}
                        size={24}
                        color={Colors.dark[10]}
                      />
                      <View style={styles.noticiatonIndicator} />
                    </View>
                  </TouchableOpacity> */}
                </View>
                <TextInput
                  placeholder={i18n.t('(farmer).(index).index.searchOrder')}
                  placeholderTextColor={Colors.grey['bd']}
                  style={[defaultStyles.input, styles.searchInput]}
                  outlineStyle={styles.searchInputOutline}
                  value={searchQuery}
                  onChangeText={text => setSearchQuery(text)}
                  mode="outlined"
                  left={
                    <TextInput.Icon
                      icon={() => (
                        <Feather
                          name="search"
                          size={20}
                          color={Colors.grey['bd']}
                        />
                      )}
                      size={24}
                      color={Colors.grey['61']}
                    />
                  }
                  theme={{
                    colors: {
                      primary: Colors.primary[500],
                      background: Colors.grey['fa'],
                      error: Colors.error,
                    },
                    roundness: 16,
                  }}
                />
              </View>
            </SafeAreaView>
          </View>
          <View style={styles.tabItemsMainContainer}>
            {TAB_ITEMS.map(item => {
              return (
                <TouchableOpacity
                  key={item?.value[0]}
                  onPress={() => setTabItem(item)}
                  style={[
                    styles.tabItemContainer,
                    tabItem.value === item?.value &&
                      styles.tabItemActiveContainer,
                  ]}>
                  <Text
                    variant="titleSmall"
                    style={[
                      styles.tabItemText,
                      tabItem.value === item?.value && styles.tabItemActiveText,
                    ]}>
                    {item?.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {isOrdersLoading && !ordersData ? (
            <View style={[defaultStyles.container, defaultStyles.center]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={ordersData?.orders}
              keyExtractor={(item, index) =>
                item.orderNumber ?? index.toString()
              }
              contentContainerStyle={[
                defaultStyles.paddingVertical,
                styles.flatListContentContainer,
              ]}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t('(farmer).(index).index.noOrdersFound')}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (!hasReachedEnd) {
                  setHasReachedEnd(true);
                }
              }}
              renderItem={({ item }) => {
                return <OrderItem item={item} />;
              }}
              onScrollBeginDrag={() => {
                // Reset flag when user starts dragging
                setHasReachedEnd(false);
              }}
              onScrollEndDrag={() => {
                if (hasReachedEnd && ordersData?.nextKey) {
                  setCount(prev => prev + 10);
                  setHasReachedEnd(false);
                }
              }}
              ListFooterComponent={() =>
                ordersData?.nextKey ? (
                  <View style={defaultStyles.listFooterComponent}>
                    {hasReachedEnd && (
                      <ActivityIndicator
                        color={Colors.primary[500]}
                        style={defaultStyles.listFooterIndicator}
                      />
                    )}
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
