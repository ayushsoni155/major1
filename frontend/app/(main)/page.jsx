"use client";

import { motion, useScroll, useTransform, useInView, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Zap, Database, Shield, Globe, Code2, BarChart3,
  ArrowRight, Terminal, Key, Lock, BookOpen, Server,
  CheckCircle, Rocket, Users, Copy, Check, ChevronDown,
  Layers, PlayCircle, Star, ArrowUpRight, Cpu, GitBranch,
  FileCode2, Blocks, Sparkles, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notification/notificationUse";
import { ProfilePopup } from "@/components/global/ProfilePopup";
import { useAuth } from "@/providers/AuthContext";

// --- Typewriter Hook ---
function useTypewriter(texts, speed = 60) {
  const [textIndex, setTextIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIndex];
    if (!deleting && displayed.length < current.length) {
      const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), speed);
      return () => clearTimeout(t);
    } else if (!deleting && displayed.length === current.length) {
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    } else if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), speed / 2);
      return () => clearTimeout(t);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setTextIndex((i) => (i + 1) % texts.length);
    }
  }, [displayed, deleting, textIndex, texts, speed]);

  return displayed;
}

// --- Counter Hook ---
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return { count, ref };
}

// --- Copy Button ---
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-all">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// --- Code Block ---
function CodeBlock({ children, language = "bash", copyText }) {
  return (
    <div className="relative rounded-xl bg-[#0d0d14] border border-white/10 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.07]">
        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/70" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/70" /></div>
        <span className="ml-2 text-xs font-mono text-zinc-500">{language}</span>
      </div>
      <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto relative">
        {children}
        {copyText && <CopyButton text={copyText} />}
      </div>
    </div>
  );
}

