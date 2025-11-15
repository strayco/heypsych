import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Target, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About HeyPsych | Mental Health Information Platform",
  description:
    "Learn about HeyPsych, our mission to provide accessible mental health information, and our commitment to evidence-based resources.",
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
        <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600">
          Your trusted resource for mental health information and support
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
            HeyPsych is dedicated to making mental health information accessible, understandable,
            and actionable for everyone. We believe that informed individuals make better decisions
            about their mental health care.
          </p>
          <p className="leading-relaxed text-gray-700">
            Our platform provides comprehensive information about mental health conditions,
            treatment options, resources, and providers to help you navigate your mental health
            journey with confidence.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            What We Offer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-gray-900">Condition Information</h3>
              <p className="text-sm text-gray-700">
                Evidence-based information about mental health conditions, symptoms, and diagnostic
                criteria.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-gray-900">Treatment Options</h3>
              <p className="text-sm text-gray-700">
                Comprehensive coverage of medications, therapies, and alternative treatments with
                research backing.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-gray-900">Resources & Tools</h3>
              <p className="text-sm text-gray-700">
                Assessments, crisis support, educational guides, and digital tools to support your
                journey.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-gray-900">Psychiatrist Directory</h3>
              <p className="text-sm text-gray-700">
                Information about psychiatrists including specialties, credentials, and
                practice details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Our Commitment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Evidence-Based Information</h3>
            <p className="text-sm text-gray-700">
              All content is reviewed for accuracy and backed by current research and clinical
              guidelines.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Privacy & Security</h3>
            <p className="text-sm text-gray-700">
              We take your privacy seriously and do not collect or store personal health
              information.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Accessibility</h3>
            <p className="text-sm text-gray-700">
              We strive to make mental health information accessible to everyone, regardless of
              background or circumstances.
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
              <strong>Medical Disclaimer:</strong> HeyPsych is an informational resource and should
              not be used as a substitute for professional medical advice, diagnosis, or treatment.
              Always seek the advice of your physician or qualified mental health provider with any
              questions you may have regarding a medical condition.
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
    </div>
  );
}
