"use client";

import { FC, useContext, useState } from "react";
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
import {
  Search,
  CreditCard,
  Calendar,
  ShoppingCart,
  Percent,
} from "lucide-react";
import {
  ordersgrpcPayment,
  ordersgrpcPaymentEntity,
  ordersgrpcPaymentStatus,
  ordersgrpcPaymentType,
} from "@/client/orders.swagger";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { ordersListPaymentsOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usersGetPublicUserOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatCurrency } from "@/utils";
import moment from "moment";

const STATUS_FILTERS: Array<{
  label: string;
  value: ordersgrpcPaymentStatus;
}> = [
  {
    label: "All Statuses",
    value: "PaymentStatus_UNSPECIFIED",
  },
  {
    label: "Completed",
    value: "PaymentStatus_COMPLETED",
  },
  {
    label: "Failed",
    value: "PaymentStatus_FAILED",
  },
  {
    label: "Canceled",
    value: "PaymentStatus_CANCELED",
  },
  {
    label: "Initiated",
    value: "PaymentStatus_INITIATED",
  },
];

const ENTITY_FILTERS: Array<{
  label: string;
  value: ordersgrpcPaymentEntity;
}> = [
  {
    label: "All Entities",
    value: "PaymentEntity_UNSPECIFIED",
  },
  {
    label: "Orders",
    value: "PaymentEntity_ORDER",
  },
  {
    label: "Subscriptions",
    value: "PaymentEntity_SUBSCRIPTION",
  },
  {
    label: "Commissions",
    value: "PaymentEntity_COMMISSION",
  },
];

const TYPE_FILTERS: Array<{
  label: string;
  value: ordersgrpcPaymentType;
}> = [
  {
    label: "All Types",
    value: "PaymentType_UNSPECIFIED",
  },
  {
    label: "Debits",
    value: "PaymentType_DEBIT",
  },
  {
    label: "Credits",
    value: "PaymentType_CREDIT",
  },
];

type PaymentItemProps = {
  payment: ordersgrpcPayment | undefined;
};

const PaymentItem: FC<PaymentItemProps> = ({ payment }) => {
  const { data: userData, isLoading: isUserDataLoading } = useQuery({
    ...usersGetPublicUserOptions({
      path: {
        userId: payment?.createdBy ?? "",
      },
    }),
    enabled: !!payment?.createdBy,
  });

  const getStatusColor = (status: ordersgrpcPaymentStatus | undefined) => {
    switch (status) {
      case "PaymentStatus_COMPLETED":
        return "bg-green-100 text-green-800";
      case "PaymentStatus_INITIATED":
        return "bg-yellow-100 text-yellow-800";
      case "PaymentStatus_FAILED":
        return "bg-red-100 text-red-800";
      case "PaymentStatus_CANCELED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAmountColor = (type: ordersgrpcPaymentType | undefined) => {
    switch (type) {
      case "PaymentType_CREDIT":
        return "text-green-700";
      case "PaymentType_DEBIT":
        return "text-red-700";
      case "PaymentType_UNSPECIFIED":
        return "text-grey-700";
    }
  };

  const getTypeIcon = (type: ordersgrpcPaymentEntity | undefined) => {
    switch (type) {
      case "PaymentEntity_ORDER":
        return <ShoppingCart className="h-4 w-4" />;
      case "PaymentEntity_SUBSCRIPTION":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Percent className="h-4 w-4" />;
    }
  };
  if (isUserDataLoading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-16">
          <div className="flex items-center justify-center w-full">
            <LoadingSpinner size="sm" text="Loading payment data..." />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline" className="flex items-center w-fit gap-1">
          {getTypeIcon(payment?.paymentEntity)}
          <span className="capitalize">
            {payment?.paymentEntity
              ?.replace("PaymentEntity_", "")
              ?.split("_")
              .join(" ")
              .trim()}
          </span>
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        {userData?.name}
        <div className="md:hidden mt-1 text-xs text-gray-500">
          {payment?.account?.accountNumber}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {payment?.account?.accountNumber}
      </TableCell>
      <TableCell className={`${getAmountColor(payment?.type)}`}>
        {payment?.type === "PaymentType_CREDIT"
          ? "+"
          : payment?.type === "PaymentType_DEBIT"
          ? "-"
          : "~"}
        {formatCurrency(
          payment?.amount?.value ?? 0,
          payment?.amount?.currencyIsoCode ?? ""
        )}
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(payment?.status)}>
          {payment?.status
            ?.replace("PaymentStatus_", "")
            .split("_")
            .join(" ")
            .trim()}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {payment?.account?.paymentMethod
          ?.replace("PaymentMethodType_", "")
          .split("_")
          .join(" ")
          .trim()}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {moment(payment?.createdAt ?? "").format("DD-MM-YYYY")}
      </TableCell>
    </TableRow>
  );
};

