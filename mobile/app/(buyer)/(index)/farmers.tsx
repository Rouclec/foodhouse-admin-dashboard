import { Context, ContextType } from '@/app/_layout';
import { usersListFarmersOptions } from '@/client/users.swagger/@tanstack/react-query.gen';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { defaultStyles, farmersStyles as styles } from '@/styles';
import { Feather } from '@expo/vector-icons';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import { Appbar, Button, Icon, Text, TextInput } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function Farmers() {
  const router = useRouter();

  const { user } = useContext(Context) as ContextType;

  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState('');
  const [count, setCount] = useState(10);

  const slideAnim = useRef(new Animated.Value(width)).current;

  const toggleSearch = () => {
    if (searchVisible) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setSearchVisible(false));
      setSearchQuery('');
      setDebounceQuery('');
    } else {
      setSearchVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    ...usersListFarmersOptions({
      path: {
        userId: user?.userId ?? '',
      },
      query: {
        count: count,
        startKey: '',
        searchKey: debounceQuery,
      },
    }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={[defaultStyles.flex, defaultStyles.relativeContainer]}>
          <Appbar.Header dark={false} style={[defaultStyles.appHeader]}>
            {!searchVisible && (
              <Text variant="titleMedium" style={styles.title}>
                {i18n.t('(buyer).(index).farmers.farmers')}
              </Text>
            )}

            {!searchVisible && (
              <TouchableOpacity onPress={toggleSearch} style={styles.icon}>
                <Feather name="search" size={24} />
              </TouchableOpacity>
            )}

            {searchVisible && (
              <Animated.View
                style={[
                  styles.searchContainer,
                  { transform: [{ translateX: slideAnim }] },
                ]}>
                <TextInput
                  label={i18n.t('(buyer).(index).farmers.searchFarmers')}
                  style={[defaultStyles.input, styles.searchInput]}
                  autoFocus
                  value={searchQuery}
                  onChangeText={text => setSearchQuery(text)}
                  mode="outlined"
                  theme={{
                    colors: {
                      primary: Colors.primary[500],
                      background: Colors.grey['fa'],
                      error: Colors.error,
                    },
                    roundness: 10,
                  }}
                />
                <TouchableOpacity
                  onPress={toggleSearch}
                  style={styles.closeIcon}>
                  <Icon source={'close'} size={24} color={Colors.dark[0]} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </Appbar.Header>
          {isLoading && !data ? (
            <View style={[defaultStyles.container, defaultStyles.center]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={data?.farmers}
              keyExtractor={(item, index) =>
                item.user?.createdAt ?? index.toString()
              }
              contentContainerStyle={[
                defaultStyles.paddingVertical,
                styles.flatListContentContainer,
              ]}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t('(buyer).(index).farmers.noFarmerFound')}
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
                return (
                  <View style={styles.farmerItemContainer}>
                    <View style={styles.profileContainer}>
                      <View style={styles.profileImageContainer}>
                        {item?.user?.profileImage ? (
                          <Image
                            source={{ uri: item?.user?.profileImage }}
                            style={styles.profileImage}
                          />
                        ) : (
                          <Image
                            source={require('@/assets/images/avatar.png')}
                            style={styles.avatar}
                          />
                        )}
                      </View>
                      <View style={styles.nameContainer}>
                        <Text variant="titleSmall" style={styles.text18}>
                          {!!item?.user?.firstName
                            ? item?.user?.firstName
                            : 'Anonymous'}{' '}
                          {item?.user?.lastName}
                        </Text>
                        {/* <View style={styles.ratingsContainer}>
                          {Math.floor(item?.rating ?? 0) >= 5.0 ? (
                            <Icon
                              source={'star'}
                              size={24}
                              color={Colors.gold}
                            />
                          ) : item?.rating ?? 0 > 0 ? (
                            <Icon
                              source={'star-half-full'}
                              size={24}
                              color={Colors.gold}
                            />
                          ) : (
                            <Icon
                              source={'star-outline'}
                              size={24}
                              color={Colors.grey['61']}
                            />
                          )}
                          <Text style={styles.ratingsText}>
                            {formatAmount((item?.rating ?? 0.0).toString(), {
                              decimalPlaces: item?.rating ?? 0 > 0 ? 1 : 0,
                            })}
                          </Text>
                        </View> */}
                      </View>
                    </View>
                    <Button
                      style={styles.button}
                      onPress={() =>
                        router.push({
                          pathname: '/(buyer)/farmer-details',
                          params: {
                            farmerId: item?.user?.userId,
                          },
                        })
                      }>
                      <Text style={defaultStyles.buttonText}>
                        {i18n.t('(buyer).(index).farmers.viewDetails')}
                      </Text>
                    </Button>
                  </View>
                );
              }}
              onScrollBeginDrag={() => {
                // Reset flag when user starts dragging
                setHasReachedEnd(false);
              }}
              onScrollEndDrag={() => {
                if (hasReachedEnd && !!data?.nextKey && data?.nextKey != '') {
                  setCount(prev => prev + 10);
                  setHasReachedEnd(false);
                }
              }}
              ListFooterComponent={() =>
                !!data?.nextKey && data?.nextKey != '' ? (
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
