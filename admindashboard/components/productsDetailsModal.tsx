"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Package,
  MessageCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  productsUpdateProductMutation,
} from "@/client/products.swagger/@tanstack/react-query.gen";
import { usersGetFarmerByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  unitType: z.string().min(1, "Unit type is required"),
  amountValue: z.number().min(0, "Price must be positive"),
  amountCurrencyIsoCode: z.string().min(1, "Currency is required"),
  categoryId: z.string().min(1, "Category is required"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  onDelete: (productId: string, productName: string, createdBy: string) => void;
  onRefetch: () => void;
  adminUserId: string;
  categoriesData: any;
}

export default function ProductDetailsModal({
  open,
  onOpenChange,
  product,
  onDelete,
  onRefetch,
  adminUserId,
  categoriesData,
}: ProductDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

 
  const { data: farmerData, isLoading: isFarmerLoading } = useQuery({
    ...usersGetFarmerByIdOptions({
      path: {
        farmerId: product?.createdBy ?? "",
        userId: adminUserId,
      },
    }),
    enabled: !!product?.createdBy && open,
  });

  const { mutateAsync: updateProduct } = useMutation({
    ...productsUpdateProductMutation(),
    onError: (error) => {
      toast({
        title: "Error updating product",
        description:
          error?.response?.data?.message ?? "An unknown error occurred",
        variant: "destructive",
      });
    },
  });


  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      unitType: "",
      amountValue: 0,
      amountCurrencyIsoCode: "USD",
      categoryId: "",
    },
  });

  
  useEffect(() => {
    if (product) {
      form.reset({
        name: product?.name || "",
        description: product?.description || "",
        unitType: product?.unitType || "",
        amountValue: product?.amount?.value || 0,
        amountCurrencyIsoCode: product?.amount?.currencyIsoCode || "USD",
        categoryId: product?.category?.id || "",
      });
    }
  }, [product, form]);

  const handleClose = () => {
    onOpenChange(false);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (data: ProductFormValues) => {
    if (!product) return;

    try {
      setLoading(true);

      await updateProduct({
        path: {
          productId: product.id,
          userId: product.createdBy,
        },
        body: {
          name: data.name,
          description: data.description,
          unitType: data.unitType,
          amount: {
            value: data.amountValue,
            currencyIsoCode: data.amountCurrencyIsoCode,
          },
          categoryId: data.categoryId,
        },
      });

      toast({
        title: "Product updated",
        description: "The product has been successfully updated.",
      });

      onRefetch();
      setIsEditing(false);
    } catch (error) {
      console.error({ error }, "updating product");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset({
      name: product?.name || "",
      description: product?.description || "",
      unitType: product?.unitType || "",
      amountValue: product?.amount?.value || 0,
      amountCurrencyIsoCode: product?.amount?.currencyIsoCode || "USD",
      categoryId: product?.category?.id || "",
    });
  };

  const handleContactFarmer = () => {
    if (!farmerData) return;
    
    const message = encodeURIComponent(
      `Hello ${farmerData.user?.firstName}! I'm contacting you from FoodHouse admin team regarding your product "${product?.name}".\n\nWe have some questions about this product. Could you please provide more information?`
    );
    const whatsappUrl = `https://wa.me/${farmerData.user?.phoneNumber?.replace(
      /[^0-9]/g,
      ""
    )}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const categoryMap = categoriesData?.categories?.reduce((acc: Record<string, string>, category: any) => {
    if (category.id && category.name) {
      acc[category.id] = category.name;
    }
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            {isEditing ? "Edit Product" : "Product Details"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the product information"
              : "Complete details about the product"}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., kg, piece, bundle"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          disabled 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountCurrencyIsoCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled 
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="NGN">NGN</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoriesData?.categories?.map((category: any) => (
                          <SelectItem
                            value={category.id || ""}
                            key={category.id}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <>
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-700 text-lg mb-4">
                Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start p-4 border rounded-lg bg-gray-50">
                <div className="space-y-3">
                  <DetailItem
                    label="Name"
                    value={product?.name}
                    icon={<Package className="h-4 w-4 text-green-500" />}
                  />
                  <DetailItem
                    label="Description"
                    value={product?.description || "N/A"}
                    icon={<Edit className="h-4 w-4 text-green-500" />}
                  />
                  <DetailItem
                    label="Unit Type"
                    value={product?.unitType || "N/A"}
                    icon={<Save className="h-4 w-4 text-green-500" />}
                  />
                  <DetailItem
                    label="Price"
                    value={`${product?.amount?.value} ${product?.amount?.currencyIsoCode}`}
                    icon={<Mail className="h-4 w-4 text-green-500" />}
                  />
                  <DetailItem
                    label="Category"
                    value={categoryMap?.[product?.category?.id || ""] || "N/A"}
                    icon={<Package className="h-4 w-4 text-green-500" />}
                  />
                  <DetailItem
                    label="Created"
                    value={new Date(product?.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    icon={<Phone className="h-4 w-4 text-green-500" />}
                  />
                  <DetailItem
                    label="Last Updated"
                    value={new Date(product?.updatedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    icon={<MapPin className="h-4 w-4 text-green-500" />}
                  />
                </div>

                {product?.image && (
                  <div className="flex justify-center items-center p-4 bg-white rounded-lg shadow-inner">
                    <img
                      src={product.image}
                      alt={product.name || "Product Image"}
                      className="rounded-lg object-cover w-full h-64 sm:h-auto max-h-96"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-700 text-lg mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                Farmer Information
              </h3>
              <div className="bg-blue-50 rounded-xl p-6 mt-2 shadow-md border border-blue-200">
                {isFarmerLoading ? (
                  <div className="flex items-center justify-center py-4 text-green-600">
                    <LoadingSpinner className="mr-2" />
                    <span>Loading farmer details...</span>
                  </div>
                ) : farmerData ? (
                  <div className="space-y-4 text-sm text-gray-800">
                    <DetailItem
                      label="Name"
                      value={`${farmerData.user?.firstName} ${farmerData.user?.lastName}`}
                      icon={<User className="h-4 w-4 text-green-600" />}
                    />
                    <DetailItem
                      label="Phone"
                      value={farmerData.user?.phoneNumber || "N/A"}
                      icon={<Phone className="h-4 w-4 text-green-600" />}
                    />
                    <DetailItem
                      label="Address"
                      value={farmerData.user?.address || "N/A"}
                      icon={<MapPin className="h-4 w-4 text-green-600" />}
                    />

                    {farmerData.user?.phoneNumber && (
                      <Button
                        variant="secondary"
                        className="w-full mt-4 bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                        onClick={handleContactFarmer}
                        type="button"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Farmer
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-red-500 text-sm py-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p>
                      Unable to load farmer details. Farmer information might
                      be missing or an error occurred.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-3 mt-8 border-t pt-6 bg-white sticky bottom-0 z-10 -mx-6 px-6">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  onDelete(
                    product?.id ?? "",
                    product?.name ?? "this product",
                    product?.createdBy ?? ""
                  )
                }
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


const DetailItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center p-2 rounded-md bg-white border border-gray-200">
    <div className="mr-3 text-gray-500">{icon}</div>
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-gray-500">{label}:</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  </div>
);