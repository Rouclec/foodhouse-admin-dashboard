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
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ordersCreateSubscriptionPlanMutation,
  ordersListSubscriptionPlansOptions,
  ordersUpdateSubscriptionPlanMutation,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { ordersgrpcSubscription } from "@/client/orders.swagger";
import { formatCurrency } from "@/utils";

const currencies = ["XAF", "TZS", "USD"];

export default function SubscriptionsPage() {
  const { user } = useContext(Context) as ContextType;
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
            subscriptionItems: [], // TODO: Add subscription items UI
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
            subscriptionItems: [], // TODO: Add subscription items UI
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

  const handleEdit = (subscription: ordersgrpcSubscription) => {
    setEditingSubscription(subscription);
    setFormData({
      name: subscription?.title ?? "",
      amount: subscription?.amount?.value?.toString() ?? "",
      currency: subscription?.amount?.currencyIsoCode ?? "XAF",
      description: subscription?.description ?? "",
      duration: subscription?.duration?.toString() ?? "",
      estimatedDeliveryTimeDays: subscription?.estimatedDeliveryTimeDays?.toString() ?? "",
    });
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
        <div className="flex items-center justify-between">
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
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSubscription
                    ? "Edit Subscription"
                    : "Create New Subscription"}
                </DialogTitle>
                <DialogDescription>
                  {editingSubscription
                    ? "Update the subscription information below."
                    : "Add a new subscription type for users."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
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
                    <Label htmlFor="name">Description</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Access to basic features"
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
                <DialogFooter>
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