export default function PaymentsPage() {
  const { user } = useContext(Context) as ContextType;

  const pagination = useCursorPagination({
    pageSize: 10,
  });

  const [statusFilter, setStatusFilter] = useState<ordersgrpcPaymentStatus>(
    "PaymentStatus_UNSPECIFIED"
  );

  const [entityFilter, setEntityFilter] = useState<ordersgrpcPaymentEntity>(
    "PaymentEntity_UNSPECIFIED"
  );

  const [typeFilter, setTypeFilter] = useState<ordersgrpcPaymentType>(
    "PaymentType_UNSPECIFIED"
  );

  const [searchTerm, setSearchTerm] = useState("");

  const { data: paymentsData, isLoading: isPaymentsDataLoading } = useQuery({
    ...ordersListPaymentsOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        searchKey: searchTerm,
        startKey: pagination.startKey,
        paymentEntity: entityFilter,
        paymentStatus: statusFilter,
        paymentType: typeFilter,
        count: pagination.pageSize,
      },
    }),
    placeholderData: keepPreviousData,
  });

  useQueryLoading(isPaymentsDataLoading);

  const handleNextPage = () => {
    // Only proceed if nextKey exists and is not empty
    if (paymentsData?.nextKey && paymentsData.nextKey !== "") {
      pagination.goToNextPage(paymentsData.nextKey);
    }
  };

  console.log({ entityFilter, statusFilter, typeFilter });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and manage all payments</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by account number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter as string}
              onValueChange={(value) =>
                setStatusFilter(value as ordersgrpcPaymentStatus)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter, index) => (
                  <SelectItem value={filter.value as string} key={index}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={entityFilter as string}
              onValueChange={(value) =>
                setEntityFilter(value as ordersgrpcPaymentEntity)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_FILTERS.map((filter, index) => (
                  <SelectItem value={filter.value as string} key={index}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter as string}
              onValueChange={(value) =>
                setTypeFilter(value as ordersgrpcPaymentType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((filter, index) => (
                  <SelectItem value={filter.value as string} key={index}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            Showing {paymentsData?.payments?.length ?? 0} of{" "}
            {paymentsData?.payments?.length ?? 0} payments
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Account N<sup>o</sup>
                  </TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Method</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsData?.payments?.map((payment, index) => (
                  <PaymentItem key={index} payment={payment} />
                ))}
              </TableBody>
            </Table>
            {paymentsData?.payments?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payments found</p>
              </div>
            )}
            <CursorPagination
              currentPage={pagination.currentPage}
              nextKey={paymentsData?.nextKey} // Pass the nextKey directly
              canGoToPrevious={pagination.canGoToPrevious}
              onPreviousPage={pagination.goToPreviousPage}
              onNextPage={handleNextPage}
              onFirstPage={pagination.goToFirstPage}
              isLoading={isPaymentsDataLoading}
              itemsPerPage={pagination.pageSize}
              totalItemsOnPage={paymentsData?.payments?.length ?? 0}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
