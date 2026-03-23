"use client";

import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Search,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  usersgrpcKYCStatus,
  usersgrpcKYCVerification,
} from "@/client/users.swagger";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  usersListKycVerificationsOptions,
  usersUpdateKycStatusMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { useQueryLoading } from "@/hooks/use-query-loading";
import moment from "moment";
import Image from "next/image";

const STATUS_FILTERS: Array<{
  label: string;
  value: usersgrpcKYCStatus | "ALL";
}> = [
  { label: "All Statuses", value: "ALL" },
  { label: "Pending", value: "KYC_STATUS_PENDING" },
  { label: "Verified", value: "KYC_STATUS_VERIFIED" },
  { label: "Rejected", value: "KYC_STATUS_REJECTED" },
];

export default function KYCVerificationsPage() {
  const { user } = useContext(Context) as ContextType;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<usersgrpcKYCStatus | "ALL">("ALL");
  const [selectedVerification, setSelectedVerification] = useState<usersgrpcKYCVerification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const {
    data: kycData,
    isLoading,
    refetch,
  } = useQuery({
    ...usersListKycVerificationsOptions({
      path: {
        adminUserId: user?.userId ?? "",
      },
      query: {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        searchKey: searchTerm || undefined,
      },
    }),
    placeholderData: keepPreviousData,
    enabled: !!user?.userId,
  });

  useQueryLoading(isLoading);

  const getStatusColor = (status: usersgrpcKYCStatus | undefined) => {
    switch (status) {
      case "KYC_STATUS_PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "KYC_STATUS_VERIFIED":
        return "bg-green-100 text-green-800";
      case "KYC_STATUS_REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: usersgrpcKYCStatus | undefined) => {
    switch (status) {
      case "KYC_STATUS_PENDING":
        return <Clock className="h-4 w-4" />;
      case "KYC_STATUS_VERIFIED":
        return <CheckCircle className="h-4 w-4" />;
      case "KYC_STATUS_REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: usersgrpcKYCStatus | undefined) => {
    switch (status) {
      case "KYC_STATUS_PENDING":
        return "Pending";
      case "KYC_STATUS_VERIFIED":
        return "Verified";
      case "KYC_STATUS_REJECTED":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const handleViewDetails = (verification: usersgrpcKYCVerification) => {
    setSelectedVerification(verification);
    setRejectionReason(verification.rejectionReason ?? "");
    setShowDetailModal(true);
  };

  const { mutateAsync: updateStatus } = useMutation({
    ...usersUpdateKycStatusMutation(),
  });

  const handleApprove = async () => {
    if (!selectedVerification) return;

    setActionLoading(true);
    try {
      await updateStatus({
        path: {
          adminUserId: user?.userId ?? "",
          kycId: selectedVerification.id ?? "",
        },
        body: {
          status: "KYC_STATUS_VERIFIED",
        },
      });
      toast({
        title: "KYC Approved",
        description: "The agent's KYC has been verified successfully.",
      });
      setShowDetailModal(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;

    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this KYC.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await updateStatus({
        path: {
          adminUserId: user?.userId ?? "",
          kycId: selectedVerification.id ?? "",
        },
        body: {
          status: "KYC_STATUS_REJECTED",
          rejectionReason: rejectionReason,
        },
      });
      toast({
        title: "KYC Rejected",
        description: "The agent has been notified about the rejection.",
      });
      setShowDetailModal(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8" />
            KYC Verifications
          </h1>
          <p className="text-gray-600">
            Review and verify agent identity documents
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as usersgrpcKYCStatus | "ALL")
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter, index) => (
                  <SelectItem value={filter.value} key={index}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{kycData?.total ?? 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {kycData?.kycVerifications?.filter(
                    (k) => k.status === "KYC_STATUS_PENDING"
                  ).length ?? 0}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold">
                  {kycData?.kycVerifications?.filter(
                    (k) => k.status === "KYC_STATUS_VERIFIED"
                  ).length ?? 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC List */}
      <Card>
        <CardHeader>
          <CardTitle>Agent KYC Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {kycData?.kycVerifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No KYC verifications found</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                {searchTerm || statusFilter !== "ALL"
                  ? "Try adjusting your search or filter criteria"
                  : "No agents have submitted KYC documents yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {kycData?.kycVerifications?.map((kyc) => (
                <div
                  key={kyc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={kyc.selfieUrl ?? ""} alt="Agent" />
                      <AvatarFallback className="bg-primary text-white">
                        {kyc.userId?.[0]?.toUpperCase() ?? "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">User ID: {kyc.userId}</p>
                      <p className="text-sm text-gray-500">
                        Submitted: {moment(kyc.createdAt).format("DD-MM-YYYY HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(kyc.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(kyc.status)}
                        {getStatusLabel(kyc.status)}
                      </span>
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(kyc)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Verification Review</DialogTitle>
            <DialogDescription>
              Review the agent&apos;s identity documents before approving or rejecting
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <Badge className={getStatusColor(selectedVerification.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(selectedVerification.status)}
                      {getStatusLabel(selectedVerification.status)}
                    </span>
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium">{selectedVerification.userId}</p>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Identity Document */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Identity Document (Front/Back)
                    </Label>
                    <div className="border rounded-lg p-2 bg-gray-50">
                      {selectedVerification.identityDocumentUrl ? (
                        <div className="relative h-40 bg-gray-100 rounded">
                          <Image
                            src={selectedVerification.identityDocumentUrl}
                            alt="Identity Document"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center bg-gray-100 rounded">
                          <p className="text-sm text-gray-500">Not provided</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selfie */}
                  <div className="space-y-2">
                    <Label>Selfie Photo</Label>
                    <div className="border rounded-lg p-2 bg-gray-50">
                      {selectedVerification.selfieUrl ? (
                        <div className="relative h-40 bg-gray-100 rounded">
                          <Image
                            src={selectedVerification.selfieUrl}
                            alt="Selfie"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center bg-gray-100 rounded">
                          <p className="text-sm text-gray-500">Not provided</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Document */}
                  <div className="space-y-2">
                    <Label>Vehicle Registration</Label>
                    <div className="border rounded-lg p-2 bg-gray-50">
                      {selectedVerification.vehicleDocumentUrl ? (
                        <div className="relative h-40 bg-gray-100 rounded">
                          <Image
                            src={selectedVerification.vehicleDocumentUrl}
                            alt="Vehicle Document"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center bg-gray-100 rounded">
                          <p className="text-sm text-gray-500">Not provided</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedVerification.status === "KYC_STATUS_REJECTED" && (
                <div className="space-y-2">
                  <Label>Rejection Reason</Label>
                  <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {selectedVerification.rejectionReason || "No reason provided"}
                  </p>
                </div>
              )}

              {/* Action Buttons (only for pending) */}
              {selectedVerification.status === "KYC_STATUS_PENDING" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">
                      Rejection Reason (required if rejecting)
                    </Label>
                    <Input
                      id="rejectionReason"
                      placeholder="Enter reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button onClick={handleApprove} disabled={actionLoading}>
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
