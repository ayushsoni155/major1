"use client";

import { Separator } from "@/components/ui/separator";
import { Github, Twitter, Linkedin, Facebook, Dribbble, Bot } from "lucide-react";
import Link from "next/link";

const footerSections = [
  {
    title: "Product",
    links: [
      { title: "Overview", href: "#" },
      { title: "Features", href: "#" },
      { title: "Solutions", href: "#" },
      { title: "Pricing", href: "#" },
      { title: "Releases", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { title: "About us", href: "#" },
      { title: "Careers", href: "#" },
      { title: "Press", href: "#" },
      { title: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "Blog", href: "#" },
      { title: "Newsletter", href: "#" },
      { title: "Help Centre", href: "#" },
      { title: "Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Terms", href: "#" },
      { title: "Privacy", href: "#" },
      { title: "Cookies", href: "#" },
    ],
  },
];

const Footer01Page = () => {
  return (
    <footer className="bg-background border-t mt-16">
      <div className="max-w-screen-xl mx-auto px-6 xl:px-0">
        <div className="py-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-10">
          {/* Logo + Intro */}
          <div className="col-span-full lg:col-span-2">
            <div className="flex  items-center gap-2 font-semibold text-lg">
             <Bot/>
              GoRapidBase
            </div>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              Build Databases & Dashboards — <br /> In Minutes, Not Weeks
            </p>
          </div>

          {/* Footer Sections */}
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <h6 className="font-semibold text-foreground">{title}</h6>
              <ul className="mt-6 space-y-3 text-sm">
                {links.map(({ title, href }) => (
                  <li key={title}>
                    <Link
                      href={href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        {/* Bottom bar */}
        <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Rapidbase. All rights reserved.
          </span>

          <div className="flex items-center gap-5 text-muted-foreground">
            <Link href="#" aria-label="Twitter">
              <Twitter className="h-5 w-5 hover:text-primary transition-colors" />
            </Link>
            <Link href="#" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5 hover:text-primary transition-colors" />
            </Link>
            <Link href="#" aria-label="Facebook">
              <Facebook className="h-5 w-5 hover:text-primary transition-colors" />
            </Link>
            <Link href="#" aria-label="Dribbble">
              <Dribbble className="h-5 w-5 hover:text-primary transition-colors" />
            </Link>
            <Link href="#" aria-label="GitHub">
              <Github className="h-5 w-5 hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer01Page;
