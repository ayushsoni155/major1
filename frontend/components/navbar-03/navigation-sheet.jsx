"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthContext";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";
import { Bot, Menu, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import LoginPopup from "@/components/global/LoginPopup";

import { features, resources, pricing } from "./config";
import ThemeToggleButton from "../ui/theme-toggle-button";

export const NavigationSheet = () => {
const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleButtonClick = () => {
    if (user) {
      router.push("/project/create-project");
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-72 p-5 space-y-6">
          <DialogTitle className="sr-only">Navigation Menu</DialogTitle>

          {/* Logo */}
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="h-5 w-5" /> GoRapidBase
          </div>

          {/* CTA */}
          <div className="flex flex-row gap-3">
          <Button className="w-50" onClick={handleButtonClick}>
            {user? "Dashboard" : "Get Started"}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          <ThemeToggleButton variant="circle-blur" start="top-right" />
          </div>
          {/* Links */}
          <div className="space-y-6">
            {/* Home */}
            <Link href="/" className="block font-bold">
              Home
            </Link>

            {/* Features */}
            <div>
              <div className="font-bold">Features</div>
              <ul className="mt-2 space-y-2 ml-3 border-l pl-3">
                {features.map((f) => (
                  <li key={f.title}>
                    <Link href={f.href || "#"} className="flex items-center gap-2">
                      <f.icon className="h-4 w-4 text-muted-foreground" />
                      {f.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <div className="font-bold">Documents</div>
              <ul className="mt-2 space-y-2 ml-3 border-l pl-3">
                {resources.map((r) => (
                  <li key={r.title}>
                    <Link href={r.href || "#"} className="flex items-center gap-2">
                      <r.icon className="h-4 w-4 text-muted-foreground" />
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div>
              <div className="font-bold">Prices</div>
              <ul className="mt-2 space-y-2 ml-3 border-l pl-3">
                {pricing.map((p) => (
                  <li key={p.title}>
                    <Link href={p.href || "#"} className="flex items-center gap-2">
                      <p.icon className="h-4 w-4 text-muted-foreground" />
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Login Popup */}
      <LoginPopup open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
};
