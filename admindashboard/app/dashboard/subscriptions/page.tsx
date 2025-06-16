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
import { Plus, Edit, Trash2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  usersCreateSubscriptionMutation,
  usersDeleteSubscriptionMutation,
  usersListSubscriptionsOptions,
  usersUpdateSubscriptionMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { usersgrpcSubscription } from "@/client/users.swagger";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { formatCurrency } from "@/utils";
import moment from "moment";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

const currencies = ["XAF", "TZS", "USD"];

export default function SubscriptionsPage() {
  const { user } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);

  const {
    data: subscriptionsData,
    isLoading: isSubscriptionsLoading,
    refetch,
  } = useQuery({
    ...usersListSubscriptionsOptions({
      path: {
        userId: user?.userId ?? "",
      },
    }),
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<usersgrpcSubscription>();

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
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSubscription) {
      // Update existing subscription
      await updateSubscription({
        body: {
          title: formData?.name,
          description: formData?.description,
          duration: (parseInt(formData?.duration ?? "0") * 30).toString(),
          amount: parseFloat(formData?.amount ?? ""),
          currencyIsoCode: formData?.currency,
        },
        path: {
          adminUserId: user?.userId ?? "",
          subscriptionId: editingSubscription?.id ?? "",
        },
      });
    } else {
      // Create new subscription
      await createSubscription({
        body: {
          title: formData?.name,
          description: formData?.description,
          duration: (parseInt(formData?.duration ?? "0") * 30).toString(),
          amount: parseFloat(formData?.amount ?? ""),
          currencyIsoCode: formData?.currency,
        },
        path: {
          adminUserId: user?.userId ?? "",
        },
      });
    }
  };

  const handleEdit = (subscription: usersgrpcSubscription) => {
    setEditingSubscription(subscription);
    setFormData({
      name: subscription.title ?? "",
      description: subscription?.description ?? "",
      amount: (subscription?.amount?.value ?? 0)?.toString(),
      currency: subscription?.amount?.currencyIsoCode ?? "",
      duration: Math.ceil(
        parseInt(subscription?.duration ?? "0") / 7
      ).toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (subscription: usersgrpcSubscription) => {
    setDeletingSubscriptionId(subscription?.id);
    setDeletingSubscriptionTitle(subscription?.title);
    confirmDelete.openDialog();
  };

  const openCreateDialog = () => {
    setEditingSubscription(undefined);
    setFormData({
      name: "",
      amount: "",
      currency: "XAF",
      description: "",
      duration: "",
    });
    setIsDialogOpen(true);
  };

  const { mutateAsync: createSubscription } = useMutation({
    ...usersCreateSubscriptionMutation(),
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
      });
      setEditingSubscription(undefined);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating subscription",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
      });
    },
  });

  const { mutateAsync: updateSubscription } = useMutation({
    ...usersUpdateSubscriptionMutation(),
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
      });
      setEditingSubscription(undefined);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating subscription",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
      });
    },
  });

  // Confirm delete hook
  const confirmDelete = useConfirmDelete({
    onDelete: async () => {
      setLoading(true);
      if (deletingSubscriptionId) {
        await deleteSubscription({
          path: {
            adminUserId: user?.userId ?? "",
            subscriptionId: deletingSubscriptionId ?? "",
          },
        });
      }
      setLoading(false);
    },
    itemType: deletingSubscriptionTitle,
    description: "Are you sure you want to delete this subscription?",
  });

  useQueryLoading(isSubscriptionsLoading);

  const { mutateAsync: deleteSubscription } = useMutation({
    ...usersDeleteSubscriptionMutation(),
    onSuccess: () => {
      setDeletingSubscriptionTitle(undefined);
      setDeletingSubscriptionId(undefined);
      toast({
        title: "Subscription deleted",
        description: "Subscription has been successfully deleted.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error deleting subscription",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
      });
    },
  });

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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="9.99"
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

                  {formData.amount &&
                    formData.currency &&
                    formData.duration && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700">
                          <strong>Preview:</strong>{" "}
                          {formatCurrency(formData.amount, formData.currency)}{" "}
                          for {formData.duration} weeks
                        </p>
                      </div>
                    )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSubscription
                      ? "Update Subscription"
                      : "Create Subscription"}
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
              {subscriptionsData?.subscriptions?.length ?? 0}
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
                {subscriptionsData?.subscriptions?.map((subscription) => (
                  <TableRow key={subscription?.id}>
                    <TableCell className="font-medium">
                      {subscription?.title}
                      <div className="md:hidden mt-1 text-xs text-gray-500">
                        {Math.ceil(parseInt(subscription.duration ?? "0") / 7)}{" "}
                        weeks
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
                      {Math.ceil(parseInt(subscription.duration ?? "0") / 7)}{" "}
                      weeks
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
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(subscription)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        itemName={deletingSubscriptionTitle}
        isLoading={loading}
      />
    </>
  );
}
