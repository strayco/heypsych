"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Entity } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";
import {
  MapPin,
  Star,
  Globe,
  User,
  GraduationCap,
  Shield,
  ExternalLink,
  Linkedin,
  Building2,
} from "lucide-react";

interface ProviderCardProps {
  provider: Entity;
  variant?: "default" | "compact" | "detailed";
  onContact?: (provider: Entity) => void;
  onViewProfile?: (provider: Entity) => void;
  className?: string;
}

export function ProviderCard({
  provider,
  variant = "default",
  onContact,
  onViewProfile,
  className = "",
}: ProviderCardProps) {
  const data = provider.data;

  // Get provider type styling - simplified for psychiatrists only
  const getProviderTypeBadge = () => {
    return { variant: "primary", label: "Psychiatrist" };
  };

  const providerBadge = getProviderTypeBadge();

  // Render rating stars
  const renderRating = () => {
    if (!data.rating) return null;

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(data.rating) ? "fill-current text-yellow-400" : "text-neutral-500"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{data.rating}</span>
        <span className="text-sm text-neutral-700">({data.total_reviews} reviews)</span>
      </div>
    );
  };

  // Get session fee display - FIXED to match your schema
  const getSessionFeeDisplay = () => {
    if (!data.session_fee) return "Contact for pricing";

    const fees = data.session_fee;

    // Match your actual schema fields
    if (fees.initial_consultation) {
      return `${formatCurrency(fees.initial_consultation)}/initial`;
    }
    if (fees.follow_up) {
      return `${formatCurrency(fees.follow_up)}/follow-up`;
    }
    if (fees.medication_management) {
      return `${formatCurrency(fees.medication_management)}/session`;
    }

    return "Contact for pricing";
  };

  // Get specialty display names
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
      child_adolescent: "Child/Adolescent",
      geriatric: "Geriatric Psychiatry",
      forensic: "Forensic Psychiatry",
    };
    return (
      specialtyNames[specialty] ||
      specialty.charAt(0).toUpperCase() + specialty.slice(1).replace("_", " ")
    );
  };

  // Render different layouts based on variant
  if (variant === "detailed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Card
          className="group cursor-pointer transition-all duration-300 hover:shadow-xl"
          onClick={() => onViewProfile?.(provider)}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-600">
                <User className="h-8 w-8 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold transition-colors group-hover:text-blue-600">
                      {data.full_name}
                    </h3>
                    <p className="mb-2 text-sm text-neutral-800">{data.credentials}</p>

                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {providerBadge.label}
                      </Badge>
                    </div>

                    {/* Rating */}
                    {renderRating()}
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {/* Education & Experience */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-1 text-sm font-semibold text-neutral-900">
                      <GraduationCap className="h-4 w-4" />
                      Education & Experience
                    </h4>

                    {data.medical_school && (
                      <div className="text-sm">
                        <p className="font-medium">{data.medical_school}</p>
                      </div>
                    )}

                    {data.residency && (
                      <div className="text-sm text-neutral-800">
                        <p>Residency: {data.residency}</p>
                        {data.fellowship && <p>Fellowship: {data.fellowship}</p>}
                      </div>
                    )}
                  </div>

                  {/* Practice & Location */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-1 text-sm font-semibold text-neutral-900">
                      <MapPin className="h-4 w-4" />
                      Practice & Location
                    </h4>

                    {data.practice_name && (
                      <div className="text-sm font-medium">{data.practice_name}</div>
                    )}

                    {data.address && (
                      <div className="text-sm text-neutral-800">
                        <p>{data.address.street}</p>
                        <p>
                          {data.address.city}, {data.address.state} {data.address.zip}
                        </p>
                      </div>
                    )}

                    {data.languages && data.languages.length > 1 && (
                      <div className="flex items-center gap-1 text-sm text-neutral-800">
                        <Globe className="h-3 w-3" />
                        <span>{data.languages.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {/* Specialties & Insurance */}
                  <div className="space-y-3">
                    {/* Specialties */}
                    {data.specialties && data.specialties.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-neutral-900">Specialties</h4>
                        <div className="flex flex-wrap gap-1">
                          {data.specialties.slice(0, 3).map((specialty: string, idx: number) => (
                            <Badge key={idx} variant="outline" size="sm">
                              {getSpecialtyDisplayName(specialty)}
                            </Badge>
                          ))}
                          {data.specialties.length > 3 && (
                            <Badge variant="outline" size="sm">
                              +{data.specialties.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Insurance */}
                    {data.insurance_accepted && data.insurance_accepted.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold text-neutral-900">
                          <Shield className="h-4 w-4" />
                          Insurance
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {data.insurance_accepted
                            .slice(0, 2)
                            .map((insurance: string, idx: number) => (
                              <Badge key={idx} variant="outline" size="sm">
                                {insurance}
                              </Badge>
                            ))}
                          {data.insurance_accepted.length > 2 && (
                            <Badge variant="outline" size="sm">
                              +{data.insurance_accepted.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio Preview */}
                {data.bio && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="mb-2 text-sm font-semibold text-neutral-900">About</h4>
                    <p className="line-clamp-2 text-sm text-neutral-800">{data.bio}</p>
                  </div>
                )}

                {/* Online Presence */}
                {data.online_presence && Object.values(data.online_presence).some((val) => {
                  if (Array.isArray(val)) return val.length > 0;
                  return val !== null && val !== undefined;
                }) && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold text-neutral-900">
                      <Globe className="h-4 w-4" />
                      Online Presence
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.online_presence.website && (
                        <a
                          href={data.online_presence.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-blue-600"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Website
                        </a>
                      )}
                      {data.online_presence.linkedin && (
                        <a
                          href={data.online_presence.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-blue-600"
                        >
                          <Linkedin className="h-3.5 w-3.5" />
                          LinkedIn
                        </a>
                      )}
                      {data.online_presence.academic_profile && (
                        <a
                          href={data.online_presence.academic_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-blue-600"
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          Academic Profile
                        </a>
                      )}
                      {data.online_presence.practice_profile && (
                        <a
                          href={data.online_presence.practice_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-blue-600"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          Practice Profile
                        </a>
                      )}
                      {data.online_presence.other_links?.map((link: { url: string; label: string }, idx: number) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-blue-600"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3 border-t pt-4">
                  <Button
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile?.(provider);
                    }}
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Default and compact variants (grid view)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card
        className="group h-full cursor-pointer transition-all duration-300 hover:shadow-xl"
        onClick={() => onViewProfile?.(provider)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-1 items-start space-x-3">
              {/* Avatar */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-600">
                <User className="h-6 w-6 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg transition-colors group-hover:text-blue-600">
                  {data.full_name}
                </CardTitle>
                <p className="mb-2 text-sm text-neutral-800">{data.credentials}</p>

                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="primary" size="sm">
                    {providerBadge.label}
                  </Badge>
                </div>

                {/* Rating */}
                {renderRating()}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {variant !== "compact" && (
            <>
              {/* Education & Training */}
              <div className="space-y-2">
                {data.medical_school && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-neutral-700" />
                    <span className="font-medium">{data.medical_school}</span>
                  </div>
                )}

                {data.residency && (
                  <div className="flex items-start gap-2 text-sm text-neutral-800">
                    <GraduationCap className="mt-0.5 h-4 w-4 text-neutral-700" />
                    <div>
                      <p>Residency: {data.residency}</p>
                      {data.fellowship && <p>Fellowship: {data.fellowship}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Practice & Location */}
              {data.practice_name && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{data.practice_name}</span>
                </div>
              )}

              {data.address && (
                <div className="flex items-start gap-2 text-sm text-neutral-800">
                  <MapPin className="mt-0.5 h-4 w-4 text-neutral-700" />
                  <div>
                    <p>{data.address.street}</p>
                    <p>
                      {data.address.city}, {data.address.state} {data.address.zip}
                    </p>
                  </div>
                </div>
              )}

              {/* Specialties */}
              {data.specialties && data.specialties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-neutral-900">Specialties</h4>
                  <div className="flex flex-wrap gap-1">
                    {data.specialties.slice(0, 4).map((specialty: string, idx: number) => (
                      <Badge key={idx} variant="outline" size="sm">
                        {getSpecialtyDisplayName(specialty)}
                      </Badge>
                    ))}
                    {data.specialties.length > 4 && (
                      <Badge variant="outline" size="sm">
                        +{data.specialties.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Insurance */}
              {data.insurance_accepted && data.insurance_accepted.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-neutral-900">
                    <Shield className="h-4 w-4" />
                    Insurance
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {data.insurance_accepted.slice(0, 3).map((insurance: string, idx: number) => (
                      <Badge key={idx} variant="outline" size="sm">
                        {insurance}
                      </Badge>
                    ))}
                    {data.insurance_accepted.length > 3 && (
                      <Badge variant="outline" size="sm">
                        +{data.insurance_accepted.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Online Presence Links */}
          {data.online_presence && Object.values(data.online_presence).some((val) => {
            if (Array.isArray(val)) return val.length > 0;
            return val !== null && val !== undefined;
          }) && (
            <div className="flex flex-wrap gap-2">
              {data.online_presence.website && (
                <a
                  href={data.online_presence.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </a>
              )}
              {data.online_presence.linkedin && (
                <a
                  href={data.online_presence.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </a>
              )}
              {data.online_presence.academic_profile && (
                <a
                  href={data.online_presence.academic_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <GraduationCap className="h-3 w-3" />
                  Academic
                </a>
              )}
              {data.online_presence.practice_profile && (
                <a
                  href={data.online_presence.practice_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <Building2 className="h-3 w-3" />
                  Practice
                </a>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile?.(provider);
              }}
            >
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
