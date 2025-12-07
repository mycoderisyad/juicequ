"use client";

import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "@/lib/i18n";
import { 
  Leaf, 
  Heart, 
  Award, 
  Users, 
  Target,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui";

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Leaf,
      title: t("about.values.fresh.title"),
      description: t("about.values.fresh.description"),
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Heart,
      title: t("about.values.health.title"),
      description: t("about.values.health.description"),
      color: "bg-red-100 text-red-600"
    },
    {
      icon: Award,
      title: t("about.values.quality.title"),
      description: t("about.values.quality.description"),
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      icon: Users,
      title: t("about.values.community.title"),
      description: t("about.values.community.description"),
      color: "bg-blue-100 text-blue-600"
    }
  ];

  const stats = [
    { value: "50K+", label: t("about.stats.customers") },
    { value: "100+", label: t("about.stats.products") },
    { value: "15+", label: t("about.stats.outlets") },
    { value: "4.9", label: t("about.stats.rating") }
  ];

  const team = [
    {
      name: "Raflan",
      role: t("about.team.founder"),
      image: "/images/products/hero/berry-blast.webp"
    },
    {
      name: "Sasya",
      role: t("about.team.headChef"),
      image: "/images/products/hero/green-goddess.webp"
    },
    {
      name: "Fauzan",
      role: t("about.team.operations"),
      image: "/images/products/hero/tropical-paradise.webp"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                <Sparkles className="h-4 w-4" />
                {t("about.badge")}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                {t("about.hero.title")}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                {t("about.hero.description")}
              </p>
            </div>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-green-100/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-orange-100/50 blur-3xl" />
        </section>

        {/* Stats Section */}
        <section className="py-16 border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-green-600 lg:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                  <Target className="h-4 w-4" />
                  {t("about.mission.badge")}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">
                  {t("about.mission.title")}
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {t("about.mission.description")}
                </p>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {t("about.mission.description2")}
                </p>
              </div>
              <div className="relative">
                <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-green-100 to-orange-50">
                  <Image
                    src="/images/products/hero/berry-blast.webp"
                    alt="Our Mission"
                    fill
                    className="object-cover opacity-90"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <Leaf className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">100% Natural</div>
                      <div className="text-xs text-gray-500">{t("about.mission.noPreservatives")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">
                {t("about.values.title")}
              </h2>
              <p className="mt-4 text-gray-600">
                {t("about.values.subtitle")}
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <div 
                  key={index} 
                  className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${value.color}`}>
                    <value.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">
                  {t("about.story.title")}
                </h2>
                <div className="mt-8 space-y-6 text-gray-600 leading-relaxed text-left">
                  <p>{t("about.story.paragraph1")}</p>
                  <p>{t("about.story.paragraph2")}</p>
                  <p>{t("about.story.paragraph3")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">
                {t("about.team.title")}
              </h2>
              <p className="mt-4 text-gray-600">
                {t("about.team.subtitle")}
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member, index) => (
                <div key={index} className="group text-center">
                  <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-full bg-gradient-to-br from-green-100 to-orange-50">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-r from-green-600 to-green-700 p-8 text-center text-white lg:p-12">
              <h2 className="text-2xl font-bold lg:text-3xl">
                {t("about.cta.title")}
              </h2>
              <p className="mt-4 text-green-100">
                {t("about.cta.description")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/menu">
                  <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 rounded-full px-8">
                    {t("about.cta.viewMenu")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-green-500 rounded-full px-8">
                    {t("about.cta.chatWithUs")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