// --- Data ---
const FEATURES = [
  { icon: Database, title: "Auto-Generated REST API", desc: "PostgREST instantly turns your tables into a full REST API at /api/rest/. Create a table, get CRUD endpoints — zero config.", colSpan: "md:col-span-2", color: "text-violet-400", glow: "rgba(139,92,246,0.2)" },
  { icon: Shield, title: "Multi-Tenant Isolation", desc: "Every project gets its own PostgreSQL schema. Complete data isolation — no cross-project access ever.", colSpan: "md:col-span-1", color: "text-indigo-400", glow: "rgba(99,102,241,0.2)" },
  { icon: Key, title: "JWT API Keys", desc: "Generate scoped JWT tokens with granular permissions (read, insert, update, delete) and origin whitelisting.", colSpan: "md:col-span-1", color: "text-cyan-400", glow: "rgba(34,211,238,0.2)" },
  { icon: Code2, title: "SQL Editor", desc: "Execute raw SQL queries with syntax highlighting, query history, and execution time tracking.", colSpan: "md:col-span-1", color: "text-emerald-400", glow: "rgba(52,211,153,0.2)" },
  { icon: Lock, title: "Authentication System", desc: "Built-in JWT auth with OTP email verification, refresh tokens, password reset, and session management.", colSpan: "md:col-span-1", color: "text-amber-400", glow: "rgba(251,191,36,0.2)" },
  { icon: Users, title: "Team Collaboration", desc: "Invite members with Admin, Editor, or Viewer roles. Email invitations with accept/decline workflow.", colSpan: "md:col-span-1", color: "text-pink-400", glow: "rgba(244,114,182,0.2)" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Build custom charts and widgets from your data. Drag-and-drop dashboard layouts saved per project.", colSpan: "md:col-span-1", color: "text-orange-400", glow: "rgba(251,146,60,0.2)" },
  { icon: Globe, title: "Real-time Notifications", desc: "Server-Sent Events via Redis Pub/Sub for instant in-app alerts on invitations and project updates.", colSpan: "md:col-span-1", color: "text-sky-400", glow: "rgba(56,189,248,0.2)" },
  { icon: Layers, title: "Schema Visualization", desc: "Interactive ER diagrams showing all tables, columns, and relationships using React Flow.", colSpan: "md:col-span-1", color: "text-teal-400", glow: "rgba(45,212,191,0.2)" },
  { icon: Server, title: "Audit Logging", desc: "Every action tracked — table changes, member updates, SQL queries — with IP address and timestamps.", colSpan: "md:col-span-2", color: "text-rose-400", glow: "rgba(251,113,133,0.2)" },
  { icon: GitBranch, title: "CI/CD Pipeline", desc: "GitHub Actions pipeline with Trivy vulnerability scanning, Docker builds, and auto-push to Docker Hub.", colSpan: "md:col-span-1", color: "text-lime-400", glow: "rgba(163,230,53,0.2)" },
  { icon: Cpu, title: "Redis Caching", desc: "OTP codes, API key validation, project lists, and rate limiting all cached in Redis for blazing speed.", colSpan: "md:col-span-1", color: "text-fuchsia-400", glow: "rgba(232,121,249,0.2)" },
];

const HOW_IT_WORKS = [
  { step: "01", icon: Rocket, title: "Create Your Project", desc: "Sign up and spin up a new RapidBase project in seconds. We provision a dedicated PostgreSQL instance with proper isolation.", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { step: "02", icon: Database, title: "Design Your Schema", desc: "Use our visual table builder or SQL editor to define your schema. Columns, constraints, foreign keys — full postgres power.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { step: "03", icon: Zap, title: "Call Your REST API", desc: "Instantly query your data via the PostgREST gateway using your API key. Filter, sort, paginate — all from any language.", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
];

const STATS = [
  { label: "Projects Deployed", value: 1200, suffix: "+" },
  { label: "API Calls Served", value: 50, suffix: "M+" },
  { label: "Tables Created", value: 8500, suffix: "+" },
  { label: "Uptime SLA", value: 99.9, suffix: "%" },
];

const DOCS_TABS = ["Getting Started", "Security & RLS", "PostgREST API", "SDK & Integrations"];

const DOCS_CONTENT = {
  "Getting Started": {
    icon: Rocket,
    color: "text-violet-400",
    steps: [
      { title: "Sign up & Create Project", desc: "Create a free account and hit 'New Project'. Your project gets a dedicated PostgreSQL schema instantly — fully isolated from all other projects.", code: null },
      { title: "Design your tables", desc: "Navigate to Tables → Create Table. Add columns with the visual builder or write SQL directly in the built-in SQL Editor.", code: null },
      { title: "Generate an API Key", desc: "Go to API Keys tab → Generate New Key. Choose permissions (read, insert, update, delete). Your key is a JWT token.", code: `# Your API key is a JWT token like:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# It encodes: project schema, permissions, and origin
# Use it via Authorization header:
Authorization: Bearer <your_jwt_token>` },
      { title: "Query your data", desc: "Use curl, fetch, or any HTTP client to read/write your data via the auto-generated REST API.", code: `# Read all rows from your 'users' table
curl "https://your-domain.com/api/rest/users" \\
  -H "Authorization: Bearer <your_jwt_token>"

# Response: [{"id":1,"name":"Alice",...}]` },
    ]
  },
  "Security & RLS": {
    icon: Shield,
    color: "text-emerald-400",
    steps: [
      { title: "Schema Isolation", desc: "Every project gets a unique PostgreSQL schema (e.g. proj_ki1jw9xf). Your JWT token is locked to this schema — cross-project access is impossible.", code: null },
      { title: "Permission Enforcement", desc: "Each API key has specific permissions. A read-only key cannot insert data. An insert-only key cannot read. Enforced at the gateway level.", code: `# API Key with [read] permission:
GET  /api/rest/users → 200 OK ✅
POST /api/rest/users → 403 Forbidden ❌

# API Key with [insert] permission:
POST /api/rest/users → 201 Created ✅
GET  /api/rest/users → 403 Forbidden ❌` },
      { title: "Origin Whitelisting", desc: "Restrict API keys to specific domains. Localhost is always allowed for development. Production keys only work from your app's domain.", code: `# When generating a key, set origin:
{
  "key_name": "Production App",
  "permissions": ["read", "insert"],
  "origin_url": "https://myapp.com"
}
# Requests from other domains → 403` },
      { title: "Audit Trail", desc: "Every action is logged — table creates/drops, member changes, SQL queries, API key usage — all with IP address and timestamp.", code: null },
    ]
  },
  "PostgREST API": {
    icon: Globe,
    color: "text-cyan-400",
    steps: [
      { title: "Endpoints", desc: "All REST requests go to /api/rest/{table_name}. Use HTTP methods for CRUD operations. Auth via Bearer token.", code: `# Base URL: https://your-domain.com/api/rest

GET    /api/rest/users              # Read rows
POST   /api/rest/users              # Insert row(s)
PATCH  /api/rest/users?id=eq.1      # Update row
DELETE /api/rest/users?id=eq.1      # Delete row` },
      { title: "Filtering & Operators", desc: "Use query parameters with PostgREST operators. Supports eq, neq, gt, lt, gte, lte, like, ilike, in, is.", code: `# Equals
GET /api/rest/users?status=eq.active

# Greater than
GET /api/rest/orders?total=gt.100

# Pattern match (case-insensitive)
GET /api/rest/users?name=ilike.*john*

# Multiple filters (AND)
GET /api/rest/users?age=gte.18&role=eq.admin

# IN list
GET /api/rest/users?status=in.(active,pending)` },
      { title: "Pagination & Sorting", desc: "Control result size and ordering. Use limit, offset, order, and select parameters.", code: `# Paginate: 10 results, skip 20 (page 3)
GET /api/rest/users?limit=10&offset=20

# Sort descending by created_at
GET /api/rest/users?order=created_at.desc

# Select specific columns only
GET /api/rest/users?select=id,name,email

# Combine all
GET /api/rest/users?select=id,name&order=name.asc&limit=5` },
      { title: "Insert & Update", desc: "Send JSON body for inserts. Use Prefer header to get inserted data back. Always filter updates/deletes.", code: `# Insert a row (returns inserted data)
curl -X POST "https://your-domain.com/api/rest/users" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{"name": "Alice", "email": "alice@example.com"}'

# Update (⚠️ always include a filter!)
curl -X PATCH "https://your-domain.com/api/rest/users?id=eq.1" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice Updated"}'` },
    ]
  },
  "SDK & Integrations": {
    icon: Code2,
    color: "text-indigo-400",
    steps: [
      { title: "JavaScript / Fetch", desc: "Use the standard fetch API. Pass your JWT token in the Authorization header.", code: `const API = "https://your-domain.com/api/rest";
const TOKEN = "your_jwt_token_here";
const headers = {
  "Authorization": \`Bearer \${TOKEN}\`,
  "Content-Type": "application/json",
};

// Read
const users = await fetch(\`\${API}/users\`, { headers })
  .then(r => r.json());

// Insert
await fetch(\`\${API}/users\`, {
  method: "POST", headers,
  body: JSON.stringify({ name: "Bob", email: "bob@test.com" }),
});` },
      { title: "Python", desc: "Use the requests library with Authorization Bearer header:", code: `import requests

API = "https://your-domain.com/api/rest"
HEADERS = {"Authorization": "Bearer <your_jwt_token>"}

# Read all users
users = requests.get(f"{API}/users", headers=HEADERS).json()

# Insert a record
requests.post(f"{API}/users",
  headers={**HEADERS, "Content-Type": "application/json"},
  json={"name": "Bob", "email": "bob@example.com"}
)

# Filter: get active users
active = requests.get(
  f"{API}/users?status=eq.active", headers=HEADERS
).json()` },
      { title: "React Hook (SWR)", desc: "Build a reusable data-fetching hook with caching and auto-refresh:", code: `import useSWR from "swr";

const API = "https://your-domain.com/api/rest";
const TOKEN = "your_jwt_token";

const fetcher = (url) =>
  fetch(url, {
    headers: { "Authorization": \`Bearer \${TOKEN}\` }
  }).then(r => r.json());

export function useTable(table, query = "") {
  const { data, error, mutate } = useSWR(
    \`\${API}/\${table}\${query ? "?" + query : ""}\`,
    fetcher
  );
  return { data, isLoading: !data && !error, error, mutate };
}

// Usage:
const { data: users } = useTable("users", "select=id,name&limit=10");` },
      { title: "cURL Quick Reference", desc: "All CRUD operations with correct URLs and auth:", code: `TOKEN="your_jwt_token_here"
BASE="https://your-domain.com/api/rest"

# Read all
curl "$BASE/users" -H "Authorization: Bearer $TOKEN"

# Read with filter
curl "$BASE/users?age=gt.18&limit=10" -H "Authorization: Bearer $TOKEN"

# Insert
curl -X POST "$BASE/users" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Dave","email":"dave@test.com"}'

# Update
curl -X PATCH "$BASE/users?id=eq.5" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Dave Updated"}'

# Delete
curl -X DELETE "$BASE/users?id=eq.5" \\
  -H "Authorization: Bearer $TOKEN"` },
    ]
  }
};


export default function LandingPage() {
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  
  const [activeDocTab, setActiveDocTab] = useState("Getting Started");
  const [activeDocsStep, setActiveDocsStep] = useState(0);

  const heroHeading = useTypewriter(["ready in minutes.", "built to scale.", "secured by default.", "zero config."], 70);

  // Stat counters
  const s1 = useCounter(1200);
  const s2 = useCounter(50);
  const s3 = useCounter(8500);
  const s4 = useCounter(99.9);
  const statCounters = [s1, s2, s3, s4];

  const activeDoc = DOCS_CONTENT[activeDocTab];

  return (
    <main className="min-h-screen bg-[#08080f] text-white selection:bg-violet-500/30 overflow-x-hidden relative">
      {/* Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 aurora-bg opacity-25 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.08] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080f]/30 via-[#08080f]/70 to-[#08080f]" />
      </div>

      {/* ============ NAVBAR ============ */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-4 inset-x-4 md:inset-x-12 z-50 glass rounded-2xl flex items-center justify-between px-6 h-16"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-black tracking-tight text-white drop-shadow-md">RapidBase</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#features" className="hover:text-white transition-all hover:-translate-y-0.5">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-all hover:-translate-y-0.5">How it works</a>
          <a href="#docs" className="hover:text-white transition-all hover:-translate-y-0.5">Docs</a>
          <a href="#stats" className="hover:text-white transition-all hover:-translate-y-0.5">Stats</a>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/project/create-project">
                <Button size="sm" className="bg-white text-black hover:bg-zinc-200 border-0 shadow-lg font-bold rounded-xl px-5 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Dashboard
                </Button>
              </Link>
              <NotificationBell />
              <ProfilePopup />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Sign in</Link>
              <Link href="/signup">
                <Button size="sm" className="bg-white text-black hover:bg-zinc-200 border-0 shadow-lg font-bold rounded-xl px-5 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.header>

      {/* ============ HERO ============ */}
      <section className="relative z-10 pt-44 pb-24 px-6 flex flex-col items-center justify-center text-center min-h-screen">
        <motion.div style={{ y, opacity: heroOpacity }} className="max-w-5xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex glass items-center gap-2 px-4 py-1.5 rounded-full mb-8 border border-violet-500/20"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
            <span className="text-xs font-semibold text-white/90">v1.0 — Production Ready</span>
          </motion.div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[1.05] mb-8">
            Your backend,{" "}
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
              {heroHeading}
              <span className="typewriter-caret inline-block w-1.5 h-[0.85em] ml-1 bg-violet-500/80 translate-y-2 rounded-sm" />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed mb-12 font-medium"
          >
            Deploy a production-ready PostgreSQL database with an auto-generated REST API, 
            multi-tenant isolation, and built-in dashboards — in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Link href={user ? "/project/create-project" : "/signup"}>
              <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold border-0 shadow-[0_0_40px_rgba(139,92,246,0.4)] rounded-2xl hover:-translate-y-1 transition-all duration-300">
                {user ? <>Go to Dashboard <Rocket className="w-5 h-5 ml-2" /></> : <>Start Building Free <Rocket className="w-5 h-5 ml-2" /></>}
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg glass border-white/20 text-white hover:bg-white/10 rounded-2xl hover:-translate-y-1 transition-all">
                See how it works
              </Button>
            </a>
          </motion.div>

          {/* Mini API Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="w-full max-w-2xl"
          >
            <CodeBlock language="bash" copyText={`curl "https://your-domain.com/api/rest/users?select=*" -H "Authorization: Bearer <your_token>"`}>
              <span className="text-violet-400 font-bold">curl</span>{" "}
              <span className="text-emerald-300">"https://your-domain.com/api/rest/users?select=*"</span>{" "}
              <span className="text-zinc-500">\</span>
              <br />
              {"  "}<span className="text-zinc-500">-H</span>{" "}
              <span className="text-yellow-300">"Authorization: Bearer &lt;your_jwt_token&gt;"</span>
              <br />
              <br />
              <span className="text-zinc-500"># → 200 OK</span>
              <br />
              <span className="text-sky-300">{"[{ \"id\": 1, \"name\": \"Alice\", \"email\": \"alice@app.com\" }]"}</span>
            </CodeBlock>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ============ STATS ============ */}
      <section id="stats" className="relative z-10 py-20 px-6 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, idx) => {
            const { count, ref } = statCounters[idx];
            return (
              <motion.div
                key={stat.label}
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center group"
              >
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent mb-1 tabular-nums">
                  {idx === 3 ? count.toFixed(1) : count.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-sm text-zinc-500 font-medium">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-4">
              <PlayCircle className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Simple Setup</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Up and running in <span className="text-violet-400">3 steps</span></h2>
            <p className="text-white/50 max-w-xl mx-auto">No infrastructure expertise needed. No DevOps required.</p>
          </motion.div>

          {/* Connector line */}
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-violet-500/50 via-indigo-500/30 to-transparent -translate-x-1/2" />
            <div className="space-y-8 md:space-y-0 grid md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((step, idx) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, type: "spring", stiffness: 200 }}
                  whileHover={{ y: -6 }}
                  className="glass-card rounded-[2rem] p-8 relative group overflow-hidden border border-white/[0.08]"
                >
                  <div className={`absolute -top-4 -right-4 w-24 h-24 ${step.bg} blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className="text-8xl font-black text-white/[0.04] absolute top-4 right-6 select-none">{step.step}</div>
                  <div className={`w-14 h-14 rounded-2xl ${step.bg} ${step.border} border flex items-center justify-center mb-6 relative z-10`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 relative z-10">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm relative z-10">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ BENTO FEATURES ============ */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-4">
              <Blocks className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Feature Set</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              The ultimate <span className="text-violet-400">toolkit</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">Everything you need to launch your next big idea without wrestling with infrastructure.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.slice(0, 6).map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0, transition: { delay: idx * 0.08 } }}
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`glass-card p-8 rounded-[2rem] flex flex-col justify-between overflow-hidden relative group ${feature.colSpan} border border-white/[0.07]`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                  style={{ background: `radial-gradient(circle, ${feature.glow} 0%, transparent 70%)` }} />
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-6 shadow-inner border border-white/10 group-hover:border-white/20 transition-colors">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-white/45 leading-relaxed font-medium">{feature.desc}</p>
                </div>
                <div className={`mt-6 text-xs font-semibold ${feature.color} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                  Learn more <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Secondary Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            {FEATURES.slice(6).map((feature, idx) => (
              <motion.div
                key={idx + 6}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0, transition: { delay: idx * 0.08 } }}
                viewport={{ once: true }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`glass-card p-6 rounded-2xl flex items-start gap-4 overflow-hidden relative group ${feature.colSpan} border border-white/[0.07]`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-all duration-500"
                  style={{ background: `radial-gradient(circle, ${feature.glow} 0%, transparent 70%)` }} />
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:border-white/20 transition-colors">
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                  <p className="text-white/45 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ INSTANT API DEMO ============ */}
      <section className="relative z-10 py-32 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto glass rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center border border-white/10 shadow-[0_0_60px_rgba(99,102,241,0.12)] overflow-hidden relative"
        >
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-violet-500/8 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[100%] bg-indigo-500/8 blur-[100px] rounded-full" />

          <div className="w-full md:w-1/2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">PostgREST Powered — /api/rest/*</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
              Instant APIs,<br />
              <span className="text-indigo-400">zero configuration.</span>
            </h2>
            <p className="text-white/55 text-base mb-8 leading-relaxed">
              Define your tables and RapidBase instantly exposes fully-typed REST endpoints. 
              Insert, filter, paginate, and order with ease natively through PostgREST.
            </p>
            <ul className="space-y-3 mb-8">
              {["JWT API keys with scoped permissions", "Schema isolation per project", "Filter, sort, paginate via query params", "Auth via Authorization: Bearer header", "Interactive analytics dashboard", "SQL Editor with query history"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/75 font-medium text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] rounded-full flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <Button className="h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold border-0 shadow-lg transition-all hover:scale-105 gap-2">
                Try it now <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="w-full md:w-1/2 relative z-10 space-y-3">
            <CodeBlock language="bash" copyText={`curl "https://your-domain.com/api/rest/posts?select=id,title,author&order=created_at.desc&limit=5" -H "Authorization: Bearer <token>"`}>
              <span className="text-violet-400">curl</span>{" "}
              <span className="text-green-300">"https://your-domain.com/api/rest/posts</span>
              <span className="text-sky-300">?select=id,title,author</span>
              <span className="text-yellow-300">&order=created_at.desc</span>
              <span className="text-emerald-300">&limit=5</span>
              <span className="text-green-300">"</span>{" "}
              <span className="text-zinc-500">\</span>
              <br />
              {"  "}<span className="text-zinc-500">-H</span>{" "}
              <span className="text-yellow-300">"Authorization: Bearer &lt;your_jwt_token&gt;"</span>
            </CodeBlock>
            <div className="text-center text-xs text-zinc-600 font-mono">↓ Response 200 OK (4ms)</div>
            <CodeBlock language="json" copyText={"[{\"id\":1,\"title\":\"Hello World\",\"author\":\"Alice\"}]"}>
              <span className="text-zinc-500">{"["}</span>
              {`\n  `}<span className="text-sky-300">{"{"}</span>
              {`\n    `}<span className="text-violet-300">"id"</span>: <span className="text-emerald-300">1</span>,
              {`\n    `}<span className="text-violet-300">"title"</span>: <span className="text-yellow-300">"Hello World"</span>,
              {`\n    `}<span className="text-violet-300">"author"</span>: <span className="text-yellow-300">"Alice"</span>
              {`\n  `}<span className="text-sky-300">{"}"}</span>
              {`\n`}<span className="text-zinc-500">{"]"}</span>
            </CodeBlock>
          </div>
        </motion.div>
      </section>

      {/* ============ DOCS SECTION ============ */}
      <section id="docs" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-4">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Documentation</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Everything you need to <span className="text-emerald-400">build fast</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">From your first project to production-grade apps — we've got you covered.</p>
          </motion.div>

          {/* Tab Bar */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {DOCS_TABS.map((tab) => {
              const doc = DOCS_CONTENT[tab];
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveDocTab(tab); setActiveDocsStep(0); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeDocTab === tab
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      : "glass text-white/60 hover:text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  <doc.icon className={`w-4 h-4 ${activeDocTab === tab ? "text-black" : doc.color}`} />
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Docs Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDocTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="grid lg:grid-cols-5 gap-6"
            >
              {/* Step List */}
              <div className="lg:col-span-2 space-y-2">
                {activeDoc.steps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDocsStep(i)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 group ${
                      activeDocsStep === i
                        ? "bg-white/[0.07] border-white/20 shadow-lg"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-all ${
                        activeDocsStep === i ? "bg-white text-black" : "bg-white/10 text-zinc-400 group-hover:bg-white/20"
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white mb-1">{step.title}</div>
                        <div className="text-xs text-zinc-500 leading-relaxed">{step.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Code/Detail Panel */}
              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeDocTab}-${activeDocsStep}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card rounded-[2rem] border border-white/10 overflow-hidden h-full"
                  >
                    <div className="p-6 border-b border-white/[0.07] bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center`}>
                          <activeDoc.icon className={`w-5 h-5 ${activeDoc.color}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{activeDoc.steps[activeDocsStep].title}</h3>
                          <p className="text-xs text-zinc-500 mt-0.5">{activeDocTab}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-zinc-400 text-sm leading-relaxed mb-5">{activeDoc.steps[activeDocsStep].desc}</p>
                      {activeDoc.steps[activeDocsStep].code ? (
                        <CodeBlock language="bash" copyText={activeDoc.steps[activeDocsStep].code}>
                          {activeDoc.steps[activeDocsStep].code.split("\n").map((line, li) => {
                            const isComment = line.trim().startsWith("#");
                            const isString = line.includes('"') || line.includes("'") || line.includes('`');
                            return (
                              <div key={li} className={isComment ? "text-zinc-500" : "text-zinc-300"}>
                                {line}
                              </div>
                            );
                          })}
                        </CodeBlock>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-white/[0.02] rounded-2xl border border-white/[0.06] border-dashed">
                          <div className="text-center">
                            <CheckCircle className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
                            <p className="text-xs text-zinc-600">No code needed — it's handled automatically</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative z-10 py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-violet-500/20 blur-3xl rounded-full" />
            <div className="relative glass rounded-[3rem] p-12 border border-white/10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Free Forever Plan</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                Stop managing infrastructure.
                <br />
                <span className="text-violet-400">Start building your product.</span>
              </h2>
              <p className="text-white/50 mb-10 max-w-lg mx-auto">
                Get a fully managed PostgreSQL database with REST API, Auth, SQL Editor, and Analytics — completely free to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link href="/project/create-project">
                    <Button size="lg" className="h-14 px-10 text-lg bg-white text-black hover:bg-zinc-200 font-bold rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] gap-2">
                      Go to Dashboard <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button size="lg" className="h-14 px-10 text-lg bg-white text-black hover:bg-zinc-200 font-bold rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] gap-2">
                      Create free account <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                )}
                <a href="#docs">
                  <Button size="lg" variant="outline" className="h-14 px-10 text-lg glass border-white/20 text-white hover:bg-white/10 rounded-2xl transition-all">
                    Read the docs
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-black/40">
        <div className="max-w-6xl mx-auto py-16 px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)]">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-black tracking-tight text-white">RapidBase</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                The open-source Firebase / Supabase alternative. Deploy your backend in seconds.
              </p>
            </div>
            {[
              { title: "Product", links: [
                { label: "Features", href: "#features" },
                { label: "How it Works", href: "#how-it-works" },
                { label: "Documentation", href: "#docs" },
              ] },
              { title: "Developers", links: [
                { label: "PostgREST API", href: "#docs" },
                { label: "SDK Examples", href: "#docs" },
                { label: "Support / FAQ", href: "/support" },
              ] },
              { title: "Company", links: [
                { label: "GitHub", href: "https://github.com/ayushsoni1010/rapidbase" },
                { label: "Contact", href: "mailto:support@rapidbase.io" },
              ] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1 group">
                        {link.label}
                        {link.href.startsWith("http") && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">© 2026 RapidBase. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}