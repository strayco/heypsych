import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service | HeyPsych",
  description: "HeyPsych terms of service - Terms and conditions for using our platform.",
};

export default function TermsPage() {
  const lastUpdated = "January 2025";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-sm text-gray-600">Last Updated: {lastUpdated}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agreement to Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            By accessing or using HeyPsych, you agree to be bound by these Terms of Service and all
            applicable laws and regulations. If you do not agree with any of these terms, you are
            prohibited from using this site.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Disclaimer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="mb-2 text-sm text-gray-700">
              <strong>Important Medical Disclaimer:</strong>
            </p>
            <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-gray-700">
              <li>HeyPsych is an informational resource only</li>
              <li>We do not provide medical advice, diagnosis, or treatment</li>
              <li>Information on this site should not replace professional medical advice</li>
              <li>Always consult with qualified healthcare providers for medical decisions</li>
              <li>
                Never disregard professional medical advice based on information from this site
              </li>
              <li>We are not liable for any health-related decisions you make</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Situations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border-l-4 border-red-400 bg-red-50 p-4">
            <p className="text-sm text-gray-700">
              <strong>Crisis Support:</strong> If you are experiencing a mental health emergency or
              having thoughts of suicide, please:
            </p>
            <ul className="mt-2 ml-4 list-inside list-disc space-y-1 text-sm text-gray-700">
              <li>Call 988 (Suicide & Crisis Lifeline) immediately</li>
              <li>Call 911 or go to your nearest emergency room</li>
              <li>Contact a mental health professional</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Use of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="mb-2 text-sm text-gray-700">
            You agree to use HeyPsych only for lawful purposes and in accordance with these Terms.
            You agree not to:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-gray-700">
            <li>Use the site in any way that violates applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to any part of the site</li>
            <li>Interfere with or disrupt the site or servers</li>
            <li>Use automated systems to access the site without permission</li>
            <li>Copy, modify, or distribute content without authorization</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intellectual Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            The content, features, and functionality of HeyPsych are owned by us and are protected
            by copyright, trademark, and other intellectual property laws. You may not reproduce,
            distribute, or create derivative works without our express written permission.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accuracy of Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            While we strive to provide accurate and up-to-date information, we make no
            representations or warranties about the completeness, accuracy, reliability, or
            suitability of any information on the site. Medical knowledge evolves rapidly, and
            information may become outdated.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Third-Party Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            HeyPsych may contain links to third-party websites. We are not responsible for the
            content, privacy practices, or terms of these external sites. Accessing third-party
            links is at your own risk.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            To the fullest extent permitted by law, HeyPsych and its affiliates shall not be liable
            for any indirect, incidental, special, consequential, or punitive damages arising from
            your use of the site or reliance on any information provided.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disclaimer of Warranties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            The site is provided on an &quot;as is&quot; and &quot;as available&quot; basis without
            warranties of any kind, either express or implied, including but not limited to
            warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Indemnification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            You agree to indemnify and hold harmless HeyPsych and its affiliates from any claims,
            damages, or expenses arising from your use of the site or violation of these Terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            We reserve the right to modify these Terms at any time. Changes will be effective
            immediately upon posting. Your continued use of the site after changes constitutes
            acceptance of the modified Terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Governing Law</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            These Terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law principles.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            If you have questions about these Terms of Service, please contact us.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
