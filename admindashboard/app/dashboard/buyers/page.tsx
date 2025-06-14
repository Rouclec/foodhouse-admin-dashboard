"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Flag, UserX, Leaf, MessageCircle, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Farmer {
  id: string
  name: string
  email: string
  phone: string
  farmName: string
  location: string
  status: "active" | "flagged" | "disabled"
  joinDate: string
  totalProducts: number
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([
    {
      id: "1",
      name: "John Smith",
      email: "john@greenvalley.com",
      phone: "+1234567890",
      farmName: "Green Valley Farm",
      location: "California, USA",
      status: "active",
      joinDate: "2024-01-15",
      totalProducts: 25,
    },
    {
      id: "2",
      name: "Maria Garcia",
      email: "maria@sunnyacres.com",
      phone: "+1234567891",
      farmName: "Sunny Acres",
      location: "Texas, USA",
      status: "flagged",
      joinDate: "2024-01-10",
      totalProducts: 18,
    },
    {
      id: "3",
      name: "David Johnson",
      email: "david@freshfields.com",
      phone: "+1234567892",
      farmName: "Fresh Fields",
      location: "Florida, USA",
      status: "active",
      joinDate: "2024-01-20",
      totalProducts: 32,
    },
    {
      id: "4",
      name: "Sarah Wilson",
      email: "sarah@organicharvest.com",
      phone: "+1234567893",
      farmName: "Organic Harvest",
      location: "Oregon, USA",
      status: "disabled",
      joinDate: "2024-01-05",
      totalProducts: 12,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  const filteredFarmers = farmers.filter((farmer) => {
    const matchesSearch =
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || farmer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "flagged":
        return "bg-yellow-100 text-yellow-800"
      case "disabled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleFlagFarmer = (farmerId: string) => {
    setFarmers(
      farmers.map((farmer) =>
        farmer.id === farmerId
          ? { ...farmer, status: farmer.status === "flagged" ? "active" : ("flagged" as const) }
          : farmer,
      ),
    )

    const farmer = farmers.find((f) => f.id === farmerId)
    const newStatus = farmer?.status === "flagged" ? "active" : "flagged"

    toast({
      title: `Farmer ${newStatus === "flagged" ? "flagged" : "unflagged"}`,
      description: `${farmer?.name} has been ${newStatus === "flagged" ? "flagged for review" : "restored to active status"}.`,
    })
  }

  const handleDisableFarmer = (farmerId: string) => {
    setFarmers(
      farmers.map((farmer) =>
        farmer.id === farmerId
          ? { ...farmer, status: farmer.status === "disabled" ? "active" : ("disabled" as const) }
          : farmer,
      ),
    )

    const farmer = farmers.find((f) => f.id === farmerId)
    const newStatus = farmer?.status === "disabled" ? "active" : "disabled"

    toast({
      title: `Farmer account ${newStatus === "disabled" ? "disabled" : "enabled"}`,
      description: `${farmer?.name}'s account has been ${newStatus === "disabled" ? "disabled" : "reactivated"}.`,
    })
  }

  const handleContactFarmer = (phone: string, farmerName: string) => {
    const message = encodeURIComponent(
      `Hello ${farmerName}! I'm contacting you from FoodHouse admin team. How can I assist you?`,
    )
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer Management</h1>
          <p className="text-gray-600">Manage buyers and their account status</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Buyer Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Farmers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Buyers</CardTitle>
          <CardDescription>
            Showing {filteredFarmers.length} of {farmers.length} users
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarmers.map((farmer) => (
                <TableRow key={farmer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{farmer.name}</p>
                      <p className="text-sm text-gray-600">{farmer.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{farmer.location}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(farmer.status)}>{farmer.status}</Badge>
                    <div className="md:hidden mt-1 text-xs text-gray-500">Joined: {farmer.joinDate}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{farmer.joinDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactFarmer(farmer.phone, farmer.name)}
                        title="Contact via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisableFarmer(farmer.id)}
                        title={farmer.status === "disabled" ? "Enable account" : "Disable account"}
                      >
                        <UserX className="h-4 w-4" />
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
