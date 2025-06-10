import { Context, ContextType } from "@/app/_layout";
import { ordersgrpcOrderStatus } from "@/client/orders.swagger";
import { productsListProductsOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { usersGetPublicUser, usersgrpcReview } from "@/client/users.swagger";
import {
  usersGetFarmerByIdOptions,
  usersGetPublicUserOptions,
  usersListFarmersReivewsOptions,
  usersReviewFarmerMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { Product } from "@/components";
import { Colors } from "@/constants";
import i18n from "@/i18n";
import { defaultStyles, farmerDetailsStyle as styles } from "@/styles";
import { formatAmount } from "@/utils/amountFormater";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { FC, useContext, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { Chase } from "react-native-animated-spinkit";
import { Appbar, Button, Icon, Text } from "react-native-paper";

const TAB_ITEMS: Array<{
  name: string;
  value: "PRODUCTS" | "REVIEWS";
}> = [
  {
    name: i18n.t("(buyer).farmer-details.products"),
    value: "PRODUCTS",
  },
  {
    name: i18n.t("(buyer).farmer-details.reviews"),
    value: "REVIEWS",
  },
];

type CommentItemProps = {
  item: usersgrpcReview;
};
const CommentItem: FC<CommentItemProps> = ({ item }) => {
  const { data, isLoading } = useQuery({
    ...usersGetPublicUserOptions({
      path: {
        userId: item?.createdBy ?? "",
      },
    }),
  });

  console.log({ data });
  return (
    <View>
      <View>
        <View>
          <View></View>
          <Text>{""}</Text>
        </View>
      </View>
      <Text>{item?.comment}</Text>
    </View>
  );
};

export default function FarmerDetails() {
  const router = useRouter();

  const { user } = useContext(Context) as ContextType;

  const { farmerId } = useLocalSearchParams();

  const [reviewCount, setReviewCount] = useState(10);
  const [productsCount, setProductsCount] = useState(10);

  const [reviewsHaveReachedEnd, setReviewsHaveReachedEnd] = useState(false);
  const [productsHaveReachedEnd, setProductsHaveReachedEnd] = useState(false);

  const [tabItem, setTabItem] = useState<{
    name: string;
    value: "PRODUCTS" | "REVIEWS";
  }>(TAB_ITEMS[0]);

  const { data: farmerDetails } = useQuery({
    ...usersGetFarmerByIdOptions({
      path: {
        farmerId: farmerId as string,
        userId: user?.userId ?? "",
      },
    }),
  });

  const { data: farmerReviews, isLoading: isReviewsLoading } = useQuery({
    ...usersListFarmersReivewsOptions({
      path: {
        farmerId: farmerId as string,
        userId: user?.userId ?? "",
      },
      query: {
        count: reviewCount,
        startKey: "",
      },
    }),
  });

  const { data: farmerProducts, isLoading: isProductsLoading } = useQuery({
    ...productsListProductsOptions({
      query: {
        startKey: "",
        count: productsCount,
        createdBy: farmerId as string,
      },
    }),
  });

  //   const handleReview = async () => {
  //     try {
  //       await mutateAsync({
  //         body: {
  //           farmerId: farmerId as string,
  //           orderId: "4",
  //           productId: "1234567890",
  //           rating: 4.5,
  //           comment:
  //             "Impressed by the quality of the ripe plantains received 🌟, will definitely be ordering again!",
  //         },
  //         path: {
  //           userId: user?.userId ?? "",
  //         },
  //       });
  //     } catch (error) {
  //       console.error({ error }, "reviewing farmer");
  //     }
  //   };

  //   const { mutateAsync } = useMutation({
  //     ...usersReviewFarmerMutation(),
  //   });

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      >
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}
            >
              <Icon source={"arrow-left"} size={24} color={Colors.dark[0]} />
            </TouchableOpacity>

            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t("(buyer).farmer-details.farmerInformation")}
            </Text>
            <View />
          </Appbar.Header>
          <View>
            <View style={styles.farmerDetailsContainer}>
              <View style={styles.addImageContainer}>
                {farmerDetails?.user?.profileImage ? (
                  <Image
                    source={{ uri: farmerDetails?.user?.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Image
                    source={require("@/assets/images/avatar.png")}
                    style={styles.avatar}
                  />
                )}
              </View>
              <View style={styles.nameAndRatingContainer}>
                <Text variant="titleSmall" style={styles.farmerName}>
                  {!!farmerDetails?.user?.firstName
                    ? farmerDetails?.user?.firstName
                    : "Anonymous"}{" "}
                  {farmerDetails?.user?.lastName}
                </Text>
                <View style={styles.ratingsContainer}>
                  {farmerDetails?.rating ?? 0 >= 5.0 ? (
                    <Icon source={"star"} size={24} color={Colors.gold} />
                  ) : farmerDetails?.rating ?? 0 > 0 ? (
                    <Icon
                      source={"star-half-full"}
                      size={24}
                      color={Colors.gold}
                    />
                  ) : (
                    <Icon
                      source={"star-outline"}
                      size={24}
                      color={Colors.grey["61"]}
                    />
                  )}
                  <Text style={styles.ratingsText}>
                    {formatAmount((farmerDetails?.rating ?? 0.0).toString(), {
                      decimalPlaces: farmerDetails?.rating ?? 0 > 0 ? 1 : 0,
                    })}
                  </Text>
                </View>
              </View>
              {/* TODO: This text will be for the farmer's description, when the time comes  */}
              {/* <Text style={styles.farmerDescription}>
                {
                  "I am Forsamp Anyah, a farmer from Bamenda, I grow foodcrops like tomatoes, banana, plantains"
                }
              </Text> */}
            </View>
          </View>
          <View style={styles.tabItemsMainContainer}>
            {TAB_ITEMS.map((item) => {
              return (
                <TouchableOpacity
                  key={item?.value[0]}
                  onPress={() => setTabItem(item)}
                  style={[
                    styles.tabItemContainer,
                    tabItem.value === item?.value &&
                      styles.tabItemActiveContainer,
                  ]}
                >
                  <Text
                    variant="titleSmall"
                    style={[
                      styles.tabItemText,
                      tabItem.value === item?.value && styles.tabItemActiveText,
                    ]}
                  >
                    {item?.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {tabItem.value === "REVIEWS" ? (
            <>
              {isReviewsLoading && !farmerReviews ? (
                <View style={[defaultStyles.container, defaultStyles.center]}>
                  <Chase size={56} color={Colors.primary[500]} />
                </View>
              ) : (
                <FlatList
                  key={"REVIEWS"}
                  data={farmerReviews?.reviews}
                  keyExtractor={(item, index) =>
                    item?.createdAt ?? index.toString()
                  }
                  contentContainerStyle={[
                    defaultStyles.paddingVertical,
                    styles.flatListContentContainer,
                  ]}
                  ListEmptyComponent={
                    <View style={defaultStyles.noItemsContainer}>
                      <Text style={defaultStyles.noItems}>
                        {i18n.t("(buyer).farmer-details.noReviewsYet")}
                      </Text>
                    </View>
                  }
                  showsVerticalScrollIndicator={false}
                  onEndReached={() => {
                    if (!reviewsHaveReachedEnd) {
                      setReviewsHaveReachedEnd(true);
                    }
                  }}
                  renderItem={({ item }) => {
                    return <CommentItem item={item} />;
                  }}
                  onScrollBeginDrag={() => {
                    // Reset flag when user starts dragging
                    setReviewsHaveReachedEnd(false);
                  }}
                  onScrollEndDrag={() => {
                    if (reviewsHaveReachedEnd && farmerReviews?.nextKey) {
                      setReviewCount((prev) => prev + 10);
                      setReviewsHaveReachedEnd(false);
                    }
                  }}
                  ListFooterComponent={() =>
                    farmerReviews?.nextKey ? (
                      <View style={defaultStyles.listFooterComponent}>
                        {productsHaveReachedEnd && (
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
            </>
          ) : (
            <>
              {isProductsLoading && !farmerProducts ? (
                <View style={[defaultStyles.container, defaultStyles.center]}>
                  <Chase size={56} color={Colors.primary[500]} />
                </View>
              ) : (
                <FlatList
                  key={"PRODUCTS"}
                  data={farmerProducts?.products}
                  keyExtractor={(item, index) => item?.id ?? index.toString()}
                  contentContainerStyle={[
                    defaultStyles.paddingVertical,
                    styles.flatListContentContainer,
                  ]}
                  ListEmptyComponent={
                    <View style={defaultStyles.noItemsContainer}>
                      <Text style={defaultStyles.noItems}>
                        {i18n.t("(buyer).farmer-details.noProductsFound")}
                      </Text>
                    </View>
                  }
                  numColumns={2}
                  columnWrapperStyle={styles.flatListColumnWrapper}
                  showsVerticalScrollIndicator={false}
                  onEndReached={() => {
                    if (!productsHaveReachedEnd) {
                      setProductsHaveReachedEnd(true);
                    }
                  }}
                  renderItem={({ item }) => {
                    return (
                      <Product
                        product={item}
                        OnPress={() =>
                          router.push({
                            pathname: "/(buyer)/product-details",
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
                    setProductsHaveReachedEnd(false);
                  }}
                  onScrollEndDrag={() => {
                    if (productsHaveReachedEnd && farmerProducts?.nextKey) {
                      setProductsCount((prev) => prev + 10);
                      setProductsHaveReachedEnd(false);
                    }
                  }}
                  ListFooterComponent={() =>
                    farmerProducts?.nextKey ? (
                      <View style={defaultStyles.listFooterComponent}>
                        {productsHaveReachedEnd && (
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
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
