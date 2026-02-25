import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from "@/hooks/useBlog";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const AdminBlog = () => {
  const { user } = useAuth();
  const { data: posts, isLoading } = useBlogPosts(false);
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    meta_title: "",
    meta_description: "",
    cover_image: "",
    status: "draft" as "draft" | "published",
  });

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      meta_title: "",
      meta_description: "",
      cover_image: "",
      status: "draft",
    });
    setEditingId(null);
  };

  const openEdit = (post: any) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      cover_image: post.cover_image || "",
      status: post.status,
    });
    setEditingId(post.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Titel en inhoud zijn verplicht");
      return;
    }

    const slug = form.slug || generateSlug(form.title);

    try {
      if (editingId) {
        await updatePost.mutateAsync({
          id: editingId,
          title: form.title,
          slug,
          excerpt: form.excerpt || undefined,
          content: form.content,
          meta_title: form.meta_title || undefined,
          meta_description: form.meta_description || undefined,
          cover_image: form.cover_image || undefined,
          status: form.status,
          published_at: form.status === "published" ? new Date().toISOString() : undefined,
        });
        toast.success("Artikel bijgewerkt");
      } else {
        await createPost.mutateAsync({
          title: form.title,
          slug,
          excerpt: form.excerpt || undefined,
          content: form.content,
          meta_title: form.meta_title || undefined,
          meta_description: form.meta_description || undefined,
          cover_image: form.cover_image || undefined,
          author_id: user!.id,
          status: form.status,
          published_at: form.status === "published" ? new Date().toISOString() : undefined,
        });
        toast.success("Artikel aangemaakt");
      }
      setDialogOpen(false);
      resetForm();
    } catch (e) {
      toast.error("Opslaan mislukt");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit artikel wilt verwijderen?")) return;
    try {
      await deletePost.mutateAsync(id);
      toast.success("Artikel verwijderd");
    } catch {
      toast.error("Verwijderen mislukt");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Blog</h1>
            <p className="text-sm text-muted-foreground">Beheer je blogartikelen</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nieuw artikel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Artikel bewerken" : "Nieuw artikel"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titel *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) })}
                    placeholder="Artikeltitel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="artikel-url-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Samenvatting</Label>
                  <Textarea
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Korte samenvatting voor de overzichtspagina"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inhoud * (HTML)</Label>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="<p>Schrijf je artikel hier...</p>"
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SEO Titel</Label>
                    <Input
                      value={form.meta_title}
                      onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                      placeholder="SEO titel (max 60 tekens)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v: "draft" | "published") => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Concept</SelectItem>
                        <SelectItem value="published">Gepubliceerd</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>SEO Beschrijving</Label>
                  <Textarea
                    value={form.meta_description}
                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                    placeholder="SEO beschrijving (max 160 tekens)"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cover afbeelding URL</Label>
                  <Input
                    value={form.cover_image}
                    onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full"
                  disabled={createPost.isPending || updatePost.isPending}
                >
                  {(createPost.isPending || updatePost.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingId ? "Opslaan" : "Aanmaken"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{post.title}</h3>
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>
                        {post.status === "published" ? "Gepubliceerd" : "Concept"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      /{post.slug}
                      {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString("nl-NL")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {post.status === "published" && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/blog/${post.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="font-display text-lg font-semibold">Nog geen artikelen</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Maak je eerste blogartikel aan om te beginnen.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
