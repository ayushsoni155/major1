"use client";

import { useState, useEffect } from "react";
import { useProjects } from "@/providers/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Key, Plus, Trash2, Copy, Check, Shield, Globe, Loader2 } from "lucide-react";
import api from "@/utils/axios";
import { toast } from "sonner";

export default function ApiKeysPage() {
  const { selectedProject } = useProjects();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [originUrl, setOriginUrl] = useState("");
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const projectId = selectedProject?.project_id;

  const fetchKeys = async () => {
    if (!projectId) return;
    try {
      const res = await api.get(`/projects/${projectId}/keys`);
      setKeys(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load API keys");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchKeys(); }, [projectId]);

  const handleCreate = async () => {
    if (!keyName.trim()) { toast.error("Key name required"); return; }
    setCreating(true);
    try {
      const res = await api.post(`/projects/${projectId}/keys`, {
        key_name: keyName.trim(),
        origin_url: originUrl.trim() || undefined,
      });
      setNewKey(res.data.data.api_key);
      fetchKeys();
      toast.success("API key created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create key");
    } finally { setCreating(false); }
  };

  const handleDelete = async (keyId) => {
    try {
      await api.delete(`/projects/${projectId}/keys/${keyId}`);
      setKeys(keys.filter(k => k.id !== keyId));
      toast.success("API key deleted");
    } catch { toast.error("Failed to delete key"); }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetDialog = () => {
    setKeyName(""); setOriginUrl(""); setNewKey(null); setCopied(false);
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> API Keys
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage API keys for external access via PostgREST</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Create Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{newKey ? "Key Created!" : "Create API Key"}</DialogTitle>
              <DialogDescription>
                {newKey ? "Copy this key now. It won't be shown again." : "Generate a new API key for your project."}
              </DialogDescription>
            </DialogHeader>
            {newKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <code className="text-xs font-mono flex-1 break-all select-all">{newKey}</code>
                  <Button size="sm" variant="outline" onClick={copyKey} className="flex-shrink-0 gap-1">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={resetDialog}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Key Name</Label>
                  <Input placeholder="e.g., Frontend Production" value={keyName} onChange={e => setKeyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Origin URL <span className="text-muted-foreground">(optional)</span></Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="https://myapp.com" value={originUrl} onChange={e => setOriginUrl(e.target.value)} className="pl-10" />
                  </div>
                  <p className="text-xs text-muted-foreground">Restrict API key usage to this origin</p>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={creating} className="gap-2">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Generate Key
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-16">
              <Key className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No API keys yet. Create one to enable external API access.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{k.key_name}</TableCell>
                    <TableCell><code className="text-xs bg-muted/50 px-2 py-0.5 rounded">{k.key_prefix}...</code></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{k.origin_url || "Any"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
                        {k.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(k.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                            <AlertDialogDescription>This will immediately revoke access for anything using this key.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(k.id)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
