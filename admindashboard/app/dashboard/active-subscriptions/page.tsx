"use client";

import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Eye, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import {
  ordersListAllActiveSubscriptionsOptions,
  ordersGetUserSubscriptionDetailsOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { ordersgrpcUserSubscription } from "@/client/orders.swagger";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { formatCurrency } from "@/utils";
import moment from "moment";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";

export default function ActiveSubscriptionsPage() {
  const { user } = useContext(Context) as ContextType;
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSubscription, setSelectedSubscription] = useState<
    ordersgrpcUserSubscription | undefined
  >(undefined);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const {
    data: subscriptionsData,
    isLoading: isSubscriptionsLoading,
    refetch,
  } = useQuery({
    ...ordersListAllActiveSubscriptionsOptions({
      path: {
        adminUserId: user?.userId ?? "",
      },
      query: {
        activeOnly: true,
      },
    }),
  });

  const {
    data: subscriptionDetailsData,
    isLoading: isSubscriptionDetailsLoading,
  } = useQuery({
    ...ordersGetUserSubscriptionDetailsOptions({
      path: {
        userId: selectedSubscription?.userId ?? "",
        subscriptionId: selectedSubscription?.publicId ?? "",
      },
    }),
    enabled: !!selectedSubscription?.publicId && isDetailsDialogOpen,
  });

  const { data: userData } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: selectedSubscription?.userId ?? "",
      },
    }),
    enabled: !!selectedSubscription?.userId && isDetailsDialogOpen,
  });

  useQueryLoading(isSubscriptionsLoading);

  const handleViewDetails = (subscription: ordersgrpcUserSubscription) => {
    setSelectedSubscription(subscription);
    setIsDetailsDialogOpen(true);
  };

  const getProgressColor = (progress: number | undefined) => {
    if (!progress) return "bg-gray-200";
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
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

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return moment(date).format("MMM D, YYYY");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Active Subscriptions
          </h1>
          <p className="text-gray-600">
            View and track all active user subscriptions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Active Subscriptions Overview
          </CardTitle>
          <CardDescription>
            Track subscription progress and delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubscriptionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : subscriptionsData?.subscriptions &&
            subscriptionsData.subscriptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscription ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Soonest Delivery</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionsData.subscriptions.map((subscription) => {
                  const daysUntilDelivery = getDaysUntilDelivery(
                    subscription.soonestDeliveryDate
                  );
                  const dueSoonColor = getDueSoonColor(daysUntilDelivery);
                  return (
                    <TableRow
                      key={subscription.publicId}
                      className={dueSoonColor || ""}>
                      <TableCell className="font-mono text-sm">
                        {subscription.publicId}
                      </TableCell>
                      <TableCell>{subscription.userId}</TableCell>
                      <TableCell>
                        {formatCurrency(
                          subscription.amount?.value ?? 0,
                          subscription.amount?.currencyIsoCode ?? "XAF"
                        )}
                      </TableCell>
                      <TableCell>
                        {subscription.soonestDeliveryDate ? (
                          <div>
                            <div className="font-medium">
                              {formatDate(subscription.soonestDeliveryDate)}
                            </div>
                            {daysUntilDelivery !== null && (
                              <div className="text-xs text-gray-500">
                                {daysUntilDelivery < 0
                                  ? `${Math.abs(daysUntilDelivery)} days overdue`
                                  : daysUntilDelivery === 0
                                  ? "Due today"
                                  : daysUntilDelivery === 1
                                  ? "Due tomorrow"
                                  : `Due in ${daysUntilDelivery} days`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No pending orders</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(
                                subscription.progress
                              )}`}
                              style={{
                                width: `${subscription.progress ?? 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 min-w-[3rem]">
                            {Math.round(subscription.progress ?? 0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            subscription.isCustom ? "default" : "secondary"
                          }>
                          {subscription.isCustom ? "Custom" : "Plan"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(subscription.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(subscription)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No active subscriptions found
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              View subscription information and associated orders
            </DialogDescription>
          </DialogHeader>
          {isSubscriptionDetailsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subscription Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Subscription ID</p>
                      <p className="font-mono text-sm">
                        {selectedSubscription?.publicId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">User</p>
                      <p className="text-sm">
                        {userData?.user?.firstName} {userData?.user?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-sm font-semibold">
                        {formatCurrency(
                          selectedSubscription?.amount?.value ?? 0,
                          selectedSubscription?.amount?.currencyIsoCode ??
                            "XAF"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(
                              selectedSubscription?.progress
                            )}`}
                            style={{
                              width: `${selectedSubscription?.progress ?? 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.round(selectedSubscription?.progress ?? 0)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <Badge
                        variant={
                          selectedSubscription?.isCustom
                            ? "default"
                            : "secondary"
                        }>
                        {selectedSubscription?.isCustom ? "Custom" : "Plan"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-sm">
                        {formatDate(selectedSubscription?.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Associated Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionDetailsData?.orders &&
                  subscriptionDetailsData.orders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Expected Delivery</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptionDetailsData.orders.map((order) => (
                          <TableRow key={order.orderNumber}>
                            <TableCell className="font-mono text-sm">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  order.status ===
                                  "OrderStatus_DELIVERED"
                                    ? "default"
                                    : "secondary"
                                }>
                                {order.status?.replace("OrderStatus_", "")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                order.sumTotal?.value ?? 0,
                                order.sumTotal?.currencyIsoCode ?? "XAF"
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDate(order.expectedDeliveryDate)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/orders/${order.orderNumber}`
                                  )
                                }>
                                View Order
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No orders found for this subscription
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

