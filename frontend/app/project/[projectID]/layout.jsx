import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/project-sidebar/app-sidebar"
import HeadSidebar from "@/components/project-sidebar/HeadSidebar"

export default function RootLayout({ children }) {
  return (
    <>  
     <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
         <HeadSidebar/>
            {children}
              </SidebarInset>
    </SidebarProvider>
  </>
  )  
}
