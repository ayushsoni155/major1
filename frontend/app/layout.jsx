import "./globals.css";

import Provider from "@/providers/Provider";

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
