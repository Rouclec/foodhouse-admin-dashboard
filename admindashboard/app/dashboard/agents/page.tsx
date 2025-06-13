"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Edit, Trash2, Flag, MessageCircle, Phone, Truck, Star, ClipboardCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Agent {
  id: string
  name: string
  email: string
  phone: string
  location: string
  status: "active" | "suspended" | "inactive"
  joinDate: string
  completedOrders: number
  rating: number
  vehicleType: string // Now represents transport partner
  vehicleNumber: string // Now represents partner ID/reference
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "1",
      name: "Michael Johnson",
      email: "michael@foodhouse.com",
      phone: "+1234567890",
      location: "Lagos, Nigeria",
      status: "active",
      joinDate: "2024-01-15",
      completedOrders: 156,
      rating: 4.8,
      vehicleType: "GIG Logistics",
      vehicleNumber: "GIG-123-456",
    },
    {
      id: "2",
      name: "Sarah Williams",
      email: "sarah@foodhouse.com",
      phone: "+1234567891",
      location: "Abuja, Nigeria",
      status: "active",
      joinDate: "2024-01-10",
      completedOrders: 98,
      rating: 4.6,
      vehicleType: "DHL",
      vehicleNumber: "DHL-789-012",
    },
    {
      id: "3",
      name: "David Brown",
      email: "david@foodhouse.com",
      phone: "+1234567892",
      location: "Lagos, Nigeria",
      status: "suspended",
      joinDate: "2024-01-20",
      completedOrders: 45,
      rating: 3.2,
      vehicleType: "Local Transport",
      vehicleNumber: "LT-345-678",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily@foodhouse.com",
      phone: "+1234567893",
      location: "Port Harcourt, Nigeria",
      status: "inactive",
      joinDate: "2024-01-05",
      completedOrders: 0,
      rating: 0,
      vehicleType: "FedEx",
      vehicleNumber: "FDX-901-234",
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    vehicleType: "",
    vehicleNumber: "",
  })

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingAgent) {
      // Update existing agent
      setAgents(
        agents.map((agent) =>
          agent.id === editingAgent.id
            ? {
                ...agent,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                location: formData.location,
                vehicleType: formData.vehicleType,
                vehicleNumber: formData.vehicleNumber,
              }
            : agent,
        ),
      )
      toast({
        title: "Agent updated",
        description: "The field agent has been successfully updated.",
      })
    } else {
      // Create new agent
      const newAgent: Agent = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        status: "active",
        joinDate: new Date().toISOString().split("T")[0],
        completedOrders: 0,
        rating: 0,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
      }
      setAgents([...agents, newAgent])
      toast({
        title: "Agent created",
        description: "The new field agent has been successfully created.",
      })
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      location: "",
      vehicleType: "",
      vehicleNumber: "",
    })
    setEditingAgent(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      location: agent.location,
      vehicleType: agent.vehicleType,
      vehicleNumber: agent.vehicleNumber,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setAgents(agents.filter((agent) => agent.id !== id))
    toast({
      title: "Agent deleted",
      description: "The field agent has been successfully deleted.",
    })
  }

  const handleToggleStatus = (id: string) => {
    setAgents(
      agents.map((agent) =>
        agent.id === id
          ? {
              ...agent,
              status: agent.status === "active" ? "suspended" : "active",
            }
          : agent,
      ),
    )

    const agent = agents.find((a) => a.id === id)
    const newStatus = agent?.status === "active" ? "suspended" : "active"

    toast({
      title: `Agent ${newStatus}`,
      description: `${agent?.name} has been ${newStatus === "active" ? "activated" : "suspended"}.`,
    })
  }

  const handleContactViaWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}! I'm contacting you from FoodHouse admin team.`)
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Agents</h1>
          <p className="text-gray-600">Manage field agents who validate products from farmers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgent ? "Edit Field Agent" : "Create New Field Agent"}</DialogTitle>
              <DialogDescription>
                {editingAgent
                  ? "Update the agent information below."
                  : "Add a new field agent who will validate products from farmers."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="e.g., +1234567890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Lagos, Nigeria"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Transport Partner</Label>
                    <Select
                      value={formData.vehicleType}
                      onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                    >
                      <SelectTrigger id="vehicleType">
                        <SelectValue placeholder="Select transport partner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GIG Logistics">GIG Logistics</SelectItem>
                        <SelectItem value="DHL">DHL</SelectItem>
                        <SelectItem value="FedEx">FedEx</SelectItem>
                        <SelectItem value="Local Transport">Local Transport</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Partner ID/Reference</Label>
                    <Input
                      id="vehicleNumber"
                      placeholder="e.g., Partner reference number"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">{editingAgent ? "Update Agent" : "Create Agent"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Field Agent Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                <div className="flex items-center">
                  <div className="flex items-center mr-2">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{agent.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-gray-500">{agent.completedOrders} validations</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center mb-4">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarFallback className="bg-green-100 text-green-800">{agent.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-lg">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{agent.phone}</span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-gray-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{agent.location}</span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 text-gray-500 mr-2" />
                  <span>
                    Transport: {agent.vehicleType} • Ref: {agent.vehicleNumber}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-gray-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Joined {agent.joinDate}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(agent)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(agent.id)}
                  className={agent.status === "active" ? "text-yellow-600" : "text-green-600"}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  {agent.status === "active" ? "Suspend" : "Activate"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleContactViaWhatsApp(agent.phone, agent.name)}>
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(agent.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <ClipboardCheck className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No agents found</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Add your first field agent to get started"}
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
