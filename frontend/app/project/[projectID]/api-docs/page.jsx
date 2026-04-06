"use client";

import { useState } from "react";
import { useProjects } from "@/providers/ProjectContext";
import { useTables } from "@/providers/TableContext";
import { BookOpen, Copy, Check, ChevronDown, Globe, Terminal, Code2, Braces, Filter, ArrowUpDown, Pencil, Trash2, Plus, Lock, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import useSWR from "swr";
import api from "@/utils/axios";

const fetcher = (url) => api.get(url).then((r) => r.data.data);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-all flex-shrink-0"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, language = "bash" }) {
  return (
    <div className="relative group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CopyBtn text={code} />
      </div>
      <pre className="p-4 rounded-xl bg-black/60 border border-white/10 overflow-x-auto text-sm font-mono leading-relaxed text-zinc-300 scrollbar-thin scrollbar-thumb-white/10">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({ title, icon: Icon, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div variants={itemVariants} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${color} border border-white/10`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-white font-bold text-base">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MethodBadge({ method }) {
  const colors = {
    GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    POST: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    PATCH: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    DELETE: "bg-red-500/15 text-red-400 border-red-500/25",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border font-mono ${colors[method] || "bg-white/10 text-zinc-400"}`}>
      {method}
    </span>
  );
}

export default function ApiDocsPage() {
  const { selectedProject } = useProjects();
  const { tables = [] } = useTables();
  const projectId = selectedProject?.project_id;

  const { data: keys = [] } = useSWR(
    projectId ? `/projects/${projectId}/keys` : null,
    fetcher
  );

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_API_URL || "https://your-domain.com";

  const apiEndpoint = `${baseUrl}/api/rest`;
  const firstTable = tables.length > 0 ? tables[0].table_name : "your_table";
  const apiKeyPlaceholder = keys.length > 0 ? `${keys[0].key_prefix}••••••••` : "rb_your_token_here";
  const apiKeyFull = keys.length > 0 ? `${keys[0].key_prefix}...` : "YOUR_JWT_TOKEN";

  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="text-center glass-card rounded-[2rem] p-10 border border-white/10">
          <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-semibold">Select a project to view API docs</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto w-full"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-500/20 border border-orange-500/30">
            <BookOpen className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-wide">API Documentation</h1>
            <p className="text-zinc-400 text-sm mt-1">Access your data from any application using the REST API</p>
          </div>
        </div>
      </motion.div>

      {/* Base URL */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Base URL</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-white/10">
          <code className="text-sm font-mono text-cyan-300 flex-1 truncate">{apiEndpoint}</code>
          <CopyBtn text={apiEndpoint} />
        </div>
        <p className="text-xs text-zinc-500 mt-2">All examples below use your current domain. If you deploy to a custom domain, this URL will update automatically.</p>
      </motion.div>

      {/* Auth */}
      <Section title="Authentication" icon={Shield} color="bg-emerald-500/15 text-emerald-400" defaultOpen={true}>
        <p className="text-sm text-zinc-400">
          Every request must include your JWT token in the <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs">Authorization</code> header as a Bearer token.
          You can generate API keys from the <strong className="text-white">API Keys</strong> page.
        </p>
        <CodeBlock code={`# Include this header in every request\nAuthorization: Bearer ${apiKeyFull}`} />

        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-300">
            Each token is scoped to your project schema with specific permissions (read, insert, update, delete). Public schema access is <strong>never</strong> allowed.
          </span>
        </div>

        <div className="space-y-2 mt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Security Features</h4>
          <div className="grid gap-2 text-xs text-zinc-400">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
              <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Schema Isolation</strong> — Each token is locked to its project schema. Cross-schema access is impossible.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
              <Lock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Permission Enforcement</strong> — GET requires read, POST requires insert, PATCH requires update, DELETE requires delete.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
              <Globe className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Origin Control</strong> — Set an allowed origin to restrict production access. Localhost is always permitted for development.</span>
            </div>
          </div>
        </div>

        {keys.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-300">
              You have <strong>{keys.length}</strong> active API key{keys.length !== 1 ? "s" : ""}: {apiKeyPlaceholder}
            </span>
          </div>
        )}
      </Section>

      {/* GET — Read */}
      <Section title="Read Records" icon={Braces} color="bg-emerald-500/15 text-emerald-400" defaultOpen={true}>
        <div className="flex items-center gap-2 mb-2">
          <MethodBadge method="GET" />
          <code className="text-xs text-zinc-400 font-mono">{apiEndpoint}/{firstTable}</code>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 mb-3">
          <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[10px] text-emerald-300 uppercase font-semibold tracking-wider">Requires: read permission</span>
        </div>

        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-4 mb-2">cURL</h4>
        <CodeBlock code={`curl "${apiEndpoint}/${firstTable}" \\\n  -H "Authorization: Bearer ${apiKeyFull}"`} />

        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-4 mb-2">JavaScript (Fetch)</h4>
        <CodeBlock code={`const response = await fetch("${apiEndpoint}/${firstTable}", {
  headers: {
    "Authorization": "Bearer ${apiKeyFull}"
  }
});
const data = await response.json();
console.log(data);`} language="javascript" />

        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-4 mb-2">Select Specific Columns</h4>
        <CodeBlock code={`curl "${apiEndpoint}/${firstTable}?select=id,email" \\\n  -H "Authorization: Bearer ${apiKeyFull}"`} />
      </Section>

      {/* Filtering */}
      <Section title="Filtering & Sorting" icon={Filter} color="bg-violet-500/15 text-violet-400">
        <p className="text-sm text-zinc-400 mb-3">Use query parameters to filter and sort results. PostgREST uses a powerful operator syntax.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-zinc-500 font-semibold text-xs uppercase">Operator</th>
                <th className="text-left py-2 px-3 text-zinc-500 font-semibold text-xs uppercase">Meaning</th>
                <th className="text-left py-2 px-3 text-zinc-500 font-semibold text-xs uppercase">Example</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300 font-mono text-xs">
              {[
                ["eq", "Equals", `?id=eq.5`],
                ["neq", "Not Equal", `?status=neq.deleted`],
                ["gt / lt", "Greater / Less than", `?age=gt.18`],
                ["gte / lte", "Greater/Less or Equal", `?price=lte.100`],
                ["like", "Pattern match (case-sensitive)", `?name=like.*john*`],
                ["ilike", "Pattern match (case-insensitive)", `?name=ilike.*john*`],
                ["in", "In list", `?status=in.(active,pending)`],
                ["is", "IS (null/true/false)", `?deleted_at=is.null`],
              ].map(([op, desc, ex]) => (
                <tr key={op} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 text-amber-400">{op}</td>
                  <td className="py-2.5 px-3 font-sans text-zinc-400">{desc}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-4 mb-2">Sorting</h4>
        <CodeBlock code={`# Sort ascending
curl "${apiEndpoint}/${firstTable}?order=created_at.asc" \\
  -H "Authorization: Bearer ${apiKeyFull}"

# Sort descending, nulls last
curl "${apiEndpoint}/${firstTable}?order=price.desc.nullslast" \\
  -H "Authorization: Bearer ${apiKeyFull}"`} />

        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-4 mb-2">Pagination</h4>
        <CodeBlock code={`# Limit to 10 results, skip first 20 (page 3)
curl "${apiEndpoint}/${firstTable}?limit=10&offset=20" \\
  -H "Authorization: Bearer ${apiKeyFull}"`} />
      </Section>

      {/* POST — Insert */}
      <Section title="Insert Records" icon={Plus} color="bg-blue-500/15 text-blue-400">
        <div className="flex items-center gap-2 mb-2">
          <MethodBadge method="POST" />
          <code className="text-xs text-zinc-400 font-mono">{apiEndpoint}/{firstTable}</code>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/15 mb-3">
          <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-[10px] text-blue-300 uppercase font-semibold tracking-wider">Requires: insert permission</span>
        </div>

        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-4 mb-2">Insert Single Row</h4>
        <CodeBlock code={`curl -X POST "${apiEndpoint}/${firstTable}" \\
  -H "Authorization: Bearer ${apiKeyFull}" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{"full_name": "John Doe", "email": "john@example.com"}'`} />

        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-4 mb-2">Insert Multiple Rows</h4>
        <CodeBlock code={`curl -X POST "${apiEndpoint}/${firstTable}" \\
  -H "Authorization: Bearer ${apiKeyFull}" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '[
    {"full_name": "Alice", "email": "alice@example.com"},
    {"full_name": "Bob", "email": "bob@example.com"}
  ]'`} />

        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
          <Code2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-blue-300">
            Add <code className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded">Prefer: return=representation</code> to get the inserted row(s) back in the response.
          </span>
        </div>
      </Section>

      {/* PATCH — Update */}
      <Section title="Update Records" icon={Pencil} color="bg-amber-500/15 text-amber-400">
        <div className="flex items-center gap-2 mb-2">
          <MethodBadge method="PATCH" />
          <code className="text-xs text-zinc-400 font-mono">{apiEndpoint}/{firstTable}?id=eq.1</code>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/15 mb-3">
          <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-[10px] text-amber-300 uppercase font-semibold tracking-wider">Requires: update permission</span>
        </div>

        <CodeBlock code={`curl -X PATCH "${apiEndpoint}/${firstTable}?id=eq.1" \\
  -H "Authorization: Bearer ${apiKeyFull}" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{"full_name": "Jane Updated"}'`} />

        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <ArrowUpDown className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-300">
            <strong>Always</strong> include a filter like <code className="text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">?id=eq.1</code> — without it, <strong>all rows</strong> will be updated.
          </span>
        </div>
      </Section>

      {/* DELETE */}
      <Section title="Delete Records" icon={Trash2} color="bg-red-500/15 text-red-400">
        <div className="flex items-center gap-2 mb-2">
          <MethodBadge method="DELETE" />
          <code className="text-xs text-zinc-400 font-mono">{apiEndpoint}/{firstTable}?id=eq.1</code>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/15 mb-3">
          <Shield className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-[10px] text-red-300 uppercase font-semibold tracking-wider">Requires: delete permission</span>
        </div>

        <CodeBlock code={`curl -X DELETE "${apiEndpoint}/${firstTable}?id=eq.1" \\
  -H "Authorization: Bearer ${apiKeyFull}"`} />

        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
          <Trash2 className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-300">
            <strong>Always</strong> include a filter — without it, <strong>all rows</strong> will be deleted.
          </span>
        </div>
      </Section>

      {/* JavaScript SDK */}
      <Section title="JavaScript Example" icon={Code2} color="bg-indigo-500/15 text-indigo-400">
        <p className="text-sm text-zinc-400 mb-3">Full CRUD example using <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-xs">fetch</code>:</p>
        <CodeBlock code={`const API_URL = "${apiEndpoint}";
const TOKEN = "${apiKeyFull}";

const headers = {
  "Authorization": \`Bearer \${TOKEN}\`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// GET — Read all (requires: read)
const users = await fetch(\`\${API_URL}/${firstTable}\`, { headers }).then(r => r.json());

// GET — With filter (requires: read)
const adults = await fetch(\`\${API_URL}/${firstTable}?age=gte.18&order=name.asc\`, { headers }).then(r => r.json());

// POST — Insert (requires: insert)
const newUser = await fetch(\`\${API_URL}/${firstTable}\`, {
  method: "POST",
  headers,
  body: JSON.stringify({ full_name: "New User", email: "new@example.com" }),
}).then(r => r.json());

// PATCH — Update (requires: update)
await fetch(\`\${API_URL}/${firstTable}?id=eq.\${newUser[0].id}\`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ full_name: "Updated Name" }),
});

// DELETE — Remove (requires: delete)
await fetch(\`\${API_URL}/${firstTable}?id=eq.\${newUser[0].id}\`, {
  method: "DELETE",
  headers,
});`} language="javascript" />
      </Section>

      {/* Tables Reference */}
      {tables.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
            <Braces className="w-4 h-4 text-violet-400" /> Available Tables
          </h3>
          <div className="flex flex-wrap gap-2">
            {tables.map((t) => (
              <span key={t.table_name} className="text-xs font-mono px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">
                {t.table_name}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
