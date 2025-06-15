"use client";

import type React from "react";

import { useContext, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  productsCreateCategoryMutation,
  productsDeleteCategoryMutation,
  productsListCategoriesOptions,
  productsUpdateCategoryMutation,
} from "@/client/products.swagger/@tanstack/react-query.gen";
import { productsgrpcCategory } from "@/client/products.swagger";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

export default function CategoriesPage() {
  const { user } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<productsgrpcCategory>();
  const [deletingCategoryId, setDeletingCategoryId] = useState<string>();
  const [deletingCategoryName, setDeletingCategoryName] = useState<string>();

  const [categoryName, setCategoryName] = useState<string>();
  const { toast } = useToast();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      if (editingCategory) {
        // Update existing category

        await updateCategory({
          body: {
            name: categoryName,
          },
          path: {
            categoryId: editingCategory?.id ?? "",
            userId: user?.userId ?? "",
          },
        });
      } else {
        // Create new category
        await createCategory({
          body: {
            name: categoryName,
          },
          path: {
            userId: user?.userId ?? "",
          },
        });
      }
    } catch (error) {
      console.error({ error }, "creating category");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: productsgrpcCategory | undefined) => {
    if (!category) return;

    setEditingCategory(category);
    setCategoryName(category.name);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (category: productsgrpcCategory | undefined) => {
    setDeletingCategoryId(category?.id ?? "");
    setDeletingCategoryName(category?.name ?? "");
    confirmDelete.openDialog();
  };

  // Confirm delete hook
  const confirmDelete = useConfirmDelete({
    onDelete: async () => {
      setLoading(true);
      if (deletingCategoryId) {
        await deleteCategory({
          path: { userId: user?.userId ?? "", categoryId: deletingCategoryId },
        });
      }
      setLoading(false);
    },
    itemType: deletingCategoryName,
    description:
      "Deleting this category will delete all the price types and product names associated with it",
  });

  const openCreateDialog = () => {
    setEditingCategory(undefined);
    setCategoryName(undefined);
    setIsDialogOpen(true);
  };

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    refetch,
  } = useQuery({
    ...productsListCategoriesOptions({}),
  });

  useQueryLoading(isCategoriesLoading);

  const { mutateAsync: updateCategory } = useMutation({
    ...productsUpdateCategoryMutation(),
    onSuccess: () => {
      toast({
        title: "Category updated",
        description: "The category has been successfully updated.",
      });
      refetch();
      setCategoryName(undefined);
      setEditingCategory(undefined);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating category",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
      });
    },
  });
  const { mutateAsync: deleteCategory } = useMutation({
    ...productsDeleteCategoryMutation(),
    onSuccess: () => {
      setDeletingCategoryId(undefined);
      toast({
        title: "Category deleted",
        description: "The category has been successfully deleted.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error deleting category",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
      });
    },
  });

  const { mutateAsync: createCategory } = useMutation({
    ...productsCreateCategoryMutation(),
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "The category has been successfully created.",
      });
      refetch();
      setCategoryName(undefined);
      setEditingCategory(undefined);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating category",
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
            <h1 className="text-3xl font-bold text-gray-900">
              Product Categories
            </h1>
            <p className="text-gray-600">
              Manage product categories for your marketplace
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Update the category information below."
                    : "Add a new product category to organize your marketplace."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      placeholder="e.g., Vegetables, Fruits, Grains"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      required
                    />
                  </div>
                  {categoryName && (
                    <div className="space-y-2">
                      <Label>Generated Slug</Label>
                      <div className="p-2 bg-gray-100 rounded text-sm text-gray-600">
                        {generateSlug(categoryName)}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={loading}
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
                    {editingCategory ? "Update Category" : "Create Category"}
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
              <Package className="h-5 w-5 mr-2" />
              Categories Overview
            </CardTitle>
            <CardDescription>
              Total categories: {(categoriesData?.categories ?? [])?.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Slug</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Created By
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriesData?.categories?.map((category) => (
                  <TableRow key={category?.id}>
                    <TableCell className="font-medium">
                      {category?.name}
                      <div className="sm:hidden mt-1">
                        <Badge variant="secondary">{category?.slug}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{category?.slug}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      Admin
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <Trash2 className="h-4 w-4" />
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
      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        itemName={deletingCategoryName}
        isLoading={loading}
      />
    </>
  );
}
