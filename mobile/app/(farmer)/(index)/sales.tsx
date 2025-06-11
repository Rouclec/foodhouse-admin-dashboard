import { Context, ContextType } from "@/app/_layout";
import { ordersGetFarmerEarningsOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";
import React, { useContext } from "react";
import { View, Text } from "react-native";

export default function Sales() {
  const { user } = useContext(Context) as ContextType;

  const { data } = useQuery({
    ...ordersGetFarmerEarningsOptions({
      path: {
        farmerId: user?.userId ?? "",
      },
      query: {
        filter: "FilterType_THIS_MONTH",
      },
    }),
  });

  console.log({ data });
  
  return (
    <View>
      <Text>Sales</Text>
    </View>
  );
}
