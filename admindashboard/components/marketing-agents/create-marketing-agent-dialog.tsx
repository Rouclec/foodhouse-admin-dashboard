"use client";

import {
  type Dispatch,
  type SetStateAction,
  useContext,
  useEffect,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useMutation } from "@tanstack/react-query";
import {
  usersCompleteRegistrationMutation,
  usersGrantAgentMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/contexts/QueryProvider";

const marketingAgentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  city: z.string().min(2, "City must be at least 2 characters"),
});

type MarketingAgentFormData = z.infer<typeof marketingAgentSchema>;

type CreateMarketingAgentProps = {
  defaultValues?: {
    id?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    city?: string;
  };
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  mode?: "create" | "edit";
};

const emptyFormValues = {
  id: "",
  name: "",
  email: "",
  phoneNumber: "",
  city: "",
};

export function CreateMarketingAgentDialog({
  defaultValues,
  isOpen,
  setIsOpen,
  onClose,
  mode = "create",
}: CreateMarketingAgentProps) {
  const { user } = useContext(Context) as ContextType;

  const { toast } = useToast();
  const isEditMode = mode === "edit" || !!defaultValues?.id;

  const form = useForm<MarketingAgentFormData>({
    resolver: zodResolver(marketingAgentSchema),
    defaultValues: emptyFormValues,
  });

  // Reset form when dialog opens or mode changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && defaultValues) {
        // Edit mode - populate with existing data
        form.reset({
          id: defaultValues.id ?? "",
          name: defaultValues.name ?? "",
          email: defaultValues.email ?? "",
          phoneNumber: defaultValues.phoneNumber ?? "",
          city: defaultValues.city ?? "",
        });
      } else {
        // Create mode - reset to empty values
        form.reset(emptyFormValues);
      }
    }
  }, [isOpen, isEditMode, defaultValues, form]);

  // Also reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      form.reset(emptyFormValues);
    }
  }, [isOpen, form]);

  const onSubmit = async (data: MarketingAgentFormData) => {
    try {
      if (isEditMode) {
        await updateAgent({
          body: {
            phoneNumber: data.phoneNumber,
            address: data.city,
            email: data.email,
            firstName: data.name.split(" ")[0],
            lastName: data?.name?.split(" ")[1],
          },
          path: {
            userId: data?.id ?? "",
          },
        });
      } else {
        // Create new agent
        const newAgent = await createAgent({
          body: {
            phoneNumber: data.phoneNumber,
            address: data.city,
            email: data.email,
            residenceCountryIsoCode: "CM",
            role: "USER_ROLE_MARKETING_AGENT",
          },
          path: {
            adminUserId: user?.userId ?? "",
          },
        });

        toast({
          title: "Success",
          description: `Marketing agent created successfully`,
        });
      }

      handleDialogClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${
          isEditMode ? "update" : "create"
        } marketing agent. Please try again.`,
        variant: "destructive",
      });
      console.error(
        `${isEditMode ? "Update" : "Create"} marketing agent error:`,
        error
      );
    }
  };

  const handleDialogClose = () => {
    form.reset(emptyFormValues);
    onClose();
    setIsOpen(false);
  };

  const { mutateAsync: createAgent } = useMutation({
    ...usersGrantAgentMutation(),
    onSuccess: () => {
      form.reset(emptyFormValues);
      onClose();
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create agent",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: updateAgent } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onSuccess: () => {
      form.reset(emptyFormValues);
      onClose();
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update agent",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleDialogClose();
        } else {
          setIsOpen(open);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] mx-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Marketing Agent" : "Create New Marketing Agent"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the marketing agent information below."
              : "Add a new marketing agent to the system. A unique referral code will be generated automatically."}
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

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
                className="w-full sm:w-auto bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
              >
                {form.formState.isSubmitting
                  ? `${isEditMode ? "Updating" : "Creating"}...`
                  : `${isEditMode ? "Update" : "Create"} Agent`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
