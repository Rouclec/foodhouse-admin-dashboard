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
  Leaf,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ordersgrpcOrder,
  ordersgrpcOrderStatus,
} from "@/client/orders.swagger";
import { delay, formatAmount, formatCurrency } from "@/utils";
import { FC, useEffect, useState } from "react";
import { useLoadingState } from "@/hooks/use-with-loading";
import { productsgrpcProduct } from "@/client/products.swagger";

type OrderItemProps = {
  order: ordersgrpcOrder | undefined;
};
const OrderItem: FC<OrderItemProps> = ({ order }) => {
  const [farmerName, setFarmerName] = useState<string>();
  const [customerName, setCustomerName] = useState<string>();
  const [product, setProduct] = useState<productsgrpcProduct>();

  const getFarmer = async () => {
    await delay(2000);
    setFarmerName("Farmer name");
  };
  const getCustomerName = async () => {
    await delay(2000);
    setCustomerName("Customer Name");
  };

  const getProductDetails = async () => {
    await delay(2000);
    setProduct({
      name: "Product name",
      unitType: {
        slug: "per_kg",
      },
    });
  };

  useEffect(() => {
    getFarmer();
    getCustomerName();
    getProductDetails();
  }, []);

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
  return (
    <div
      key={order?.orderNumber}
      className="flex items-center justify-between p-4 border rounded-lg"
    >
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div>
            <p className="font-medium text-gray-600">{order?.orderNumber}</p>
            <p className="text-sm font-medium">{customerName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">from</p>
            <p className="text-sm font-medium">{farmerName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {formatAmount(order?.quantity ?? "", { decimalPlaces: 0 })}{" "}
              {product?.unitType?.slug?.replace("per_", "")}
              {parseInt(order?.quantity ?? "") > 1 && "s"}
            </p>
            <p className="text-sm font-medium">{product?.name}</p>
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
  /* Update the dashboard stats to use the primary color */
  const stats = [
    {
      title: "Total Farmers",
      value: "1,234",
      change: "+12%",
      trend: "up",
      icon: Users,
      description: "Active farmers on platform",
    },
    {
      title: "Total Orders",
      value: "5,678",
      change: "+8%",
      trend: "up",
      icon: ShoppingCart,
      description: "Orders this month",
    },
    // {
    //   title: "Product Categories",
    //   value: "45",
    //   change: "+3",
    //   trend: "up",
    //   icon: Leaf,
    //   description: "Available categories",
    // },
    {
      title: "Revenue",
      value: "$89,432",
      change: "-2%",
      trend: "down",
      icon: CreditCard,
      description: "This month's revenue",
    },
  ];

  // const recentOrders: Array<ordersgrpcOrder> = [
  //   {
  //     orderNumber: "001",
  //     createdBy: "1234567890",
  //     productOwner: "1234567890",
  //     status: "OrderStatus_PAYMENT_SUCCESSFUL",
  //     product: "123456",
  //     price: {
  //       value: 45.99,
  //       currencyIsoCode: "USD",
  //     },
  //     quantity: "4",
  //   },
  //   {
  //     orderNumber: "002",
  //     createdBy: "123456789012",
  //     productOwner: "123456789012",
  //     status: "OrderStatus_IN_TRANSIT",
  //     product: "123456",
  //     price: {
  //       value: 67.6,
  //       currencyIsoCode: "USD",
  //     },
  //     quantity: "1",
  //   },
  //   {
  //     orderNumber: "003",
  //     createdBy: "12345789012",
  //     productOwner: "12345678901",
  //     status: "OrderStatus_DELIVERED",
  //     product: "123456",
  //     price: {
  //       value: 23.75,
  //       currencyIsoCode: "USD",
  //     },
  //     quantity: "3",
  //   },
  //   {
  //     orderNumber: "004",
  //     createdBy: "123457890",
  //     productOwner: "1234567890",
  //     status: "OrderStatus_REJECTED",
  //     product: "123456",
  //     price: {
  //       value: 89.25,
  //       currencyIsoCode: "USD",
  //     },
  //     quantity: "2",
  //   },
  //   {
  //     orderNumber: "005",
  //     createdBy: "123456789012",
  //     productOwner: "1234568891",
  //     status: "OrderStatus_IN_TRANSIT",
  //     product: "123456",
  //     price: {
  //       value: 34.8,
  //       currencyIsoCode: "USD",
  //     },
  //     quantity: "1",
  //   },
  // ];

  const recentOrders: Array<ordersgrpcOrder> = [];

  // const {data: order}

  const { withLoading } = useLoadingState();

  const handleSubmit = async () => {
    await withLoading(
      async () => {
        // Your async operation here
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // return { success: true };
        return { error: true };
      },
      {
        loadingMessage: "Please wait...",
        successMessage: "Successfull",
        errorMessage: "Oh no!!...",
      }
    );
  };

  useEffect(() => {
    handleSubmit();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with FoodHouse today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
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
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
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
            {recentOrders?.length == 0 ? (
              <div>
                <p>No recent orders</p>
              </div>
            ) : (
              recentOrders.map((order) => <OrderItem order={order} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
