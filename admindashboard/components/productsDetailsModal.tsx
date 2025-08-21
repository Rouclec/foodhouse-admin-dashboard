"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Package, MessageCircle, User, Phone, Mail, MapPin, Save, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQuery } from "@tanstack/react-query"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { productsUpdateProductMutation } from "@/client/products.swagger/@tanstack/react-query.gen"
import { usersGetFarmerByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  unitType: z.string().min(1, "Unit type is required"),
  amountValue: z.number().min(0, "Price must be positive"),
  amountCurrencyIsoCode: z.string().min(1, "Currency is required"),
  categoryId: z.string().min(1, "Category is required"),
})

type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onDelete: (productId: string, productName: string, createdBy: string) => void
  onRefetch: () => void
  adminUserId: string
  categoriesData: any
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
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const { data: farmerData, isLoading: isFarmerLoading } = useQuery({
    ...usersGetFarmerByIdOptions({
      path: {
        farmerId: product?.createdBy ?? "",
        userId: adminUserId,
      },
    }),
    enabled: !!product?.createdBy && open,
  })

  const { mutateAsync: updateProduct } = useMutation({
    ...productsUpdateProductMutation(),
    onError: (error) => {
      toast({
        title: "Error updating product",
        description: error?.response?.data?.message ?? "An unknown error occurred",
        variant: "destructive",
      })
    },
  })

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
  })

  useEffect(() => {
    if (product) {
      form.reset({
        name: product?.name || "",
        description: product?.description || "",
        unitType: product?.unitType || "",
        amountValue: product?.amount?.value || 0,
        amountCurrencyIsoCode: product?.amount?.currencyIsoCode || "USD",
        categoryId: product?.category?.id || "",
      })
    }
  }, [product, form])

  const handleClose = () => {
    onOpenChange(false)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async (data: ProductFormValues) => {
    if (!product) return

    try {
      setLoading(true)

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
      })

      toast({
        title: "Product updated",
        description: "The product has been successfully updated.",
      })

      onRefetch()
      setIsEditing(false)
    } catch (error) {
      console.error({ error }, "updating product")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    form.reset({
      name: product?.name || "",
      description: product?.description || "",
      unitType: product?.unitType || "",
      amountValue: product?.amount?.value || 0,
      amountCurrencyIsoCode: product?.amount?.currencyIsoCode || "USD",
      categoryId: product?.category?.id || "",
    })
  }

  const handleContactFarmer = () => {
    if (!farmerData) return

    const message = encodeURIComponent(
      `Hello ${farmerData.user?.firstName}! I'm contacting you from FoodHouse admin team regarding your product "${product?.name}".\n\nWe have some questions about this product. Could you please provide more information?`,
    )
    const whatsappUrl = `https://wa.me/${farmerData.user?.phoneNumber?.replace(/[^0-9]/g, "")}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const categoryMap = categoriesData?.categories?.reduce((acc: Record<string, string>, category: any) => {
    if (category.id && category.name) {
      acc[category.id] = category.name
    }
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader className="flex-shrink-0 pb-6 border-b border-gray-200">
          <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-black">
            <div className="p-2 bg-white border-2 border-gray-300 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            {isEditing ? "Edit Product" : "Product Details"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 font-medium">
            {isEditing
              ? "Update the product information below"
              : "Complete details about the product and farmer information"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                <div className="bg-white rounded-xl p-6 border-2 border-gray-300">
                  <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                    <Edit className="h-5 w-5 text-green-600" />
                    Product Information
                  </h3>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black font-medium">Product Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter product name"
                              {...field}
                              className="border-gray-300 "
                            />
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
                          <FormLabel className="text-black font-medium">Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter product description"
                              {...field}
                              className="border-gray-300  min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="unitType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black font-medium">Unit Type</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., kg, piece, bundle"
                                {...field}
                                className="border-gray-300 "
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black font-medium">Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-gray-300 ">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categoriesData?.categories?.map((category: any) => (
                                  <SelectItem value={category.id || ""} key={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amountValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black font-medium">Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                disabled
                                className="border-gray-300 bg-gray-50"
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
                            <FormLabel className="text-black font-medium">Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                              <FormControl>
                                <SelectTrigger className="border-gray-300 bg-gray-50">
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
                  </div>
                </div>

                <DialogFooter className="gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="border-gray-300 hover:bg-gray-50 bg-white text-black"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600"
                  >
                    {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border-2 border-gray-300 overflow-hidden">
                <div className="bg-white border-b-2 border-gray-300 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white border-2 border-gray-300 rounded-xl">
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-black">{product?.name}</h3>
                      <p className="text-gray-600 font-medium">Product Information</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="mb-4 p-4 bg-white rounded-xl border-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-black uppercase tracking-wide mb-1">Current Price</p>
                        <p className="text-3xl font-bold text-black">
                          {product?.amount?.value}{" "}
                          <span className="text-xl text-gray-600">{product?.amount?.currencyIsoCode}</span>
                        </p>
                      </div>
                      <div className="p-4 bg-white border-2 border-gray-300 rounded-full">
                        <Mail className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-black uppercase tracking-wider mb-3">
                          Description
                        </label>
                        <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
                          <p className="text-black leading-relaxed">
                            {product?.description || "No description available"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-black uppercase tracking-wider mb-3">
                          Category
                        </label>
                        <div className="p-4 bg-white rounded-xl border-2 border-gray-300">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white border border-gray-300 rounded-lg">
                              <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="text-lg font-semibold text-black">
                              {categoryMap?.[product?.category?.id || ""] || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="h-4 block text-sm font-bold text-black uppercase tracking-wider mb-3">
                          Unit Type
                        </label>
                        <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white border border-gray-300 rounded-lg">
                              <Package className="h-3 w-5 text-green-600" />
                            </div>
                            <span className="text-lg font-semibold text-black">{product?.unitType || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-black uppercase tracking-wider mb-3">
                            Created
                          </label>
                          <div className="p-4 bg-white rounded-xl border-2 border-gray-200 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-2 bg-white border border-gray-300 rounded-lg">
                                <Phone className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-sm font-semibold text-black">
                                {new Date(product?.createdAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-black uppercase tracking-wider mb-3">
                            Updated
                          </label>
                          <div className="p-4 bg-white rounded-xl border-2 border-gray-200 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-2 bg-white border border-gray-300 rounded-lg">
                                <MapPin className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-sm font-semibold text-black">
                                {new Date(product?.updatedAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {product?.image && (
                    <div className="mb-8">
                      <label className="block text-sm font-bold text-black uppercase tracking-wider mb-4">
                        Product Image
                      </label>
                      <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name || "Product Image"}
                          className="w-full h-80 object-cover rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border-2 border-gray-300 overflow-hidden">
                <div className="bg-white border-b-2 border-gray-300 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white border-2 border-gray-300 rounded-xl">
                      <User className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-black">Farmer Details</h3>
                      <p className="text-gray-600 font-medium">Contact Information</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {isFarmerLoading ? (
                    <div className="flex items-center justify-center py-12 text-green-600">
                      <LoadingSpinner className="mr-3" />
                      <span className="font-medium text-lg text-black">Loading farmer details...</span>
                    </div>
                  ) : farmerData ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-black uppercase tracking-wider mb-3">
                            Full Name
                          </label>
                          <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white border border-gray-300 rounded-lg">
                                <User className="h-5 w-5 text-green-600" />
                              </div>
                              <span className="text-lg font-semibold text-black">
                                {`${farmerData.user?.firstName} ${farmerData.user?.lastName}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-black uppercase tracking-wider mb-3">
                            Phone Number
                          </label>
                          <div className="p-4 bg-white rounded-xl border-2 border-gray-300">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white border border-gray-300 rounded-lg">
                                <Phone className="h-5 w-5 text-green-600" />
                              </div>
                              <span className="text-lg font-semibold text-black">
                                {farmerData.user?.phoneNumber || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-black uppercase tracking-wider mb-3">
                          Address
                        </label>
                        <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white border border-gray-300 rounded-lg mt-1">
                              <MapPin className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="text-lg font-medium text-black leading-relaxed">
                              {farmerData.user?.address || "No address provided"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {farmerData.user?.phoneNumber && (
                        <div className="pt-6 border-t border-gray-200">
                          <Button
                            onClick={handleContactFarmer}
                            className="w-92 h-14  bg-green-600  text-white border-2  text-lg font-semibold"
                          >
                            <MessageCircle className="h-6 w-6 mr-3" />
                            Contact Farmer on WhatsApp
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white border-2 border-red-200 rounded-xl">
                      <div className="p-4 bg-white border-2 border-red-300 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <User className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="text-black font-semibold text-lg">Unable to load farmer details</p>
                      <p className="text-gray-600 mt-2">Information might be missing or an error occurred.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="gap-3 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleEdit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white border-2 border-green-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
              <Button
                onClick={() => onDelete(product?.id ?? "", product?.name ?? "this product", product?.createdBy ?? "")}
                variant="outline"
                className="flex-1 border-2 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 hover:text-red-700 bg-white"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Product
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

const DetailItem = ({
  label,
  value,
  icon,
  bgColor = "bg-slate-50 border-slate-200",
  highlight = false,
  compact = false,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  bgColor?: string
  highlight?: boolean
  compact?: boolean
}) => (
  <div
    className={`p-4 rounded-xl border ${bgColor} ${highlight ? "shadow-md" : "shadow-sm"} transition-all duration-200 hover:shadow-md`}
  >
    <div className="flex items-center gap-3">
      <div className={`${compact ? "p-1.5" : "p-2"} bg-white rounded-lg shadow-sm`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-slate-600 uppercase tracking-wide ${compact ? "text-xs" : "text-xs"}`}>
          {label}
        </p>
        <p
          className={`font-bold text-slate-800 ${highlight ? "text-lg" : "text-sm"} ${compact ? "text-xs" : ""} break-words`}
        >
          {value}
        </p>
      </div>
    </div>
  </div>
)
