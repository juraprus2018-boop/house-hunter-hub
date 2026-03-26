import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Mail, MailOpen, Clock, Loader2, Upload, Users, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { EMAIL_TEMPLATES } from "@/components/admin/emailTemplates";

const AdminEmailSender = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode: single or bulk
  const [sendMode, setSendMode] = useState<"single" | "bulk">("single");

  // Single mode
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");

  // Bulk mode
  const [bulkEmails, setBulkEmails] = useState("");

  // Shared
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customSubject, setCustomSubject] = useState("");

  // Batch progress
  const [batchProgress, setBatchProgress] = useState<{ sent: number; failed: number; skipped: number; total: number } | null>(null);
  const abortRef = useRef(false);

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

  const parseBulkEmails = (): { email: string; name?: string }[] => {
    return bulkEmails
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split(/[,;]\s*/);
        if (parts.length >= 2) {
          const first = parts[0]?.trim();
          const second = parts[1]?.trim();
          if (second?.includes("@")) {
            return { email: second, name: first || undefined };
          }
          if (first?.includes("@")) {
            return { email: first, name: second || undefined };
          }
          return null;
        }
        const email = parts[0]?.trim();
        if (!email || !email.includes("@")) return null;
        return { email };
      })
      .filter(Boolean) as { email: string; name?: string }[];
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const startIndex = lines[0]?.toLowerCase().includes("email") ? 1 : 0;

      const parsed = lines
        .slice(startIndex)
        .map((line) => {
          const parts = line.split(/[,;]\s*/);
          const first = parts[0]?.trim();
          const second = parts[1]?.trim();
          if (second?.includes("@")) {
            return first ? `${first}, ${second}` : second;
          }
          if (first?.includes("@")) {
            return second ? `${second}, ${first}` : first;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");

      setBulkEmails((prev) => (prev ? prev + "\n" + parsed : parsed));
      toast.success(`${parsed.split("\n").length} e-mailadressen geïmporteerd`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const BATCH_SIZE = 2;

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("Selecteer een template");
      const template = EMAIL_TEMPLATES[selectedTemplate];
      if (!template) throw new Error("Template niet gevonden");

      const subject = customSubject || template.subject;
      const htmlContent = template.getHtml();
      abortRef.current = false;

      if (sendMode === "single") {
        const { data, error } = await supabase.functions.invoke("send-makelaar-email", {
          body: {
            recipients: [{ email: recipientEmail, name: recipientName || undefined }],
            subject,
            htmlContent,
            templateName: selectedTemplate,
            userId: user?.id,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
      }

      const allRecipients = parseBulkEmails();
      if (allRecipients.length === 0) throw new Error("Geen geldige e-mailadressen gevonden");

      let totalSent = 0;
      let totalFailed = 0;
      let totalSkipped = 0;
      const totalCount = allRecipients.length;
      setBatchProgress({ sent: 0, failed: 0, skipped: 0, total: totalCount });

      for (let i = 0; i < allRecipients.length; i += BATCH_SIZE) {
        if (abortRef.current) break;

        const batch = allRecipients.slice(i, i + BATCH_SIZE);
        try {
          const { data, error } = await supabase.functions.invoke("send-makelaar-email", {
            body: {
              recipients: batch,
              subject,
              htmlContent,
              templateName: selectedTemplate,
              userId: user?.id,
            },
          });
          if (error) throw error;
          totalSent += data?.sent || 0;
          totalFailed += data?.failed || 0;
          totalSkipped += data?.skipped || 0;
        } catch {
          totalFailed += batch.length;
        }

        setBatchProgress({ sent: totalSent, failed: totalFailed, skipped: totalSkipped, total: totalCount });

        if (i + BATCH_SIZE < allRecipients.length && !abortRef.current) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      setBatchProgress(null);
      return { sent: totalSent, failed: totalFailed, skipped: totalSkipped };
    },
    onSuccess: (data) => {
      const sent = data?.sent || 0;
      const failed = data?.failed || 0;
      const skipped = data?.skipped || 0;
      const parts = [`${sent} verzonden`];
      if (skipped > 0) parts.push(`${skipped} overgeslagen (al verzonden)`);
      if (failed > 0) parts.push(`${failed} mislukt`);
      if (failed > 0) {
        toast.warning(parts.join(", "));
      } else {
        toast.success(parts.join(", "));
      }
      setRecipientEmail("");
      setRecipientName("");
      setBulkEmails("");
      setCustomSubject("");
      queryClient.invalidateQueries({ queryKey: ["admin-sent-emails"] });
    },
    onError: (err: Error) => {
      setBatchProgress(null);
      toast.error(`Fout bij verzenden: ${err.message}`);
    },
  });

  const bulkCount = parseBulkEmails().length;

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
                <CardDescription>Verstuur naar één ontvanger of in bulk</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={sendMode === "single" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSendMode("single")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Enkel
                  </Button>
                  <Button
                    variant={sendMode === "bulk" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSendMode("bulk")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Bulk
                  </Button>
                </div>

                {sendMode === "single" ? (
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
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-2">
                        <Label>
                          E-mailadressen (één per regel, optioneel met naam: naam, email)
                        </Label>
                      </div>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          className="hidden"
                          onChange={handleCsvImport}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          CSV importeren
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      placeholder={`Jan de Vries, makelaar1@kantoor.nl\nmakelaar2@kantoor.nl\nPiet Jansen, info@vastgoed.nl`}
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    {bulkCount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        <Users className="mr-1 inline h-4 w-4" />
                        {bulkCount} geldige ontvanger{bulkCount !== 1 ? "s" : ""} gevonden
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Template *</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EMAIL_TEMPLATES).map(([key, tpl]) => (
                        <SelectItem key={key} value={key}>
                          {tpl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Onderwerp (leeg = standaard van template)</Label>
                  <Input
                    placeholder={
                      selectedTemplate
                        ? EMAIL_TEMPLATES[selectedTemplate]?.subject
                        : "Onderwerp..."
                    }
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                  />
                </div>

                {/* Batch progress */}
                {batchProgress && (
                  <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        Verzenden... {batchProgress.sent + batchProgress.failed} / {batchProgress.total}
                      </span>
                      <span className="text-muted-foreground">
                        {batchProgress.sent} verzonden{batchProgress.failed > 0 ? `, ${batchProgress.failed} mislukt` : ""}
                      </span>
                    </div>
                    <Progress value={((batchProgress.sent + batchProgress.failed) / batchProgress.total) * 100} />
                    <Button variant="destructive" size="sm" onClick={() => { abortRef.current = true; }}>
                      Stoppen
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => sendMutation.mutate()}
                    disabled={
                      !selectedTemplate ||
                      sendMutation.isPending ||
                      (sendMode === "single" && !recipientEmail) ||
                      (sendMode === "bulk" && bulkCount === 0)
                    }
                    className="w-full sm:w-auto"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {sendMode === "bulk"
                      ? `Verstuur naar ${bulkCount} ontvanger${bulkCount !== 1 ? "s" : ""}`
                      : "Verstuur E-mail"}
                  </Button>
                </div>
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
                  <p className="py-8 text-center text-muted-foreground">
                    Nog geen e-mails verzonden
                  </p>
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
                                <p className="text-sm font-medium">{email.recipient_email}</p>
                                {email.recipient_name && (
                                  <p className="text-xs text-muted-foreground">
                                    {email.recipient_name}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {EMAIL_TEMPLATES[email.template_name]?.name ||
                                  email.template_name}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">
                              {email.subject}
                            </TableCell>
                            <TableCell>
                              {email.opened_at ? (
                                <Badge className="border-0 bg-green-500/10 text-green-700 hover:bg-green-500/20">
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
                              {format(new Date(email.created_at), "d MMM yyyy HH:mm", {
                                locale: nl,
                              })}
                              {email.opened_at && (
                                <p className="text-xs text-green-600">
                                  Geopend:{" "}
                                  {format(new Date(email.opened_at), "d MMM HH:mm", {
                                    locale: nl,
                                  })}
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
                        __html: EMAIL_TEMPLATES[selectedTemplate].getHtml(
                          recipientName || "Voorbeeld Naam"
                        ),
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
