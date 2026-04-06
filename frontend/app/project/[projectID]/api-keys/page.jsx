"use client";

import { useState, useEffect } from "react";
import { useProjects } from "@/providers/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Key, Plus, Trash2, Copy, Check, Shield, Globe, Loader2, KeySquare, Lock, Eye, Pencil, Upload } from "lucide-react";
import api from "@/utils/axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import useSWR from "swr";

const fetcher = (url) => api.get(url).then(r => r.data.data);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const PERMISSION_OPTIONS = [
  { id: "read", label: "Read", desc: "GET requests — query data", icon: Eye, color: "emerald" },
  { id: "insert", label: "Insert", desc: "POST requests — add rows", icon: Upload, color: "blue" },
  { id: "update", label: "Update", desc: "PATCH requests — modify rows", icon: Pencil, color: "amber" },
  { id: "delete", label: "Delete", desc: "DELETE requests — remove rows", icon: Trash2, color: "red" },
];

export default function ApiKeysPage() {
  const { selectedProject } = useProjects();
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [originUrl, setOriginUrl] = useState("");
  const [permissions, setPermissions] = useState(["read"]);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const projectId = selectedProject?.project_id;

  const { data: keys = [], error, isLoading: keysLoading, mutate } = useSWR(
    projectId ? `/projects/${projectId}/keys` : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const togglePermission = (perm) => {
    setPermissions(prev => {
      if (prev.includes(perm)) {
        const next = prev.filter(p => p !== perm);
        return next.length > 0 ? next : prev; // must keep at least one
      }
      return [...prev, perm];
    });
  };

  const handleCreate = async () => {
    if (!keyName.trim()) { toast.error("Key name required"); return; }
    setCreating(true);
    try {
      const res = await api.post(`/projects/${projectId}/keys`, {
        key_name: keyName.trim(),
        origin_url: originUrl.trim() || undefined,
        permissions,
      });
      setNewKey(res.data.data.api_key);
      mutate();
      toast.success("API key created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create key");
    } finally { setCreating(false); }
  };

  const handleDelete = async (keyId) => {
    try {
      await api.delete(`/projects/${projectId}/keys/${keyId}`);
      mutate();
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
    setPermissions(["read"]);
    setDialogOpen(false);
  };

  const formatPermissions = (perms) => {
    if (!perms) return "read";
    const arr = Array.isArray(perms) ? perms : JSON.parse(perms);
    return arr.join(", ");
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex flex-1 flex-col gap-8 p-6 max-w-7xl mx-auto w-full"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] p-6 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-wide">API Keys</h1>
            <p className="text-zinc-400 text-sm mt-1">Manage JWT tokens to securely access your database via PostgREST</p>
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/25 transition-all duration-200 gap-2 font-medium relative z-10">
              <Plus className="w-5 h-5" /> Generate New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl text-white flex items-center gap-2">
                {newKey ? <Check className="w-5 h-5 text-emerald-400" /> : <KeySquare className="w-5 h-5 text-emerald-400" />}
                {newKey ? "Key Generated Successfully!" : "Create API Key"}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {newKey ? "Please copy this token immediately. You will not be able to see it again once you close this dialog." : "Generate a JWT token for external applications to connect to your database."}
              </DialogDescription>
            </DialogHeader>
            <AnimatePresence mode="wait">
              {newKey ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 py-2">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-lg transition-all group-hover:bg-emerald-500/30" />
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-black/60 border border-emerald-500/30 relative z-10 backdrop-blur-xl">
                      <code className="text-emerald-400 text-xs font-mono break-all selection:bg-emerald-500/30 select-all max-h-32 overflow-y-auto block">{newKey}</code>
                      <Button size="icon" variant="ghost" onClick={copyKey} className="flex-shrink-0 w-10 h-10 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-300 text-emerald-500/80 transition-colors">
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-amber-300">
                      Use this as <code className="text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> in your API requests.
                    </span>
                  </div>
                  <DialogFooter>
                    <Button onClick={resetDialog} className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl h-12 font-bold">I have copied my key</Button>
                  </DialogFooter>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300 font-semibold uppercase text-xs tracking-wider">Key Description</Label>
                    <Input placeholder="e.g., Production Web App, Mobile Client..." value={keyName} onChange={e => setKeyName(e.target.value)} className="bg-white/5 border-white/10 text-white rounded-xl h-12 focus-visible:ring-emerald-500/50 placeholder:text-zinc-600" />
                  </div>

                  {/* Permissions selector */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 font-semibold uppercase text-xs tracking-wider">Permissions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PERMISSION_OPTIONS.map(({ id, label, desc, icon: Icon, color }) => {
                        const isActive = permissions.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => togglePermission(id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                              isActive
                                ? `bg-${color}-500/10 border-${color}-500/30 text-white`
                                : 'bg-white/[0.02] border-white/10 text-zinc-500 hover:bg-white/[0.05]'
                            }`}
                            style={isActive ? {
                              backgroundColor: `color-mix(in srgb, var(--color-${color}-500, ${color === 'emerald' ? '#10b981' : color === 'blue' ? '#3b82f6' : color === 'amber' ? '#f59e0b' : '#ef4444'}) 10%, transparent)`,
                              borderColor: `color-mix(in srgb, var(--color-${color}-500, ${color === 'emerald' ? '#10b981' : color === 'blue' ? '#3b82f6' : color === 'amber' ? '#f59e0b' : '#ef4444'}) 30%, transparent)`,
                            } : {}}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? '' : 'opacity-40'}`} />
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-zinc-400'}`}>{label}</p>
                              <p className="text-[10px] text-zinc-500 truncate">{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300 font-semibold uppercase text-xs tracking-wider flex items-center justify-between">
                      Allowed Origin
                      <span className="text-zinc-500 font-normal lowercase tracking-normal">optional</span>
                    </Label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                      <Input placeholder="https://example.com" value={originUrl} onChange={e => setOriginUrl(e.target.value)} className="bg-white/5 border-white/10 text-white rounded-xl h-12 pl-12 focus-visible:ring-emerald-500/50 placeholder:text-zinc-600" />
                    </div>
                    <p className="text-xs text-zinc-500 ml-1">Restrict to this origin in production. Localhost is always allowed for development.</p>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button onClick={handleCreate} disabled={creating} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all gap-2">
                      {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                      Generate JWT Token
                    </Button>
                  </DialogFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] border border-white/10 relative overflow-hidden flex-1 flex flex-col min-h-[500px]">
        {keysLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500/50" />
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 bg-white/[0.01]">
            <div className="w-24 h-24 rounded-full bg-emerald-500/5 flex items-center justify-center mb-6">
              <Shield className="w-12 h-12 text-emerald-500/30" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No API Keys Generated</h3>
            <p className="text-sm text-zinc-500 max-w-md text-center">Create your first API key to enable secure external access to your database via our high-performance PostgREST gateway.</p>
            <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-6 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Generate Key
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-semibold tracking-wider">Name</TableHead>
                  <TableHead className="text-zinc-400 font-semibold tracking-wider">Key Label</TableHead>
                  <TableHead className="text-zinc-400 font-semibold tracking-wider">Permissions</TableHead>
                  <TableHead className="text-zinc-400 font-semibold tracking-wider">Allowed Origin</TableHead>
                  <TableHead className="text-zinc-400 font-semibold tracking-wider">Status</TableHead>
                  <TableHead className="text-zinc-400 font-semibold tracking-wider">Created On</TableHead>
                  <TableHead className="text-right w-16 whitespace-nowrap text-zinc-400 font-semibold tracking-wider">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {keys.map((k) => (
                    <motion.tr 
                      key={k.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="border-white/5 hover:bg-white/[0.03] transition-colors group"
                    >
                      <TableCell className="font-medium text-white px-4 py-4">{k.key_name}</TableCell>
                      <TableCell className="px-4 py-4">
                        <code className="text-xs bg-black/40 border border-white/10 text-emerald-400 px-3 py-1.5 rounded-lg inline-block font-mono">
                          {k.key_prefix}••••••••
                        </code>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(k.permissions) ? k.permissions : JSON.parse(k.permissions || '["read"]')).map(p => (
                            <span key={p} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${
                              p === 'read' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              p === 'insert' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              p === 'update' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400 px-4 py-4">
                        {k.origin_url ? (
                          <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> {k.origin_url}</div>
                        ) : (
                          <span className="text-zinc-600 italic">Dev only</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full border ${k.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {k.is_active ? 'Active' : 'Revoked'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500 px-4 py-4 whitespace-nowrap">
                        {new Date(k.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right px-4 py-4 flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100">
                              Usage API
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card border-white/10 sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-xl text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-emerald-400" /> PostgREST Usage Example
                              </DialogTitle>
                              <DialogDescription className="text-zinc-400">
                                Connect to your database using the Bearer token for authentication.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label className="text-zinc-300 font-semibold uppercase text-xs tracking-wider">cURL Request</Label>
                                <div className="p-4 rounded-xl bg-black/60 border border-white/10 relative">
                                  <code className="text-zinc-300 text-xs font-mono whitespace-pre text-wrap leading-relaxed">
                                    <span className="text-emerald-400">curl</span> "https://api.yourdomain.com/api/rest/your_table?select=*" \<br/>
                                    {"  "}-H <span className="text-amber-300">"Authorization: Bearer {k.key_prefix}..."</span> \<br/>
                                    {"  "}-H <span className="text-amber-300">"Accept: application/json"</span>
                                  </code>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-300 font-semibold uppercase text-xs tracking-wider">JavaScript (Fetch)</Label>
                                <div className="p-4 rounded-xl bg-black/60 border border-white/10 relative">
                                  <code className="text-zinc-300 text-xs font-mono whitespace-pre text-wrap leading-relaxed">
                                    <span className="text-blue-400">const</span> response = <span className="text-emerald-400">await</span> fetch(<span className="text-amber-300">"https://api.yourdomain.com/api/rest/your_table"</span>, {"{"}<br/>
                                    {"  "}headers: {"{"}<br/>
                                    {"    "}<span className="text-amber-300">"Authorization"</span>: <span className="text-amber-300">"Bearer {k.key_prefix}..."</span>,<br/>
                                    {"    "}<span className="text-amber-300">"Content-Type"</span>: <span className="text-amber-300">"application/json"</span><br/>
                                    {"  "}{"}"}<br/>
                                    {"}"});<br/>
                                    <span className="text-blue-400">const</span> data = <span className="text-emerald-400">await</span> response.json();
                                  </code>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                                <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                <span className="text-xs text-cyan-300">
                                  This token has <strong>{formatPermissions(k.permissions)}</strong> permissions.
                                  {k.origin_url && <> Restricted to origin: <code className="text-cyan-400">{k.origin_url}</code>. Localhost always allowed.</>}
                                </span>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-card border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white flex items-center gap-2">
                                <Trash2 className="text-red-400 w-5 h-5"/> Revoke API Key
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-zinc-400">
                                This action is permanent. Any applications currently using this key will immediately lose access to the database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(k.id)} className="bg-red-500 hover:bg-red-600 text-white border-0">Revoke Access</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
