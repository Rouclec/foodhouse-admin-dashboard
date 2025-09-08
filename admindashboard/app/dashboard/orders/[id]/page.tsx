"use client";

import { useContext, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  User,
  MapPin,
  Tractor,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ordersGetOrderDetailsOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import {
  usersGetFarmerByIdOptions,
  usersGetUserByIdOptions,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { ordersgrpcOrderStatus } from "@/client/orders.swagger";
import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { formatCurrency } from "@/utils";
import {
  ordersApproveOrderMutation,
  ordersRejectOrderMutation,
  ordersConfirmDeliveryMutation,
} from "@/client/orders.swagger/@tanstack/react-query.gen";

export default function OrderDetailsPage() {
  const { user } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const handleContactViaWhatsApp = (
    phone: string,
    name: string,
    role: string
  ) => {
    const message = encodeURIComponent(
      `Hello ${name}! I'm contacting you from FoodHouse admin team regarding order ${params.id}.\n`
    );
    const whatsappUrl = `https://wa.me/${phone.replace(
      /[^0-9]/g,
      ""
    )}?text=${message}`;
    window.open(whatsappUrl, "_blank");

    toast({
      title: `Contacting ${role}`,
      description: `Opening WhatsApp chat with ${name}`,
    });
  };

  const handleCall = (phone: string, name: string, role: string) => {
    window.location.href = `tel:${phone}`;

    toast({
      title: `Calling ${role}`,
      description: `Initiating call to ${name} at ${phone}`,
    });
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const {
    data: orderDetailsData,
    isLoading: isOrderDetailsLoading,
    refetch,
  } = useQuery({
    ...ordersGetOrderDetailsOptions({
      path: {
        userId: user?.userId ?? "",
        orderNumber: (params.id as string) ?? "",
      },
    }),
  });

  const { data: userData, isLoading: isUserDataLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: orderDetailsData?.order?.createdBy ?? "",
      },
    }),
    enabled: !!orderDetailsData?.order?.createdBy,
  });

  const { data: farmerData, isLoading: isFarmerDataLoading } = useQuery({
    ...usersGetFarmerByIdOptions({
      path: {
        farmerId: orderDetailsData?.order?.productOwner ?? "",
        userId: user?.userId ?? "",
      },
    }),
    enabled: !!orderDetailsData?.order?.productOwner,
  });

  const { data: agentData, isLoading: isAgentDataLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: orderDetailsData?.order?.dispatchedBy ?? "",
      },
    }),
    enabled: !!orderDetailsData?.order?.dispatchedBy,
  });

  const { data: approver, isLoading: isApproverLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId:
          orderDetailsData?.auditLog?.find(
            (log) =>
              log.after?.status === "OrderStatus_APPROVED" ||
              log.after?.status === "OrderStatus_REJECTED"
          )?.actor ?? "",
      },
    }),
    enabled:
      orderDetailsData?.auditLog?.findIndex(
        (log) =>
          log.after?.status === "OrderStatus_APPROVED" ||
          log.after?.status === "OrderStatus_REJECTED"
      ) != -1, // only enable this query when the order has been approved or rejected, else, avoid unneccesary call
  });

  const { data: productData, isLoading: isProductDataLoading } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: orderDetailsData?.order?.product ?? "",
      },
    }),
    enabled: !!orderDetailsData?.order?.product,
  });

  const { mutateAsync: approveOrder } = useMutation({
    ...ordersApproveOrderMutation(),
    onSuccess: async () => {
      refetch();
      toast({
        title: "Order Approved Successfully",
        description: "The order has been approved and is now being processed.",
      });
    },
    onError: async (error: any) => {
      const errorMessage =
        error?.response?.data?.message ?? "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: rejectOrder } = useMutation({
    ...ordersRejectOrderMutation(),
    onSuccess: async () => {
      refetch();
      setShowRejectModal(false);
      toast({
        title: "Order Rejected",
        description: "The order has been rejected successfully.",
      });
    },
    onError: async (error: any) => {
      const errorMessage =
        error?.response?.data?.message ?? "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: confirmDelivery } = useMutation({
    ...ordersConfirmDeliveryMutation(),
    onSuccess: async () => {
      refetch();
      toast({
        title: "Delivery Confirmed",
        description: "The order delivery has been confirmed successfully.",
      });
    },
    onError: async (error: any) => {
      const errorMessage =
        error?.response?.data?.message ?? "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleApproveOrder = async () => {
    try {
      setLoading(true);
      await approveOrder({
        body: {},
        path: {
          orderId: orderDetailsData?.order?.orderNumber ?? "",
          userId: user?.userId ?? "",
        },
      });
    } catch (error) {
      console.error({ error }, "approving order");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    try {
      setLoading(true);
      await rejectOrder({
        body: {
          reason: rejectReason,
        },
        path: {
          orderId: orderDetailsData?.order?.orderNumber ?? "",
          userId: user?.userId ?? "",
        },
      });
      setRejectReason("");
    } catch (error) {
      console.error({ error }, "rejecting order");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    try {
      setLoading(true);
      await confirmDelivery({
        body: {},
        path: {
          secretKey: orderDetailsData?.order?.secretKey ?? "",
          userId: user?.userId ?? "",
        },
      });
    } catch (error) {
      console.error({ error }, "confirming delivery");
    } finally {
      setLoading(false);
    }
  };

  if (
    isOrderDetailsLoading ||
    isFarmerDataLoading ||
    isUserDataLoading ||
    isAgentDataLoading ||
    isProductDataLoading ||
    isApproverLoading
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600">Loading order information...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">
                  Loading order details...
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!orderDetailsData?.order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order Not Found
            </h1>
            <p className="text-gray-600">
              The requested order could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Reject Order</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full p-2 border rounded mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleRejectOrder}
                disabled={!rejectReason || loading}
              >
                {loading ? "Processing..." : "Confirm Rejection"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order {orderDetailsData?.order.orderNumber}
            </h1>
            <div className="flex items-center mt-1">
              <Badge className={getStatusColor(orderDetailsData?.order.status)}>
                {orderDetailsData?.order.status
                  ?.replace("OrderStatus_", "")
                  .split("_")
                  .join(" ")}
              </Badge>
              <span className="mx-2 text-gray-500">•</span>
              <span className="text-sm text-gray-600">
                {formatDate(orderDetailsData?.order.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {orderDetailsData?.order.status ===
            "OrderStatus_PAYMENT_SUCCESSFUL" && (
            <>
              <Button
                variant="default"
                onClick={handleApproveOrder}
                disabled={loading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {loading ? "Processing..." : "Approve Order"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Reject Order
              </Button>
            </>
          )}

          {orderDetailsData?.order.status === "OrderStatus_IN_TRANSIT" && (
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleConfirmDelivery}
              disabled={loading}
            >
              <Truck className="h-4 w-4 mr-2" />
              {loading ? "Processing..." : "Confirm Delivery"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order Summary
            </CardTitle>
            <CardDescription>Order details and products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Products</h3>
                <div className="mt-3 border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr key={productData?.product?.id ?? ""}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {productData?.product?.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                          {orderDetailsData?.order.quantity}{" "}
                          {productData?.product?.unitType?.replace("per_", "")}
                          {parseInt(orderDetailsData?.order.quantity ?? "") >
                            1 && "s"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(
                            productData?.product?.amount?.value ?? 0,
                            productData?.product?.amount?.currencyIsoCode ?? ""
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(
                            (productData?.product?.amount?.value ?? 0) *
                              parseInt(orderDetailsData?.order?.quantity ?? ""),
                            productData?.product?.amount?.currencyIsoCode ?? ""
                          )}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-sm font-medium text-gray-900 text-right"
                        >
                          Subtotal
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(
                            (productData?.product?.amount?.value ?? 0) *
                              parseInt(orderDetailsData?.order?.quantity ?? ""),
                            productData?.product?.amount?.currencyIsoCode ?? ""
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-sm font-medium text-gray-900 text-right"
                        >
                          Delivery Fee
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(
                            orderDetailsData?.order?.deliveryFee?.value ?? "0",
                            orderDetailsData?.order.deliveryFee
                              ?.currencyIsoCode ?? ""
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-sm font-medium text-gray-900 text-right"
                        >
                          Service Fee
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(
                            (orderDetailsData?.order.price?.value ?? 0) -
                              (productData?.product?.amount?.value ?? 0) *
                                parseInt(
                                  orderDetailsData?.order?.quantity ?? ""
                                ),
                            orderDetailsData?.order.price?.currencyIsoCode ?? ""
                          )}
                        </td>
                      </tr>

                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-sm font-bold text-gray-900 text-right"
                        >
                          Grand Total
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(
                            (orderDetailsData?.order?.price?.value ?? 0) +
                              (orderDetailsData?.order?.deliveryFee?.value ??
                                0),
                            orderDetailsData?.order.price?.currencyIsoCode ?? ""
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Delivery Information</h3>
                <div className="mt-3 flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {orderDetailsData?.order?.deliveryLocation?.address}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Timeline */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Order Timeline
            </CardTitle>
            <CardDescription>Status updates and history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ol className="relative border-l border-gray-200 ml-3">
                {orderDetailsData?.auditLog?.map((log, index) => (
                  <li key={log.action} className="mb-6 ml-6">
                    <span
                      className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white ${
                        index === 0 ? "bg-green-200" : "bg-blue-200"
                      }`}
                    >
                      {index === 0 ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-blue-600" />
                      )}
                    </span>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <Badge className={getStatusColor(log.after?.status)}>
                          {log.after?.status
                            ?.replace("OrderStatus_", "")
                            .split("_")
                            .join(" ")
                            .trim()}
                        </Badge>
                        <time className="text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </time>
                      </div>
                      <p className="text-sm font-normal text-gray-700">
                        {log.reason}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        By:{" "}
                        {log.after?.status === "OrderStatus_CREATED"
                          ? `${userData?.user?.firstName} ${userData?.user?.lastName}`
                          : log.after?.status === "OrderStatus_APPROVED" ||
                            log.after?.status === "OrderStatus_REJECTED"
                          ? `${approver?.user?.firstName} ${
                              approver?.user?.lastName
                            } ${
                              approver?.user?.userId !==
                              farmerData?.user?.userId
                                ? `(${approver?.user?.role?.replace(
                                    "USER_ROLE_",
                                    ""
                                  )})`
                                : ""
                            } `
                          : log.after?.status === "OrderStatus_IN_TRANSIT"
                          ? `${agentData?.user?.firstName} ${agentData?.user?.lastName}`
                          : log.actor}
                      </p>
                    </div>
                  </li>
                ))}
                {orderDetailsData.order.status !== "OrderStatus_DELIVERED" &&
                  orderDetailsData?.order?.status !==
                    "OrderStatus_PAYMENT_FAILED" &&
                  orderDetailsData?.order?.status !==
                    "OrderStatus_REJECTED" && (
                    <li className="ml-6">
                      <span className="absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white bg-gray-100">
                        <AlertCircle className="w-3 h-3 text-gray-500" />
                      </span>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                        <p className="text-sm font-normal text-gray-500">
                          Awaiting next update...
                        </p>
                      </div>
                    </li>
                  )}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* People Involved */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>People Involved</CardTitle>
            <CardDescription>
              Contact information for all parties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Customer */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {
                          (userData?.user?.firstName ??
                            userData?.user?.lastName ??
                            "")[0]
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-medium flex items-center">
                        <User className="h-4 w-4 mr-1 text-blue-600" />
                        Customer
                      </h3>
                      <p className="text-base font-medium">
                        {userData?.user?.firstName} {userData?.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {userData?.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleContactViaWhatsApp(
                          userData?.user?.phoneNumber ?? "",
                          userData?.user?.firstName ??
                            userData?.user?.lastName ??
                            "",
                          "Customer"
                        )
                      }
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCall(
                          userData?.user?.phoneNumber ?? "",
                          userData?.user?.firstName ??
                            userData?.user?.lastName ??
                            "",
                          "Customer"
                        )
                      }
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              </div>

              {/* Farmer */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-green-100 text-green-800">
                        {
                          (farmerData?.user?.firstName ??
                            farmerData?.user?.lastName ??
                            "")[0]
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-medium flex items-center">
                        <Tractor className="h-4 w-4 mr-1 text-green-600" />
                        Farmer
                      </h3>
                      <p className="text-base font-medium">
                        {farmerData?.user?.firstName}{" "}
                        {farmerData?.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {farmerData?.user?.address}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="flex items-center mr-3">
                          <svg
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          {farmerData?.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleContactViaWhatsApp(
                          farmerData?.user?.phoneNumber ?? "",
                          farmerData?.user?.firstName ??
                            farmerData?.user?.lastName ??
                            "",
                          "Farmer"
                        )
                      }
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCall(
                          farmerData?.user?.phoneNumber ?? "",
                          farmerData?.user?.firstName ??
                            farmerData?.user?.lastName ??
                            "",
                          "Farmer"
                        )
                      }
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              </div>

              {/* Delivery Agent */}
              {!!agentData && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-purple-100 text-purple-800">
                          {
                            (agentData?.user?.firstName ??
                              agentData?.user?.lastName ??
                              "")[0]
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-medium flex items-center">
                          <Truck className="h-4 w-4 mr-1 text-purple-600" />
                          Field agent
                        </h3>
                        <p className="text-base font-medium">
                          {agentData?.user?.firstName}{" "}
                          {agentData?.user?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleContactViaWhatsApp(
                            agentData?.user?.phoneNumber ?? "",
                            agentData?.user?.firstName ??
                              agentData?.user?.lastName ??
                              "",
                            "Agent"
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCall(
                            agentData?.user?.phoneNumber ?? "",
                            agentData?.user?.firstName ??
                              agentData?.user?.lastName ??
                              "",
                            "Agent"
                          )
                        }
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
