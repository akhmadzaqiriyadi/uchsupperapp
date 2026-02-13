"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@/features/organizations/hooks/use-organizations";
import { Loader2, ArrowLeft, Building2, Phone, Mail, Globe, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function OrganizationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { data: organization, isLoading, error } = useOrganization(id);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !organization) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold text-muted-foreground">Organization not found</h2>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            {/* Header */}
            <div>
                 <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                </Button>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="h-24 w-24 rounded-xl border bg-muted flex items-center justify-center overflow-hidden shadow-sm">
                        {organization.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={organization.logo} alt={organization.name} className="h-full w-full object-cover" />
                        ) : (
                             <Building2 className="h-10 w-10 text-muted-foreground" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                             <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
                             {organization.isCenter && <Badge>Headquarter</Badge>}
                        </div>
                        <p className="text-muted-foreground font-mono">@{organization.slug}</p>
                        <p className="text-xs text-muted-foreground">ID: {organization.id}</p>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">Address</p>
                                <p className="text-sm text-muted-foreground">
                                    {organization.address || "-"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Phone</p>
                                <p className="text-sm text-muted-foreground">
                                    {organization.phone || "-"}
                                </p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Email</p>
                                <p className="text-sm text-muted-foreground">
                                    {organization.email ? (
                                        <a href={`mailto:${organization.email}`} className="hover:underline text-primary">
                                            {organization.email}
                                        </a>
                                    ) : "-"}
                                </p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Website</p>
                                <p className="text-sm text-muted-foreground">
                                    {organization.website ? (
                                        <a href={organization.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                            {organization.website}
                                        </a>
                                    ) : "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" /> Membership & Metadata
                        </CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Created At</p>
                                <p className="text-sm text-muted-foreground">
                                    {organization.createdAt && !isNaN(new Date(organization.createdAt).getTime())
                                      ? format(new Date(organization.createdAt), "dd MMMM yyyy, HH:mm", { locale: idLocale })
                                      : "-"}
                                </p>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
