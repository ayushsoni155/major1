"use client";

import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/providers/AuthContext";
import { ProjectProvider } from "@/providers/ProjectContext";
import ClientTopLoader from "@/providers/ClientTopLoader";
import { Toaster } from "@/components/ui/sonner";
import { TableProvider } from "./TableContext";
import SessionWatcher from "./SessionWatcher";
import ProtectedRoute from "@/components/global/ProtectedRoute";

const allowedRoutes = ["/", "/about", "/login", "/signup"];

export default function Provider({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
      <AuthProvider>
        <ProjectProvider>
           <TableProvider>
             <ClientTopLoader />
          <Toaster
            expand={false}
            position="top-center"
            richColors
            closeButton
          />
           <SessionWatcher />
            <ProtectedRoute allowedRoutes={allowedRoutes}>
          {children}
          </ProtectedRoute>
          </TableProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
