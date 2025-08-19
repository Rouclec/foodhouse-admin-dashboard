"use client";

import { useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  History,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { useQueryLoading } from "@/hooks/use-query-loading";
import type { usersgrpcUserStatus } from "@/client/users.swagger";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import {
  ordersBulkSettleCommissionsMutation,
  ordersListCommissionsByReferrerOptions,
  ordersListPaymentsOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Button } from "../ui/button";
import { typesAmount } from "@/client/products.swagger";

type AggregatedCommission = {
  currency: string;
  totalValue: number;
  ids: string[];
};
interface MarketingAgentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

export function MarketingAgentDetailsDialog({
  isOpen,
  onClose,
  agentId,
}: MarketingAgentDetailsDialogProps) {
  const { user } = useContext(Context) as ContextType;

  const [payingCommission, setPayingCommission] = useState<typesAmount>();
  // const [payingCommisso]
  const [activeTab, setActiveTab] = useState<"commissions" | "payments">(
    "commissions"
  );
  const [aggregatedCommissions, setAggregatedCommissions] =
    useState<Array<AggregatedCommission>>();

  const { toast } = useToast();

  const { data: userData, isLoading: isUserDataLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: agentId,
      },
    }),
  });

  const { data: paymentsData, isLoading: isPaymentsDataLoading } = useQuery({
    ...ordersListPaymentsOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        paymentEntity: "PaymentEntity_COMMISSION",
        searchKey: userData?.user?.phoneNumber,
        startKey: "",
        count: 5,
      },
    }),
    enabled: activeTab == "payments",
  });

  const { data: commissionsData, isLoading: isCommissionsDataLoading } =
    useQuery({
      ...ordersListCommissionsByReferrerOptions({
        path: {
          adminUserId: user?.userId ?? "",
          referrerId: agentId,
        },
        query: {
          isPaid: false,
        },
      }),
      enabled: activeTab == "commissions",
    });

  useQueryLoading(
    isUserDataLoading || isCommissionsDataLoading || isPaymentsDataLoading
  );

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(userData?.user?.referralCode ?? "");
    toast({
      title: "Referral Code Copied",
      description: "The referral code has been copied to your clipboard.",
    });
  };

  useEffect(() => {
    const result: AggregatedCommission[] =
      commissionsData?.commissions?.reduce(
        (acc: AggregatedCommission[], curr) => {
          const currency = curr?.commissionAmount?.currencyIsoCode ?? "";
          const value = Number(curr?.commissionAmount?.value ?? 0);

          let existing = acc.find((item) => item.currency === currency);
          if (existing) {
            existing.totalValue += value;
            existing.ids.push(curr.id ?? "");
          } else {
            acc.push({
              currency,
              totalValue: value,
              ids: [curr.id ?? ""],
            });
          }
          return acc;
        },
        []
      ) ?? [];

    setAggregatedCommissions(result);
  }, [commissionsData]);

  const getStatusColor = (status: usersgrpcUserStatus | undefined) => {
    switch (status) {
      case "UserStatus_ACTIVE":
        return "bg-green-100 text-green-800";
      case "UserStatus_SUSPENDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePayCommission = async (
    amount: number,
    currency: string,
    ids: string[]
  ) => {
    setPayingCommission({
      value: amount,
      currencyIsoCode: currency,
    });

    try {
      await mutateAsync({
        body: {
          commissionIds: ids,
        },
        path: { adminUserId: user?.userId ?? "" },
      });
    } catch (error) {
      console.error("Pay commission error:", error);
    } finally {
      setPayingCommission(undefined);
    }
  };

  const { mutateAsync } = useMutation({
    ...ordersBulkSettleCommissionsMutation(),
    onSuccess: () => {
      toast({
        title: "Commission Paid",
        description: `Successfully paid ${formatCurrency(
          payingCommission?.value ?? "",
          payingCommission?.currencyIsoCode ?? ""
        )} commission.`,
      });
    },
    onError: (error) => {
      toast({
        title: `Payment failed`,
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
  });

  if (!userData?.user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px] max-w-[95vw] mx-auto">
          <div className="flex items-center justify-center p-8">
            <div>Agent not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-w-[95vw] max-h-[95vh] mx-auto overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-5 w-5" />
            <span className="truncate">
              {userData?.user.firstName} - Marketing Agent Details
            </span>
          </DialogTitle>
          <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span>Referral Code:</span>
            <Badge
              variant="outline"
              className="font-mono w-fit cursor-copy"
              onClick={copyToClipboard}
            >
              {userData?.user.referralCode}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Agent Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile: Stacked layout */}
              <div className="block sm:hidden space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm truncate">{userData?.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Phone
                    </p>
                    <p className="text-sm">{userData?.user.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Address
                    </p>
                    <p className="text-sm">
                      {userData?.user?.address || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-4 w-4 flex-shrink-0">
                    <Badge
                      className={`${getStatusColor(
                        userData?.user.status
                      )} text-xs px-1 py-0`}
                    >
                      {userData?.user?.status?.replace("UserStatus_", "")}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Status
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="truncate">{userData?.user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p>{userData?.user.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p>{userData?.user?.address || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge className={getStatusColor(userData?.user.status)}>
                    {userData?.user?.status?.replace("UserStatus_", "")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs
            defaultValue="commissions"
            className="w-full"
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "commissions" | "payments")
            }
          >
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="commissions" className="text-xs sm:text-sm">
                Commission Overview
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs sm:text-sm">
                Payment History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="commissions" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {aggregatedCommissions?.map((commission) => (
                  <Card key={commission?.currency}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {commission?.currency}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-green-600">
                            {formatCurrency(
                              commission?.totalValue ?? "",
                              commission?.currency ?? ""
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Unpaid Commission
                          </p>
                        </div>
                        {/* <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(
                              0,
                              "XAF"
                              // commission.totalEarned,
                              // commission.currency
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total Earned
                          </p>
                        </div> */}
                        {!!commission?.totalValue && (
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={() =>
                              handlePayCommission(
                                commission?.totalValue ?? 0,
                                commission?.currency ?? "",
                                commission?.ids ?? []
                              )
                            }
                            disabled={
                              payingCommission?.currencyIsoCode ===
                              commission?.currency
                            }
                          >
                            {payingCommission?.currencyIsoCode ===
                            commission.currency
                              ? "Processing..."
                              : "Pay Commission"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {(!commissionsData ||
                commissionsData?.commissions?.length === 0) && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No commissions earned yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <History className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentsData?.payments &&
                  paymentsData?.payments.length > 0 ? (
                    <>
                      {/* Mobile: Card layout */}
                      <div className="block sm:hidden space-y-3">
                        {paymentsData?.payments?.map((payment) => (
                          <Card key={payment.id} className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {payment?.amount?.currencyIsoCode}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {formatCurrency(
                                    payment?.amount?.value ?? "",
                                    payment?.amount?.currencyIsoCode ?? ""
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  payment?.updatedAt ?? ""
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs font-mono text-muted-foreground">
                                Ref: {payment?.id || "—"}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop: Table layout */}
                      <div className="hidden sm:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Currency</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Reference</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentsData?.payments?.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  {new Date(
                                    payment?.updatedAt ?? ""
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {payment.amount?.currencyIsoCode}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(
                                    payment?.amount?.value ?? "",
                                    payment?.amount?.currencyIsoCode ?? ""
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {payment?.id || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No payment history found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
