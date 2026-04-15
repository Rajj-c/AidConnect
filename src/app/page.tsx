
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ClipboardCheck, 
  MapPin, 
  Users, 
  Zap, 
  ShieldCheck, 
  Globe2 
} from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === "hero-image");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="bg-primary rounded-lg p-1.5">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-headline font-bold text-xl text-primary">AidConnect</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors mt-2" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors mt-2" href="#about">
            How it works
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Go to Dashboard</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold">
                    Smart Coordination
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Empowering NGOs with AI-Driven Insight
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl font-body">
                    Connect field reports to volunteer action. Prioritize urgent community needs using intelligent analysis and automated matching.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/dashboard">
                    <Button size="lg" className="px-8 font-semibold gap-2">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="px-8 font-semibold">
                    Watch Demo
                  </Button>
                </div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl lg:aspect-square">
                {heroImage && (
                  <Image
                    alt={heroImage.description}
                    className="object-cover"
                    fill
                    src={heroImage.imageUrl}
                    data-ai-hint={heroImage.imageHint}
                    priority
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section id="features" className="w-full py-12 md:py-24 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Built for Real Impact</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl font-body">
                  Everything an NGO needs to transition from scattered reports to coordinated success.
                </p>
              </div>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-12">
              <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-background/50">
                <CardContent className="pt-6">
                  <div className="p-2 w-fit bg-primary/10 rounded-lg mb-4 text-primary">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline mb-2">Smart Prioritization</h3>
                  <p className="text-muted-foreground font-body">
                    AI analyzes field reports to automatically identify high-priority community needs based on severity.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-background/50">
                <CardContent className="pt-6">
                  <div className="p-2 w-fit bg-accent/10 rounded-lg mb-4 text-accent">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline mb-2">Volunteer Matching</h3>
                  <p className="text-muted-foreground font-body">
                    Matching skills, locations, and availability to ensure the right people are at the right place at the right time.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-background/50">
                <CardContent className="pt-6">
                  <div className="p-2 w-fit bg-primary/10 rounded-lg mb-4 text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline mb-2">Live Operations Map</h3>
                  <p className="text-muted-foreground font-body">
                    A real-time dashboard visualizing needs, volunteer status, and active task progress across regions.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-background/50">
                <CardContent className="pt-6">
                  <div className="p-2 w-fit bg-accent/10 rounded-lg mb-4 text-accent">
                    <Globe2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline mb-2">Multilingual Support</h3>
                  <p className="text-muted-foreground font-body">
                    Available in major local languages like Telugu, Tamil, and Hindi to ensure field workers stay connected.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-background/50">
                <CardContent className="pt-6">
                  <div className="p-2 w-fit bg-primary/10 rounded-lg mb-4 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline mb-2">Secure & Reliable</h3>
                  <p className="text-muted-foreground font-body">
                    Enterprise-grade data security with role-based access to protect sensitive community information.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-background/50">
                <CardContent className="pt-6">
                  <div className="p-2 w-fit bg-accent/10 rounded-lg mb-4 text-accent">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline mb-2">Emergency Mode</h3>
                  <p className="text-muted-foreground font-body">
                    One-click disaster mode to override normal flows and prioritize life-critical resources during crises.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t bg-white">
        <div className="container px-4 md:px-6 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-body">
            © 2024 AidConnect Platform. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4 font-body" href="#">
              Terms of Service
            </Link>
            <Link className="text-xs hover:underline underline-offset-4 font-body" href="#">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
