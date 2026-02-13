"use client"

import * as React from "react"
import Link from "next/link"
import {
  PieChart,
  LogOut,
  Settings,
  LayoutDashboard,
  Wallet,
  WalletCards,
  History,
  Building2,
  Users,
  ChevronRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"

import { useUser } from "@/features/auth/hooks/use-auth";
import { ModeToggle } from "@/components/mode-toggle";
const baseNav = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Pengguna",
      url: "/dashboard/users",
      icon: Users,
    },
    {
      title: "Keuangan",
      icon: Wallet,
      items: [
        {
          title: "Riwayat Transaksi",
          url: "/dashboard/logs",
        },
        {
          title: "Analitik Transaksi",
          url: "/dashboard/reports",
        },
      ],
    },
];

const adminNav = [
    {
      title: "Organisasi",
      url: "/dashboard/organizations",
      icon: Building2,
    },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useUser();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const navMain = isSuperAdmin ? [...baseNav, ...adminNav] : baseNav;

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <Sidebar collapsible="icon" {...props} suppressHydrationWarning>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent">
                  <img src="/uch.webp" alt="Logo" className="size-8 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">UCH SuperApp</span>
                  <span className="truncate text-xs">Financial Hub</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <CollapsibleMenuItem key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt={user?.name || "User"} />
                    <AvatarFallback className="rounded-lg">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || "Loading..."}</span>
                    <span className="truncate text-xs">{user?.email || "..."}</span>
                  </div>
                  <Settings className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  <Users className="mr-2 size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                  <span className="text-muted-foreground">Theme</span>
                  <ModeToggle />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function CollapsibleMenuItem({ item, pathname }: { item: any, pathname: string }) {
  const { state, setOpen } = useSidebar();
  
  // Special case for Dashboard home to prevent it from being active on all /dashboard/* routes
  if (item.url === "/dashboard") {
      const isDashboardActive = pathname === "/dashboard";
      return (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={item.title} isActive={isDashboardActive}>
            <Link href={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
  }

  // Check if main item is active (starts with match) or if any child is active
  // For submenu parent, it is valid if any child is active
  const isChildActive = item.items?.some((sub: any) => pathname.startsWith(sub.url));
  const isMainActive = item.url !== "#" && pathname.startsWith(item.url);
  const isOpen = isMainActive || isChildActive; 

  if (item.items?.length) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(isOpen);
    
    const handleClick = () => {
      // Auto-open sidebar if collapsed when clicking menu with submenu
      if (state === "collapsed") {
        setOpen(true);
      }
    };

    return (
        <Collapsible 
            asChild 
            open={isMenuOpen} 
            onOpenChange={setIsMenuOpen}
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                        tooltip={item.title} 
                        isActive={isOpen} 
                        className={isOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                        onClick={handleClick}
                    >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className={`ml-auto transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.items.map((subItem: any) => {
                            const isSubActive = pathname.startsWith(subItem.url);
                            return (
                                <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton asChild isActive={isSubActive}>
                                        <Link href={subItem.url}>
                                            <span>{subItem.title}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            );
                        })}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={isMainActive}>
        <Link href={item.url}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
