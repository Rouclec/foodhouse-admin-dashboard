import { Context, ContextType } from "@/app/_layout";
import { ordersgrpcFilterType } from "@/client/orders.swagger";
import {
  ordersGetFarmerEarningsOptions,
  ordersListFarmerOrdersOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Dropdown, OrderItem } from "@/components";
import { Colors } from "@/constants";
import i18n from "@/i18n";
import { salesStyles as styles, defaultStyles } from "@/styles";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Chase } from "react-native-animated-spinkit";
import { LineChart } from "react-native-chart-kit";
import { Appbar, Text } from "react-native-paper";

const FILTER_DATA: Array<{
  label: string;
  value: ordersgrpcFilterType;
}> = [
  {
    label: "All",
    value: "FilterType_ALL_TIME",
  },
  {
    label: "This week",
    value: "FilterType_THIS_WEEK",
  },
  {
    label: "This month",
    value: "FilterType_THIS_MONTH",
  },
  {
    label: "This year",
    value: "FilterType_THIS_YEAR",
  },
];

const { width, height } = Dimensions.get("window");
export default function Sales() {
  const { user } = useContext(Context) as ContextType;
  const [filter, setFilter] = useState<ordersgrpcFilterType>(
    "FilterType_ALL_TIME"
  );
  const [count, setCount] = useState(10);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const { data: farmersEarnings, isLoading } = useQuery({
    ...ordersGetFarmerEarningsOptions({
      path: {
        farmerId: user?.userId ?? "",
      },
      query: {
        filter: filter,
      },
    }),
    placeholderData: keepPreviousData,
  });

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    ...ordersListFarmerOrdersOptions({
      path: {
        farmerId: user?.userId ?? "",
      },
      query: {
        count: count,
        startKey: "",
        statuses: ["OrderStatus_DELIVERED"],
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
        <View style={defaultStyles.flex}>
          <Appbar.Header
            dark={false}
            style={[defaultStyles.appHeader, styles.appHeader]}
          >
            <Text variant="titleMedium" style={styles.heading}>
              {i18n.t("(farmer).sales.sales")}
            </Text>
          </Appbar.Header>
          <View style={defaultStyles.relativeContainer}>
            <View style={styles.dropDownWrapperContainer}>
              <Dropdown
                value={filter}
                onSelect={(item) => setFilter(item as ordersgrpcFilterType)}
                data={FILTER_DATA}
                defaultSelected={FILTER_DATA[0]}
                dropdownStyle={styles.dropdownStyle}
              />
            </View>
            <View style={[defaultStyles.card, styles.marginTop80]}>
              <View style={styles.mainCardContainer}>
                <Text variant="titleMedium">
                  {i18n.t("(farmer).sales.earnings")}
                </Text>

                {isLoading && (
                  <View style={defaultStyles.center}>
                    <Chase size={36} color={Colors.primary[500]} />
                  </View>
                )}
                {!!farmersEarnings && (
                  <View style={styles.flexShrink1}>
                    <LineChart
                      data={{
                        labels: (farmersEarnings?.data ?? []).map((_) => ""), // Blank x-labels to hide them
                        datasets: [
                          {
                            data: (farmersEarnings?.data ?? []).map(
                              (item) => item.value ?? 0
                            ),
                          },
                        ],
                      }}
                      width={width - 28}
                      height={height * 0.22 > 254 ? 254 : height * 0.22}
                      yAxisLabel={""}
                      yAxisSuffix={""}
                      withVerticalLabels={false}
                      withHorizontalLabels={false}
                      withInnerLines={true}
                      withOuterLines={true}
                      chartConfig={{
                        backgroundColor: "#ffffff00", // transparent without black fallback
                        backgroundGradientFrom: "#ffffff00",
                        backgroundGradientTo: "#ffffff00",
                        decimalPlaces: 2,
                        color: () => Colors.primary[500], // line color
                        labelColor: () => Colors.dark[0], // effectively hides labels
                        propsForDots: {
                          r: "0",
                          strokeWidth: "1",
                          stroke: Colors.light[10],
                        },
                        propsForBackgroundLines: {
                          strokeDasharray: "", // <- empty means solid lines
                          strokeWidth: 0.5,
                          stroke: "#E0E0E0",
                        },
                        fillShadowGradient: Colors.primary[500], // area under the line
                        fillShadowGradientOpacity: 0.2, // adjust as needed
                      }}
                      bezier
                      style={styles.chart}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
          <View>
            <Text variant="titleSmall" style={styles.title2}>
              {i18n.t("(farmer).sales.completedOrders")}
            </Text>
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
              contentContainerStyle={[styles.flatListContentContainer]}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t("(farmer).sales.noOrdersFound")}
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
                  setCount((prev) => prev + 10);
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
