import { Context, ContextType } from "@/app/_layout";
import { ordersgrpcOrderStatus } from "@/client/orders.swagger";
import { usersListFarmersOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { Colors } from "@/constants";
import i18n from "@/i18n";
import { defaultStyles, ordersStyles as styles } from "@/styles";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Chase } from "react-native-animated-spinkit";
import { Appbar, Icon, Text, TextInput } from "react-native-paper";

const { width } = Dimensions.get("window");

export default function Farmers() {
  const router = useRouter();

  const { user } = useContext(Context) as ContextType;

  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");
  const [count, setCount] = useState(10);

  const slideAnim = useRef(new Animated.Value(width)).current;

  const toggleSearch = () => {
    if (searchVisible) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setSearchVisible(false));
      setSearchQuery("");
      setDebounceQuery("");
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
        userId: user?.userId ?? "",
      },
      query: {
        count: count,
        startKey: 0.0,
      },
    }),
  });

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      >
        <View style={[defaultStyles.flex, defaultStyles.relativeContainer]}>
          <Appbar.Header dark={false} style={[defaultStyles.appHeader]}>
            {!searchVisible && (
              <Text variant="titleMedium" style={styles.title}>
                {i18n.t("(buyer).(index).farmers.farmers")}
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
                ]}
              >
                <TextInput
                  label={i18n.t("(buyer).(index).farmers.searchFarmers")}
                  style={[defaultStyles.input, styles.searchInput]}
                  autoFocus
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(text)}
                  mode="outlined"
                  theme={{
                    colors: {
                      primary: Colors.primary[500],
                      background: Colors.grey["fa"],
                      error: Colors.error,
                    },
                    roundness: 10,
                  }}
                />
                <TouchableOpacity
                  onPress={toggleSearch}
                  style={styles.closeIcon}
                >
                  <Icon source={"close"} size={24} color={Colors.dark[0]} />
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
                item.user?.userId ?? index.toString()
              }
              contentContainerStyle={[
                defaultStyles.paddingVertical,
                styles.flatListContentContainer,
              ]}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t("(buyer).(index).farmers.noFarmerFound")}
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
                  <View>
                    <Text>{item?.user?.firstName}</Text>
                    <Text>{item?.rating}</Text>
                  </View>
                );
              }}
              onScrollBeginDrag={() => {
                // Reset flag when user starts dragging
                setHasReachedEnd(false);
              }}
              onScrollEndDrag={() => {
                if (hasReachedEnd && data?.nextKey) {
                  setCount((prev) => prev + 10);
                  setHasReachedEnd(false);
                }
              }}
              ListFooterComponent={() =>
                data?.nextKey ? (
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
