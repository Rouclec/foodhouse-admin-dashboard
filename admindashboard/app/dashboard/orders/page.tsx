"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MessageCircle, ShoppingCart, Eye } from "lucide-react"

interface Order {
  id: string
  customer: string
  farmer: string
  products: string[]
  status: "pending" | "accepted" | "in-transit" | "delivered" | "cancelled"
  amount: number
  date: string
  customerPhone: string
  farmerPhone: string
  agentName: string
  agentPhone: string
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders] = useState<Order[]>([
    {
      id: "ORD-001",
      customer: "John Doe",
      farmer: "Green Valley Farm",
      products: ["Tomatoes", "Lettuce"],
      status: "pending",
      amount: 45.99,
      date: "2024-01-20",
      customerPhone: "+1234567890",
      farmerPhone: "+1987654321",
      agentName: "Michael Johnson",
      agentPhone: "+1122334455",
    },
    {
      id: "ORD-002",
      customer: "Jane Smith",
      farmer: "Sunny Acres",
      products: ["Apples", "Oranges", "Bananas"],
      status: "accepted",
      amount: 67.5,
      date: "2024-01-19",
      customerPhone: "+1234567891",
      farmerPhone: "+1987654322",
      agentName: "Sarah Williams",
      agentPhone: "+1122334466",
    },
    {
      id: "ORD-003",
      customer: "Bob Johnson",
      farmer: "Fresh Fields",
      products: ["Wheat", "Rice"],
      status: "in-transit",
      amount: 23.75,
      date: "2024-01-18",
      customerPhone: "+1234567892",
      farmerPhone: "+1987654323",
      agentName: "David Brown",
      agentPhone: "+1122334477",
    },
    {
      id: "ORD-004",
      customer: "Alice Brown",
      farmer: "Organic Harvest",
      products: ["Milk", "Cheese"],
      status: "delivered",
      amount: 89.25,
      date: "2024-01-17",
      customerPhone: "+1234567893",
      farmerPhone: "+1987654324",
      agentName: "Emily Davis",
      agentPhone: "+1122334488",
    },
    {
      id: "ORD-005",
      customer: "Charlie Wilson",
      farmer: "Nature's Best",
      products: ["Potatoes", "Onions"],
      status: "cancelled",
      amount: 34.8,
      date: "2024-01-16",
      customerPhone: "+1234567894",
      farmerPhone: "+1987654325",
      agentName: "James Wilson",
      agentPhone: "+1122334499",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.agentName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "in-transit":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleWhatsAppContact = (phone: string, type: "customer" | "farmer" | "agent", orderId: string) => {
    const message = encodeURIComponent(`Hello! I'm contacting you regarding order ${orderId}. How can I assist you?`)
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const viewOrderDetails = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600">Monitor and manage all customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Order Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order ID, customer, farmer or agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in-transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Showing {filteredOrders.length} of {orders.length} orders
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead className="hidden sm:table-cell">Customer</TableHead>
                <TableHead className="hidden md:table-cell">Farmer</TableHead>
                <TableHead className="hidden lg:table-cell">Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.id}
                    <div className="sm:hidden mt-1 text-xs text-gray-500">{order.customer}</div>
                    <div className="md:hidden mt-1 text-xs text-gray-500">{order.farmer}</div>
                    <div className="lg:hidden mt-1 text-xs text-gray-500">Agent: {order.agentName}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{order.customer}</TableCell>
                  <TableCell className="hidden md:table-cell">{order.farmer}</TableCell>
                  <TableCell className="hidden lg:table-cell">{order.agentName}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    <div className="md:hidden mt-1 text-xs font-medium">${order.amount.toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">${order.amount.toFixed(2)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{order.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewOrderDetails(order.id)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWhatsAppContact(order.customerPhone, "customer", order.id)}
                        title="Contact Customer"
                      >
                        <MessageCircle className="h-4 w-4" />
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
