import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy | HeyPsych",
  description: "HeyPsych privacy policy - How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  const lastUpdated = "January 2025";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-sm text-gray-600">Last Updated: {lastUpdated}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            HeyPsych (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and
            is committed to protecting your personal information. This Privacy Policy explains how
            we collect, use, disclose, and safeguard your information when you visit our website.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Information You Provide</h3>
            <p className="mb-2 text-sm text-gray-700">
              We may collect information that you voluntarily provide to us, including:
            </p>
            <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-gray-700">
              <li>Contact information (if you reach out to us)</li>
              <li>Feedback and correspondence</li>
              <li>Search queries and site usage patterns</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-gray-900">
              Automatically Collected Information
            </h3>
            <p className="mb-2 text-sm text-gray-700">
              When you visit our website, we may automatically collect certain information:
            </p>
            <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-gray-700">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address</li>
              <li>Pages visited and time spent</li>
              <li>Referring website</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">We use the information we collect to:</p>
          <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-gray-700">
            <li>Provide, maintain, and improve our services</li>
            <li>Understand how users interact with our platform</li>
            <li>Respond to your inquiries and feedback</li>
            <li>Send administrative information</li>
            <li>Monitor and analyze usage trends</li>
            <li>Detect and prevent technical issues</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            We implement appropriate technical and organizational security measures to protect your
            information. However, no method of transmission over the Internet or electronic storage
            is 100% secure, and we cannot guarantee absolute security.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cookies and Tracking Technologies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            We may use cookies and similar tracking technologies to collect information about your
            browsing activities. You can control cookies through your browser settings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Third-Party Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Our website may contain links to third-party websites. We are not responsible for the
            privacy practices of these external sites. We encourage you to review their privacy
            policies before providing any personal information.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Health Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border-l-4 border-blue-400 bg-blue-50 p-4">
            <p className="text-sm text-gray-700">
              <strong>Important:</strong> HeyPsych does not collect, store, or process personal
              health information (PHI) or protected health information as defined by HIPAA. We are
              an informational resource only and do not provide medical services or maintain health
              records.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="mb-2 text-sm text-gray-700">
            Depending on your location, you may have certain rights regarding your personal
            information:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-gray-700">
            <li>Access to your personal information</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of your information</li>
            <li>Opt-out of certain data processing</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Children&apos;s Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Our website is not intended for children under 13 years of age. We do not knowingly
            collect personal information from children under 13.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes to This Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot;
            date.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            If you have questions about this Privacy Policy or our data practices, please contact
            us.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
