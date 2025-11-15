import Link from "next/link";
import { ArrowRight, Brain, Heart, BookOpen, Users } from "lucide-react";

const navigationTiles = [
  {
    title: "Treatments",
    description: "Explore evidence-based mental health treatments and therapies",
    href: "/treatments",
    icon: Brain,
    gradient: "from-blue-500 to-cyan-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-600",
    stats: "500+ Treatment Options",
  },
  {
    title: "Conditions",
    description: "Learn about mental health conditions and symptoms",
    href: "/conditions",
    icon: Heart,
    gradient: "from-purple-500 to-pink-500",
    hoverGradient: "group-hover:from-purple-600 group-hover:to-pink-600",
    stats: "289+ Conditions Covered",
  },
  {
    title: "Resources",
    description: "Access clinical tools, assessments, and educational materials",
    href: "/resources",
    icon: BookOpen,
    gradient: "from-emerald-500 to-teal-500",
    hoverGradient: "group-hover:from-emerald-600 group-hover:to-teal-600",
    stats: "25+ Clinical Resources",
  },
  {
    title: "Find Psychiatrists",
    description: "Connect with qualified psychiatrists",
    href: "/psychiatrists",
    icon: Users,
    gradient: "from-orange-500 to-red-500",
    hoverGradient: "group-hover:from-orange-600 group-hover:to-red-600",
    stats: "60,000+ Psychiatrists",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          {/* Main headline */}
          <div className="relative">
            <h1 className="mb-3 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
              Your Mental Health
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Journey Starts Here
              </span>
            </h1>
          </div>

          <p className="mx-auto mb-6 max-w-2xl text-base text-slate-600 sm:text-lg">
            Compare treatments, understand conditions, access clinical resources, and find
            psychiatrists.
          </p>

          {/* Trust indicators */}
          <div className="mb-8 flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              Evidence-Based
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
              Clinically Reviewed
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
              Always Free
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tiles */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {navigationTiles.map((tile, index) => {
              const IconComponent = tile.icon;
              return (
                <Link key={tile.href} href={tile.href} className="group block">
                  <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition-all duration-500 group-hover:-translate-y-2 hover:shadow-2xl">
                    {/* Gradient background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} ${tile.hoverGradient} opacity-5 transition-opacity duration-500 group-hover:opacity-10`}
                    />

                    {/* Content */}
                    <div className="relative p-6 sm:p-8">
                      {/* Icon and title row */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`rounded-2xl bg-gradient-to-r p-3 ${tile.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                          >
                            <IconComponent className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-slate-700">
                              {tile.title}
                            </h3>
                            <div className="mt-1 text-sm font-medium text-slate-500">
                              {tile.stats}
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="h-6 w-6 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-600" />
                      </div>

                      {/* Description */}
                      <p className="mb-4 text-base leading-relaxed text-slate-600">
                        {tile.description}
                      </p>

                      {/* Call to action */}
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span
                          className={`bg-gradient-to-r ${tile.gradient} bg-clip-text text-transparent`}
                        >
                          Explore {tile.title}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-3xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-slate-200" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
