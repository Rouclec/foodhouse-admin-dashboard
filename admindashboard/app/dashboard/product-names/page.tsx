"use client";

import type React from "react";

import { FC, useContext, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  productsCreateProductNameMutation,
  productsDeleteProductNameMutation,
  productsListCategoriesOptions,
  productsListProductNamesOptions,
} from "@/client/products.swagger/@tanstack/react-query.gen";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { productsgrpcProductName } from "@/client/products.swagger";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

type ProductNameItemProps = {
  productName: productsgrpcProductName;
  handleDeleteClick: (productName: productsgrpcProductName) => void;
  categoryName: string | undefined;
};

const ProductNameItem: FC<ProductNameItemProps> = ({
  productName,
  handleDeleteClick,
  categoryName,
}) => {
  return (
    <TableRow key={productName?.name ?? ""}>
      <TableCell className="font-medium">
        {productName.name}
        <div className="sm:hidden mt-1">
          <Badge variant="secondary">{categoryName}</Badge>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant="secondary">{categoryName}</Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <p>Admin</p>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteClick(productName)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function ProductNamesPage() {
  const { user } = useContext(Context) as ContextType;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingProductName, setDeletingProductName] = useState<string>();

  const [productName, setProductName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const selectedCategory = categoriesData?.categories?.find(
        (cat) => cat.id === selectedCategoryId
      );
      if (!selectedCategory) return;

      await createProductName({
        body: {
          name: productName,
          categoryId: selectedCategoryId,
        },
        path: {
          userId: user?.userId ?? "",
        },
      });

      setProductName("");
      setSelectedCategoryId("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error({ error }, "creating product name");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (
    productName: productsgrpcProductName | undefined
  ) => {
    setDeletingProductName(productName?.name ?? "");
    confirmDelete.openDialog();
  };

  // Confirm delete hook
  const confirmDelete = useConfirmDelete({
    onDelete: async () => {
      setLoading(true);
      if (deletingProductName) {
        await deleteProductName({
          path: { userId: user?.userId ?? "", name: deletingProductName },
        });
      }
      setLoading(false);
    },
    itemType: deletingProductName,
    description:
      "Deleting this product name will delete all the products associated with it",
  });

  const openCreateDialog = () => {
    setProductName("");
    setSelectedCategoryId("");
    setIsDialogOpen(true);
  };

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    ...productsListCategoriesOptions({}),
  });

  const {
    data: productNames,
    isLoading: isProductNamesLoading,
    refetch,
  } = useQuery({
    ...productsListProductNamesOptions({}),
  });

  useQueryLoading(isCategoriesLoading || isProductNamesLoading);

  const { mutateAsync: createProductName } = useMutation({
    ...productsCreateProductNameMutation(),
    onSuccess: () => {
      toast({
        title: "Product name created",
        description: "The product name has been successfully created.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error creating product name",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
      });
    },
  });

  const { mutateAsync: deleteProductName } = useMutation({
    ...productsDeleteProductNameMutation(),
    onSuccess: () => {
      setDeletingProductName(undefined);
      toast({
        title: "Product name deleted",
        description: "The product name has been successfully deleted.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error deleting product name",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
      });
    },
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Names</h1>
            <p className="text-gray-600">
              Manage standardized product names for farmers to select
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product Name
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{"Create New Product Name"}</DialogTitle>
                <DialogDescription>
                  {"Add a new standardized product name for farmers to select."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData?.categories?.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id ?? ""}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      placeholder="e.g., Tomatoes, Apples, Wheat"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`${
                      loading &&
                      "bg-gray-500 hover:bg-grey-500 hover:cursor-not-allowed bg-opacity-80"
                    }`}
                  >
                    {"Create Product Name"}
                    {loading && (
                      <Loader2 className={"animate-spin text-white"} />
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Product Names Overview
            </CardTitle>
            <CardDescription>
              Total product names: {productNames?.productNames?.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Created By
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productNames?.productNames?.map((productName) => (
                  <ProductNameItem
                    productName={productName}
                    handleDeleteClick={(productName) =>
                      handleDeleteClick(productName)
                    }
                    categoryName={
                      categoriesData?.categories?.find(
                        (item) => item?.id === productName?.categoryId
                      )?.name
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        itemName={deleteProductName?.name}
        isLoading={loading}
      />
    </>
  );
}
