"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Settings,
  Leaf,
  Tag,
  DollarSign,
  ChevronUp,
  LogOut,
  User,
  MapPin,
  Truck,
  LucideProps,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ForwardRefExoticComponent, RefAttributes, useContext } from "react";
import { UrlObject } from "url";
import { Context, ContextType } from "@/app/contexts/QueryProvider";

const menuItems: Array<{
  title: string;
  items: Array<{
    title: string;
    url: UrlObject | __next_route_internal_types__.RouteImpl<string>;
    icon: ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;
  }>;
}> = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Product Management",
    items: [
      { title: "Categories", url: "/dashboard/categories", icon: Package },
      { title: "Product Names", url: "/dashboard/product-names", icon: Tag },
      { title: "Price Types", url: "/dashboard/price-types", icon: DollarSign },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Orders", url: "/dashboard/orders", icon: ShoppingCart },
      { title: "Farmers", url: "/dashboard/farmers", icon: Leaf },
      {
        title: "Delivery Points",
        url: "/dashboard/delivery-points",
        icon: MapPin,
      },
      { title: "Payments", url: "/dashboard/payments", icon: CreditCard },
      {
        title: "Subscriptions",
        url: "/dashboard/subscriptions",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", url: "/dashboard/profile", icon: User },
      { title: "Field Agents", url: "/dashboard/agents", icon: Truck },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useContext(Context) as ContextType;

  const handleLogout = () => {
    // Remove auth token
    localStorage.removeItem("auth-token");

    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });

    router.push("/auth/login");
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-gray-200">
        <div className="flex items-center space-x-2 px-4 py-2">
          <div className="bg-primary p-2 rounded-lg">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">FoodHouse</h2>
            <p className="text-xs text-gray-600">Admin Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        !!user?.profileImage
                          ? user?.profileImage
                          : `/placeholder-user.jpg`
                      }
                      alt="Admin"
                    />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                  <ChevronUp className="h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
