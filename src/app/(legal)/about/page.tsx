import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Target, Shield, ArrowLeft, Lightbulb, Stethoscope } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About HeyPsych | Mental Health Decision Platform",
  description:
    "HeyPsych helps people make better mental-health decisions. For patients: find the right care, apps, and treatments. For clinicians: build the right practice stack.",
};

export default function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Back Button + Title Row */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="group">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            About HeyPsych
          </span>
        </h1>

        <div className="w-[140px]"></div>
      </div>

      <div className="text-center">
        <p className="mx-auto mb-3 max-w-2xl text-lg text-slate-700 font-medium">
          Better mental health starts with better decisions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Our Mission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed text-gray-700">
            HeyPsych is a mental health decision-support platform. We help patients, families,
            and clinicians make better decisions about mental health care.
          </p>
          <p className="leading-relaxed text-gray-700">
            We believe the hardest part of mental health isn&apos;t finding information—it&apos;s
            knowing what to do with it. Our platform turns information into action by helping
            you compare options, understand tradeoffs, and take your next step with confidence.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            For Patients & Families
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-700">
            We help you make decisions about your mental health care:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Find the Right Care</h3>
              <p className="text-sm text-gray-700">
                Search 70,000+ psychiatrists. Filter by specialty, location, and insurance.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Compare Treatments</h3>
              <p className="text-sm text-gray-700">
                Understand medications, therapies, and alternatives. See evidence levels and side effects.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Explore Conditions</h3>
              <p className="text-sm text-gray-700">
                Learn about symptoms, diagnostic criteria, and what to expect from treatment.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Discover Apps & Tools</h3>
              <p className="text-sm text-gray-700">
                Find digital tools for mood tracking, meditation, crisis support, and more.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-purple-600" />
            For Clinicians
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-700">
            We help you make decisions about your practice stack:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Compare EHR & Practice Tools</h3>
              <p className="text-sm text-gray-700">
                Side-by-side comparisons of practice management software with transparent pricing.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Practice Architect</h3>
              <p className="text-sm text-gray-700">
                Build your complete practice stack—from front door to back office—with fit scores.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Billing & Credentialing</h3>
              <p className="text-sm text-gray-700">
                Find billing services, credentialing support, and revenue cycle management tools.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">AI Scribes & Documentation</h3>
              <p className="text-sm text-gray-700">
                Compare AI documentation tools with HIPAA compliance and integration details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            How We&apos;re Different
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed text-gray-700">
            Every piece of content on HeyPsych is filtered through one question:
            <strong> &quot;Does this help someone make a decision?&quot;</strong>
          </p>
          <p className="leading-relaxed text-gray-700">
            We don&apos;t just aggregate information. We structure it for comparison,
            verify it for accuracy, and present it with the context you need to act.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Trust & Transparency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Medical Review Board</h3>
            <p className="text-sm text-gray-700">
              Clinical content is reviewed by board-certified psychiatrists and licensed mental
              health professionals.{" "}
              <Link
                href="/about/medical-review-board"
                className="font-medium text-green-700 hover:text-green-800 hover:underline"
              >
                Meet our Medical Review Board →
              </Link>
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Editorial Independence</h3>
            <p className="text-sm text-gray-700">
              Sponsors cannot purchase reviews, rankings, or favorable coverage.{" "}
              <Link
                href="/about/sponsorship-policy"
                className="font-medium text-green-700 hover:text-green-800 hover:underline"
              >
                Read our Sponsorship Policy →
              </Link>
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Review Methodology</h3>
            <p className="text-sm text-gray-700">
              We document how we evaluate tools—clinical evidence, privacy, pricing, and features.{" "}
              <Link
                href="/about/review-methodology"
                className="font-medium text-green-700 hover:text-green-800 hover:underline"
              >
                See our Review Methodology →
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Important Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="text-sm text-gray-700">
              <strong>Medical Disclaimer:</strong> HeyPsych provides decision-support information
              and should not be used as a substitute for professional medical advice, diagnosis,
              or treatment. Always consult a qualified mental health provider.
            </p>
          </div>
          <div className="rounded border-l-4 border-red-400 bg-red-50 p-4">
            <p className="text-sm text-gray-700">
              <strong>Crisis Support:</strong> If you are experiencing a mental health emergency,
              please call 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            For general inquiries, media, and partnerships:{" "}
            <a
              href="mailto:hello@heypsych.com"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              hello@heypsych.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
