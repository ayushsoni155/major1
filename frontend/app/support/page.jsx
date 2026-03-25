"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "nextjs-toploader/app";
import {
  ChevronDown, LifeBuoy, MessageCircle, BookOpen, Github,
  Zap, Mail, ArrowLeft, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const FAQS = [
  {
    category: "Getting Started",
    items: [
      { q: "What is RapidBase?", a: "RapidBase is the open-source backend for rapid development that gives you an instant Postgres database per project, a REST API powered by PostgREST, a SQL editor, analytics, and team collaboration features — all in one dashboard." },
      { q: "How do I create my first project?", a: "From the dashboard, click 'New Project', enter a name and optional description, and click 'Create'. Your project gets a dedicated Postgres schema, isolated from all other projects." },
      { q: "What are the role types (admin, editor, viewer)?", a: "Admin: full access including member management and project settings. Editor: can create/edit tables and data, run SQL. Viewer: read-only access to tables, analytics, and schema." },
    ],
  },
  {
    category: "SQL Editor",
    items: [
      { q: "Can I run multiple SQL statements at once?", a: "Yes! Separate multiple statements with semicolons. e.g., 'CREATE TABLE a (...); CREATE TABLE b (...);'. Comments using -- and /* */ are supported. Each statement runs sequentially." },
      { q: "Why can't I query public.users or pg_catalog?", a: "For security, direct schema-qualified access (public.table) is blocked. Just use the table name directly: SELECT * FROM users works fine — the schema is automatically applied per-project." },
      { q: "How do I use the query history?", a: "Click the 'History' button in the top-right of the SQL Editor. Your last 20 queries appear in a panel — click any to load it back into the editor." },
    ],
  },
  {
    category: "Tables & Data",
    items: [
      { q: "How do I create tables with foreign keys?", a: "Use the SQL Editor. e.g., REFERENCES products(id) ON DELETE CASCADE. For drag-and-drop table building, use the 'Create Table' UI under the Tables tab." },
      { q: "Can I filter and sort table data?", a: "Yes. In the table data view, click any column header to sort. Use the search box to filter rows by any column value. Both apply server-side for performance." },
      { q: "How do I alter an existing table (add/rename/drop columns)?", a: "Open a table from the Tables tab and click the 'Alter Table' button (pencil icon). From there you can add columns, rename them, drop them, or change defaults." },
    ],
  },
  {
    category: "API Keys & PostgREST",
    items: [
      { q: "How do I access my data via the REST API?", a: "Generate an API key from the 'API Keys' tab. Then send requests to /api/rest/<table> with the header x-api-key: rb_yourkey. Supports GET, POST, PATCH, DELETE." },
      { q: "Why does the REST endpoint return 401?", a: "The REST API requires a valid API key in the x-api-key header. Without it, the gateway returns 401. This is by design — your data is always protected." },
    ],
  },
  {
    category: "Projects & Teams",
    items: [
      { q: "How do I archive a project?", a: "On the dashboard, click the three-dot menu on a project card and select 'Archive'. Archived projects are hidden from the 'Active' filter and can't be accessed until unarchived." },
      { q: "Can I transfer project ownership?", a: "Not yet — ownership transfer is on the roadmap. For now, the project creator is always the owner. Admins can do everything except delete the project." },
      { q: "How do I invite team members?", a: "Inside a project, go to the 'Members' tab. Click 'Invite Member', enter their registered email, choose a role (admin/editor/viewer), and click 'Send Invite'." },
    ],
  },
  {
    category: "Account",
    items: [
      { q: "How do I change my password?", a: "Go to the profile page (click your avatar → Profile & Settings). In the 'Change Password' section, enter your current password and a new one (min 8 characters)." },
      { q: "How do I delete my account?", a: "In Profile & Settings → Danger Zone → Delete Account. You'll need to confirm your password. This permanently deletes your account and all projects you own." },
    ],
  },
];

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-white/[0.07] rounded-2xl overflow-hidden transition-all ${open ? "border-violet-500/30" : ""}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-3 hover:bg-white/[0.03] transition-colors">
        <span className="text-sm font-semibold text-zinc-200 leading-snug">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-white/[0.06] pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? FAQS.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : FAQS;

  const quickLinks = [
    { icon: Github,        label: "GitHub Issues",    href: "https://github.com/ayushsoni1010/rapidbase/issues", color: "text-zinc-300 bg-white/5 border-white/10" },
    { icon: MessageCircle, label: "Community Discord", href: "#",                                                  color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20" },
    { icon: BookOpen,      label: "Documentation",    href: "#",                                                  color: "text-blue-300 bg-blue-500/10 border-blue-500/20" },
    { icon: Mail,          label: "Email Support",     href: "mailto:support@rapidbase.io",                       color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
  ];

  return (
    <div className="min-h-screen bg-[#08080f] px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 mb-2">
            <LifeBuoy className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-4xl font-black text-white">Help & Support</h1>
          <p className="text-zinc-400 text-lg">Find answers to common questions or reach out to our team.</p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search FAQ..." className="pl-10 h-11 rounded-2xl bg-white/5 border-white/10 text-white text-sm focus-visible:ring-violet-500/50" />
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map(({ icon: Icon, label, href, color }) => (
              <Link key={label} href={href} target="_blank"
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center hover:scale-[1.03] transition-transform ${color}`}>
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No results for "{search}"</p>
            </div>
          ) : (
            filtered.map((cat, i) => (
              <div key={cat.category} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <h2 className="text-base font-bold text-white">{cat.category}</h2>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item, j) => (
                    <AccordionItem key={j} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Contact CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="glass-card rounded-[2rem] border-white/10 p-8 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-indigo-500/8 pointer-events-none" />
          <MessageCircle className="w-10 h-10 text-violet-400 mx-auto mb-3 relative z-10" />
          <h2 className="text-xl font-bold text-white mb-2 relative z-10">Still need help?</h2>
          <p className="text-zinc-400 text-sm mb-5 relative z-10">Our support team typically responds within 24 hours.</p>
          <a href="mailto:support@rapidbase.io"
            className="relative z-10 inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition-all">
            <Mail className="w-4 h-4" /> Contact Support
          </a>
        </motion.div>
      </div>
    </div>
  );
}
