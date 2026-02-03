import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Database, Bell } from "lucide-react";

const AdminSettings = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Instellingen</h1>
          <p className="mt-1 text-muted-foreground">
            Beheer de instellingen van het platform
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Algemene Instellingen</CardTitle>
                  <CardDescription>
                    Naam, logo en basis configuratie
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Binnenkort beschikbaar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Beveiliging</CardTitle>
                  <CardDescription>
                    Gebruikers en toegangsrechten
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Binnenkort beschikbaar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Database</CardTitle>
                  <CardDescription>
                    Data export en beheer
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Binnenkort beschikbaar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Notificaties</CardTitle>
                  <CardDescription>
                    E-mail en push meldingen
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Binnenkort beschikbaar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
