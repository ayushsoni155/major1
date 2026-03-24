"use client";

import { useState } from "react";
import HeaderCreateProject from "@/components/headerCreateProject/HeaderCreateProject";

export default function CreateProjectLayout({ children }) {
  const [search, setSearch] = useState("");

  return (
    <div className="dashboard-dark min-h-screen bg-[#08080f]" data-search={search}>
      <HeaderCreateProject onSearchChange={setSearch} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
