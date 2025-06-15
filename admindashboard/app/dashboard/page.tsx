"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  TrendingDown,
  LucideIcon,
  Package,
  BarChart2,
  Minus,
  Tractor,
} from "lucide-react";
import {
  ordersgrpcOrder,
  ordersgrpcOrderStatus,
} from "@/client/orders.swagger";
import { formatAmount, formatCurrency } from "@/utils";
import { FC, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ordersGetAdminStatsOptions,
  ordersListOrdersOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "../contexts/QueryProvider";
import { useQueryLoading } from "@/hooks/use-query-loading";
import {
  usersGetFarmerByIdOptions,
  usersGetPublicUserOptions,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRouter } from "next/navigation";

const acceptedOrderStatuses: Array<ordersgrpcOrderStatus> = [
  "OrderStatus_APPROVED",
  "OrderStatus_DELIVERED",
  "OrderStatus_IN_TRANSIT",
  "OrderStatus_PAYMENT_SUCCESSFUL",
  "OrderStatus_REJECTED",
];

type FormattedStatItem = {
  title?: string | undefined;
  value?: string | undefined;
  change: string | undefined; // e.g., "+8%"
  trend: "up" | "down" | "neutral";
  icon: LucideIcon;
  description?: string | undefined;
  url: __next_route_internal_types__.RouteImpl<string>;
};

const getIconForTitle = (title: string | undefined) => {
  const lower = (title ?? "").toLowerCase();

  if (lower.includes("revenue")) return CreditCard;
  if (lower.includes("user")) return Users;
  if (lower.includes("order")) return ShoppingCart;
  if (lower.includes("farmer")) return Tractor;
  if (lower.includes("product")) return Package;

  return BarChart2; // default icon
};

const getStatUrl = (
  title: string | undefined
): __next_route_internal_types__.RouteImpl<string> => {
  const lower = (title ?? "").toLowerCase();

  if (lower.includes("revenue")) return "/dashboard/payments";
  if (lower.includes("user")) return "/dashboard/buyers";
  if (lower.includes("order")) return "/dashboard/orders";
  if (lower.includes("farmer")) return "/dashboard/farmers";
  // if (lower.includes("product")) return "/dashboard/products";

  return "/dashboard"; // default icon
};

type OrderItemProps = {
  order: ordersgrpcOrder | undefined;
};
const OrderItem: FC<OrderItemProps> = ({ order }) => {
  const { user } = useContext(Context) as ContextType;

  const { data: farmerData, isLoading: isLoadingFarmer } = useQuery({
    ...usersGetFarmerByIdOptions({
      path: {
        userId: user?.userId ?? "",
        farmerId: order?.productOwner ?? "",
      },
    }),
  });

  const { data: userData, isLoading: isUserDataLoading } = useQuery({
    ...usersGetPublicUserOptions({
      path: {
        userId: order?.createdBy ?? "",
      },
    }),
  });

  const { data: productData, isLoading: isProductDataLoading } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: order?.product ?? "",
      },
    }),
  });

  const getStatusColor = (status: ordersgrpcOrderStatus | undefined) => {
    switch (status) {
      case "OrderStatus_PAYMENT_SUCCESSFUL":
        return "bg-yellow-100 text-yellow-800";
      case "OrderStatus_IN_TRANSIT":
        return "bg-blue-100 text-blue-800";
      case "OrderStatus_DELIVERED":
        return "bg-primary text-primary-foreground";
      case "OrderStatus_REJECTED":
        return "bg-red-600 text-primary-foreground";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoadingFarmer || isUserDataLoading || isProductDataLoading) {
    return <LoadingSpinner size="sm" />;
  }

  return (
    <div
      key={order?.orderNumber}
      className="flex items-center justify-between p-4 border rounded-lg"
    >
      <div className="flex-1">
        <div className="flex items-center space-x-8">
          <div>
            <p className="text-sm text-gray-600">
              {formatAmount(order?.quantity ?? "", { decimalPlaces: 0 })}{" "}
              {productData?.product?.unitType?.replace("per_", "")}
              {parseInt(order?.quantity ?? "") > 1 && "s"}
            </p>
            <p className="text-sm font-medium">{productData?.product?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Order number</p>
            <p className="text-sm font-medium">{order?.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Buyer</p>
            <p className="text-sm font-medium">{userData?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Farmer</p>
            <p className="text-sm font-medium">
              {farmerData?.user?.firstName} {farmerData?.user?.lastName}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Badge className={getStatusColor(order?.status)}>
          {order?.status
            ?.replace("OrderStatus_", "")
            .split("_")
            .join(" ")
            .trim()}
        </Badge>
        <p className="font-medium text-gray-900">
          {formatCurrency(
            order?.price?.value ?? 0,
            order?.price?.currencyIsoCode ?? ""
          )}
        </p>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();

  const { user } = useContext(Context) as ContextType;

  const { data: adminStats, isLoading: isStatsLoading } = useQuery({
    ...ordersGetAdminStatsOptions({
      path: {
        userId: user?.userId ?? "",
      },
    }),
  });

  const { data: recentOrders, isLoading: isOrdersLoading } = useQuery({
    ...ordersListOrdersOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        count: 5,
        statuses: acceptedOrderStatuses,
      },
    }),
  });

  useQueryLoading(isStatsLoading || isOrdersLoading);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with FoodHouse today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {adminStats?.data
          ?.filter((item) => !item.title?.toLowerCase().includes("product")) // removing the products stats for now
          ?.map((stat): FormattedStatItem => {
            const trend =
              (stat.change ?? 0) > 0
                ? "up"
                : (stat.change ?? 0) < 0
                ? "down"
                : "neutral";
            const formattedChange = `${(stat.change ?? 0) > 0 ? "+" : ""}${(
              stat.change ?? 0
            ).toFixed(0)}%`;
            const icon = getIconForTitle(stat?.title);

            return {
              ...stat,
              value: !!stat?.currency
                ? formatCurrency(stat?.value ?? 0, stat?.currency)
                : formatAmount(stat?.value ?? ""),
              trend,
              change: formattedChange,
              icon,
              url: getStatUrl(stat?.title),
            };
          })
          .map((stat) => (
            <Card
              key={stat.title}
              className="cursor-pointer"
              onClick={() => router.push(stat.url)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <span
                    className={`flex items-center ${
                      stat.trend === "up"
                        ? "text-green-600"
                        : stat.trend === "down"
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : stat.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : (
                      <Minus className="h-3 w-3 mr-1" />
                    )}
                    {stat.change}
                  </span>
                  <span>from last month</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders from customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders?.orders?.length == 0 ? (
              <div>
                <p>No recent orders</p>
              </div>
            ) : (
              recentOrders?.orders?.map((order) => <OrderItem order={order} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
