// software/frontend/src/pages/LandingPage.tsx
import { Link as RouterLink } from "react-router-dom";
import {
  AlertTriangle,
  MapPin,
  BarChart2,
  MessageSquare,
  // ChevronRight, // No longer needed if "Learn More" is removed
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  // CardFooter, // No longer needed if "Learn More" is removed
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Helper function for scrolling
const scrollToSection = (
  e: React.MouseEvent<HTMLAnchorElement>,
  sectionIdWithHash: string
) => {
  e.preventDefault();
  if (sectionIdWithHash === "#top") {
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  const sectionId = sectionIdWithHash.substring(1);
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "auto" });
  }
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a
            href="#top"
            onClick={(e) => scrollToSection(e, "#top")}
            className="flex items-center gap-2 cursor-pointer" // cursor-pointer added
          >
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">WildRisk AI</span>
          </a>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              onClick={(e) => scrollToSection(e, "#features")}
              className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer" // cursor-pointer added
            >
              <Button variant="ghost">Features</Button>
            </a>
            <a
              href="#faq"
              onClick={(e) => scrollToSection(e, "#faq")}
              className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer" // cursor-pointer added
            >
              <Button variant="ghost">FAQ</Button>
            </a>
            <RouterLink to="/model">
              <Button className="bg-orange-600 hover:bg-orange-700 cursor-pointer">
                {" "}
                {/* cursor-pointer by default on Button but can be explicit */}
                Launch App
              </Button>
            </RouterLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-orange-100 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-6 text-5xl font-bold text-gray-900 md:text-6xl">
              <span className="text-orange-600">WildRisk AI</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-700">
              AI-powered wildfire risk assessment for communities across the
              USA. Get personalized insights and proactive protection against
              the growing threat of wildfires.
            </p>
            <RouterLink to="/model">
              <Button
                size="lg"
                className="bg-orange-600 px-8 py-6 text-lg hover:bg-orange-700 cursor-pointer"
              >
                Launch WildRisk AI
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </RouterLink>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center">
                <div className="mb-4 rounded-full bg-orange-100 p-4">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold">
                  Personalized Risk Assessment
                </h3>
                <p className="text-gray-600">
                  Risk scores based on your specific location within the United
                  States.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-4 rounded-full bg-orange-100 p-4">
                  <MapPin className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold">Historical Insights</h3>
                <p className="text-gray-600">
                  Explore past wildfire patterns in your area.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-4 rounded-full bg-orange-100 p-4">
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold">AI Assistant</h3>
                <p className="text-gray-600">
                  Get personalized guidance on fire prevention.
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-orange-200 opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-200 opacity-40 blur-3xl"></div>
        </section>

        {/* About Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
                Proactive Protection Against Wildfires
              </h2>
              <p className="mb-12 text-lg text-gray-700">
                As wildfires pose an increasing threat nationwide, WildRisk AI
                delivers localized risk predictions by combining historical burn
                data, real-time weather patterns, and community-specific
                factors.
              </p>
            </div>
            <div className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-xl border bg-white shadow-xl">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-100"></div>
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-100"></div>
              <div className="relative p-8">
                <img
                  src="/src/assets/map_preview.png"
                  alt="WildRisk AI Dashboard Preview"
                  className="rounded-lg border shadow-md"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
              Key Features
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* --- CardFooter and "Learn More" Link removed from all feature cards --- */}
              <Card>
                <CardHeader>
                  <div className="mb-2 w-fit rounded-full bg-orange-100 p-2">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Risk Rating</CardTitle>
                  <CardDescription>Updated 1-10 risk scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Receive a personalized risk rating for your location,
                    updated based on live weather data, local vegetation
                    information, and historical fire patterns.
                  </p>
                </CardContent>
                {/* <CardFooter><RouterLink to="/model" className="flex items-center text-sm font-medium text-orange-600 cursor-pointer">Learn more <ChevronRight className="ml-1 h-4 w-4" /></RouterLink></CardFooter> */}
              </Card>
              <Card>
                <CardHeader>
                  <div className="mb-2 w-fit rounded-full bg-orange-100 p-2">
                    <BarChart2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Risk Breakdown</CardTitle>
                  <CardDescription>
                    Understand your specific risk factors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Get plain-language explanations of your top risk factors,
                    such as dry brush proximity, wind patterns, and temperature
                    trends affecting your specific location.
                  </p>
                </CardContent>
                {/* <CardFooter><RouterLink to="/model" className="flex items-center text-sm font-medium text-orange-600 cursor-pointer">Learn more <ChevronRight className="ml-1 h-4 w-4" /></RouterLink></CardFooter> */}
              </Card>
              <Card>
                <CardHeader>
                  <div className="mb-2 w-fit rounded-full bg-orange-100 p-2">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Historical Map</CardTitle>
                  <CardDescription>
                    Visualize past wildfire patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Explore an interactive map showing past wildfires and
                    seasonal trends tied to your specific location and
                    surrounding areas.
                  </p>
                </CardContent>
                {/* <CardFooter><RouterLink to="/model" className="flex items-center text-sm font-medium text-orange-600 cursor-pointer">Learn more <ChevronRight className="ml-1 h-4 w-4" /></RouterLink></CardFooter> */}
              </Card>
              <Card>
                <CardHeader>
                  <div className="mb-2 w-fit rounded-full bg-orange-100 p-2">
                    <BarChart2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Neighborhood Comparison</CardTitle>
                  <CardDescription>See how your risk compares</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Compare your risk level to similar areas to advocate for
                    broader safety measures like community brush-clearing
                    programs.
                  </p>
                </CardContent>
                {/* <CardFooter><RouterLink to="/model" className="flex items-center text-sm font-medium text-orange-600 cursor-pointer">Learn more <ChevronRight className="ml-1 h-4 w-4" /></RouterLink></CardFooter> */}
              </Card>
              <Card>
                <CardHeader>
                  <div className="mb-2 w-fit rounded-full bg-orange-100 p-2">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>AI Assistant</CardTitle>
                  <CardDescription>Get personalized guidance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Interact with our AI agent to discuss your risk in depth and
                    develop potential prevention plans tailored to your specific
                    situation.
                  </p>
                </CardContent>
                {/* <CardFooter><RouterLink to="/model" className="flex items-center text-sm font-medium text-orange-600 cursor-pointer">Learn more <ChevronRight className="ml-1 h-4 w-4" /></RouterLink></CardFooter> */}
              </Card>
              <Card>
                <CardHeader>
                  <div className="mb-2 w-fit rounded-full bg-orange-100 p-2">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Real-time Updates</CardTitle>
                  <CardDescription>
                    Stay informed with current data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Receive updates based on changing weather conditions,
                    seasonal factors, and other dynamic elements that affect
                    your wildfire risk through our RAG architecture.
                  </p>
                </CardContent>
                {/* <CardFooter><RouterLink to="/model" className="flex items-center text-sm font-medium text-orange-600 cursor-pointer">Learn more <ChevronRight className="ml-1 h-4 w-4" /></RouterLink></CardFooter> */}
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-orange-600 to-red-600 py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              Ready to Assess Your Wildfire Risk?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-orange-50">
              Get started with WildRisk AI today and take proactive steps to protect
              your home, family, and community from wildfire threats.
            </p>
            <RouterLink to="/model">
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-transparent px-8 py-6 text-lg text-white hover:bg-white hover:text-orange-600 cursor-pointer"
              >
                Launch WildRisk AI
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </RouterLink>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="cursor-pointer">
                    How accurate are WildRisk AI's risk predictions?
                  </AccordionTrigger>
                  <AccordionContent>
                    WildRisk AI combines historical wildfire data, real-time weather
                    patterns, and location-specific factors to provide highly
                    accurate risk assessments. Our model is continuously
                    improved with new data and validated against actual wildfire
                    occurrences.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="cursor-pointer">
                    Is WildRisk AI available for all areas in the USA?
                  </AccordionTrigger>
                  <AccordionContent>
                    Currently, WildRisk AI's predictor model leverages nationwide
                    datasets for the United States. The availability of highly
                    localized real-time data for our RAG component may vary by
                    region, but the core predictive model aims for broad US
                    coverage.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="cursor-pointer">
                    How often is the risk assessment updated?
                  </AccordionTrigger>
                  <AccordionContent>
                    Risk assessments are updated based on our model's training
                    data and, where applicable, daily real-time inputs. During
                    high-risk periods or rapidly changing conditions, updates
                    derived from dynamic data may occur more frequently.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="cursor-pointer">
                    What data does WildRisk AI use to generate risk scores?
                  </AccordionTrigger>
                  <AccordionContent>
                    WildRisk AI analyzes historical wildfire incident data, current
                    and forecasted weather conditions (temperature, humidity,
                    wind speed/direction), terrain information (elevation,
                    slope), vegetation types and density, and proximity to
                    previous burn areas, among other factors relevant to the
                    selected location.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger className="cursor-pointer">
                    How can I use WildRisk AI to protect my property?
                  </AccordionTrigger>
                  <AccordionContent>
                    WildRisk AI provides specific risk factors affecting your
                    location, allowing you to take targeted preventive measures.
                    Our AI assistant can also suggest personalized prevention
                    strategies based on your property's specific characteristics
                    and risk profile.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger className="cursor-pointer">
                    Is WildRisk AI free to use?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes, WildRisk AI's basic risk assessment features are free.
                    We're committed to making this vital safety information
                    accessible to everyone in fire-prone areas.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <a
              href="#top"
              onClick={(e) => scrollToSection(e, "#top")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-lg font-bold text-gray-900">WildRisk AI</span>
            </a>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, "#features")}
                className="text-sm text-gray-600 hover:text-orange-600 cursor-pointer"
              >
                Features
              </a>
              <a
                href="#faq"
                onClick={(e) => scrollToSection(e, "#faq")}
                className="text-sm text-gray-600 hover:text-orange-600 cursor-pointer"
              >
                FAQ
              </a>
              <RouterLink
                to="/privacy-policy"
                className="text-sm text-gray-600 hover:text-orange-600 cursor-pointer"
              >
                Privacy Policy
              </RouterLink>
              <RouterLink
                to="/terms-of-service"
                className="text-sm text-gray-600 hover:text-orange-600 cursor-pointer"
              >
                Terms of Service
              </RouterLink>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} LLMinance. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
