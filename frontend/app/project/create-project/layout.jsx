import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/project-sidebar/app-sidebar"
import HeaderCreateProject from "@/components/headerCreateProject/HeaderCreateProject"

export default function RootLayout({ children }) {
  return (
    <>  
     <SidebarProvider>
      <SidebarInset>
        <HeaderCreateProject/>
            {children}
              </SidebarInset>
    </SidebarProvider>
  </>
  )  
}
