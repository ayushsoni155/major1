import {
  Database,
  BarChart3,
  Users,
  Key,
  Settings,
  FileText,
  Rocket,
  Lock,
  Tag,
} from "lucide-react";

// GoRapidBase Menu Items
export const features = [
  {
    title: "Visual Schema Builder",
    icon: Database,
    description: "Create tables and columns instantly without writing SQL.",
  },
  {
    title: "Auto CRUD UI",
    icon: Settings,
    description: "Generate user-friendly interfaces for your data automatically.",
  },
  {
    title: "Dynamic Dashboards",
    icon: BarChart3,
    description: "Get real-time views with search, filtering, and analytics.",
  },
  {
    title: "Collaboration",
    icon: Users,
    description: "Invite team members and assign secure roles easily.",
  },
  {
    title: "REST API Generation",
    icon: Key,
    description: "Expose secure APIs for integration with other apps.",
  },
];

export const resources = [
  {
    title: "Documentation",
    icon: FileText,
    description: "Learn how to use GoRapidBase with guides and examples.",
  },
  {
    title: "Security",
    icon: Lock,
    description: "Understand our multi-tenant architecture and data safety.",
  },
  {
    title: "Roadmap",
    icon: Rocket,
    description: "See upcoming features and planned improvements.",
  },
];

// Pricing Plans (array, same format as features/resources)
export const pricing = [
  {
    title: "Free",
    icon: Tag,
    description: "$0 — 1 Project, 5 Tables, 1,000 rows per table, Basic CRUD UI, Community Support",
  },
  {
    title: "Pro",
    icon: Tag,
    description:
      "$19/month — 10 Projects, 5 Tables, 50000 rows per table, Advanced Dashboards, Community Support",
  },
  {
    title: "Premium",
    icon: Tag,
    description:
      "$49/month — 50 Projects, 100 Tables, 1M rows per table, Role-based Access, Advanced Dashboards, Priority Support",
  }
];
