import { Context, ContextType } from "@/app/_layout";
import { ordersgrpcFilterType } from "@/client/orders.swagger";
import { ordersGetFarmerEarningsOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Dropdown } from "@/components";
import { Colors } from "@/constants";
import i18n from "@/i18n";
import { salesStyles as styles, defaultStyles } from "@/styles";
import { useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
} from "react-native";
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
export default function Sales() {
  const { user } = useContext(Context) as ContextType;
  const [filter, setFilter] = useState<ordersgrpcFilterType>(
    "FilterType_THIS_MONTH"
  );

  const { data } = useQuery({
    ...ordersGetFarmerEarningsOptions({
      path: {
        farmerId: user?.userId ?? "",
      },
      query: {
        filter: filter,
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
            <View
              style={{
                position: "absolute",
                zIndex: 99,
                left: 0,
                right: 0,
                height: 56,
              }}
            >
              <Dropdown
                value={filter}
                onSelect={(item) => setFilter(item as ordersgrpcFilterType)}
                data={FILTER_DATA}
                defaultSelected={FILTER_DATA[0]}
                dropdownStyle={{
                  minHeight: 184,
                }}
              />
            </View>
            <View
              style={[
                defaultStyles.card,
                {
                  marginTop: 80,
                },
              ]}
            >
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  rowGap: 16,
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexDirection: "row",
                  }}
                >
                  <Text variant="titleMedium">
                    {i18n.t("(farmer).sales.earnings")}
                  </Text>
                </View>
                <View style={{ flexShrink: 1 }}>
                  <LineChart
                    data={{
                      labels: ["", "", "", "", "", ""], // Blank x-labels to hide them
                      datasets: [
                        {
                          data: [
                            Math.random() * 100,
                            Math.random() * 100,
                            Math.random() * 100,
                            Math.random() * 100,
                            Math.random() * 100,
                            Math.random() * 100,
                          ],
                        },
                      ],
                    }}
                    width={Dimensions.get("window").width - 28}
                    height={220}
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
                      labelColor: () => `rgba(0, 0, 0, 0)`, // effectively hides labels
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#21BF73",
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: "", // <- empty means solid lines
                        strokeWidth: 0.5,
                        stroke: "#E0E0E0",
                      },
                      fillShadowGradient: "#21BF73", // area under the line
                      fillShadowGradientOpacity: 0.2, // adjust as needed
                    }}
                    bezier
                    style={{
                      marginTop: 0,
                      paddingRight: 0,
                      paddingLeft: 0,
                      paddingBottom: 0,
                      marginBottom: -16,
                      marginLeft: 0,
                      marginRight: 60,
                      borderRadius: 16,
                      backgroundColor: "transparent",
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
          <ScrollView
            contentContainerStyle={[defaultStyles.scrollContainer]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          ></ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
