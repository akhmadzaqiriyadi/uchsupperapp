"use client";

import { useUser } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Building, Shield, Lock } from "lucide-react";

export default function ProfilePage() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Personal Info Card */}
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                        {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{user?.name}</CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                         <Badge variant="outline">{user?.role}</Badge>
                         {user?.organization && (
                             <Badge variant="secondary">{user.organization.slug}</Badge>
                         )}
                    </div>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-6 pt-6">
                 <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="name" defaultValue={user?.name} className="pl-9" readOnly />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="email" defaultValue={user?.email} className="pl-9" readOnly disabled />
                        </div>
                    </div>
                 </div>

                 <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                         <Label>Organization</Label>
                         <div className="relative">
                             <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input defaultValue={user?.organization?.name || "No Organization"} className="pl-9" readOnly disabled />
                         </div>
                    </div>
                    <div className="space-y-2">
                         <Label>Role Access</Label>
                         <div className="relative">
                             <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input defaultValue={user?.role} className="pl-9" readOnly disabled />
                         </div>
                    </div>
                 </div>
            </CardContent>
            <CardFooter className="bg-muted/5 border-t py-4">
                 <p className="text-xs text-muted-foreground">
                     To update your personal details, please contact your workspace administrator.
                 </p>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
