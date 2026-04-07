import "./globals.css";

import Provider from "@/providers/Provider";

export const metadata = {
  title: "RapidBase — Your Backend, Ready in Minutes",
  description:
    "Deploy a production-ready PostgreSQL database with an auto-generated REST API, multi-tenant isolation, and built-in dashboards — in seconds.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <Provider>{children}</Provider>
        </body>
      </html>
    </>
  );
}
