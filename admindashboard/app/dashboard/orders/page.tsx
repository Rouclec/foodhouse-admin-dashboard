"use client";

import { FC, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MessageCircle, ShoppingCart, Eye } from "lucide-react";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ordersListOrdersOptions,
  ordersListOrdersDueSoonOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import {
  ordersgrpcOrder,
  ordersgrpcOrderStatus,
} from "@/client/orders.swagger";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { formatCurrency } from "@/utils";
import moment from "moment";
import { usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const STATUS_FILTERS: Array<{
  label: string;
  value: ordersgrpcOrderStatus | string;
}> = [
  {
    label: "All Statuses",
    value: "all",
  },
  {
    label: "Payment Successful",
    value: "OrderStatus_PAYMENT_SUCCESSFUL",
  },
  {
    label: "Approved",
    value: "OrderStatus_APPROVED",
  },
  {
    label: "Rejected",
    value: "OrderStatus_REJECTED",
  },
  {
    label: "In Transit",
    value: "OrderStatus_IN_TRANSIT",
  },
  {
    label: "Delivered",
    value: "OrderStatus_DELIVERED",
  },
];

type OrderRowProps = {
  order: ordersgrpcOrder;
};
// Helper function to get days until delivery
const getDaysUntilDelivery = (
  expectedDeliveryDate: string | undefined
): number | null => {
  if (!expectedDeliveryDate) return null;
  const deliveryDate = moment(expectedDeliveryDate);
  const now = moment();
  const daysUntil = deliveryDate.diff(now, "days");
  return daysUntil;
};

// Helper function to get color class based on days until delivery
const getDueSoonColor = (daysUntil: number | null): string => {
  if (daysUntil === null) return "";
  if (daysUntil < 0) return "bg-red-500 text-white"; // Overdue
  if (daysUntil <= 1) return "bg-red-100 text-red-800"; // Due today/tomorrow
  if (daysUntil <= 3) return "bg-orange-100 text-orange-800"; // Due in 2-3 days
  if (daysUntil <= 7) return "bg-yellow-100 text-yellow-800"; // Due in 4-7 days
  return ""; // More than 7 days - no special color
};

const OrderRow: FC<OrderRowProps> = ({ order }) => {
  const router = useRouter();
  const daysUntilDelivery = getDaysUntilDelivery(order?.expectedDeliveryDate);

  const { data: userData, isLoading: isUserDataLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: order?.createdBy ?? "",
      },
    }),
  });

  const { data: farmerData, isLoading: isFarmerDataLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: order?.productOwner ?? "",
      },
    }),
  });

  const { data: agentData, isLoading: isAgentDataLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: order?.dispatchedBy ?? "",
      },
    }),
    enabled: !!order?.dispatchedBy,
  });

  const handleWhatsAppContact = (
    phone: string,
    userName: string,
    orderId: string
  ) => {
    const message = encodeURIComponent(
      `Hello ${userName}! I'm contacting you regarding order ${orderId}. How can I assist you?`
    );
    const whatsappUrl = `https://wa.me/${phone.replace(
      /[^0-9]/g,
      ""
    )}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const getStatusColor = (status: ordersgrpcOrderStatus | undefined) => {
    switch (status) {
      case "OrderStatus_PAYMENT_SUCCESSFUL":
        return "bg-yellow-100 text-yellow-800";
      case "OrderStatus_APPROVED":
        return "bg-blue-100 text-blue-800";
      case "OrderStatus_IN_TRANSIT":
        return "bg-purple-100 text-purple-800";
      case "OrderStatus_DELIVERED":
        return "bg-green-100 text-green-800";
      case "OrderStatus_REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const viewOrderDetails = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  if (isFarmerDataLoading || isUserDataLoading || isAgentDataLoading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-16">
          <div className="flex items-center justify-center w-full">
            <LoadingSpinner size="sm" text="Loading order data..." />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      key={order.orderNumber}
      className={
        daysUntilDelivery !== null && daysUntilDelivery <= 7
          ? "bg-yellow-50 border-l-4 border-yellow-400"
          : ""
      }
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {order.orderNumber}
          {daysUntilDelivery !== null && daysUntilDelivery <= 7 && (
            <Badge className={getDueSoonColor(daysUntilDelivery)}>
              {daysUntilDelivery < 0
                ? `${Math.abs(daysUntilDelivery)}d overdue`
                : daysUntilDelivery === 0
                ? "Due today"
                : daysUntilDelivery === 1
                ? "Due tomorrow"
                : `Due in ${daysUntilDelivery}d`}
            </Badge>
          )}
        </div>
        <div className="sm:hidden mt-1 text-xs text-gray-500">
          {userData?.user?.firstName} {userData?.user?.lastName}
        </div>
        <div className="md:hidden mt-1 text-xs text-gray-500">
          {farmerData?.user?.firstName} {farmerData?.user?.lastName}
        </div>
        <div className="lg:hidden mt-1 text-xs text-gray-500">
          Agent: {agentData?.user?.firstName ?? "- -"}{" "}
          {agentData?.user?.lastName}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {userData?.user?.firstName} {userData?.user?.lastName}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {farmerData?.user?.firstName} {farmerData?.user?.lastName}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {agentData?.user?.firstName ?? "- -"} {agentData?.user?.lastName}
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(order?.status)}>
          {order?.status?.replace("OrderStatus_", "").split("_").join(" ")}
        </Badge>
        <div className="md:hidden mt-1 text-xs font-medium">
          {formatCurrency(
            (order?.sumTotal?.value ?? 0) + (order?.deliveryFee?.value ?? 0),
            order.sumTotal?.currencyIsoCode ?? ""
          )}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {formatCurrency(
          (order?.sumTotal?.value ?? 0) + (order?.deliveryFee?.value ?? 0),
          order?.sumTotal?.currencyIsoCode ?? ""
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {moment(order?.createdAt).format("DD-MM-YYYY")}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => viewOrderDetails(order?.orderNumber ?? "")}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleWhatsAppContact(
                userData?.user?.phoneNumber ?? "",
                userData?.user?.firstName ?? userData?.user?.lastName ?? "",
                order.orderNumber ?? ""
              )
            }
            title="Contact Customer"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
export default function OrdersPage() {
  const { user } = useContext(Context) as ContextType;

  const pagination = useCursorPagination({
    pageSize: 10,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ordersgrpcOrderStatus | string
  >(STATUS_FILTERS[0].value);

  // Fetch orders due soon (within 7 days)
  const {
    data: dueSoonOrdersData,
    isLoading: isDueSoonLoading,
  } = useQuery({
    ...ordersListOrdersDueSoonOptions({
      path: {
        adminUserId: user?.userId ?? "",
      },
      query: {
        days: "7",
      },
    }),
  });

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    error,
  } = useQuery({
    ...ordersListOrdersOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        count: pagination.pageSize,
        searchKey: searchTerm,
        startKey: pagination.startKey,
        statuses:
          statusFilter !== "all"
            ? [statusFilter]
            : [
                "OrderStatus_PAYMENT_SUCCESSFUL",
                "OrderStatus_APPROVED",
                "OrderStatus_IN_TRANSIT",
                "OrderStatus_DELIVERED",
                "OrderStatus_REJECTED",
              ],
      },
    }),
    placeholderData: keepPreviousData,
  });


  useQueryLoading(isOrdersLoading || isDueSoonLoading);

  const handleNextPage = () => {
    // Only proceed if nextKey exists and is not empty
    if (ordersData?.nextKey && ordersData.nextKey !== "") {
      pagination.goToNextPage(ordersData.nextKey);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Error loading orders
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Orders Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage all customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Order Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter as string}
              onValueChange={(value) =>
                setStatusFilter(value as ordersgrpcOrderStatus)
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter, index) => {
                  return (
                    <SelectItem key={index} value={filter.value as string}>
                      {filter.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Due Soon Orders Section */}
      {dueSoonOrdersData?.orders && dueSoonOrdersData.orders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-900">
              ⚠️ Orders Due Soon ({dueSoonOrdersData.orders.length})
            </CardTitle>
            <CardDescription>
              Orders that need attention - sorted by delivery date
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Order N<sup>o</sup>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Customer
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Farmer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Amount</TableHead>
                  <TableHead className="hidden lg:table-cell">Expected Delivery</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dueSoonOrdersData.orders
                  .sort((a, b) => {
                    const aDays = getDaysUntilDelivery(a?.expectedDeliveryDate);
                    const bDays = getDaysUntilDelivery(b?.expectedDeliveryDate);
                    if (aDays === null && bDays === null) return 0;
                    if (aDays === null) return 1;
                    if (bDays === null) return -1;
                    return aDays - bDays;
                  })
                  .map((order) => (
                    <OrderRow key={order.orderNumber ?? ""} order={order} />
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            Showing {ordersData?.orders?.length ?? 0} order{(ordersData?.orders?.length ?? 0) !== 1 && "s"}
            {dueSoonOrdersData?.orders && dueSoonOrdersData.orders.length > 0 && (
              <span className="ml-2">
                ({dueSoonOrdersData.orders.length} due soon highlighted above)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Order N<sup>o</sup>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Customer
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Farmer</TableHead>
                  <TableHead className="hidden lg:table-cell">Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Amount</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData?.orders?.map((order) => (
                  <OrderRow key={order.orderNumber ?? ""} order={order} />
                ))}
              </TableBody>
            </Table>
            {ordersData?.orders?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No orders found</p>
              </div>
            )}
            <CursorPagination
              currentPage={pagination.currentPage}
              nextKey={ordersData?.nextKey} // Pass the nextKey directly
              canGoToPrevious={pagination.canGoToPrevious}
              onPreviousPage={pagination.goToPreviousPage}
              onNextPage={handleNextPage}
              onFirstPage={pagination.goToFirstPage}
              isLoading={isOrdersLoading}
              itemsPerPage={pagination.pageSize}
              totalItemsOnPage={ordersData?.orders?.length ?? 0}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
