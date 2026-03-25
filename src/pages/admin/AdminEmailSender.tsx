import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Mail, MailOpen, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

// Email templates
const EMAIL_TEMPLATES: Record<string, { name: string; subject: string; getHtml: (recipientName?: string) => string }> = {
  "makelaar-welkom": {
    name: "Makelaar Welkom",
    subject: "Vergroot uw bereik met WoonPeek – Gratis woningen plaatsen",
    getHtml: (name?: string) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); padding: 40px 30px; text-align: center; border-radius: 0 0 24px 24px;">
          <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">🏠 WoonPeek</h1>
          <p style="color: #bfdbfe; font-size: 14px; margin: 8px 0 0;">Het snelst groeiende woningplatform van Nederland</p>
        </div>
        
        <div style="padding: 35px 30px;">
          <h2 style="color: #1a365d; font-size: 22px; margin: 0 0 15px;">
            ${name ? `Beste ${name},` : "Beste makelaar,"}
          </h2>
          
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            Wij zijn <strong>WoonPeek</strong> – een ambitieus woningplatform dat dagelijks groeit. 
            Wij helpen makelaars zoals u om meer potentiële huurders en kopers te bereiken, 
            volledig <strong>gratis</strong>.
          </p>

          <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 12px 12px 0; margin: 25px 0;">
            <h3 style="color: #1a365d; font-size: 16px; margin: 0 0 12px;">✨ Waarom WoonPeek?</h3>
            <ul style="color: #374151; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
              <li><strong>Gratis</strong> uw woningaanbod plaatsen</li>
              <li>Extra verkeer naar uw website via doorverwijzingen</li>
              <li>Automatische koppeling via XML/JSON feed mogelijk</li>
              <li>Dagelijks nieuwe bezoekers die actief zoeken</li>
              <li>Professionele presentatie van uw aanbod</li>
            </ul>
          </div>

          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 20px 0;">
            Wij bieden een eenvoudige manier om uw aanbod te koppelen. Of u nu een XML-feed heeft, 
            handmatig wilt plaatsen of een andere koppeling prefereert – wij denken graag mee.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://woonpeek.nl/makelaar-koppelen" 
               style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
              Gratis Aanmelden →
            </a>
          </div>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 25px 0 0; text-align: center;">
            Heeft u vragen? Reageer gerust op deze e-mail of neem contact op via 
            <a href="mailto:info@woonpeek.nl" style="color: #2563eb;">info@woonpeek.nl</a>
          </p>
        </div>

        <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} WoonPeek.nl – Met passie gebouwd voor de woningmarkt
          </p>
        </div>
      </div>
    `,
  },
  "makelaar-herinnering": {
    name: "Makelaar Herinnering",
    subject: "Nog niet aangemeld? Uw woningen verdienen meer bereik!",
    getHtml: (name?: string) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); padding: 35px 30px; text-align: center; border-radius: 0 0 24px 24px;">
          <h1 style="color: #ffffff; font-size: 26px; margin: 0;">🏠 WoonPeek</h1>
        </div>
        
        <div style="padding: 35px 30px;">
          <h2 style="color: #1a365d; font-size: 20px; margin: 0 0 15px;">
            ${name ? `Hallo ${name},` : "Hallo,"}
          </h2>
          
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            Onlangs hebben wij u geïnformeerd over de mogelijkheid om <strong>gratis</strong> uw 
            woningaanbod te plaatsen op WoonPeek. Wij wilden u er even aan herinneren dat deze 
            kans er nog steeds is!
          </p>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 0 12px 12px 0; margin: 20px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
              💡 Wist u dat makelaars die op WoonPeek staan gemiddeld <strong>meer bereik</strong> genereren 
              voor hun woningen? En het kost u niets.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://woonpeek.nl/makelaar-koppelen" 
               style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 10px; font-size: 16px; font-weight: 600;">
              Nu Gratis Aanmelden →
            </a>
          </div>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
            Vragen? Mail ons op <a href="mailto:info@woonpeek.nl" style="color: #2563eb;">info@woonpeek.nl</a>
          </p>
        </div>

        <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} WoonPeek.nl</p>
        </div>
      </div>
    `,
  },
};

