import Footer01Page from "@/components/footer-02/footer-02";
import Navbar03Page from "@/components/navbar-03/navbar-03";


export default function RootLayout({ children }) {
  return (
    <>  
    <Navbar03Page/>
            {children}
            <Footer01Page/>
    </>
  )
}