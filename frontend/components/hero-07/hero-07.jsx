"use client";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/providers/AuthContext";
import { useRouter } from 'nextjs-toploader/app';
import { toast } from "sonner";

const Hero07 = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleDashboardClick = () => {
    router.push("/project/create-project");
  };

  const handleLoginClick = () => {
    router.push("/login");
  };

  const handleSignupClick = () => {
    router.push("/signup");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-2 overflow-hidden bg-background text-foreground">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.2}
        duration={1}
        repeatdelay={1}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 h-full skew-y-12"
        )}
      />
      <div className="relative z-10 text-center max-w-2xl">
        <Badge className="bg-primary text-primary-foreground rounded-full py-1 px-3 border-none shadow-sm hover:bg-primary/90 transition-colors">
          Self-hosted BaaS Platform
        </Badge>

        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold !leading-[1.2] tracking-tight text-foreground">
          Build Databases & Dashboards — <br /> In Minutes, Not Weeks
        </h1>

        <p className="mt-6 text-[17px] md:text-lg text-muted-foreground">
          GoRapidBase lets you create databases, auto-generated dashboards, and
          REST APIs — all without writing code. From schema design to data
          visualization, everything is instant, intuitive, and secure.
        </p>

        <div className="mt-12 flex items-center justify-center gap-4">
          {loading ? (
             <Button size="lg" className="text-base min-w-[140px]" disabled>
               ...
             </Button>
          ) : user ? (
            <Button size="lg" className="text-base shadow-sm" onClick={handleDashboardClick}>
              Go to Dashboard
              <ArrowUpRight className="ml-2 !h-5 !w-5" />
            </Button>
          ) : (
            <>
              <Button size="lg" className="text-base shadow-sm" onClick={handleSignupClick}>
                <UserPlus className="mr-2 !h-5 !w-5" /> Sign Up Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoginClick}
                className="text-base shadow-none bg-background/50 backdrop-blur-sm"
              >
                <LogIn className="mr-2 !h-5 !w-5" /> Login
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hero07;