const AdminEmailSender = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customSubject, setCustomSubject] = useState("");

  // Fetch sent emails history
  const { data: sentEmails, isLoading: loadingHistory } = useQuery({
    queryKey: ["admin-sent-emails"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_sent_emails")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as {
        id: string;
        recipient_email: string;
        recipient_name: string | null;
        subject: string;
        template_name: string;
        status: string;
        opened_at: string | null;
        tracking_id: string;
        created_at: string;
      }[];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !recipientEmail) throw new Error("Vul alle velden in");
      const template = EMAIL_TEMPLATES[selectedTemplate];
      if (!template) throw new Error("Template niet gevonden");

      const trackingId = crypto.randomUUID();
      const subject = customSubject || template.subject;
      const htmlContent = template.getHtml(recipientName || undefined);

      const { data, error } = await supabase.functions.invoke("send-makelaar-email", {
        body: {
          recipientEmail,
          recipientName: recipientName || null,
          subject,
          htmlContent,
          templateName: selectedTemplate,
          trackingId,
          userId: user?.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("E-mail succesvol verzonden!");
      setRecipientEmail("");
      setRecipientName("");
      setCustomSubject("");
      queryClient.invalidateQueries({ queryKey: ["admin-sent-emails"] });
    },
    onError: (err: Error) => {
      toast.error(`Fout bij verzenden: ${err.message}`);
    },
  });

  const stats = {
    total: sentEmails?.length || 0,
    opened: sentEmails?.filter((e) => e.opened_at).length || 0,
    pending: sentEmails?.filter((e) => !e.opened_at).length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">E-mail Verzenden</h1>
          <p className="text-muted-foreground">Verstuur e-mails naar makelaars en volg opens</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Totaal verzonden</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <MailOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.opened}</p>
                <p className="text-sm text-muted-foreground">Geopend</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Niet geopend</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="send" className="space-y-4">
          <TabsList>
            <TabsTrigger value="send">Versturen</TabsTrigger>
            <TabsTrigger value="history">Geschiedenis ({stats.total})</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Send Tab */}
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Nieuwe E-mail</CardTitle>
                <CardDescription>Selecteer een template en vul de gegevens in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>E-mailadres ontvanger *</Label>
                    <Input
                      type="email"
                      placeholder="makelaar@kantoor.nl"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Naam ontvanger (optioneel)</Label>
                    <Input
                      placeholder="Jan de Vries"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Template *</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EMAIL_TEMPLATES).map(([key, tpl]) => (
                        <SelectItem key={key} value={key}>{tpl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Onderwerp (leeg = standaard van template)</Label>
                  <Input
                    placeholder={selectedTemplate ? EMAIL_TEMPLATES[selectedTemplate]?.subject : "Onderwerp..."}
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                  />
                </div>

                <Button
                  onClick={() => sendMutation.mutate()}
                  disabled={!recipientEmail || !selectedTemplate || sendMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Verstuur E-mail
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Verzonden E-mails</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !sentEmails?.length ? (
                  <p className="py-8 text-center text-muted-foreground">Nog geen e-mails verzonden</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ontvanger</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead>Onderwerp</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Verzonden</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sentEmails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{email.recipient_email}</p>
                                {email.recipient_name && (
                                  <p className="text-xs text-muted-foreground">{email.recipient_name}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {EMAIL_TEMPLATES[email.template_name]?.name || email.template_name}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">{email.subject}</TableCell>
                            <TableCell>
                              {email.opened_at ? (
                                <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-0">
                                  <MailOpen className="mr-1 h-3 w-3" />
                                  Geopend
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <Clock className="mr-1 h-3 w-3" />
                                  Verzonden
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(email.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                              {email.opened_at && (
                                <p className="text-xs text-green-600">
                                  Geopend: {format(new Date(email.opened_at), "d MMM HH:mm", { locale: nl })}
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>
                  {selectedTemplate
                    ? `Preview: ${EMAIL_TEMPLATES[selectedTemplate]?.name}`
                    : "Selecteer een template om de preview te zien"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="rounded-lg border bg-white p-4">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: EMAIL_TEMPLATES[selectedTemplate].getHtml(recipientName || "Voorbeeld Naam"),
                      }}
                    />
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    Selecteer een template hierboven om een preview te zien
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailSender;
