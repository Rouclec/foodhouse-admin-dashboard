"use client";

import { useContext, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { useQueryLoading } from "@/hooks/use-query-loading";
import type { usersgrpcUserStatus } from "@/client/users.swagger";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import {
  ordersListCommissionsByReferrerOptions,
  ordersListPaymentsOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Button } from "../ui/button";

interface MarketingAgentDetails {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  referralCode: string;
  status: "active" | "inactive";
  createdAt: string;
  commissions: {
    currency: string;
    unpaidAmount: number;
    totalEarned: number;
    lastTransactionDate?: string;
  }[];
}

interface CommissionPayment {
  id: string;
  currency: string;
  amount: number;
  paidAt: string;
  transactionReference?: string;
}

interface MarketingAgentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

const mockPaymentHistory: Record<string, CommissionPayment[]> = {
  "1": [
    {
      id: "1",
      currency: "USD",
      amount: 500.0,
      paidAt: "2024-01-10T10:00:00Z",
      transactionReference: "PAY-1704873600000",
    },
    {
      id: "2",
      currency: "EUR",
      amount: 300.0,
      paidAt: "2024-01-12T14:30:00Z",
      transactionReference: "PAY-1705060200000",
    },
  ],
  "2": [
    {
      id: "3",
      currency: "USD",
      amount: 1200.0,
      paidAt: "2024-01-15T09:15:00Z",
      transactionReference: "PAY-1705309300000",
    },
    {
      id: "4",
      currency: "USD",
      amount: 1000.0,
      paidAt: "2024-01-22T11:45:00Z",
      transactionReference: "PAY-1705914300000",
    },
  ],
  "3": [
    {
      id: "5",
      currency: "USD",
      amount: 150.5,
      paidAt: "2024-01-28T16:20:00Z",
      transactionReference: "PAY-1706459200000",
    },
  ],
};

// Mock commission data for demonstration - remove when real data is available
const mockCommissions: Record<string, MarketingAgentDetails["commissions"]> = {
  "1": [
    {
      currency: "USD",
      unpaidAmount: 250.0,
      totalEarned: 1500.0,
      lastTransactionDate: "2024-01-20T10:00:00Z",
    },
    {
      currency: "EUR",
      unpaidAmount: 180.5,
      totalEarned: 890.5,
      lastTransactionDate: "2024-01-18T14:30:00Z",
    },
  ],
  "2": [
    {
      currency: "USD",
      unpaidAmount: 0,
      totalEarned: 2200.0,
      lastTransactionDate: "2024-01-25T09:15:00Z",
    },
  ],
  "3": [
    {
      currency: "USD",
      unpaidAmount: 75.25,
      totalEarned: 325.75,
      lastTransactionDate: "2024-02-05T16:45:00Z",
    },
  ],
};

export function MarketingAgentDetailsDialog({
  isOpen,
  onClose,
  agentId,
}: MarketingAgentDetailsDialogProps) {
  const { user } = useContext(Context) as ContextType;

  const [payingCommission, setPayingCommission] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"commissions" | "payments">(
    "commissions"
  );
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

  const paymentHistory = mockPaymentHistory[agentId] || [];
  // const commissions = mockCommissions[agentId] || [] // Remove when real data is available

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

  const handlePayCommission = async (currency: string, amount: number) => {
    setPayingCommission(currency);

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Commission Paid",
        description: `Successfully paid ${formatCurrency(
          amount,
          currency
        )} commission.`,
      });

      // In a real app, you would update the data here
      console.log(`Paid ${amount} ${currency} to agent ${agentId}`);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to process commission payment. Please try again.",
        variant: "destructive",
      });
      console.error("Pay commission error:", error);
    } finally {
      setPayingCommission(null);
    }
  };

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

  console.log({ activeTab });

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
            <Badge variant="outline" className="font-mono w-fit">
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
                {commissionsData?.commissions?.map((commission) => (
                  <Card key={commission?.commissionAmount?.currencyIsoCode}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {commission?.commissionAmount?.currencyIsoCode}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-green-600">
                            {formatCurrency(
                              commission.commissionAmount?.value ?? "",
                              commission.commissionAmount?.currencyIsoCode ?? ""
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Unpaid Commission
                          </p>
                        </div>
                        <div>
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
                        </div>
                        {!!commission?.commissionAmount?.value && (
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={() =>
                              // handlePayCommission(
                              //   commission.commissionAmount?.value ?? "",
                              //   commission.commissionAmount?.currencyIsoCode
                              // )
                              console.log("hey")
                            }
                            disabled={
                              payingCommission ===
                              commission.commissionAmount?.currencyIsoCode
                            }
                          >
                            {payingCommission ===
                            commission.commissionAmount?.currencyIsoCode
                              ? "Processing..."
                              : "Pay Commission"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Mobile: Commission cards stacked layout */}
              <div className="block sm:hidden space-y-3">
                {commissionsData?.commissions?.map((commission) => (
                  <Card
                    key={commission?.commissionAmount?.currencyIsoCode}
                    className="p-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <Badge
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {commission?.commissionAmount?.currencyIsoCode}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(
                              commission.commissionAmount?.value ?? "",
                              commission.commissionAmount?.currencyIsoCode ?? ""
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Unpaid
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Earned:
                        </span>
                        <span className="font-medium">
                          {/* {formatCurrency(commission.totalEarned, commission.currency)} */}
                          {formatCurrency(0, "XAF")}
                        </span>
                      </div>

                      {/* {commission.lastTransactionDate && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Last: {new Date(commission.lastTransactionDate).toLocaleDateString()}
                        </div>
                      )} */}

                      {!!commission?.commissionAmount?.value && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            // handlePayCommission(commission.currency, commission.unpaidAmount)
                            {
                              console.log("hey");
                            }
                          }
                          disabled={
                            payingCommission ===
                            commission.commissionAmount?.currencyIsoCode
                          }
                        >
                          {payingCommission ===
                          commission.commissionAmount.currencyIsoCode
                            ? "Processing..."
                            : "Pay Commission"}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop: Commission cards grid layout */}

              <div className="hidden sm:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {commissionsData?.commissions?.map((commission) => (
                  <Card key={commission?.commissionAmount?.currencyIsoCode}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {commission?.commissionAmount?.currencyIsoCode}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(
                              commission?.commissionAmount?.value ?? "",
                              commission?.commissionAmount?.currencyIsoCode ??
                                ""
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Unpaid Commission
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(
                              commission?.commissionAmount?.value ?? "",
                              commission?.commissionAmount?.currencyIsoCode ??
                                ""
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total Earned
                          </p>
                        </div>
                        {/* {commission.lastTransactionDate && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Last transaction:{" "}
                              {new Date(
                                commission.lastTransactionDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )} */}
                        {!!commission?.commissionAmount?.currencyIsoCode && (
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={() =>
                              // handlePayCommission(
                              //   commission.currency,
                              //   commission.unpaidAmount
                              // )
                              console.log("hey")
                            }
                            disabled={
                              payingCommission ===
                              commission?.commissionAmount?.currencyIsoCode
                            }
                          >
                            {payingCommission ===
                            commission?.commissionAmount?.currencyIsoCode
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
                  {paymentHistory && paymentHistory.length > 0 ? (
                    <>
                      {/* Mobile: Card layout */}
                      <div className="block sm:hidden space-y-3">
                        {paymentHistory.map((payment: CommissionPayment) => (
                          <Card key={payment.id} className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {payment.currency}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {formatCurrency(
                                    payment.amount,
                                    payment.currency
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(payment.paidAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs font-mono text-muted-foreground">
                                Ref: {payment.transactionReference || "—"}
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
