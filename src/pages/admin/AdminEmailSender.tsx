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
const LOGO_URL = "https://www.woonpeek.nl/assets/logo-woonpeek-CMQsaJz-.png";

const EMAIL_TEMPLATES: Record<string, { name: string; subject: string; getHtml: (recipientName?: string) => string }> = {
  "makelaar-welkom": {
    name: "Makelaar Welkom",
    subject: "Vergroot uw bereik met WoonPeek",
    getHtml: (name?: string) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;">
<div style="background:#1a365d;padding:30px;text-align:center;">
<img src="${LOGO_URL}" alt="WoonPeek" height="50" style="display:inline-block;" />
</div>
<div style="padding:30px;">
<p style="color:#1a365d;font-size:16px;margin:0 0 20px;">${name ? `Geachte ${name},` : "Geachte heer/mevrouw,"}</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 15px;">Graag stellen wij ons voor: wij zijn <strong>WoonPeek</strong>, een groeiend woningplatform in Nederland. Wij bieden makelaars de mogelijkheid om kosteloos hun woningaanbod bij ons te plaatsen.</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 20px;">Door uw aanbod op WoonPeek te plaatsen profiteert u van:</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#333333;font-size:14px;">Kosteloos uw woningen plaatsen</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#333333;font-size:14px;">Extra bezoekers naar uw eigen website</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#333333;font-size:14px;">Automatische koppeling via XML of JSON feed</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#333333;font-size:14px;">Professionele presentatie van uw aanbod</td></tr>
<tr><td style="padding:10px 12px;color:#333333;font-size:14px;">Dagelijks nieuwe woningzoekers op ons platform</td></tr>
</table>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 25px;">De koppeling is eenvoudig. Of u een XML-feed heeft, handmatig wilt plaatsen of een andere voorkeur heeft, wij denken graag met u mee.</p>
<div style="text-align:center;margin:0 0 25px;">
<a href="https://woonpeek.nl/makelaar-koppelen" style="display:inline-block;background:#1a365d;color:#ffffff;text-decoration:none;padding:12px 30px;font-size:14px;font-weight:600;">Gratis aanmelden</a>
</div>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 5px;">Met vriendelijke groet,</p>
<p style="color:#1a365d;font-size:14px;font-weight:600;margin:0;">Team WoonPeek</p>
</div>
<div style="background:#f8fafc;padding:20px 30px;border-top:1px solid #e2e8f0;">
<p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">WoonPeek.nl | info@woonpeek.nl</p>
</div>
</div>`,
  },
  "makelaar-herinnering": {
    name: "Makelaar Herinnering",
    subject: "Herinnering: plaats kosteloos uw woningen op WoonPeek",
    getHtml: (name?: string) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;">
<div style="background:#1a365d;padding:30px;text-align:center;">
<img src="${LOGO_URL}" alt="WoonPeek" height="50" style="display:inline-block;" />
</div>
<div style="padding:30px;">
<p style="color:#1a365d;font-size:16px;margin:0 0 20px;">${name ? `Geachte ${name},` : "Geachte heer/mevrouw,"}</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 15px;">Onlangs hebben wij u benaderd over de mogelijkheid om kosteloos uw woningaanbod op WoonPeek te plaatsen. Graag herinneren wij u aan dit aanbod.</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 20px;">Makelaars die op WoonPeek staan, bereiken dagelijks extra woningzoekers zonder dat daar kosten aan verbonden zijn. De koppeling is snel geregeld.</p>
<div style="text-align:center;margin:0 0 25px;">
<a href="https://woonpeek.nl/makelaar-koppelen" style="display:inline-block;background:#1a365d;color:#ffffff;text-decoration:none;padding:12px 30px;font-size:14px;font-weight:600;">Nu aanmelden</a>
</div>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 15px;">Heeft u vragen of wilt u meer informatie? Neem gerust contact met ons op via <a href="mailto:info@woonpeek.nl" style="color:#1a365d;">info@woonpeek.nl</a>.</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 5px;">Met vriendelijke groet,</p>
<p style="color:#1a365d;font-size:14px;font-weight:600;margin:0;">Team WoonPeek</p>
</div>
<div style="background:#f8fafc;padding:20px 30px;border-top:1px solid #e2e8f0;">
<p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">WoonPeek.nl | info@woonpeek.nl</p>
</div>
</div>`,
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
