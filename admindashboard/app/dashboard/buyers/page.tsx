"use client";

import { useContext, useState } from "react";
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
import {
  Download,
  MessageCircle,
  Search,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  usersListUsersOptions,
  usersReactivateUserMutation,
  usersSuspendUserMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { usersExportUsersPdf, usersgrpcUser, usersgrpcUserStatus } from "@/client/users.swagger";
import moment from "moment";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { CursorPagination } from "@/components/ui/cursor-pagination";

const STATUS_FILTERS: Array<{
  label: string;
  value: usersgrpcUserStatus;
}> = [
  {
    label: "All Statuses",
    value: "UserStatus_UNSPECIFIED",
  },
  {
    label: "Active",
    value: "UserStatus_ACTIVE",
  },
  {
    label: "Suspended",
    value: "UserStatus_SUSPENDED",
  },
];

export default function Buysers() {
  const { user } = useContext(Context) as ContextType;
  const [suspendingBuyer, setSuspendingBuyer] = useState<string>();
  const [isExporting, setIsExporting] = useState(false);

  const pagination = useCursorPagination({
    pageSize: 10,
  });

  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<usersgrpcUserStatus>(
    "UserStatus_UNSPECIFIED"
  );
  const { toast } = useToast();

  const {
    data: usersData,
    isLoading: isUsersLoading,
    refetch,
  } = useQuery({
    ...usersListUsersOptions({
      path: {
        adminUserId: user?.userId ?? "",
      },
      query: {
        searchKey: searchTerm,
        startKey: pagination.startKey,
        userStatus: statusFilter,
        count: pagination.pageSize,
        userRole: "USER_ROLE_BUYER",
      },
    }),
    placeholderData: keepPreviousData,
  });

  useQueryLoading(isUsersLoading);

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

  const handleDisableUser = async (buyer: usersgrpcUser | undefined) => {
    try {
      setSuspendingBuyer(buyer?.userId);
      setLoading(true);
      // const user = users.find((f) => f.id === userId);
      const newStatus =
        buyer?.status === "UserStatus_SUSPENDED" ? "active" : "suspended";

      if (newStatus === "active") {
        await reactivateAccount({
          body: {},
          path: {
            userId: buyer?.userId ?? "",
            adminUserId: user?.userId ?? "",
          },
        });
      } else {
        await suspendAccount({
          body: {},
          path: {
            userId: buyer?.userId ?? "",
            adminUserId: user?.userId ?? "",
          },
        });
      }

      toast({
        title: `User account ${
          newStatus === "suspended" ? "disabled" : "enabled"
        }`,
        description: `${buyer?.firstName ?? buyer?.lastName}'s account has been ${
          newStatus === "suspended" ? "suspended" : "reactivated"
        }.`,
      });

      refetch();
    } catch (error) {
      console.error({ error }, "changing account status");
    } finally {
      setSuspendingBuyer(undefined);
      setLoading(false);
    }
  };

  const handleContactUser = (phone: string, userName: string) => {
    const message = encodeURIComponent(
      `Hello ${userName}! I'm contacting you from FoodHouse admin team.\n`
    );
    const whatsappUrl = `https://wa.me/${phone.replace(
      /[^0-9]/g,
      ""
    )}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const { mutateAsync: suspendAccount } = useMutation({
    ...usersSuspendUserMutation(),
    onError: (error) => {
      toast({
        title: `Error suspending account`,
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: reactivateAccount } = useMutation({
    ...usersReactivateUserMutation(),
    onError: (error) => {
      toast({
        title: `Error reactivating account`,
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
  });

  const handleNextPage = () => {
    // Only proceed if nextKey exists and is not empty
    if (usersData?.nextKey && usersData.nextKey !== "") {
      pagination.goToNextPage(usersData.nextKey);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);

      // grpc-gateway returns google.api.HttpBody as a *raw* response body (PDF
      // bytes), not JSON. So we must request binary from axios.
      const { data } = await usersExportUsersPdf({
        path: { adminUserId: user?.userId ?? "" },
        query: {
          userRole: "USER_ROLE_BUYER",
          userStatus: statusFilter,
          search: searchTerm,
        },
        // @hey-api/client-axios passes through axios config
        responseType: "arraybuffer" as any,
      } as any);

      const arrayBuffer = data as unknown as ArrayBuffer;
      if (!arrayBuffer || (arrayBuffer as any).byteLength === 0) {
        toast({
          title: "Export failed",
          description: "The server returned an empty PDF.",
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `buyers-${moment().format("YYYYMMDD-HHmmss")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Export failed",
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer Management</h1>
          <p className="text-gray-600">
            Manage buyers and their account status
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportPdf}
          disabled={isExporting}
          title="Export buyers to PDF"
          className="w-full sm:w-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export PDF"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-500" />
            Buyer Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as usersgrpcUserStatus)
              }
            >
              <SelectTrigger className="w-full sm:w-48">
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
          </div>
        </CardContent>
      </Card>

      {/* users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Buyers</CardTitle>
          <CardDescription>
            Showing {usersData?.users?.length ?? 0} of{" "}
            {usersData?.users?.length ?? 0} users
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Location
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Join Date
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData?.users?.map((user) => (
                  <TableRow key={user?.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{user?.phoneNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {user?.address}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user?.status)}>
                        {user?.status?.replace("UserStatus_", "")}
                      </Badge>
                      <div className="md:hidden mt-1 text-xs text-gray-500">
                        Joined: {moment(user?.createdAt).format("DD-MM-YYYY")}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {moment(user?.createdAt).format("DD-MM-YYYY")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleContactUser(
                              user?.phoneNumber ?? "",
                              user?.firstName ?? user?.lastName ?? ""
                            )
                          }
                          title="Contact via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleDisableUser(user);
                          }}
                          disabled={loading}
                          className={`${loading && "cursor-not-allowed"}`}
                          title={
                            user?.status === "UserStatus_SUSPENDED"
                              ? "Reactivate account"
                              : "Suspend account"
                          }
                        >
                          {loading && suspendingBuyer === user?.userId ? (
                            <LoadingSpinner size="sm" />
                          ) : user?.status === "UserStatus_SUSPENDED" ? (
                            <UserCheck className="h-4 w-4" />
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {usersData?.users?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
            <CursorPagination
              currentPage={pagination.currentPage}
              nextKey={usersData?.nextKey} // Pass the nextKey directly
              canGoToPrevious={pagination.canGoToPrevious}
              onPreviousPage={pagination.goToPreviousPage}
              onNextPage={handleNextPage}
              onFirstPage={pagination.goToFirstPage}
              isLoading={isUsersLoading}
              itemsPerPage={pagination.pageSize}
              totalItemsOnPage={usersData?.users?.length ?? 0}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
