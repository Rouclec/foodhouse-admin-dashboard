"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const createMarketingAgentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  city: z.string().min(2, "City must be at least 2 characters"),
});

type CreateMarketingAgentFormData = z.infer<typeof createMarketingAgentSchema>;

export function CreateMarketingAgentDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateMarketingAgentFormData>({
    resolver: zodResolver(createMarketingAgentSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      city: "",
    },
  });

  const onSubmit = async (data: CreateMarketingAgentFormData) => {
    try {
      // Mock API call - replace with actual API call
      console.log("Creating marketing agent:", {
        ...data,
        status: "active",
      });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: `Marketing agent created successfully with referral code: 1234`,
      });

      handleDialogClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create marketing agent. Please try again.",
        variant: "destructive",
      });
      console.error("Create marketing agent error:", error);
    }
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Marketing Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Marketing Agent</DialogTitle>
          <DialogDescription>
            Add a new marketing agent to the system. A unique referral code will
            be generated automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter city" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Agent"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
