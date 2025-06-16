"use client";

import type React from "react";

import { useContext, useEffect, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Lock, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  usersChangePasswordMutation,
  usersCompleteRegistrationMutation,
  usersGetUserByIdOptions,
} from "@/client/users.swagger/@tanstack/react-query.gen";

export default function ProfilePage() {
  const { user, setUser } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { mutateAsync: updatePassword } = useMutation({
    ...usersChangePasswordMutation(),
    onError: async (error) => {
      toast({
        title: "Error chainging password",
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: updateProfile } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onError: async (error) => {
      toast({
        title: "Error updating profile",
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      refetch();
    },
  });

  const { data: userData, refetch } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: user?.userId ?? "",
      },
    }),
  });

  useEffect(() => {
    if (userData?.user) {
      setUser(userData?.user);
    }
  }, [userData]);

  const { toast } = useToast();

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        address: user?.address,
        profileImage: user?.profileImage ?? "",
      };

      await updateProfile({ body: data, path: { userId: user?.userId || "" } });

      toast({
        title: "Profile updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (profile?.newPassword.length < 12) {
        toast({
          title: "Error",
          description: "Password must be at least 12 characters",
          variant: "destructive",
        });
        return;
      }

      if (profile.newPassword !== profile.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match.",
          variant: "destructive",
        });
        return;
      }

      await updatePassword({
        body: {
          newPassword: profile?.newPassword,
          emailFactor: {
            id: user?.email,
            type: "FACTOR_TYPE_EMAIL_PASSWORD",
            secretValue: profile?.currentPassword,
          },
        },
      });

      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });

      setProfile({
        ...profile,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error({ error }, "updating password");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = () => {
    toast({
      title: "Feature coming soon",
      description: "Profile image upload will be available soon.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Picture
            </CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={
                    !!user?.profileImage
                      ? user?.profileImage
                      : `/placeholder-user.jpg`
                  }
                  alt="Profile"
                />
                <AvatarFallback className="text-lg">
                  {profile.firstName}
                  {profile.lastName}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={handleImageUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Picture
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile({ ...profile, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile({ ...profile, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  required
                  readOnly
                />
              </div>

              <Button
                type="submit"
                onSubmit={() => {
                  console.log("updating profile");
                }}
                disabled={loading}
                className={`${
                  loading &&
                  "bg-gray-500 hover:bg-grey-500 hover:cursor-not-allowed bg-opacity-80"
                }`}
              >
                Update Profile
                {loading && <Loader2 className={"animate-spin text-white"} />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={profile.currentPassword}
                  onChange={(e) =>
                    setProfile({ ...profile, currentPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={profile.newPassword}
                  onChange={(e) =>
                    setProfile({ ...profile, newPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={profile.confirmPassword}
                  onChange={(e) =>
                    setProfile({ ...profile, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`${
                loading &&
                "bg-gray-500 hover:bg-grey-500 hover:cursor-not-allowed bg-opacity-80"
              }`}
            >
              Change Password
              {loading && <Loader2 className={"animate-spin text-white"} />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
