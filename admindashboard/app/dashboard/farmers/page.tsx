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
  Search,
  Flag,
  UserX,
  Leaf,
  MessageCircle,
  Tractor,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { useQuery } from "@tanstack/react-query";
import { usersListFarmersOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { usersgrpcUser, usersgrpcUserStatus } from "@/client/users.swagger";
import moment from "moment";

interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string;
  farmName: string;
  location: string;
  status: "active" | "flagged" | "disabled";
  joinDate: string;
  totalProducts: number;
}

const STATUS_FILTERS: Array<{
  label: string;
  value: usersgrpcUserStatus;
}> = [
  {
    label: "All",
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

export default function FarmersPage() {
  const { user } = useContext(Context) as ContextType;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<usersgrpcUserStatus>(
    "UserStatus_UNSPECIFIED"
  );
  const { toast } = useToast();

  const { data: farmersData, isLoading: isFarmersLoading } = useQuery({
    ...usersListFarmersOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        searchKey: searchTerm,
        startKey: 5.1,
        userStatus: statusFilter,
      },
    }),
  });

  useQueryLoading(isFarmersLoading);

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

  const handleDisableFarmer = (farmer: usersgrpcUser | undefined) => {
    // disable or enable the farmer based on their status
    // setFarmers(
    //   farmers.map((farmer) =>
    //     farmer.id === farmerId
    //       ? {
    //           ...farmer,
    //           status:
    //             farmer.status === "disabled" ? "active" : ("disabled" as const),
    //         }
    //       : farmer
    //   )
    // );

    // const farmer = farmers.find((f) => f.id === farmerId);
    const newStatus =
      farmer?.status === "UserStatus_SUSPENDED" ? "active" : "suspended";

    toast({
      title: `Farmer account ${
        newStatus === "suspended" ? "disabled" : "enabled"
      }`,
      description: `${farmer?.firstName}'s account has been ${
        newStatus === "suspended" ? "suspended" : "reactivated"
      }.`,
    });
  };

  const handleContactFarmer = (phone: string, farmerName: string) => {
    const message = encodeURIComponent(
      `Hello ${farmerName}! I'm contacting you from FoodHouse admin team. How can I assist you?`
    );
    const whatsappUrl = `https://wa.me/${phone.replace(
      /[^0-9]/g,
      ""
    )}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Farmer Management
          </h1>
          <p className="text-gray-600">
            Manage farmers and their account status
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tractor className="h-5 w-5 mr-2 text-gray-500" />
            Farmer Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, or email..."
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
              <SelectTrigger className="w-48">
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

      {/* Farmers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Farmers</CardTitle>
          <CardDescription>
            Showing {farmersData?.farmers?.length ?? 0} of{" "}
            {farmersData?.farmers?.length ?? 0} farmers
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Join Date
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farmersData?.farmers?.map((farmer) => (
                <TableRow key={farmer?.user?.userId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {farmer?.user?.firstName} {farmer?.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {farmer?.user?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {farmer?.user?.address}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(farmer?.user?.status)}>
                      {farmer?.user?.status?.replace("UserStatus_", "")}
                    </Badge>
                    <div className="md:hidden mt-1 text-xs text-gray-500">
                      Joined:{" "}
                      {moment(farmer?.user?.createdAt).format("DD-MM-YYYY")}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {moment(farmer?.user?.createdAt).format("DD-MM-YYYY")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleContactFarmer(
                            farmer?.user?.phoneNumber ?? "",
                            farmer?.user?.firstName ??
                              farmer?.user?.lastName ??
                              ""
                          )
                        }
                        title="Contact via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisableFarmer(farmer?.user)}
                        title={
                          farmer?.user?.status === "UserStatus_SUSPENDED"
                            ? "Reactivate account"
                            : "Suspend account"
                        }
                      >
                        <UserX className="h-4 w-4" />
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
  );
}
