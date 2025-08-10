import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  TouchableOpacity,
  View,
} from "react-native";
import { defaultStyles, myProductStyles as styles } from "@/styles";
import { useQuery } from "@tanstack/react-query";
import { productsListFarmerProductsOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { useContext } from "react";
import { Context, ContextType } from "@/app/_layout";
import {
  ActivityIndicator,
  Appbar,
  Icon,
  Text,
  TextInput,
} from "react-native-paper";
import i18n from "@/i18n";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants";
import { Chase } from "react-native-animated-spinkit";
import { Product } from "@/components";
import { useIsFocused } from "@react-navigation/native";

const { width } = Dimensions.get("window");
export default function MyProducts() {
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

  const router = useRouter();
  const { user, setProductId } = useContext(Context) as ContextType;
  const {
    isLoading: isProductsLoading,
    data,
    refetch,
  } = useQuery({
    ...productsListFarmerProductsOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        count: count,
        search: debounceQuery,
        startKey: "",
      },
    }),
  });

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused]);

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      >
        <View style={[defaultStyles.flex, defaultStyles.relativeContainer]}>
          <Appbar.Header
            dark={false}
            style={[defaultStyles.appHeader, styles.appHeader]}
          >
            {!searchVisible && (
              <Text variant="titleMedium" style={styles.title}>
                {i18n.t("(farmer).(index).my-products.myProducts")}
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
                  label={i18n.t("(farmer).(index).my-products.searchProducts")}
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
          <Text variant="titleMedium" style={styles.title}>
            {i18n.t("(farmer).(index).my-products.products")}
          </Text>
          {isProductsLoading && !data ? (
            <View style={[defaultStyles.container, defaultStyles.center]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={data?.products}
              keyExtractor={(item, index) => item.id ?? index.toString()}
              contentContainerStyle={[
                defaultStyles.paddingVertical,
                styles.flatListContentContainer,
              ]}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t("(farmer).(index).my-products.noProductsFound")}
                  </Text>
                </View>
              }
              numColumns={2}
              columnWrapperStyle={styles.flatListColumnWrapper}
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (!hasReachedEnd) {
                  setHasReachedEnd(true);
                }
              }}
              renderItem={({ item }) => {
                return (
                  
                    <Product
                                        product={item}
                                        OnPress={() =>
                                          router.push({
                                            pathname: '/(farmer)/product-details',
                                            params: {
                                              productId: item?.id,
                                            },
                                          })
                                        }
                                      />
                  
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
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={() => router.push("/(farmer)/create-product")}
          >
            <Icon source={"plus"} size={36} color={Colors.light[10]} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}