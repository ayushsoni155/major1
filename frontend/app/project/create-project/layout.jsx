import HeaderCreateProject from "@/components/headerCreateProject/HeaderCreateProject";

export default function CreateProjectLayout({ children }) {
  return (
    <div className="dashboard-dark min-h-screen bg-[#08080f]">
      <HeaderCreateProject />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
