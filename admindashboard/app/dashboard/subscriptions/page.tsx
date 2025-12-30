"use client";

import { DialogFooter } from "@/components/ui/dialog";

import type React from "react";

import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ordersCreateSubscriptionPlanMutation,
  ordersListSubscriptionPlansOptions,
  ordersUpdateSubscriptionPlanMutation,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { ordersgrpcSubscription } from "@/client/orders.swagger";
import { formatCurrency } from "@/utils";
import {
  productsListProductsOptions,
} from "@/client/products.swagger/@tanstack/react-query.gen";
import { productsgrpcProduct } from "@/client/products.swagger";
import { productsGetProduct } from "@/client/products.swagger/sdk.gen";
import { X } from "lucide-react";

const currencies = ["XAF", "TZS", "USD"];

export default function SubscriptionsPage() {
  const { user } = useContext(Context) as ContextType;
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const {
    data: subscriptionsData,
    isLoading: isSubscriptionsLoading,
    refetch,
  } = useQuery({
    ...ordersListSubscriptionPlansOptions({
      path: {
        adminUserId: user?.userId ?? "",
      },
    }),
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<ordersgrpcSubscription>();

  const [deletingSubscriptionId, setDeletingSubscriptionId] =
    useState<string>();

  const [deletingSubscriptionTitle, setDeletingSubscriptionTitle] =
    useState<string>();

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    description: "",
    currency: "XAF",
    duration: "",
    estimatedDeliveryTimeDays: "",
  });

  // Subscription items state: each item has productId, quantity, orderIndex
  type SubscriptionItem = {
    productId: string;
    quantity: number;
    orderIndex: number;
    product?: productsgrpcProduct; // Enriched product data
  };
  const [subscriptionItems, setSubscriptionItems] = useState<SubscriptionItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0);

  // Fetch products for selection
  const {
    data: productsData,
    isLoading: isProductsLoading,
  } = useQuery({
    ...productsListProductsOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        count: 100, // Get enough products to choose from
        isApproved: true, // Only show approved products
        "userLocation.address": "",
        "userLocation.lat": 999.0,
        "userLocation.lon": 999.0,
      },
    }),
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      if (editingSubscription) {
        // Update existing subscription
        await updateSubscription({
          body: {
            title: formData?.name,
            description: formData?.description,
            duration: formData?.duration ? formData.duration : undefined, // duration in weeks (as string)
            amount: {
              value: parseFloat(formData?.amount ?? ""),
              currencyIsoCode: formData?.currency,
            },
            subscriptionItems: subscriptionItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity.toString(),
              orderIndex: item.orderIndex,
            })),
            estimatedDeliveryTimeDays: formData?.estimatedDeliveryTimeDays
              ? formData.estimatedDeliveryTimeDays
              : undefined,
          },
          path: {
            adminUserId: user?.userId ?? "",
            subscriptionPlanId: editingSubscription.id ?? "",
          },
        });
      } else {
        // Create new subscription
        await createSubscription({
          body: {
            title: formData?.name,
            description: formData?.description,
            duration: formData?.duration || "0", // duration in weeks (as string)
            amount: {
              value: parseFloat(formData?.amount ?? ""),
              currencyIsoCode: formData?.currency,
            },
            subscriptionItems: subscriptionItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity.toString(),
              orderIndex: item.orderIndex,
            })),
            estimatedDeliveryTimeDays: formData?.estimatedDeliveryTimeDays
              ? formData.estimatedDeliveryTimeDays
              : undefined,
          },
          path: {
            adminUserId: user?.userId ?? "",
          },
        });
      }
    } catch (error) {
      console.error({ error }, editingSubscription ? "updating" : "creating subscription plan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (subscription: ordersgrpcSubscription) => {
    setEditingSubscription(subscription);
    setFormData({
      name: subscription?.title ?? "",
      amount: subscription?.amount?.value?.toString() ?? "",
      currency: subscription?.amount?.currencyIsoCode ?? "XAF",
      description: subscription?.description ?? "",
      duration: subscription?.duration?.toString() ?? "",
      estimatedDeliveryTimeDays: subscription?.estimatedDeliveryTimeDays?.toString() ?? "",
    });

    // Load subscription items and fetch product details
    const subscriptionItemsData = subscription?.subscriptionItems ?? [];

    // Fetch all products in parallel
    const productPromises = subscriptionItemsData.map(async (si) => {
      try {
        const { data } = await productsGetProduct({
          path: {
            productId: si?.productId ?? "",
          },
          throwOnError: false,
        });
        return {
          productId: si?.productId ?? "",
          quantity: typeof si?.quantity === 'string' ? parseInt(si.quantity) : (si?.quantity ?? 1),
          orderIndex: si?.orderIndex ?? 0,
          product: data?.product as productsgrpcProduct,
        };
      } catch (error) {
        console.error(`Error fetching product ${si?.productId}:`, error);
        // Return item without product data if fetch fails
        return {
          productId: si?.productId ?? "",
          quantity: typeof si?.quantity === 'string' ? parseInt(si.quantity) : (si?.quantity ?? 1),
          orderIndex: si?.orderIndex ?? 0,
          product: undefined,
        };
      }
    });

    const fetchedItems = await Promise.all(productPromises);
    setSubscriptionItems(fetchedItems);
    setIsDialogOpen(true);
  };

  const handleDelete = (subscription: ordersgrpcSubscription) => {
    // TODO: Implement delete when DeleteSubscriptionPlan endpoint is added
    toast({
      title: "Delete not available",
      description: "Subscription plan deletion will be available soon.",
    });
  };

  const openCreateDialog = () => {
    setEditingSubscription(undefined);
    setFormData({
      name: "",
      amount: "",
      currency: "XAF",
      description: "",
      duration: "",
      estimatedDeliveryTimeDays: "",
    });
    setSubscriptionItems([]);
    setSelectedProductId("");
    setSelectedQuantity("1");
    setSelectedOrderIndex(0);
    setIsDialogOpen(true);
  };

  const { mutateAsync: createSubscription } = useMutation({
    ...ordersCreateSubscriptionPlanMutation(),
    onSuccess: () => {
      toast({
        title: "Subscription created",
        description: "The new subscription type has been successfully created.",
      });

      setFormData({
        name: "",
        amount: "",
        description: "",
        currency: "XAF",
        duration: "",
        estimatedDeliveryTimeDays: "",
      });
      setSubscriptionItems([]);
      setSelectedProductId("");
      setSelectedQuantity("1");
      setSelectedOrderIndex(0);
      setEditingSubscription(undefined);
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating subscription",
        description:
          error?.response?.data?.message ?? "An unknown error occurred",
      });
    },
  });

  const { mutateAsync: updateSubscription } = useMutation({
    ...ordersUpdateSubscriptionPlanMutation(),
    onSuccess: () => {
      toast({
        title: "Subscription updated",
        description: "The subscription type has been successfully updated.",
      });

      setFormData({
        name: "",
        amount: "",
        description: "",
        currency: "XAF",
        duration: "",
        estimatedDeliveryTimeDays: "",
      });
      setSubscriptionItems([]);
      setSelectedProductId("");
      setSelectedQuantity("1");
      setSelectedOrderIndex(0);
      setEditingSubscription(undefined);
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating subscription",
        description:
          error?.response?.data?.message ?? "An unknown error occurred",
      });
    },
  });

  // TODO: Re-enable delete when DeleteSubscriptionPlan endpoint is added

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Subscription Types
            </h1>
            <p className="text-gray-600">
              Manage subscription plans for farmers and customers
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] flex flex-col w-[95vw] sm:min-w-[600px] sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSubscription
                    ? "Edit Subscription Plan"
                    : "Create New Subscription Plan"}
                </DialogTitle>
                <DialogDescription>
                  {editingSubscription
                    ? "Update the subscription information below."
                    : "Add a new subscription type for users."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="space-y-4 py-4 px-1 overflow-y-auto flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="name">Subscription Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Basic Plan, Premium Plan"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="e.g., Weekly delivery of fresh vegetables"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="1000.00"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) =>
                          setFormData({ ...formData, currency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (weeks)</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="4"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedDeliveryTimeDays">
                        Estimated Delivery Time (days)
                      </Label>
                      <Input
                        id="estimatedDeliveryTimeDays"
                        type="number"
                        placeholder="7"
                        value={formData.estimatedDeliveryTimeDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estimatedDeliveryTimeDays: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Subscription Products Section */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">
                        Subscription Products
                      </Label>
                    </div>

                    {/* Add Product Form */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-5">
                          <Label className="text-xs mb-1 block">Product</Label>
                          <Select
                            value={selectedProductId}
                            onValueChange={setSelectedProductId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {productsData?.products
                                ?.filter(
                                  (p) =>
                                    !subscriptionItems.some(
                                      (si) => si.productId === p?.id
                                    )
                                )
                                .map((product) => (
                                  <SelectItem
                                    key={product?.id}
                                    value={product?.id ?? ""}
                                  >
                                    {product?.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs mb-1 block">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={selectedQuantity}
                            onChange={(e) =>
                              setSelectedQuantity(e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs mb-1 block">Order #</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={selectedOrderIndex.toString()}
                            onChange={(e) =>
                              setSelectedOrderIndex(
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <div className="col-span-3 flex items-end">
                          <Button
                            type="button"
                            onClick={() => {
                              if (
                                selectedProductId &&
                                selectedQuantity &&
                                parseInt(selectedQuantity) > 0
                              ) {
                                const product = productsData?.products?.find(
                                  (p) => p?.id === selectedProductId
                                );
                                setSubscriptionItems([
                                  ...subscriptionItems,
                                  {
                                    productId: selectedProductId,
                                    quantity: parseInt(selectedQuantity),
                                    orderIndex: selectedOrderIndex,
                                    product: product,
                                  },
                                ]);
                                setSelectedProductId("");
                                setSelectedQuantity("1");
                              }
                            }}
                            disabled={!selectedProductId || !selectedQuantity}
                            className="w-full"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>Tip:</strong> Products with the same Order # (e.g., all "0") will be delivered in a single order.
                        Use different Order #s (0, 1, 2...) to split delivery across multiple orders.
                      </p>
                    </div>

                    {/* Products List grouped by order */}
                    {subscriptionItems.length > 0 && (
                      <div className="space-y-3">
                        {Array.from(
                          new Set(
                            subscriptionItems.map((si) => si.orderIndex)
                          )
                        )
                          .sort((a, b) => a - b)
                          .map((orderIdx) => {
                            const itemsInOrder = subscriptionItems.filter(
                              (si) => si.orderIndex === orderIdx
                            );
                            return (
                              <div
                                key={orderIdx}
                                className="border rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="font-semibold">
                                    Order #{orderIdx + 1} Delivery
                                  </Label>
                                  <Badge variant="outline">
                                    {itemsInOrder.length} product
                                    {itemsInOrder.length !== 1 ? "s" : ""}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  {itemsInOrder.map((item, idx) => {
                                    const fullItem = subscriptionItems.findIndex(
                                      (si) =>
                                        si.productId === item.productId &&
                                        si.orderIndex === item.orderIndex
                                    );
                                    return (
                                      <div
                                        key={`${item.productId}-${idx}`}
                                        className="flex items-center justify-between p-2 bg-white rounded border"
                                      >
                                        <div className="flex-1">
                                          <span className="font-medium">
                                            {item.product?.name ??
                                              item.productId}
                                          </span>
                                          <span className="text-sm text-muted-foreground ml-2">
                                            x{item.quantity}
                                          </span>
                                          {item.product?.amount && (
                                            <span className="text-sm text-muted-foreground ml-2">
                                              (
                                              {formatCurrency(
                                                (item.product.amount.value ?? 0) *
                                                item.quantity,
                                                item.product.amount
                                                  .currencyIsoCode ?? "XAF"
                                              )}
                                              )
                                            </span>
                                          )}
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSubscriptionItems(
                                              subscriptionItems.filter(
                                                (_, i) => i !== fullItem
                                              )
                                            );
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {formData.amount &&
                    formData.currency &&
                    formData.duration && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700">
                          <strong>Preview:</strong>{" "}
                          {formatCurrency(formData.amount, formData.currency)}{" "}
                          for {formData.duration} weeks
                          {formData.estimatedDeliveryTimeDays && (
                            <span>
                              {" "}
                              • Delivery in ~{formData.estimatedDeliveryTimeDays}{" "}
                              days
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                </div>
                <DialogFooter className="mt-4 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`${loading &&
                      "bg-gray-500 hover:bg-grey-500 hover:cursor-not-allowed bg-opacity-80"
                      }`}
                  >
                    {editingSubscription
                      ? "Update Subscription"
                      : "Create Subscription"}
                    {loading && (
                      <Loader2 className={"animate-spin text-white"} />
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Subscription Overview
            </CardTitle>
            <CardDescription>
              Total subscription types:{" "}
              {subscriptionsData?.subscriptionPlans?.length ?? 0}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Duration
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Created By
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionsData?.subscriptionPlans?.map((subscription) => (
                  <TableRow key={subscription?.id}>
                    <TableCell className="font-medium">
                      {subscription?.title}
                      <div className="md:hidden mt-1 text-xs text-gray-500">
                        {subscription?.duration ?? 0} weeks
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatCurrency(
                          subscription?.amount?.value ?? 0,
                          subscription?.amount?.currencyIsoCode ?? ""
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {subscription?.duration ?? 0} weeks
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {"Admin"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(subscription)}
                          title="Edit subscription"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(subscription)}
                          disabled
                          title="Delete functionality coming soon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {subscriptionsData?.subscriptionPlans?.length === 0 && !isSubscriptionsLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No subscription plans found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
