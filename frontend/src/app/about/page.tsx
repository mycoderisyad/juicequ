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
      color: "bg-emerald-100 text-emerald-600"
    },
    {
      icon: Heart,
      title: t("about.values.health.title"),
      description: t("about.values.health.description"),
      color: "bg-rose-100 text-rose-600"
    },
    {
      icon: Award,
      title: t("about.values.quality.title"),
      description: t("about.values.quality.description"),
      color: "bg-amber-100 text-amber-600"
    },
    {
      icon: Users,
      title: t("about.values.community.title"),
      description: t("about.values.community.description"),
      color: "bg-sky-100 text-sky-600"
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

      <main id="main-content" className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-stone-50 py-20 lg:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {t("about.badge")}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-emerald-950 tracking-tight">
                {t("about.hero.title")}
              </h1>
              <p className="mt-6 text-stone-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                {t("about.hero.description")}
              </p>
            </div>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-lime-100/40 blur-3xl" />
        </section>

        {/* Stats Section */}
        <section className="py-16 border-b border-stone-100 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-serif font-bold text-emerald-600 lg:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-stone-500 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4">
                  <Target className="h-3.5 w-3.5" />
                  {t("about.mission.badge")}
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-medium text-emerald-950 lg:text-4xl">
                  {t("about.mission.title")}
                </h2>
                <p className="mt-4 text-stone-500 leading-relaxed">
                  {t("about.mission.description")}
                </p>
                <p className="mt-4 text-stone-500 leading-relaxed">
                  {t("about.mission.description2")}
                </p>
              </div>
              <div className="relative">
                <div className="aspect-square overflow-hidden rounded-3xl bg-stone-50">
                  <Image
                    src="/images/products/hero/berry-blast.webp"
                    alt="Our Mission"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-xl border border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <Leaf className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-serif font-medium text-emerald-950">100% Natural</div>
                      <div className="text-xs text-stone-500">{t("about.mission.noPreservatives")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-stone-50 py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-emerald-950 lg:text-4xl">
                {t("about.values.title")}
              </h2>
              <p className="mt-4 text-stone-500">
                {t("about.values.subtitle")}
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <div 
                  key={index} 
                  className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${value.color}`}>
                    <value.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-serif font-medium text-emerald-950">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-serif font-medium text-emerald-950 lg:text-4xl">
                  {t("about.story.title")}
                </h2>
                <div className="mt-8 space-y-6 text-stone-500 leading-relaxed text-left">
                  <p>{t("about.story.paragraph1")}</p>
                  <p>{t("about.story.paragraph2")}</p>
                  <p>{t("about.story.paragraph3")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="bg-stone-50 py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-emerald-950 lg:text-4xl">
                {t("about.team.title")}
              </h2>
              <p className="mt-4 text-stone-500">
                {t("about.team.subtitle")}
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member, index) => (
                <div key={index} className="group text-center">
                  <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-full bg-stone-100 ring-4 ring-white shadow-lg">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300"
                    />
                  </div>
                  <h3 className="mt-6 text-lg font-serif font-medium text-emerald-950">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl rounded-3xl bg-emerald-600 p-8 text-center text-white lg:p-12 shadow-xl shadow-emerald-600/20">
              <h2 className="text-2xl font-serif font-medium lg:text-3xl">
                {t("about.cta.title")}
              </h2>
              <p className="mt-4 text-emerald-100">
                {t("about.cta.description")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/menu">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-8 font-semibold shadow-lg">
                    {t("about.cta.viewMenu")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline" size="lg" className="border-white/50 text-white hover:bg-emerald-500 rounded-full px-8 font-semibold">
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
