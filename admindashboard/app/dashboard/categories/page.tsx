"use client";

import type React from "react";

import { useContext, useEffect, useMemo, useState } from "react";
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
import { uploadImage } from "@/utils";

export default function CategoriesPage() {
  const { user } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<productsgrpcCategory>();
  const [deletingCategoryId, setDeletingCategoryId] = useState<string>();
  const [deletingCategoryName, setDeletingCategoryName] = useState<string>();

  const [categoryName, setCategoryName] = useState<string>();
  const [categoryImage, setCategoryImage] = useState<string>();
  const [imageError, setImageError] = useState<string>();
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const imagePreviewSrc = useMemo(() => {
    const src = (categoryImage ?? "").trim();
    return src.length ? src : undefined;
  }, [categoryImage]);

  const pendingFilePreview = useMemo(() => {
    if (!pendingImageFile) return undefined;
    return URL.createObjectURL(pendingImageFile);
  }, [pendingImageFile]);

  useEffect(() => {
    return () => {
      if (pendingFilePreview) URL.revokeObjectURL(pendingFilePreview);
    };
  }, [pendingFilePreview]);

  const handleImageFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setImageError(undefined);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setImageError("Please select an image file (png, jpg, webp, etc).");
      return;
    }

    const MAX_BYTES = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_BYTES) {
      setImageError("Image is too large (max 2MB).");
      return;
    }

    setPendingImageFile(file);
    setImageUploadProgress(0);

    // allow selecting same file again later
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setImageError(undefined);

      let imageUrl = categoryImage;
      if (pendingImageFile) {
        const ext = pendingImageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
        const filename = `category_${editingCategory?.id ?? "new"}_${Date.now()}.${safeExt}`;

        imageUrl = await uploadImage({
          file: pendingImageFile,
          directory: "categories",
          filename,
          onProgress: setImageUploadProgress,
        });
      }

      if (editingCategory) {
        // Update existing category

        await updateCategory({
          body: {
            name: categoryName,
            image: imageUrl,
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
            image: imageUrl,
          },
          path: {
            userId: user?.userId ?? "",
          },
        });
      }
    } catch (error) {
      console.error({ error }, "creating category");
      setImageError("Failed to upload image or save category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: productsgrpcCategory | undefined) => {
    if (!category) return;

    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryImage(category.image);
    setPendingImageFile(null);
    setImageUploadProgress(0);
    setImageError(undefined);
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
    setCategoryImage(undefined);
    setPendingImageFile(null);
    setImageUploadProgress(0);
    setImageError(undefined);
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
      setCategoryImage(undefined);
      setPendingImageFile(null);
      setImageUploadProgress(0);
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
      setCategoryImage(undefined);
      setPendingImageFile(null);
      setImageUploadProgress(0);
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

                  <div className="space-y-2">
                    <Label>Category Image</Label>
                    <div className="grid gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileSelected}
                        disabled={loading}
                      />
                      <div className="grid gap-2">
                        <Label htmlFor="categoryImageUrl" className="text-sm">
                          Or paste an image URL / base64
                        </Label>
                        <Input
                          id="categoryImageUrl"
                          placeholder="https://... or data:image/...base64,..."
                          value={categoryImage ?? ""}
                          onChange={(e) => {
                            setImageError(undefined);
                            setCategoryImage(e.target.value);
                          }}
                          disabled={loading}
                        />
                      </div>

                      {!!imageError && (
                        <p className="text-sm text-red-600">{imageError}</p>
                      )}

                      {(pendingFilePreview || imagePreviewSrc) && (
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 border">
                            <img
                              src={pendingFilePreview ?? imagePreviewSrc}
                              alt="Category preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          {pendingImageFile && (
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">
                                Ready to upload: <span className="font-medium">{pendingImageFile.name}</span>
                              </p>
                              <p className="text-xs text-gray-500">
                                Upload starts when you save.
                                {imageUploadProgress > 0 ? ` (${imageUploadProgress}%)` : ""}
                              </p>
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setPendingImageFile(null);
                              setCategoryImage(undefined);
                              setImageUploadProgress(0);
                            }}
                            disabled={loading}
                          >
                            Remove image
                          </Button>
                        </div>
                      )}
                    </div>
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
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden md:table-cell">Image</TableHead>
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
                      <TableCell className="hidden md:table-cell">
                        {category?.image ? (
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 border">
                            <img
                              src={category.image}
                              alt={category?.name ?? "Category"}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-100 border" />
                        )}
                      </TableCell>
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
              {(categoriesData?.categories ?? []).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No categories found</p>
                </div>
              )}
            </div>
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
