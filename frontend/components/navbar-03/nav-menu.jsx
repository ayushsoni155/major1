"use client";;
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { features, resources,pricing } from "./config";

export const NavMenu = (props) => (
  <NavigationMenu {...props}>
    <NavigationMenuList className="gap-1 space-x-0 text-sm">
      <NavigationMenuItem>
        <Button variant="ghost" className="text-[15px] font-normal" asChild>
          <Link href="/">Home</Link>
        </Button>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger className="text-[15px] font-normal">
          Features
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul
            className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
            {features.map((feature) => (
              <ListItem key={feature.title} title={feature.title} icon={feature.icon} href="#">
                {feature.description}
              </ListItem>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger className="text-[15px] font-normal">
          Resources
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul
            className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
            { resources.map((menuItem) => (
              <ListItem key={menuItem.title} title={menuItem.title} icon={menuItem.icon} href="#">
                {menuItem.description}
              </ListItem>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger className="text-[15px] font-normal">
          Pricing
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul
            className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
            { pricing .map((price) => (
              <ListItem key={price.title} title={price.title} icon={price.icon} href="#">
                {price.description}
              </ListItem>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);

const ListItem = React.forwardRef(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block items-start select-none space-y-2 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}>
          <props.icon className="mb-4 h-6 w-6" />
          <div className="text-sm font-semibold leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
