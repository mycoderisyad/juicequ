import Link from "next/link";
import { Button } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-green-600"
          >
            <span aria-hidden="true">🍹</span>
            <span>JuiceQu</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/menu"
              className="text-sm font-medium text-gray-600 hover:text-green-600"
            >
              Menu
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-green-600"
            >
              Login
            </Link>
            <Link href="/menu">
              <Button size="sm">Order Now</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Fresh & Healthy{" "}
                <span className="text-green-600">Juice</span> for You
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Order your favorite juice with AI-powered recommendations.
                Try our voice ordering feature for a seamless experience!
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/menu">
                  <Button size="xl">
                    <span aria-hidden="true">🛒</span>
                    Browse Menu
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button size="xl" variant="outline">
                    <span aria-hidden="true">🤖</span>
                    Chat with AI
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div
            className="absolute -top-40 right-0 -z-10 h-80 w-80 rounded-full bg-green-200/50 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-40 left-0 -z-10 h-80 w-80 rounded-full bg-emerald-200/50 blur-3xl"
            aria-hidden="true"
          />
        </section>

        {/* Features Section */}
        <section className="py-20" aria-labelledby="features-heading">
          <div className="container mx-auto px-4">
            <h2
              id="features-heading"
              className="text-center text-3xl font-bold text-gray-900 sm:text-4xl"
            >
              Why Choose JuiceQu?
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-2xl"
                    aria-hidden="true"
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-green-600 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to try?
            </h2>
            <p className="mt-4 text-lg text-green-100">
              Start ordering with our AI assistant or browse the menu directly.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button
                  size="xl"
                  variant="secondary"
                  className="bg-white text-green-600 hover:bg-green-50"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2024 JuiceQu. All rights reserved.</p>
          <p className="mt-2">
            Made with <span aria-label="love">❤️</span> for Hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "🤖",
    title: "AI Recommendations",
    description:
      "Get personalized juice recommendations based on your preferences and health goals.",
  },
  {
    icon: "🎤",
    title: "Voice Ordering",
    description:
      "Order hands-free using our voice recognition feature. Just speak and we'll prepare your juice!",
  },
  {
    icon: "🥗",
    title: "Healthy Options",
    description:
      "All our juices are made from fresh, locally-sourced ingredients with nutritional information.",
  },
  {
    icon: "⚡",
    title: "Fast Service",
    description:
      "Track your order in real-time and get notified when it's ready for pickup.",
  },
  {
    icon: "💳",
    title: "Easy Payment",
    description:
      "Multiple payment options including QRIS, cash, and bank transfer.",
  },
  {
    icon: "♿",
    title: "Accessible",
    description:
      "Our website is designed to be accessible to everyone, following WCAG 2.1 AA guidelines.",
  },
];
