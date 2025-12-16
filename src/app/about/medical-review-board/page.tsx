// Medical Review Board Page
// Displays all medical reviewers with credentials and expertise

import { Metadata } from "next";
import { Shield, CheckCircle, GraduationCap, Award, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import fs from 'fs';
import path from 'path';

// Type definitions
interface Reviewer {
  id: string;
  name: string;
  credentials: string;
  specialty: string;
  board_certifications: string[];
  education: string[];
  affiliations: string[];
  license_number: string;
  license_state: string;
  years_of_practice: number;
  clinical_expertise: string[];
  bio: string;
  image_url: string;
  profile_url: string;
}

interface Organization {
  name: string;
  description: string;
  url: string;
  established: string;
  mission: string;
}

interface ReviewBoardData {
  organization: Organization;
  reviewers: Reviewer[];
}

// Load reviewer data from JSON file
const getReviewBoardData = (): ReviewBoardData => {
  const filePath = path.join(process.cwd(), 'data', 'editorial', 'reviewers', 'medical-review-board.json');
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
};

export const metadata: Metadata = {
  title: "Medical Review Board | HeyPsych",
  description: "Meet the board-certified psychiatrists and mental health professionals who review all medical content on HeyPsych to ensure accuracy and reliability.",
  openGraph: {
    title: "Medical Review Board | HeyPsych",
    description: "Board-certified psychiatrists and mental health professionals ensuring medical accuracy",
    url: "https://heypsych.com/about/medical-review-board",
    type: "website",
  },
};

export default function MedicalReviewBoardPage() {
  const reviewBoardData = getReviewBoardData();
  const { organization, reviewers } = reviewBoardData;

  // Generate Organization schema.org
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": organization.name,
    "description": organization.description,
    "url": organization.url,
    "foundingDate": organization.established,
    "logo": "https://heypsych.com/images/logo.png",
    "sameAs": [
      "https://twitter.com/heypsych",
      "https://linkedin.com/company/heypsych"
    ]
  };

  // Generate Person schema.org for each reviewer
  const personSchemas = reviewers.map((reviewer: Reviewer) => ({
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `https://heypsych.com/about/medical-review-board#${reviewer.id}`,
    "name": reviewer.name,
    "jobTitle": reviewer.specialty,
    "description": reviewer.bio,
    "image": `https://heypsych.com${reviewer.image_url}`,
    "credentialCategory": reviewer.credentials,
    "knowsAbout": reviewer.clinical_expertise,
    "affiliation": reviewer.affiliations.map((aff: string) => ({
      "@type": "Organization",
      "name": aff
    })),
    "alumniOf": reviewer.education.map((edu: string) => ({
      "@type": "EducationalOrganization",
      "name": edu
    }))
  }));

  return (
    <>
      {/* Inject Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Inject Person Schemas */}
      {personSchemas.map((schema: any, index: number) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-neutral-900">
              {organization.name}
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-neutral-700">
              {organization.description}
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="mb-12 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-green-900">Our Mission</h2>
                  <p className="text-green-800">{organization.mission}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Board Members */}
          <div className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-neutral-900">
              Board Members
            </h2>
            <div className="space-y-8">
              {reviewers.map((reviewer: Reviewer) => (
                <Card key={reviewer.id} id={reviewer.id} className="overflow-hidden">
                  <CardHeader className="bg-neutral-50">
                    <div className="flex items-start gap-6">
                      {/* Reviewer Icon */}
                      <div className="shrink-0">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white">
                          <Shield className="h-12 w-12 text-blue-600" />
                        </div>
                      </div>

                      {/* Reviewer Info */}
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <CardTitle className="text-2xl">{reviewer.name}</CardTitle>
                          <CheckCircle className="h-5 w-5 text-green-600" aria-label="Verified Professional" />
                        </div>
                        <div className="mb-3 text-lg text-neutral-700">
                          {reviewer.credentials}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {reviewer.specialty}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            {reviewer.years_of_practice}+ years experience
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {reviewer.license_state} Licensed
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {/* Bio */}
                    <div className="mb-6">
                      <p className="text-neutral-800">{reviewer.bio}</p>
                    </div>

                    {/* Education */}
                    <div className="mb-6">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                        <GraduationCap className="h-4 w-4" />
                        Education
                      </div>
                      <ul className="space-y-1">
                        {reviewer.education.map((edu: string, idx: number) => (
                          <li key={idx} className="text-sm text-neutral-700">
                            • {edu}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Board Certifications */}
                    <div className="mb-6">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                        <Award className="h-4 w-4" />
                        Board Certifications
                      </div>
                      <ul className="space-y-1">
                        {reviewer.board_certifications.map((cert: string, idx: number) => (
                          <li key={idx} className="text-sm text-neutral-700">
                            • {cert}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Professional Affiliations */}
                    <div className="mb-6">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                        <Briefcase className="h-4 w-4" />
                        Professional Affiliations
                      </div>
                      <ul className="space-y-1">
                        {reviewer.affiliations.map((aff: string, idx: number) => (
                          <li key={idx} className="text-sm text-neutral-700">
                            • {aff}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Clinical Expertise */}
                    <div>
                      <div className="mb-3 text-sm font-semibold text-neutral-900">
                        Clinical Expertise
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reviewer.clinical_expertise.map((expertise: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {expertise}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Review Process */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Our Review Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-blue-800">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    1
                  </div>
                  <p>
                    <strong>Evidence-Based Research:</strong> All content is developed using current
                    peer-reviewed research, clinical guidelines, and evidence-based practices.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    2
                  </div>
                  <p>
                    <strong>Medical Review:</strong> Each article is reviewed by board-certified
                    psychiatrists or licensed mental health professionals with relevant expertise.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    3
                  </div>
                  <p>
                    <strong>Regular Updates:</strong> Content is regularly reviewed and updated to
                    reflect the latest research and clinical guidelines.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    4
                  </div>
                  <p>
                    <strong>Transparency:</strong> We clearly indicate when content was last reviewed
                    and by whom, ensuring full transparency about our editorial process.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
