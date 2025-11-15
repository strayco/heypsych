"use client";

import React, { useState, use } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { useEntity } from "@/lib/hooks/use-entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParsedContent, ParsedLinkList } from "@/components/ui/parsed-content";
import {
  ArrowLeft,
  MapPin,
  Star,
  Globe,
  User,
  GraduationCap,
  Shield,
  ExternalLink,
  Award,
  Building,
  MessageCircle,
  Share2,
  Linkedin,
  Building2,
} from "lucide-react";

interface ProviderDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  // Unwrap the params Promise using React.use()
  const { slug } = use(params);

  const { data: provider, isLoading, error } = useEntity(slug);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <h1 className="text-xl font-semibold text-neutral-900">Loading provider...</h1>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    notFound();
  }

  const data = provider.data;

  // Get specialty display names with link parsing capability
  const getSpecialtyDisplayName = (specialty: string) => {
    const specialtyNames: Record<string, string> = {
      depression: "Depression",
      anxiety: "Anxiety Disorders",
      adhd: "ADHD",
      bipolar: "Bipolar Disorder",
      trauma: "Trauma/PTSD",
      addiction: "Addiction Psychiatry",
      eating_disorders: "Eating Disorders",
      psychotic_disorders: "Psychotic Disorders",
      child_adolescent: "Child/Adolescent Psychiatry",
      geriatric: "Geriatric Psychiatry",
      forensic: "Forensic Psychiatry",
    };
    return (
      specialtyNames[specialty] ||
      specialty.charAt(0).toUpperCase() + specialty.slice(1).replace("_", " ")
    );
  };

  // Render rating stars
  const renderRating = (rating: number, size: "sm" | "lg" = "sm") => {
    const starSize = size === "lg" ? "h-6 w-6" : "h-4 w-4";

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`${starSize} ${
                i < Math.floor(rating) ? "fill-current text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className={`font-medium ${size === "lg" ? "text-lg" : "text-sm"}`}>{rating}</span>
      </div>
    );
  };

  const handleShare = async () => {
    const url = window.location.href;

    // Only use Web Share API (like mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.full_name} - Psychiatrist`,
          text: `Check out ${data.full_name}'s profile on HeyPsych`,
          url: url,
        });
      } catch (error) {
        // User cancelled sharing - silently ignore
      }
    }
    // If browser doesn't support sharing, button does nothing
  };

  const handleWebsite = () => {
    if (data.website) {
      window.open(data.website, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-neutral-800 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Psychiatrists</span>
          </Button>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="shadow-soft mb-8 rounded-2xl border border-neutral-200 bg-white"
        >
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
              {/* Provider Photo & Basic Info */}
              <div className="mb-6 flex-shrink-0 lg:mb-0">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-blue-600">
                  <User className="h-16 w-16 text-white" />
                </div>
              </div>

              {/* Main Info */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="mb-6 lg:mb-0">
                    <h1 className="mb-2 text-3xl font-bold text-neutral-900">{data.full_name}</h1>
                    <p className="mb-4 text-lg text-neutral-800">{data.credentials}</p>

                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <Badge variant="primary" size="sm">
                        Psychiatrist
                      </Badge>
                    </div>

                    {/* Location */}
                    {data.address && (
                      <div className="flex items-center space-x-4 text-neutral-800">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{data.address.city}, {data.address.state}</span>
                        </div>
                        {data.languages && data.languages.length > 1 && (
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4" />
                            <span>{data.languages.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-3 lg:items-end">
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex w-fit space-x-1 rounded-lg bg-gray-100 p-1">
            {[
              { key: "overview", label: "Overview" },
              { key: "reviews", label: "Reviews" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-neutral-800 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {activeTab === "overview" && (
              <>
                {/* About Section with link parsing */}
                {data.bio && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>About Dr. {data.full_name?.split(" ").pop()}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="leading-relaxed text-neutral-800">
                          <ParsedContent content={data.bio} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Education & Training with link parsing */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <GraduationCap className="h-5 w-5" />
                        <span>Education & Training</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.medical_school && (
                        <div>
                          <h4 className="font-semibold text-neutral-900">Medical School</h4>
                          <div className="text-neutral-800">
                            <ParsedContent content={data.medical_school} />
                          </div>
                        </div>
                      )}
                      {data.residency && (
                        <div>
                          <h4 className="font-semibold text-neutral-900">Psychiatry Residency</h4>
                          <div className="text-neutral-800">
                            <ParsedContent content={data.residency} />
                          </div>
                        </div>
                      )}
                      {data.fellowship && (
                        <div>
                          <h4 className="font-semibold text-neutral-900">Fellowship</h4>
                          <div className="text-neutral-800">
                            <ParsedContent content={data.fellowship} />
                          </div>
                        </div>
                      )}
                      {data.subspecialties && data.subspecialties.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-neutral-900">Board Certifications</h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {data.subspecialties.map((cert: string, idx: number) => (
                              <Badge key={idx} variant="outline">
                                <Award className="mr-1 h-3 w-3" />
                                <ParsedContent content={cert} />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Specialties & Treatment Approaches with enhanced linking */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Specialties & Treatment Approaches</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {data.specialties && data.specialties.length > 0 && (
                        <div>
                          <h4 className="mb-3 font-semibold text-neutral-900">Clinical Specialties</h4>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            {data.specialties.map((specialty: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="justify-start p-3">
                                <ParsedContent content={getSpecialtyDisplayName(specialty)} />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.treatment_approaches && data.treatment_approaches.length > 0 && (
                        <div>
                          <h4 className="mb-3 font-semibold text-neutral-900">Treatment Approaches</h4>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            {data.treatment_approaches.map((approach: string, idx: number) => (
                              <Badge key={idx} variant="therapy" className="justify-start p-3">
                                <ParsedContent
                                  content={approach
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enhanced treatment philosophy with links */}
                      {data.treatment_philosophy && (
                        <div>
                          <h4 className="mb-3 font-semibold text-neutral-900">Treatment Philosophy</h4>
                          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                            <div className="text-sm text-blue-800">
                              <ParsedContent content={data.treatment_philosophy} />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Hospital Affiliations with link parsing */}
                {data.hospital_affiliations && data.hospital_affiliations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Building className="h-5 w-5" />
                          <span>Hospital Affiliations</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {data.hospital_affiliations.map((hospital: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 rounded-lg bg-neutral-50 p-3"
                            >
                              <Building className="h-4 w-4 text-neutral-700" />
                              <div className="font-medium">
                                <ParsedContent content={hospital} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Research & Publications with links */}
                {data.research_interests && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Research & Clinical Interests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-neutral-800">
                          <ParsedContent content={data.research_interests} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}

            {activeTab === "reviews" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>Patient Reviews</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="py-12 text-center">
                      <MessageCircle className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
                      <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                        Reviews Coming Soon
                      </h3>
                      <div className="text-neutral-800">
                        <ParsedContent content="Patient reviews and ratings will be displayed here once our review system is live. Meanwhile, our Provider Review Guide (coming soon) will walk through how to choose the right provider." />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact & Practice Info with link parsing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Practice Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.practice_name && (
                    <div>
                      <h4 className="font-semibold text-neutral-900">
                        <ParsedContent content={data.practice_name} />
                      </h4>
                    </div>
                  )}

                  {data.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="mt-1 h-4 w-4 text-neutral-700" />
                      <div className="text-sm text-neutral-900">
                        <p>{data.address.street}</p>
                        <p>
                          {data.address.city}, {data.address.state} {data.address.zip}
                        </p>
                      </div>
                    </div>
                  )}

                  {data.website && (
                    <Button variant="outline" size="sm" onClick={handleWebsite} className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Website
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Online Presence */}
            {data.online_presence && Object.values(data.online_presence).some((val) => {
              if (Array.isArray(val)) return val.length > 0;
              return val !== null && val !== undefined;
            }) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5" />
                      <span>Online Presence</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.online_presence.website && (
                      <a
                        href={data.online_presence.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">Website</p>
                          <p className="text-xs text-neutral-700">Visit provider's website</p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-neutral-600" />
                      </a>
                    )}

                    {data.online_presence.linkedin && (
                      <a
                        href={data.online_presence.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
                      >
                        <Linkedin className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">LinkedIn Profile</p>
                          <p className="text-xs text-neutral-700">Professional background</p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-neutral-600" />
                      </a>
                    )}

                    {data.online_presence.academic_profile && (
                      <a
                        href={data.online_presence.academic_profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
                      >
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">Academic Profile</p>
                          <p className="text-xs text-neutral-700">Research & publications</p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-neutral-600" />
                      </a>
                    )}

                    {data.online_presence.practice_profile && (
                      <a
                        href={data.online_presence.practice_profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
                      >
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">Practice Profile</p>
                          <p className="text-xs text-neutral-700">Group or hospital profile</p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-neutral-600" />
                      </a>
                    )}

                    {data.online_presence.other_links?.map((link: { url: string; label: string }, idx: number) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">{link.label}</p>
                          <p className="text-xs text-neutral-700">External link</p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-neutral-600" />
                      </a>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Insurance with enhanced content */}
            {data.insurance_accepted && data.insurance_accepted.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Insurance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Insurance with link parsing */}
                    <div>
                      <h4 className="mb-3 flex items-center space-x-2 font-semibold text-neutral-900">
                        <Shield className="h-4 w-4" />
                        <span>Insurance Accepted</span>
                      </h4>
                      <div className="space-y-1">
                        {data.insurance_accepted.map((insurance: string, idx: number) => (
                          <div key={idx} className="text-sm text-neutral-800">
                            <ParsedContent content={insurance} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3">
                        <div className="text-xs text-blue-800">
                          <ParsedContent content="Always verify your insurance coverage before booking. Check our {link:resource:insurance-guide} for help understanding benefits." />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
