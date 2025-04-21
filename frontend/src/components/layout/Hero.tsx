import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section 
      className="w-full flex items-center justify-center h-[500px] sm:h-[600px] md:h-[700px] bg-background"
      style={{ contain: 'size layout', aspectRatio: '16/9', minHeight: '500px' }}
    >
      <div className="container px-4 md:px-6 mx-auto max-w-4xl" style={{ contain: 'layout' }}>
        <div className="flex flex-col items-center justify-center space-y-4 md:space-y-8 text-center">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-2 sm:mb-4 md:mb-6 px-2"
            style={{ minHeight: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Construction Compliance Made Simple
          </h1>
          <p 
            className="text-muted-foreground text-base sm:text-lg max-w-[600px] mb-4 sm:mb-6 md:mb-8 px-4"
            style={{ minHeight: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Stay updated with real-time compliance information and regulations for the construction industry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button size="lg" variant="default" className="px-6 py-2 md:px-8 md:py-3 text-sm md:text-base font-medium" asChild>
              <Link href="/compliance-check">Get Started</Link>
            </Button>
            <div className="flex gap-4">
              <Button size="lg" variant="outline" className="px-6 py-2 md:px-8 md:py-3 text-sm md:text-base font-medium" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button size="lg" variant="secondary" className="px-6 py-2 md:px-8 md:py-3 text-sm md:text-base font-medium" asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 md:mt-6" style={{ height: '8px', width: '80px' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 md:h-2 w-1.5 md:w-2 rounded-full ${i === 0 ? "bg-primary" : "bg-gray-300"}`} 
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 