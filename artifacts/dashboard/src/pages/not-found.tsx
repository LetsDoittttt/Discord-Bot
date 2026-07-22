import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="bg-destructive/10 p-4 rounded-full">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-bold font-mono tracking-tight text-foreground">ERR_404</h1>
        <p className="text-lg text-muted-foreground font-mono">Module not found or offline.</p>
      </div>

      <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 font-mono">
        RETURN_TO_BASE
      </Link>
    </div>
  );
}
