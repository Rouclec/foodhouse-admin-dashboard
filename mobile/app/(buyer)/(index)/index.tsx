import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";
import { defaultStyles, buyerProductsStyles as styles } from "@/styles";
import { useQuery } from "@tanstack/react-query";
import {
  productsListCategoriesOptions,
  productsListProductsOptions,
} from "@/client/products.swagger/@tanstack/react-query.gen";
import { useContext } from "react";
import { Context, ContextType } from "@/app/_layout";
import {
  ActivityIndicator,
  Dialog,
  Icon,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import i18n from "@/i18n";
import { useRouter } from "expo-router";
import { CAMEROON, Colors, countries } from "@/constants";
import { Chase } from "react-native-animated-spinkit";
import { Product } from "@/components";
import { useIsFocused } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

export default function BuyerProducts() {
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");
  const [count, setCount] = useState(10);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();
  const [minAmount, setMinAmount] = useState<string>();
  const [maxAmount, setMaxAmount] = useState<string>();
  const userCurrency =
    countries.find((country) => country.code === user?.residenceCountryIsoCode)
      ?.currency_code ?? CAMEROON.currency_code;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const router = useRouter();

  const { user } = useContext(Context) as ContextType;

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    ...productsListCategoriesOptions(),
  });
  const {
    isLoading: isProductsLoading,
    data,
    refetch,
  } = useQuery({
    ...productsListProductsOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        count: count,
        "maxAmount.currencyIsoCode": userCurrency,
        "maxAmount.value": maxAmount,
        "minAmount.currencyIsoCode": userCurrency,
        "minAmount.value": minAmount,
        categoryId: selectedCategoryId,
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
        style={defaultStyles.flex}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            defaultStyles.flex,
            styles.bgWhite,
            defaultStyles.relativeContainer,
          ]}
        >
          <View style={styles.appHeader}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.appHeaderContent}>
                <View style={styles.appHeaderTopContainer}>
                  <View style={styles.appHeaderLeftContainer}>
                    <View style={styles.iconContainer}>
                      <Image
                        source={require("@/assets/images/carrots.png")}
                        tintColor={Colors.primary[500]}
                        style={{
                          backgroundColor: Colors.primary[500],
                        }}
                      />
                    </View>
                    <View>
                      <Text style={styles.greetingsText} variant="bodyLarge">
                        {i18n.t("(buyer).(index).products.goodMorning")} 👋
                      </Text>
                      <Text style={styles.nameText} variant="titleLarge">
                        {user?.firstName} {user?.lastName}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.iconContainer}>
                    <View style={defaultStyles.relativeContainer}>
                      <Icon
                        source={"bell-outline"}
                        size={24}
                        color={Colors.dark[10]}
                      />
                      <View style={styles.noticiatonIndicator} />
                    </View>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder={i18n.t(
                    "(buyer).(index).products.searchProducts"
                  )}
                  placeholderTextColor={Colors.grey["bd"]}
                  style={[defaultStyles.input, styles.searchInput]}
                  outlineStyle={styles.searchInputOutline}
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(text)}
                  mode="outlined"
                  left={
                    <TextInput.Icon
                      icon={() => (
                        <Feather
                          name="search"
                          size={20}
                          color={Colors.grey["bd"]}
                        />
                      )}
                      size={24}
                      color={Colors.grey["61"]}
                    />
                  }
                  right={
                    <TextInput.Icon
                      icon={() => (
                        <Image
                          source={require("@/assets/images/filter-icon.jpg")}
                        />
                      )}
                    />
                  }
                  theme={{
                    colors: {
                      primary: Colors.primary[500],
                      background: Colors.grey["fa"],
                      error: Colors.error,
                    },
                    roundness: 16,
                  }}
                />
              </View>
            </SafeAreaView>
          </View>
          <Text variant="titleMedium" style={styles.title}>
            {i18n.t("(buyer).(index).products.categories")}
          </Text>
          {isCategoriesLoading ? (
            <View style={defaultStyles.center}>
              <Chase size={24} color={Colors.primary[500]} />
            </View>
          ) : (
            <View style={styles.flatListContainer}>
              <FlatList
                horizontal
                data={categories?.categories}
                contentContainerStyle={styles.horizontailFlatListContent}
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalFlatList}
                keyExtractor={(item, index) => item?.id ?? index.toString()}
                ListHeaderComponent={() => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      !selectedCategoryId && styles.selectedCategoryItem,
                    ]}
                    onPress={() => setSelectedCategoryId(undefined)}
                  >
                    <Text
                      style={{
                        color: !selectedCategoryId
                          ? Colors.light[10]
                          : Colors.dark[10],
                      }}
                    >
                      {i18n.t("(buyer).(index).products.all")}
                    </Text>
                  </TouchableOpacity>
                )}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={[
                        styles.categoryItem,
                        selectedCategoryId === item?.id &&
                          styles.selectedCategoryItem,
                      ]}
                      onPress={() => setSelectedCategoryId(item?.id)}
                    >
                      <Text
                        style={{
                          color:
                            selectedCategoryId === item?.id
                              ? Colors.light[10]
                              : Colors.dark[10],
                        }}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
          <Text variant="titleMedium" style={styles.title}>
            {i18n.t("(buyer).(index).products.products")}
          </Text>
          {isProductsLoading && !data ? (
            <View style={[defaultStyles.container, defaultStyles.center]}>
              <Chase size={64} color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={data?.products}
              keyExtractor={(item, index) => item?.id ?? index.toString()}
              contentContainerStyle={[
                defaultStyles.paddingVertical,
                styles.flatListContentContainer,
              ]}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t("(buyer).(index).products.noProductsFound")}
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
                return <Product product={item} OnPress={() => {}} />;
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
          <View style={styles.filtersContainer}>
            <Portal>
              <Dialog visible={true} style={styles.filtersContainer}>
                <Dialog.Content>
                  <Text>Filter container</Text>
                </Dialog.Content>
              </Dialog>
            </Portal>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
