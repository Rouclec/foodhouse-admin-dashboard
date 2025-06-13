"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProductName {
  id: string
  name: string
  categoryId: string
  categoryName: string
  createdBy: string
  createdAt: string
}

interface Category {
  id: string
  name: string
}

export default function ProductNamesPage() {
  const [categories] = useState<Category[]>([
    { id: "1", name: "Vegetables" },
    { id: "2", name: "Fruits" },
    { id: "3", name: "Grains" },
    { id: "4", name: "Dairy" },
  ])

  const [productNames, setProductNames] = useState<ProductName[]>([
    {
      id: "1",
      name: "Tomatoes",
      categoryId: "1",
      categoryName: "Vegetables",
      createdBy: "Admin",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Lettuce",
      categoryId: "1",
      categoryName: "Vegetables",
      createdBy: "Admin",
      createdAt: "2024-01-16",
    },
    { id: "3", name: "Apples", categoryId: "2", categoryName: "Fruits", createdBy: "Admin", createdAt: "2024-01-17" },
    { id: "4", name: "Wheat", categoryId: "3", categoryName: "Grains", createdBy: "Admin", createdAt: "2024-01-18" },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProductName, setEditingProductName] = useState<ProductName | null>(null)
  const [productName, setProductName] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId)
    if (!selectedCategory) return

    if (editingProductName) {
      // Update existing product name
      setProductNames(
        productNames.map((pn) =>
          pn.id === editingProductName.id
            ? { ...pn, name: productName, categoryId: selectedCategoryId, categoryName: selectedCategory.name }
            : pn,
        ),
      )
      toast({
        title: "Product name updated",
        description: "The product name has been successfully updated.",
      })
    } else {
      // Create new product name
      const newProductName: ProductName = {
        id: Date.now().toString(),
        name: productName,
        categoryId: selectedCategoryId,
        categoryName: selectedCategory.name,
        createdBy: "Admin",
        createdAt: new Date().toISOString().split("T")[0],
      }
      setProductNames([...productNames, newProductName])
      toast({
        title: "Product name created",
        description: "The new product name has been successfully created.",
      })
    }

    setProductName("")
    setSelectedCategoryId("")
    setEditingProductName(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (productName: ProductName) => {
    setEditingProductName(productName)
    setProductName(productName.name)
    setSelectedCategoryId(productName.categoryId)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setProductNames(productNames.filter((pn) => pn.id !== id))
    toast({
      title: "Product name deleted",
      description: "The product name has been successfully deleted.",
    })
  }

  const openCreateDialog = () => {
    setEditingProductName(null)
    setProductName("")
    setSelectedCategoryId("")
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Names</h1>
          <p className="text-gray-600">Manage standardized product names for farmers to select</p>
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
              <DialogTitle>{editingProductName ? "Edit Product Name" : "Create New Product Name"}</DialogTitle>
              <DialogDescription>
                {editingProductName
                  ? "Update the product name information below."
                  : "Add a new standardized product name for farmers to select."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingProductName ? "Update Product Name" : "Create Product Name"}</Button>
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
          <CardDescription>Total product names: {productNames.length}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Created By</TableHead>
                <TableHead className="hidden lg:table-cell">Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productNames.map((productName) => (
                <TableRow key={productName.id}>
                  <TableCell className="font-medium">
                    {productName.name}
                    <div className="sm:hidden mt-1">
                      <Badge variant="secondary">{productName.categoryName}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{productName.categoryName}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{productName.createdBy}</TableCell>
                  <TableCell className="hidden lg:table-cell">{productName.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(productName)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(productName.id)}>
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
  )
}
