#!/usr/bin/env node
/**
 * GODZILLA ENGINE - Patient Tools Edition
 *
 * Transforms thin patient tool records into decision-intelligence content.
 * Focus: Clinical platforms with highest revenue potential.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const V3_DIR = 'data/resources/tools';

// ============================================================================
// GODZILLA CONTENT DATABASE
// Rich, decision-intelligence content for high-priority patient tools
// ============================================================================

const GODZILLA_CONTENT = {
  // === TOP TIER: Major Therapy Platforms ===

  "ableto": {
    one_liner: "AbleTo (now Optum Behavioral Health) provides employer-sponsored virtual therapy and coaching with licensed therapists, typically covered through health insurance benefits.",
    long_description: "AbleTo, acquired by Optum in 2021, is one of the largest virtual behavioral health platforms in the US, serving over 3 million members through employer health plans. The platform offers 8-week structured therapy programs combining weekly video sessions with a licensed therapist and weekly calls with a behavioral coach. Programs target anxiety, depression, stress, chronic pain, and substance use. Most members access AbleTo at no cost through employer benefits or health insurance. The evidence-based approach uses CBT and other validated techniques. Clinical studies show 50% improvement in depression and anxiety symptoms. Available nationwide with licensed therapists in all 50 states.",
    best_for: [
      "People whose employer offers AbleTo through health benefits",
      "Those seeking structured 8-week therapy programs for anxiety or depression",
      "People who want both therapy and coaching support",
      "Those looking for insurance-covered virtual mental health care"
    ],
    not_for: [
      "Those in crisis needing immediate emergency care (call 988)",
      "People without employer-sponsored access (not available direct-to-consumer)",
      "Those seeking medication management (therapy only)"
    ],
    faqs: [
      {
        q: "Is AbleTo free or covered by insurance?",
        a: "AbleTo is typically offered at no cost to employees through employer health benefits or insurance plans. You cannot sign up directly—access comes through your employer or health plan. Check with your HR department or insurance provider to see if AbleTo is included in your benefits."
      },
      {
        q: "How does AbleTo therapy work?",
        a: "AbleTo provides structured 8-week programs combining weekly 30-minute video sessions with a licensed therapist plus weekly check-in calls with a behavioral coach. Programs use evidence-based CBT techniques for anxiety, depression, stress, chronic pain, and substance use. After the initial program, maintenance sessions may be available."
      },
      {
        q: "Is AbleTo effective for anxiety and depression?",
        a: "Clinical studies show AbleTo members experience 50% average improvement in depression and anxiety symptoms. The structured program format with both therapy and coaching support leads to high completion rates. AbleTo is designed for mild to moderate symptoms—those with severe conditions may need more intensive care."
      },
      {
        q: "How is AbleTo different from BetterHelp or Talkspace?",
        a: "Unlike BetterHelp and Talkspace which are direct-to-consumer, AbleTo is accessed through employer benefits at no cost. AbleTo uses structured 8-week programs rather than ongoing unlimited therapy. It also includes coaching support alongside therapy. If your employer offers AbleTo, it's typically the most cost-effective option."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "moderate",
      primary_uses: ["Anxiety treatment", "Depression treatment", "Stress management", "Behavioral coaching"]
    },
    privacy: {
      grade: "A",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant as a covered entity through Optum. Enterprise-grade security."
    },
    pricing: {
      model: "insurance-covered",
      free_tier: false,
      starting_price: "Free through employer benefits",
      notes: "Typically no cost to employees. Access through employer health benefits or insurance only."
    },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "find-support"]
  },

  "cerebral": {
    one_liner: "Cerebral provides online psychiatry and therapy for anxiety, depression, ADHD, and insomnia with medication delivery to your door, starting at $99/month after insurance.",
    long_description: "Cerebral is a telehealth psychiatry platform offering medication management, therapy, and care coordination for anxiety, depression, ADHD, and insomnia. The platform connects patients with licensed prescribers (psychiatrists, NPs, PAs) for video appointments and delivers medications directly to your home. Therapy is available as an add-on with licensed therapists. Cerebral accepts most major insurance plans, with out-of-pocket costs typically $99-299/month depending on services. Available in most US states. Note: Cerebral faced scrutiny in 2022 over ADHD prescribing practices and has since implemented additional safeguards. The company no longer prescribes controlled substances for ADHD to new patients in some states.",
    best_for: [
      "People seeking medication management for anxiety or depression",
      "Those who want prescriptions delivered to their door",
      "People whose insurance covers telehealth psychiatry",
      "Those looking for combined medication and therapy"
    ],
    not_for: [
      "Those seeking new ADHD controlled substance prescriptions (limited availability)",
      "People needing in-person psychiatric evaluation",
      "Those in crisis requiring emergency care (call 988)"
    ],
    faqs: [
      {
        q: "How much does Cerebral cost with insurance?",
        a: "With insurance, Cerebral medication management typically costs $0-99/month depending on your plan. Without insurance, medication management is $99/month and therapy sessions are $199/month. Medication costs are separate and vary. The first month often includes an assessment fee of $49-99."
      },
      {
        q: "Does Cerebral prescribe controlled substances for ADHD?",
        a: "Cerebral's ADHD prescribing policies have changed significantly since 2022. New patients seeking controlled substance ADHD medications face restrictions in many states. Cerebral now focuses primarily on anxiety, depression, and insomnia prescribing. Check current availability for your state before signing up."
      },
      {
        q: "Is Cerebral legitimate and safe?",
        a: "Cerebral is a licensed telehealth provider with prescribers in most states. The company faced DEA and FTC investigations in 2022-2023 regarding prescribing practices, leading to policy changes. Current practices include more thorough evaluations and prescribing restrictions for controlled substances. Read recent reviews before signing up."
      },
      {
        q: "How does Cerebral compare to Done or Talkiatry?",
        a: "Cerebral offers broader condition coverage (anxiety, depression, insomnia) while Done focused primarily on ADHD. Talkiatry provides more traditional psychiatry with longer appointments but higher costs. Cerebral's advantage is medication delivery and lower monthly costs with insurance."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "moderate",
      primary_uses: ["Psychiatric medication management", "Anxiety treatment", "Depression treatment", "Insomnia treatment"]
    },
    privacy: {
      grade: "B+",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant telehealth. Past privacy concerns addressed. BAA available."
    },
    pricing: {
      model: "subscription",
      free_tier: false,
      starting_price: "$99/month (medication management)",
      notes: "Insurance accepted. Medication costs separate. Therapy add-on $199/month."
    },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "insomnia-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "find-support"]
  },

  "lyra-health": {
    one_liner: "Lyra Health provides employer-sponsored mental health benefits with access to top-tier therapists, coaches, and psychiatrists—typically free for employees.",
    long_description: "Lyra Health is a premium employer-sponsored mental health benefits platform used by companies like Meta, Uber, Starbucks, and Morgan Stanley. Unlike traditional EAPs, Lyra provides access to a curated network of therapists credentialed for evidence-based care (CBT, DBT, ACT). Members get unlimited therapy sessions covered by their employer, plus self-guided digital programs, coaching, and medication management. Lyra's matching algorithm considers clinical needs, preferences, and therapist specialties. The platform reports that 87% of members improve within 12 weeks. Lyra serves over 15 million employees globally. Access is only through participating employers—not available direct-to-consumer.",
    best_for: [
      "Employees at companies that offer Lyra benefits (typically large employers)",
      "Those seeking high-quality therapists vetted for evidence-based care",
      "People who want unlimited therapy covered by employer",
      "Those needing specialized care (trauma, LGBTQ+, eating disorders)"
    ],
    not_for: [
      "Those without employer-sponsored Lyra access (not available to purchase directly)",
      "People in immediate crisis (call 988)",
      "Those whose employer offers a different mental health benefit"
    ],
    faqs: [
      {
        q: "How do I know if my employer offers Lyra Health?",
        a: "Check with your HR department or benefits portal. Major employers using Lyra include Meta, Uber, eBay, Starbucks, Morgan Stanley, Zoom, and Amgen. If your employer offers Lyra, you can sign up at care.lyrahealth.com with your work email."
      },
      {
        q: "Is Lyra Health free for employees?",
        a: "Yes, Lyra is typically completely free for employees whose employers offer it. Most employers cover unlimited therapy sessions, coaching, and digital programs. Some plans also cover family members. Check your specific benefits for details on session limits and family coverage."
      },
      {
        q: "How is Lyra different from an EAP?",
        a: "Traditional EAPs offer 3-8 sessions with limited provider networks. Lyra provides unlimited sessions with therapists specifically credentialed for evidence-based care. Lyra's network is highly selective—accepting only 2% of applicants. The matching process considers clinical needs, not just location and availability."
      },
      {
        q: "What conditions does Lyra treat?",
        a: "Lyra treats anxiety, depression, PTSD, relationship issues, grief, work stress, ADHD, eating disorders, and more. The network includes specialists for specific populations (LGBTQ+, new parents, teens). Medication management is available through Lyra's psychiatrist network. Severe conditions may require referral to intensive care."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "high",
      primary_uses: ["Evidence-based therapy", "Workplace mental health", "Depression treatment", "Anxiety treatment"]
    },
    privacy: {
      grade: "A",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant. Employers cannot see individual utilization data. SOC 2 Type II certified."
    },
    pricing: {
      model: "insurance-covered",
      free_tier: false,
      starting_price: "Free through employer",
      notes: "Available only through employer benefits. Employers pay per-employee-per-month."
    },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "post-traumatic-stress-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "trauma-ptsd", "find-support"]
  },

  "headway": {
    one_liner: "Headway helps you find therapists and psychiatrists who accept your insurance, with typical copays of $0-30 per session.",
    long_description: "Headway is a platform that connects patients with therapists and psychiatrists who accept their health insurance. Unlike subscription-based services, Headway enables providers to bill your insurance directly, so you only pay your copay (typically $0-30). The network includes 35,000+ licensed therapists and prescribers across most US states. Search by insurance, location, specialty, and availability. Book appointments online with next-day availability common. Headway handles insurance verification, billing, and claims. Particularly valuable for those with insurance that covers mental health but struggle to find in-network providers accepting new patients.",
    best_for: [
      "People with health insurance seeking in-network therapy",
      "Those frustrated finding therapists who accept their insurance",
      "People who want to use insurance benefits rather than pay out-of-pocket",
      "Those seeking both therapy and psychiatric medication management"
    ],
    not_for: [
      "Those without health insurance (try Open Path Collective or sliding scale options)",
      "People in immediate crisis (call 988)",
      "Those whose insurance isn't accepted (check coverage first)"
    ],
    faqs: [
      {
        q: "Is Headway free to use?",
        a: "Headway is free to search and book—you only pay your insurance copay, typically $0-30 per session depending on your plan. There's no subscription fee or platform fee. You pay the same as any in-network provider visit."
      },
      {
        q: "What insurance does Headway accept?",
        a: "Headway works with most major insurers including Aetna, Cigna, UnitedHealthcare, Blue Cross Blue Shield, Anthem, Oscar, and Medicare. Coverage varies by state and plan. Enter your insurance details on Headway to see available providers in your network."
      },
      {
        q: "How is Headway different from BetterHelp or Talkspace?",
        a: "BetterHelp and Talkspace charge monthly subscriptions ($60-100/week) regardless of insurance. Headway providers bill your insurance directly, so you only pay your copay. If you have insurance with mental health coverage, Headway is typically much more affordable."
      },
      {
        q: "How quickly can I get an appointment through Headway?",
        a: "Many Headway providers have next-day or same-week availability. The platform shows real-time availability and allows instant booking. This is often faster than calling in-network providers directly, as Headway aggregates availability across their network."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "moderate",
      primary_uses: ["Insurance-based therapy access", "Therapist matching", "Psychiatric care access"]
    },
    privacy: {
      grade: "A",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant. Functions as a healthcare platform connecting you with licensed providers."
    },
    pricing: {
      model: "insurance-covered",
      free_tier: true,
      starting_price: "$0-30 copay",
      notes: "No platform fee. You pay your insurance copay only. Copay varies by plan."
    },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "grow-therapy": {
    one_liner: "Grow Therapy connects you with therapists who accept your insurance, with most patients paying $0-30 copays for video or in-person sessions.",
    long_description: "Grow Therapy is a mental health platform that matches patients with licensed therapists who accept their insurance. The network includes 10,000+ therapists offering video, phone, and in-person sessions across 34+ states. Grow Therapy handles insurance verification and billing, so you only pay your copay (typically $0-30). The platform emphasizes therapist quality, with a selective admissions process and ongoing quality monitoring. Search by insurance, specialty (anxiety, depression, trauma, LGBTQ+, couples), and session type. Many therapists have same-week availability. Particularly strong in supporting underserved communities with diverse provider representation.",
    best_for: [
      "People with health insurance looking for in-network therapists",
      "Those who want both video and in-person therapy options",
      "People seeking diverse therapists (BIPOC, LGBTQ+ affirming)",
      "Those who want insurance to cover therapy costs"
    ],
    not_for: [
      "Those without health insurance (explore sliding scale options)",
      "People needing psychiatric medication (therapy only)",
      "Those in immediate crisis (call 988)"
    ],
    faqs: [
      {
        q: "How much does Grow Therapy cost?",
        a: "You pay your insurance copay only, typically $0-30 per session. There's no subscription fee or platform charge. If you don't have insurance, some Grow Therapy providers offer sliding scale rates. Check your benefits for mental health coverage details."
      },
      {
        q: "What insurance does Grow Therapy accept?",
        a: "Grow Therapy works with most major insurers including Aetna, Cigna, UnitedHealthcare, Blue Cross Blue Shield, Humana, and many state Medicaid plans. Coverage varies by state. Enter your insurance information to see in-network providers."
      },
      {
        q: "Does Grow Therapy offer in-person therapy?",
        a: "Yes, unlike many telehealth platforms, Grow Therapy includes therapists who offer both video and in-person sessions. Filter your search by session type and location to find in-person options near you."
      },
      {
        q: "How is Grow Therapy different from Headway?",
        a: "Both connect you with insurance-accepting therapists. Grow Therapy emphasizes therapist quality with a selective network and offers in-person options. Headway has a larger network. Try both to see provider availability in your area and specialty needs."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "moderate",
      primary_uses: ["Insurance-based therapy", "Individual therapy", "Couples therapy", "Trauma therapy"]
    },
    privacy: {
      grade: "A",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant platform. Licensed therapists maintain standard confidentiality practices."
    },
    pricing: {
      model: "insurance-covered",
      free_tier: true,
      starting_price: "$0-30 copay",
      notes: "No platform fee. Insurance copay only. Some providers offer sliding scale for uninsured."
    },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "post-traumatic-stress-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression", "trauma-ptsd"]
  },

  "monument": {
    one_liner: "Monument provides online alcohol treatment with therapy, medication, and peer support—covered by most insurance or $249/month without.",
    long_description: "Monument is a comprehensive online platform for changing your relationship with alcohol. The platform offers multiple levels of care: therapy with alcohol-specialized therapists, medication management (naltrexone, acamprosate) through licensed physicians, anonymous peer support groups, and self-guided tools. Treatment is personalized based on your drinking patterns and goals—Monument supports both moderation and abstinence approaches. Most commercial insurance covers Monument with $0-50 copays. Without insurance, therapy is $249/month, physician consultations start at $49. Medication is prescribed and shipped through partner pharmacies. Clinical studies show 53% of Monument members achieve their drinking goals.",
    best_for: [
      "People wanting to reduce or stop drinking with professional support",
      "Those interested in medication-assisted treatment for alcohol (naltrexone)",
      "People who prefer online treatment over in-person AA or rehab",
      "Those whose insurance covers substance use treatment"
    ],
    not_for: [
      "People requiring medical detox (severe alcohol dependence)",
      "Those in immediate medical crisis from alcohol withdrawal",
      "People seeking treatment for other substances (alcohol focus only)"
    ],
    faqs: [
      {
        q: "Does Monument prescribe naltrexone for alcohol?",
        a: "Yes, Monument physicians can prescribe naltrexone (Vivitrol oral) and other FDA-approved alcohol medications. After a medical evaluation ($49-99), medication is prescribed and shipped from a partner pharmacy. Medication is often covered by insurance with typical costs of $20-50/month."
      },
      {
        q: "How much does Monument cost with insurance?",
        a: "Most commercial insurance covers Monument with copays of $0-50 per service. Without insurance: therapy is $249/month, physician consultations $49-99, peer groups free. Check your benefits for substance use coverage—Monument handles insurance verification."
      },
      {
        q: "Is Monument for people who want to quit completely or just cut back?",
        a: "Monument supports both goals. Their approach is harm reduction—working toward whatever relationship with alcohol you want. Some members aim for complete sobriety, others for moderation. Treatment is personalized to your goals and adjusted based on progress."
      },
      {
        q: "How is Monument different from AA or traditional rehab?",
        a: "Monument is fully online and private—no in-person meetings required. It combines therapy, medication, and peer support in one platform. Unlike AA, Monument offers medical treatment and licensed therapy. Unlike residential rehab, you continue daily life while in treatment."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "high",
      primary_uses: ["Alcohol use disorder treatment", "Medication-assisted treatment", "Alcohol moderation", "Harm reduction"]
    },
    privacy: {
      grade: "A",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant. Substance use treatment has enhanced privacy protections under 42 CFR Part 2."
    },
    pricing: {
      model: "subscription",
      free_tier: true,
      starting_price: "$249/month (therapy) or insurance copay",
      notes: "Insurance covers most services. Peer support groups are free. Medication costs extra."
    },
    conditions: ["alcohol-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "teladoc-health": {
    one_liner: "Teladoc offers 24/7 video therapy and psychiatry with typical wait times under 5 minutes, covered by most insurance plans.",
    long_description: "Teladoc (including BetterHelp through acquisition) is the largest telehealth platform in the US, serving over 80 million members through employer and insurance plans. Mental health services include on-demand therapy, scheduled ongoing therapy, and psychiatry for medication management. Teladoc therapists and psychiatrists are available 24/7, with average wait times under 5 minutes for on-demand care. Most members access Teladoc through employer benefits or insurance with $0-75 copays. Self-pay options available starting at $99/visit. The platform treats anxiety, depression, ADHD, bipolar disorder, PTSD, and more. Available nationwide with licensed providers in all 50 states.",
    best_for: [
      "People whose insurance or employer offers Teladoc benefits",
      "Those needing quick access to mental health care (24/7 availability)",
      "People seeking both therapy and psychiatric medication management",
      "Those who travel frequently and need consistent provider access"
    ],
    not_for: [
      "Those in life-threatening crisis (call 911 or 988)",
      "People preferring in-person appointments",
      "Those without insurance or employer benefits (self-pay is expensive)"
    ],
    faqs: [
      {
        q: "Is Teladoc therapy covered by my insurance?",
        a: "Most commercial insurance and employer plans cover Teladoc mental health services. Check your benefits portal or call the number on your insurance card. Typical copays are $0-75 per visit. Many employers offer Teladoc at no cost as a benefit."
      },
      {
        q: "How quickly can I see a Teladoc therapist?",
        a: "Teladoc offers both on-demand and scheduled visits. On-demand therapy typically connects you within 5-15 minutes. Scheduled visits with a consistent therapist are available within 1-2 weeks. Psychiatry appointments typically require scheduling."
      },
      {
        q: "Does Teladoc prescribe ADHD medication?",
        a: "Teladoc psychiatrists can prescribe ADHD medications including controlled substances in most states, though policies vary. Initial evaluations are required before prescribing. Teladoc follows DEA telehealth prescribing guidelines and state regulations."
      },
      {
        q: "How is Teladoc different from BetterHelp?",
        a: "Teladoc acquired BetterHelp in 2022. Teladoc typically comes through employer/insurance benefits with copay-based pricing. BetterHelp is direct-to-consumer with subscription pricing. If your employer offers Teladoc, that's usually the more affordable option."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "high",
      primary_uses: ["Telehealth therapy", "Online psychiatry", "Mental health urgent care", "Medication management"]
    },
    privacy: {
      grade: "A",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant. NYSE-listed company with enterprise-grade security. SOC 2 certified."
    },
    pricing: {
      model: "insurance-covered",
      free_tier: false,
      starting_price: "$0-75 copay with insurance",
      notes: "Most access through employer/insurance. Self-pay starts at $99/visit for therapy, $199 for psychiatry."
    },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "attention-deficit-hyperactivity-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression", "focus-adhd"]
  },

  "mdlive": {
    one_liner: "MDLIVE provides video psychiatry and therapy appointments, often available within 24 hours, covered by most major insurance plans.",
    long_description: "MDLIVE (owned by Cigna/Evernorth) offers telehealth psychiatry and therapy across 50 states. The platform connects patients with board-certified psychiatrists for medication management and licensed therapists for ongoing counseling. MDLIVE specializes in treating anxiety, depression, PTSD, bipolar disorder, and other mental health conditions. Appointments are typically available within 24-48 hours, with some same-day availability. Most major insurance plans cover MDLIVE, including Cigna, Aetna, BCBS, and United. Self-pay options available for those without coverage. MDLIVE psychiatrists can prescribe most psychiatric medications including controlled substances where state law permits.",
    best_for: [
      "People with Cigna insurance (MDLIVE is owned by Cigna parent company)",
      "Those needing quick access to a psychiatrist (vs. 6-week waits)",
      "People seeking medication management for mental health conditions",
      "Those whose insurance covers telehealth psychiatry"
    ],
    not_for: [
      "Those requiring in-person evaluation or testing",
      "People in psychiatric emergency (call 988 or go to ER)",
      "Those without insurance seeking affordable care (try Cerebral or Brightside)"
    ],
    faqs: [
      {
        q: "How much does MDLIVE psychiatry cost?",
        a: "With insurance, MDLIVE psychiatry visits typically cost $0-75 copay depending on your plan. Cigna members often have $0 copays. Without insurance, psychiatry visits are $284 and therapy is $108-129. Check your plan's telehealth benefits for exact costs."
      },
      {
        q: "Can MDLIVE prescribe anxiety medication?",
        a: "Yes, MDLIVE psychiatrists can prescribe anxiety medications including SSRIs, SNRIs, buspirone, and in some cases benzodiazepines. Controlled substance prescribing follows DEA telehealth rules and varies by state. Initial visits include a thorough psychiatric evaluation."
      },
      {
        q: "How quickly can I get an MDLIVE psychiatry appointment?",
        a: "MDLIVE psychiatry appointments are typically available within 24-48 hours, significantly faster than traditional in-person psychiatry wait times of 4-8 weeks. Some same-day appointments available. Therapy appointments also have quick availability."
      },
      {
        q: "Is MDLIVE part of Cigna?",
        a: "Yes, MDLIVE is owned by Evernorth, which is Cigna's health services company. Cigna members often have MDLIVE included in their benefits with $0 copays for behavioral health. But MDLIVE also accepts most other major insurance plans."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "moderate",
      primary_uses: ["Online psychiatry", "Medication management", "Telehealth therapy", "Mental health treatment"]
    },
    privacy: {
      grade: "A",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant. Owned by Cigna/Evernorth with enterprise healthcare security standards."
    },
    pricing: {
      model: "insurance-covered",
      free_tier: false,
      starting_price: "$0-75 copay with insurance",
      notes: "Cigna members often $0 copay. Self-pay: $284 psychiatry, $108-129 therapy."
    },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "bipolar-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression", "serious-mental-illness"]
  },

  "ginger": {
    one_liner: "Ginger (now Headspace Health) provides employer-sponsored mental health care with text-based coaching, video therapy, and psychiatry.",
    long_description: "Ginger merged with Headspace in 2021 to form Headspace Health, creating a comprehensive mental health platform for employers. The service offers on-demand text coaching available 24/7, video therapy sessions with licensed therapists, and psychiatry for medication management. Most employer plans include unlimited coaching with video therapy and psychiatry at no additional cost. Ginger's AI-powered system helps match members to the right level of care. Clinical studies show 69% of members with moderate-severe anxiety see improvement. Available through 400+ employers covering millions of employees. Check if your employer offers Headspace Health/Ginger benefits.",
    best_for: [
      "Employees at companies offering Ginger/Headspace Health benefits",
      "Those who want 24/7 access to text-based coaching",
      "People seeking employer-covered therapy and psychiatry",
      "Those who want to start with coaching before committing to therapy"
    ],
    not_for: [
      "Those without employer-sponsored access (not available direct-to-consumer)",
      "People in immediate crisis (call 988)",
      "Those preferring in-person treatment"
    ],
    faqs: [
      {
        q: "Is Ginger free through my employer?",
        a: "If your employer offers Ginger/Headspace Health, it's typically free for employees. Most plans include unlimited text coaching plus 6-12 therapy/psychiatry sessions annually at no cost. Check with your HR department or benefits portal to confirm coverage."
      },
      {
        q: "What is Ginger coaching?",
        a: "Ginger coaching is on-demand text-based support available 24/7 with behavioral health coaches. Coaches help with stress, work-life balance, relationships, and general mental wellness. If you need clinical care, coaches can warm-transfer you to therapy or psychiatry."
      },
      {
        q: "Did Ginger merge with Headspace?",
        a: "Yes, Ginger and Headspace merged in 2021 to form Headspace Health. The combined platform offers Headspace's meditation content plus Ginger's coaching, therapy, and psychiatry. Employer benefits may be branded as either Ginger, Headspace, or Headspace Health."
      },
      {
        q: "How does Ginger compare to Lyra Health?",
        a: "Both are employer-sponsored platforms. Ginger offers unlimited 24/7 coaching as an entry point before therapy. Lyra focuses on high-quality therapy with a curated provider network. Some employers offer both. Coverage depends on which your employer has selected."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "high",
      primary_uses: ["Behavioral coaching", "Telehealth therapy", "Online psychiatry", "Workplace mental health"]
    },
    privacy: {
      grade: "A",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant. Employers see aggregate data only—not individual utilization. SOC 2 certified."
    },
    pricing: {
      model: "insurance-covered",
      free_tier: false,
      starting_price: "Free through employer",
      notes: "Employer-sponsored only. Employees typically pay nothing. Employers pay per-member-per-month."
    },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "find-support"]
  },

  "doctor-on-demand": {
    one_liner: "Doctor on Demand provides video psychiatry and therapy appointments, typically covered by insurance with $0-75 copays and same-day availability.",
    long_description: "Doctor on Demand offers telehealth psychiatry and therapy through video appointments with licensed providers. The platform treats anxiety, depression, PTSD, bipolar disorder, insomnia, and other mental health conditions. Psychiatrists can prescribe medications including controlled substances where state law permits. Most major insurance plans cover Doctor on Demand, and many employer health plans include it as a benefit. Self-pay rates are $299 for psychiatry and $129-179 for therapy. Appointments are often available same-day or within 24 hours. Doctor on Demand was acquired by Grand Rounds in 2022, forming a combined company called Included Health.",
    best_for: [
      "People with insurance covering telehealth psychiatry",
      "Those needing quick access to a psychiatrist (same-day often available)",
      "People seeking both therapy and medication management",
      "Employees whose companies offer Doctor on Demand benefits"
    ],
    not_for: [
      "Those in psychiatric crisis (call 988 or go to ER)",
      "People requiring in-person evaluation or testing",
      "Those seeking lowest-cost self-pay options"
    ],
    faqs: [
      {
        q: "How much does Doctor on Demand psychiatry cost?",
        a: "With insurance, expect $0-75 copay for psychiatry visits. Self-pay is $299 for psychiatry and $129-179 for therapy. Many employers include Doctor on Demand in health benefits at no cost. Check your insurance portal for telehealth mental health coverage."
      },
      {
        q: "Can Doctor on Demand prescribe anxiety medication?",
        a: "Yes, Doctor on Demand psychiatrists can prescribe anxiety medications including SSRIs, SNRIs, buspirone, and in some cases controlled substances. Prescribing follows state regulations and DEA telehealth guidelines. Initial evaluation required."
      },
      {
        q: "How quickly can I see a Doctor on Demand psychiatrist?",
        a: "Many psychiatry appointments are available same-day or within 24-48 hours—much faster than traditional psychiatry wait times of 4-12 weeks. Therapy appointments also have quick availability. Check the app for current openings."
      },
      {
        q: "Is Doctor on Demand part of Included Health?",
        a: "Yes, Doctor on Demand merged with Grand Rounds in 2022 to form Included Health. Services continue under the Doctor on Demand brand for telehealth. Included Health offers additional healthcare navigation services through employers."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Online psychiatry", "Telehealth therapy", "Medication management"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant telehealth platform." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$0-75 copay with insurance", notes: "Self-pay: $299 psychiatry, $129-179 therapy." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "bipolar-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "thriveworks": {
    one_liner: "Thriveworks offers in-person and video therapy with licensed counselors across 40+ states, accepting most major insurance plans.",
    long_description: "Thriveworks is a national mental health provider network with 340+ locations across 40+ states offering both in-person and video therapy. The network includes licensed therapists, psychologists, and psychiatrists treating anxiety, depression, trauma, relationships, and more. Thriveworks accepts most major insurance plans including Aetna, Cigna, BCBS, UnitedHealthcare, and Medicare. Same-week appointments are typically available, and you're matched with a provider based on your needs and preferences. The company emphasizes accessibility with evening and weekend appointments. Self-pay rates start at $99-200 per session depending on provider type and location.",
    best_for: [
      "People wanting the option of in-person or video therapy",
      "Those with insurance looking for in-network providers",
      "People who need evening or weekend appointment times",
      "Those seeking a consistent therapist relationship long-term"
    ],
    not_for: [
      "Those in immediate crisis (call 988)",
      "People without insurance seeking lowest-cost options",
      "Those in states where Thriveworks doesn't have locations"
    ],
    faqs: [
      {
        q: "Does Thriveworks accept my insurance?",
        a: "Thriveworks accepts most major insurance including Aetna, Cigna, BCBS, UnitedHealthcare, Humana, Tricare, and Medicare. Coverage varies by location. Enter your insurance on their website to verify coverage and find in-network providers near you."
      },
      {
        q: "Does Thriveworks offer in-person therapy?",
        a: "Yes, Thriveworks has 340+ physical locations across 40+ states offering in-person therapy. You can also choose video sessions. Many clients alternate between in-person and video depending on their schedule. Check location availability in your area."
      },
      {
        q: "How much does Thriveworks cost without insurance?",
        a: "Self-pay rates are $99-200 per session depending on provider type (therapist vs psychologist vs psychiatrist) and location. Sliding scale may be available. With insurance, you pay your standard copay, typically $20-50."
      },
      {
        q: "How is Thriveworks different from BetterHelp?",
        a: "Thriveworks offers both in-person and video therapy with insurance billing, while BetterHelp is online-only with subscription pricing. If you have insurance and want in-person options, Thriveworks is often more affordable. BetterHelp is simpler for those preferring text-based support."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["In-person therapy", "Video therapy", "Couples counseling", "Psychiatry"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare provider." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$20-50 copay with insurance", notes: "Self-pay $99-200 per session. Most insurances accepted." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "relationship-issues"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "alma": {
    one_liner: "Alma helps you find therapists who accept your insurance, with most sessions costing just your copay of $0-50.",
    long_description: "Alma is a platform connecting patients with therapists who accept health insurance. The network includes thousands of licensed therapists across most US states specializing in anxiety, depression, trauma, LGBTQ+ issues, and more. Alma handles insurance verification and billing so you only pay your copay (typically $0-50). Search by insurance, location, specialty, and availability. Many providers have same-week openings. Alma also supports providers who offer out-of-network services by helping with superbill generation for potential reimbursement. The platform is known for its diverse provider network and focus on underserved communities.",
    best_for: [
      "People with health insurance seeking affordable therapy",
      "Those looking for diverse or LGBTQ+ affirming therapists",
      "People frustrated by therapists not accepting their insurance",
      "Those who want video therapy billed to insurance"
    ],
    not_for: [
      "Those without health insurance (explore Open Path Collective)",
      "People needing medication management (therapy focus)",
      "Those in crisis requiring emergency care (call 988)"
    ],
    faqs: [
      {
        q: "Is Alma free to use?",
        a: "Alma is free to search and book—you only pay your insurance copay, typically $0-50 per session. There's no platform fee or subscription. Some providers also offer out-of-network services with superbills for potential reimbursement."
      },
      {
        q: "What insurance does Alma accept?",
        a: "Alma providers accept most major insurance including Aetna, Cigna, BCBS, UnitedHealthcare, Oxford, Oscar, and many state Medicaid plans. Coverage varies by provider and state. Enter your insurance details to see in-network options."
      },
      {
        q: "How is Alma different from Headway?",
        a: "Both connect patients with insurance-accepting therapists. Alma is known for provider diversity and LGBTQ+ affirming care. Headway has a larger overall network. Both are free to use—you only pay your copay. Try both to compare available providers."
      },
      {
        q: "Does Alma offer psychiatry?",
        a: "Alma focuses primarily on therapy rather than psychiatry. If you need medication management, consider platforms like Cerebral, Teladoc, or Headway which include psychiatric providers. Alma therapists can coordinate with external prescribers."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Insurance-based therapy", "Therapist matching", "LGBTQ+ affirming care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant platform connecting patients with licensed therapists." },
    pricing: { model: "insurance-covered", free_tier: true, starting_price: "$0-50 copay", notes: "No platform fee. Insurance copay only. Out-of-network superbills available." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "post-traumatic-stress-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression", "trauma-ptsd"]
  },

  "charlie-health-iop": {
    one_liner: "Charlie Health provides virtual intensive outpatient programs (IOP) for teens and young adults with serious mental health needs, often covered by insurance.",
    long_description: "Charlie Health offers virtual intensive outpatient programs (IOP) and partial hospitalization programs (PHP) for adolescents, teens, and young adults (ages 11-30) dealing with serious mental health challenges. Programs address depression, anxiety, trauma, suicidal ideation, self-harm, eating disorders, and substance use. Treatment includes 3+ hours daily of group therapy, individual therapy, and family sessions—all via secure video. Most commercial insurance covers Charlie Health, with many families paying $0 out-of-pocket. The model fills the gap between weekly outpatient therapy and residential treatment. Clinicians are licensed in all 50 states with specialized training in adolescent and young adult care.",
    best_for: [
      "Teens and young adults needing more than weekly therapy",
      "Families seeking insurance-covered intensive outpatient programs",
      "Those stepping down from inpatient/residential treatment",
      "Parents of teens struggling with depression, self-harm, or eating disorders"
    ],
    not_for: [
      "Those in acute psychiatric crisis requiring hospitalization",
      "Adults over 30 (program focuses on youth)",
      "Those who cannot commit to 3+ hours daily of treatment"
    ],
    faqs: [
      {
        q: "What is Charlie Health IOP?",
        a: "Charlie Health IOP (Intensive Outpatient Program) provides 9-15 hours per week of virtual group therapy, individual therapy, and family sessions for teens and young adults. It's more intensive than weekly therapy but allows you to stay home and continue school/work. Programs typically last 8-12 weeks."
      },
      {
        q: "Is Charlie Health covered by insurance?",
        a: "Most commercial insurance covers Charlie Health IOP/PHP, and many families pay $0-50 per session. Charlie Health verifies benefits and handles insurance billing. Medicaid coverage varies by state. They also offer self-pay options for those without coverage."
      },
      {
        q: "What ages does Charlie Health treat?",
        a: "Charlie Health treats adolescents, teens, and young adults ages 11-30. Programs are tailored to developmental stages with separate groups for middle schoolers, high schoolers, and young adults. Family involvement is a core component of treatment."
      },
      {
        q: "What conditions does Charlie Health treat?",
        a: "Charlie Health treats depression, anxiety, trauma/PTSD, suicidal ideation, self-harm, eating disorders, substance use, and personality disorders. The IOP level is appropriate for moderate-severe symptoms not requiring 24-hour supervision."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Teen depression treatment", "Adolescent IOP", "Young adult mental health", "Family therapy"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Specialized privacy protections for minors." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$0-50 copay with insurance", notes: "Most commercial insurance covers IOP. Self-pay options available." },
    conditions: ["major-depressive-disorder", "generalized-anxiety-disorder", "post-traumatic-stress-disorder"],
    primary_hubs: ["mood-depression", "anxiety-stress", "trauma-ptsd", "find-support"]
  },

  "talkspace-psychiatry": {
    one_liner: "Talkspace Psychiatry provides online medication management for anxiety, depression, ADHD, and more, starting at $199/month or covered by insurance.",
    long_description: "Talkspace Psychiatry offers video appointments with licensed psychiatrists and psychiatric nurse practitioners for medication management. Conditions treated include anxiety, depression, ADHD, bipolar disorder, OCD, PTSD, and insomnia. Initial psychiatric evaluations are 60 minutes with 15-30 minute follow-ups. Prescriptions can be sent to your local pharmacy, including controlled substances where state law permits. Talkspace accepts many insurance plans with typical copays of $25-75. Self-pay is $199/month for medication management or $249/month when combined with unlimited messaging therapy. The platform now serves over 1 million users and partners with major employers.",
    best_for: [
      "Those needing psychiatry appointments faster than traditional wait times",
      "People wanting combined therapy and medication management",
      "Those whose insurance covers telehealth psychiatry",
      "People with anxiety, depression, or ADHD seeking medication"
    ],
    not_for: [
      "Those in psychiatric emergency (call 988)",
      "People requiring complex medication regimens needing in-person monitoring",
      "Those without stable internet for video appointments"
    ],
    faqs: [
      {
        q: "Can Talkspace psychiatrists prescribe controlled substances?",
        a: "Yes, Talkspace psychiatrists can prescribe controlled substances including ADHD medications and benzodiazepines where state law permits. Prescribing follows DEA telehealth guidelines. An initial psychiatric evaluation is required before any prescribing."
      },
      {
        q: "How much does Talkspace Psychiatry cost?",
        a: "With insurance, copays are typically $25-75 per visit. Self-pay is $199/month for medication management only or $249/month combined with unlimited messaging therapy. Initial evaluations may have additional fees. Check insurance coverage before signing up."
      },
      {
        q: "How quickly can I see a Talkspace psychiatrist?",
        a: "Initial psychiatric appointments are typically available within 1-2 weeks, much faster than traditional psychiatry wait times. Follow-up appointments can usually be scheduled within days. Emergency needs should go to local ER or call 988."
      },
      {
        q: "What's the difference between Talkspace Therapy and Psychiatry?",
        a: "Talkspace Therapy provides unlimited messaging plus video sessions with licensed therapists. Talkspace Psychiatry is for medication management with psychiatrists or psychiatric NPs. Many people use both: therapy for ongoing support and psychiatry for medication. Bundle pricing available."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Online psychiatry", "Medication management", "ADHD treatment", "Anxiety medication"] },
    privacy: { grade: "B+", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. NYSE-listed company." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$199/month or insurance copay", notes: "Insurance accepted. $249/month combined with therapy." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "attention-deficit-hyperactivity-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression", "focus-adhd"]
  },

  "zoom-for-healthcare": {
    one_liner: "Zoom for Healthcare is the HIPAA-compliant version of Zoom used by therapists and healthcare providers for telehealth appointments.",
    long_description: "Zoom for Healthcare is Zoom's HIPAA-compliant telehealth platform used by thousands of mental health providers for video therapy sessions. Unlike consumer Zoom, the healthcare version includes a Business Associate Agreement (BAA), enhanced security features, and compliance documentation required for medical use. Many therapists, psychiatrists, and healthcare systems use Zoom for Healthcare for patient appointments. If your therapist uses Zoom, they're likely using this HIPAA-compliant version. The platform supports waiting rooms, screen sharing for worksheets, and cloud recording (with consent). Patients join through a link—no account required.",
    best_for: [
      "Patients whose therapist uses Zoom for Healthcare",
      "Those comfortable with video-based therapy",
      "People who want easy access from any device (no app required)",
      "Healthcare providers seeking HIPAA-compliant telehealth"
    ],
    not_for: [
      "Those seeking to find a therapist (this is just video software)",
      "People without stable internet connection",
      "Providers needing integrated EHR features"
    ],
    faqs: [
      {
        q: "Is Zoom for Healthcare HIPAA compliant?",
        a: "Yes, Zoom for Healthcare is HIPAA compliant and includes a signed Business Associate Agreement (BAA). It has additional security features beyond consumer Zoom including encryption, access controls, and audit logs. Your therapist handles the compliance—you just join the call."
      },
      {
        q: "How is Zoom for Healthcare different from regular Zoom?",
        a: "Zoom for Healthcare includes a BAA for HIPAA compliance, enhanced security settings, and is sold specifically to healthcare organizations. As a patient, the experience is similar—you click a link to join. The compliance happens behind the scenes."
      },
      {
        q: "Do I need to pay for Zoom for Healthcare?",
        a: "No, patients don't pay for Zoom—your therapist or healthcare provider pays for the HIPAA-compliant license. You just need a device with a camera and internet connection. You can join from a browser or the free Zoom app."
      },
      {
        q: "Can I see any therapist through Zoom?",
        a: "Zoom for Healthcare is just video software—it doesn't connect you with therapists. To find a therapist who uses Zoom, try platforms like Headway, Alma, or Psychology Today. Many telehealth therapists use Zoom for sessions."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Video telehealth", "Remote therapy sessions", "HIPAA-compliant video calls"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant with BAA. SOC 2 Type II certified. End-to-end encryption available." },
    pricing: { model: "subscription", free_tier: false, starting_price: "Provider pays (free for patients)", notes: "Providers pay $12.49-18.32/month per license. Patients join for free." },
    conditions: [],
    primary_hubs: ["find-support"]
  },

  "doxy-me": {
    one_liner: "Doxy.me is a free, HIPAA-compliant telehealth platform used by thousands of therapists for video sessions—no download required.",
    long_description: "Doxy.me is one of the most popular telehealth platforms among mental health providers, offering HIPAA-compliant video sessions with a simple, browser-based interface. Unlike Zoom, patients don't need to download software—just click a link to join their therapist's virtual waiting room. The basic version is completely free for providers, making it accessible for solo practitioners. Features include a virtual waiting room, screen sharing, and session analytics. Over 1 million healthcare providers use Doxy.me globally. If your therapist sends you a Doxy.me link, you're using one of the most widely-trusted telehealth platforms in behavioral health.",
    best_for: [
      "Patients whose therapist uses Doxy.me for sessions",
      "Those who want simple browser-based video (no app to install)",
      "People with older devices or limited tech comfort",
      "Therapists seeking free HIPAA-compliant video"
    ],
    not_for: [
      "Those looking to find a therapist (this is just video software)",
      "People without internet access",
      "Providers needing integrated scheduling or billing"
    ],
    faqs: [
      {
        q: "Is Doxy.me HIPAA compliant?",
        a: "Yes, Doxy.me is HIPAA compliant and provides a BAA (Business Associate Agreement) to healthcare providers. The platform uses peer-to-peer video encryption. Your therapist is responsible for the compliance setup—you just join through the link they send."
      },
      {
        q: "Do I need to download anything for Doxy.me?",
        a: "No, Doxy.me is browser-based—just click the link your therapist sends and allow camera/microphone access. Works on Chrome, Safari, Firefox, and Edge. No account creation required for patients."
      },
      {
        q: "Is Doxy.me free for patients?",
        a: "Yes, patients never pay for Doxy.me. Therapists can use the basic version for free or pay for premium features. You just need a device with a camera and stable internet connection to join your session."
      },
      {
        q: "What if Doxy.me isn't working?",
        a: "Common fixes: use Chrome or Safari browser, ensure camera/mic permissions are allowed, check internet connection, disable VPN, or try a different device. Your therapist may have a backup option like phone if video fails."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Video telehealth", "Remote therapy", "HIPAA-compliant video calls"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant with BAA. Peer-to-peer encryption." },
    pricing: { model: "free", free_tier: true, starting_price: "Free", notes: "Free for both providers and patients. Premium tiers for providers add features." },
    conditions: [],
    primary_hubs: ["find-support"]
  },

  "amwell": {
    one_liner: "Amwell provides telehealth psychiatry and therapy covered by most major insurance plans, with appointments often available within days.",
    long_description: "Amwell is a leading telehealth platform offering psychiatry and therapy services across all 50 states. The platform connects patients with board-certified psychiatrists for medication management and licensed therapists for counseling. Amwell partners with major health systems and insurance plans, making it widely accessible through employer benefits. Services cover anxiety, depression, bipolar disorder, PTSD, ADHD, and other mental health conditions. Most insurance plans cover Amwell with standard copays. Self-pay options available. Appointments typically available within 3-7 days. The Amwell platform includes Amwell Psychiatric Care (formerly SilverCloud) for digital CBT programs.",
    best_for: [
      "People whose insurance or employer covers Amwell telehealth",
      "Those needing psychiatry appointments faster than traditional wait times",
      "People seeking combined medication management and therapy",
      "Those in health system networks that partner with Amwell"
    ],
    not_for: [
      "Those in psychiatric emergency (call 988 or go to ER)",
      "People requiring in-person evaluation",
      "Those without insurance seeking lowest-cost options"
    ],
    faqs: [
      {
        q: "Does my insurance cover Amwell psychiatry?",
        a: "Most major insurance plans cover Amwell, including BCBS, Cigna, Aetna, UnitedHealthcare, and many others. Copays are typically $20-75 depending on your plan. Check your insurance portal or call the member services number to confirm telehealth mental health coverage."
      },
      {
        q: "How quickly can I see an Amwell psychiatrist?",
        a: "Amwell psychiatry appointments are typically available within 3-7 days, much faster than traditional psychiatrist wait times of 4-12 weeks. Therapy appointments often have same-week availability. Log in to see real-time availability in your state."
      },
      {
        q: "Can Amwell prescribe controlled substances?",
        a: "Amwell psychiatrists can prescribe controlled substances where permitted by state law and DEA telehealth regulations. This includes ADHD medications and some anxiety medications. Initial evaluations are required, and ongoing care follows prescribing guidelines."
      },
      {
        q: "What's the difference between Amwell and Teladoc?",
        a: "Both are major telehealth platforms with insurance coverage. Amwell has stronger health system partnerships and is often embedded in hospital systems. Teladoc has broader employer coverage. Both offer similar psychiatry and therapy services. Check which your insurance/employer covers."
      }
    ],
    clinical_metadata: {
      evidence_based: true,
      evidence_level: "moderate",
      primary_uses: ["Telehealth psychiatry", "Online therapy", "Medication management", "Digital mental health"]
    },
    privacy: {
      grade: "A",
      hipaa_compliant: true,
      gdpr_compliant: true,
      data_sold: false,
      notes: "HIPAA compliant. NYSE-listed company with enterprise healthcare security. Partners with major health systems."
    },
    pricing: {
      model: "insurance-covered",
      free_tier: false,
      starting_price: "$20-75 copay with insurance",
      notes: "Most access through insurance. Self-pay available but pricing varies by service."
    },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "bipolar-disorder", "attention-deficit-hyperactivity-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression", "focus-adhd"]
  },

  // === DIGITAL THERAPEUTICS & DTx ===

  "big-health": {
    one_liner: "Big Health makes Sleepio and Daylight—FDA-cleared digital therapeutics for insomnia and anxiety, often free through employer or health plan benefits.",
    long_description: "Big Health develops FDA-cleared digital therapeutics including Sleepio (for insomnia) and Daylight (for anxiety). Both apps deliver clinically-validated cognitive behavioral therapy through interactive programs—not just meditation or tracking. Sleepio provides a 6-week CBT-I program proven to improve sleep in clinical trials. Daylight offers a CBT-based anxiety program developed by clinical psychologists. Most users access Big Health programs for free through employer benefits or health insurance. CVS, Express Scripts, and many large employers include Big Health. Clinical evidence shows 76% of Sleepio users achieve healthy sleep and 71% of Daylight users see anxiety improvement.",
    best_for: [
      "People with insomnia wanting evidence-based CBT-I (not just sleep hygiene tips)",
      "Those with anxiety seeking structured CBT programs",
      "Employees whose companies offer Big Health benefits",
      "People looking for self-paced digital therapy backed by clinical trials"
    ],
    not_for: [
      "Those with severe untreated mental health conditions (start with a therapist)",
      "People in crisis (call 988)",
      "Those without employer or insurance access (self-pay not available)"
    ],
    faqs: [
      {
        q: "Is Sleepio free?",
        a: "Sleepio is free if your employer or health plan offers it. Major partners include CVS Health, Express Scripts, and many Fortune 500 companies. Check with HR or your insurance benefits. Sleepio isn't currently available for individual purchase."
      },
      {
        q: "Is Sleepio FDA-cleared?",
        a: "Yes, Sleepio received FDA clearance as a prescription digital therapeutic (PDT) for chronic insomnia. It's one of few insomnia treatments with regulatory clearance. The program is based on CBT-I, the gold-standard insomnia treatment recommended by medical guidelines."
      },
      {
        q: "What is Daylight by Big Health?",
        a: "Daylight is Big Health's FDA-cleared digital therapeutic for anxiety. It delivers CBT techniques through interactive smartphone sessions. Clinical studies show 71% of users experience meaningful anxiety reduction. Like Sleepio, access is typically through employer or health plan benefits."
      },
      {
        q: "How does Sleepio compare to Calm or Headspace?",
        a: "Sleepio delivers structured CBT-I (cognitive behavioral therapy for insomnia)—an evidence-based treatment protocol. Calm and Headspace offer relaxation content but aren't treatment programs. If you have clinical insomnia, Sleepio's therapeutic approach is more targeted than meditation apps."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["CBT-I for insomnia", "Digital CBT for anxiety", "Sleep improvement"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. FDA-regulated digital therapeutic with strict privacy standards." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Free through employer/insurance", notes: "Not available for individual purchase. Access through benefits only." },
    conditions: ["insomnia-disorder", "generalized-anxiety-disorder"],
    primary_hubs: ["sleep", "anxiety-stress"]
  },

  "sleepio": {
    one_liner: "Sleepio is an FDA-cleared digital therapeutic delivering CBT-I (cognitive behavioral therapy for insomnia) through a 6-week app-based program.",
    long_description: "Sleepio is an FDA-cleared digital therapeutic from Big Health that delivers CBT-I (cognitive behavioral therapy for insomnia)—the gold-standard, first-line treatment for chronic insomnia. The 6-week program includes sleep restriction, stimulus control, cognitive restructuring, and relaxation techniques delivered through interactive sessions with an animated sleep expert. Clinical trials show 76% of users achieve healthy sleep. Sleepio also includes a sleep diary and personalized sleep schedule. Access is typically through employer benefits or health insurance—not direct purchase. Partners include CVS Health, Express Scripts, and major employers. If your insomnia persists despite sleep hygiene, Sleepio offers the same techniques as in-person CBT-I therapy.",
    best_for: [
      "People with chronic insomnia (trouble falling or staying asleep most nights)",
      "Those who've tried sleep hygiene tips without lasting improvement",
      "People interested in CBT-I but unable to access in-person specialists",
      "Employees whose companies offer Sleepio benefits"
    ],
    not_for: [
      "Those with untreated sleep apnea (get tested first)",
      "People who need immediate medication for severe insomnia",
      "Those without employer/insurance access to Sleepio"
    ],
    faqs: [
      {
        q: "Does Sleepio actually work?",
        a: "Yes, clinical trials published in peer-reviewed journals show 76% of Sleepio users achieve normal sleep. The program is based on CBT-I, which is recommended as first-line treatment for chronic insomnia by the American Academy of Sleep Medicine. Results are comparable to in-person CBT-I therapy."
      },
      {
        q: "How long does Sleepio take to work?",
        a: "The core program is 6 weeks with weekly sessions. Many users see improvement within 2-3 weeks, though sleep often gets temporarily worse during sleep restriction before improving. Full benefits typically appear by week 4-6."
      },
      {
        q: "Is Sleepio better than sleeping pills?",
        a: "Medical guidelines recommend CBT-I (what Sleepio delivers) as first-line treatment before medication. CBT-I addresses root causes while pills mask symptoms. CBT-I has no side effects and benefits persist after treatment ends—unlike medication dependence."
      },
      {
        q: "How do I get Sleepio?",
        a: "Check if your employer or health insurance covers Sleepio. Major partners include CVS Health, Express Scripts, and many large employers. Some health systems also prescribe Sleepio. Contact HR or check your benefits portal. Direct individual purchase isn't currently available."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Chronic insomnia treatment", "CBT-I delivery", "Sleep improvement"], clinical_trials: [{ study: "Published RCTs in JAMA Internal Medicine, Lancet Psychiatry" }] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant FDA-cleared digital therapeutic." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Free through employer/insurance", notes: "Requires employer or health plan coverage. Not available for self-pay." },
    conditions: ["insomnia-disorder"],
    primary_hubs: ["sleep"]
  },

  "daylight": {
    one_liner: "Daylight is an FDA-cleared app delivering CBT for anxiety through guided sessions, available free through many employer and insurance plans.",
    long_description: "Daylight by Big Health is an FDA-cleared digital therapeutic that delivers cognitive behavioral therapy (CBT) for generalized anxiety and worry. The app guides users through evidence-based techniques including cognitive restructuring, relaxation training, and worry management—the same approaches used in face-to-face CBT. Programs are personalized based on symptoms and delivered through interactive voice-guided sessions. Clinical trials show 71% of users experience clinically meaningful anxiety reduction. Daylight is available through employer benefits and health insurance partnerships—not individual purchase. If you have persistent worry that interferes with daily life, Daylight offers structured treatment beyond meditation apps.",
    best_for: [
      "People with generalized anxiety or chronic worry",
      "Those who want structured CBT but can't access a therapist",
      "Employees whose companies offer Daylight benefits",
      "People looking for more than meditation—actual treatment techniques"
    ],
    not_for: [
      "Those with severe anxiety or panic disorder needing immediate treatment",
      "People in crisis (call 988)",
      "Those without employer/insurance coverage for Daylight"
    ],
    faqs: [
      {
        q: "Is Daylight app effective for anxiety?",
        a: "Yes, randomized controlled trials show 71% of Daylight users achieve clinically meaningful anxiety reduction. The app delivers CBT—the evidence-based treatment recommended by clinical guidelines. It's more structured than relaxation apps, teaching skills to manage anxiety long-term."
      },
      {
        q: "Is Daylight free?",
        a: "Daylight is free if your employer or health plan covers it. Check with HR or your insurance benefits portal. Like Sleepio, Daylight isn't available for individual purchase—access is through employer or insurance partnerships."
      },
      {
        q: "How is Daylight different from Calm or Headspace?",
        a: "Daylight delivers structured CBT treatment—cognitive restructuring, worry management, and behavioral techniques. Calm and Headspace focus on relaxation and mindfulness. If you have clinical anxiety, Daylight's therapeutic approach addresses root causes rather than just symptoms."
      },
      {
        q: "Can Daylight replace therapy?",
        a: "For mild-moderate generalized anxiety, Daylight provides CBT comparable to some therapy outcomes. For severe anxiety, complex trauma, or other conditions, Daylight works best alongside professional care. Talk to a provider if symptoms are significantly impacting your life."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Generalized anxiety treatment", "CBT delivery", "Worry management"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant FDA-cleared digital therapeutic." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Free through employer/insurance", notes: "Requires employer or health plan coverage." },
    conditions: ["generalized-anxiety-disorder"],
    primary_hubs: ["anxiety-stress"]
  },

  "neuroflow": {
    one_liner: "NeuroFlow provides mental health tracking and care coordination tools, often integrated with your healthcare provider's system.",
    long_description: "NeuroFlow is a behavioral health engagement platform used by healthcare organizations to monitor and support patients' mental health. For patients, NeuroFlow provides mood tracking, anxiety/depression screenings, mindfulness exercises, and crisis resources through a mobile app. Your responses may be shared with your healthcare provider to inform care decisions. NeuroFlow is not a standalone consumer app—you'll typically receive access through your doctor, therapist, health system, or employer. The platform helps identify patients who need additional support and facilitates care coordination. If your provider uses NeuroFlow, you may receive prompts to complete check-ins between appointments.",
    best_for: [
      "Patients whose healthcare provider uses NeuroFlow for monitoring",
      "Those wanting to track mood and share data with their care team",
      "Health systems implementing measurement-based care",
      "People whose employer wellness program includes NeuroFlow"
    ],
    not_for: [
      "Those seeking standalone mental health apps (NeuroFlow requires provider connection)",
      "People wanting private tracking not shared with providers",
      "Those in crisis needing immediate care (call 988)"
    ],
    faqs: [
      {
        q: "What is NeuroFlow?",
        a: "NeuroFlow is a behavioral health platform that connects patients with their healthcare providers. You track mood and complete assessments through the app, and your care team sees the results. It helps providers identify when you need additional support between appointments."
      },
      {
        q: "Is NeuroFlow free?",
        a: "For patients, NeuroFlow is typically free—your healthcare provider or employer pays for the platform. You receive access through your care team's invitation. If you're interested in NeuroFlow, ask your doctor if they use it."
      },
      {
        q: "Who can see my NeuroFlow data?",
        a: "Your NeuroFlow data is shared with your designated healthcare providers—that's the point of the platform. It helps your care team monitor your mental health between visits. Data sharing follows HIPAA rules like any healthcare information."
      },
      {
        q: "Does NeuroFlow replace therapy?",
        a: "No, NeuroFlow is a monitoring and engagement tool—not a replacement for therapy. Think of it as a way to stay connected with your care team between sessions. Your providers use NeuroFlow data to inform treatment decisions."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Mental health monitoring", "Care coordination", "Measurement-based care", "Patient engagement"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Data shared with designated healthcare providers." },
    pricing: { model: "free", free_tier: true, starting_price: "Free for patients", notes: "Healthcare organizations pay for licenses. Patients use for free through their provider." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "find-support"]
  },

  "blueprint": {
    one_liner: "Blueprint helps therapists track client progress with validated assessments, and clients can complete check-ins through a mobile app between sessions.",
    long_description: "Blueprint is a measurement-based care platform that helps therapists track client outcomes using validated clinical assessments like the PHQ-9, GAD-7, and PCL-5. Clients receive the Blueprint app to complete assigned assessments between sessions—typically taking 2-5 minutes. Results are displayed in visual graphs showing progress over time, which clients and therapists review together. Blueprint supports over 200 validated measures and integrates with major EHR systems. If your therapist uses Blueprint, you'll be invited to download the app and complete regular check-ins. This data helps both you and your therapist understand what's working in treatment.",
    best_for: [
      "Therapy clients whose therapist uses Blueprint for progress tracking",
      "Those who want data-driven feedback on their therapy progress",
      "Therapists implementing measurement-based care",
      "People who appreciate visual graphs of mental health trends"
    ],
    not_for: [
      "Those looking for standalone mental health apps (Blueprint requires therapist)",
      "People seeking therapy (Blueprint is a tool used within therapy)",
      "Those uncomfortable with regular assessments"
    ],
    faqs: [
      {
        q: "What is Blueprint Health?",
        a: "Blueprint is a measurement-based care platform. Your therapist assigns you clinical assessments (like PHQ-9 for depression or GAD-7 for anxiety). You complete them through the Blueprint app, and both you and your therapist see progress graphs over time."
      },
      {
        q: "Is Blueprint free for clients?",
        a: "Yes, the Blueprint client app is free. Your therapist pays for the platform. You'll receive an invitation from your therapist to download the app and start completing assigned assessments."
      },
      {
        q: "What assessments does Blueprint use?",
        a: "Blueprint offers 200+ validated clinical measures including PHQ-9 (depression), GAD-7 (anxiety), PCL-5 (PTSD), AUDIT (alcohol), and many others. Your therapist selects which assessments to assign based on your treatment goals."
      },
      {
        q: "How often do I complete Blueprint assessments?",
        a: "Frequency varies by therapist preference—typically weekly or before each session. Assessments usually take 2-5 minutes. The goal is tracking progress over time, so consistency matters more than daily check-ins."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Treatment outcome tracking", "Measurement-based care", "Clinical assessments", "Progress monitoring"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Data shared with your designated therapist only." },
    pricing: { model: "free", free_tier: true, starting_price: "Free for clients", notes: "Therapists pay subscription. Client app is free." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "post-traumatic-stress-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "trauma-ptsd"]
  },

  "silvercloud": {
    one_liner: "SilverCloud delivers online CBT programs for anxiety, depression, and stress—often free through your employer or health plan.",
    long_description: "SilverCloud (now part of Amwell) provides online cognitive behavioral therapy (CBT) programs for anxiety, depression, stress, insomnia, and chronic pain. Programs include interactive modules, journaling, and activities based on evidence-based CBT techniques. Users can access programs independently or with coach support from licensed providers. Most users access SilverCloud for free through employer benefits, health insurance, or healthcare providers like the NHS. Clinical studies show 60-80% of users experience clinically significant improvement. Programs typically take 6-8 weeks to complete. SilverCloud is used by over 500 organizations globally including major employers and health systems.",
    best_for: [
      "People with mild-moderate anxiety or depression seeking structured CBT",
      "Employees whose companies offer SilverCloud benefits",
      "Those who prefer self-paced online programs over live therapy",
      "People interested in digital mental health with some human support"
    ],
    not_for: [
      "Those with severe symptoms needing immediate clinical intervention",
      "People in crisis (call 988)",
      "Those without employer/insurance access seeking free options"
    ],
    faqs: [
      {
        q: "Is SilverCloud free?",
        a: "SilverCloud is free if your employer, health plan, or healthcare provider offers it. Check your benefits or ask HR. The NHS offers SilverCloud to UK residents. Self-pay access may be available in some regions but most users access through benefits."
      },
      {
        q: "Is SilverCloud effective?",
        a: "Yes, over 300 peer-reviewed studies support SilverCloud's efficacy. Clinical trials show 60-80% of users achieve clinically significant improvement in anxiety and depression symptoms. Results are comparable to face-to-face CBT for mild-moderate symptoms."
      },
      {
        q: "What's the difference between SilverCloud and a therapist?",
        a: "SilverCloud is self-paced online CBT—you work through modules independently. Some programs include coach support for check-ins and feedback. It's more structured than a meditation app but less personalized than one-on-one therapy. Good for mild-moderate symptoms."
      },
      {
        q: "Is SilverCloud now part of Amwell?",
        a: "Yes, Amwell acquired SilverCloud in 2021. The programs continue under the SilverCloud brand as part of Amwell Psychiatric Care. If you have Amwell benefits, you may have access to SilverCloud programs."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Online CBT programs", "Depression treatment", "Anxiety treatment", "Digital mental health"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Part of Amwell with enterprise healthcare security." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Free through employer/health plan", notes: "Access through employer, insurance, or healthcare provider. Now part of Amwell." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression"]
  },

  // === SUBSTANCE USE TREATMENT ===

  "bicycle-health": {
    one_liner: "Bicycle Health provides online Suboxone (buprenorphine) treatment for opioid addiction, with video appointments and medication delivered to your home.",
    long_description: "Bicycle Health offers medication-assisted treatment (MAT) for opioid use disorder through telehealth. The platform connects patients with licensed physicians who prescribe buprenorphine (Suboxone) for opioid addiction treatment. After an initial video evaluation, medication is sent to your local pharmacy. Treatment includes weekly video check-ins, peer recovery coaching, and access to support groups. Most commercial insurance covers Bicycle Health, and Medicaid is accepted in many states. For uninsured patients, self-pay starts at $199/month for medication management. The evidence-based approach helps reduce opioid cravings and withdrawal symptoms while patients build recovery skills.",
    best_for: [
      "People seeking Suboxone treatment for opioid addiction",
      "Those who want to start MAT without going to a clinic",
      "People with insurance covering telehealth addiction treatment",
      "Those looking for combined medication and recovery support"
    ],
    not_for: [
      "People needing medical detox for severe physical dependence",
      "Those seeking treatment for non-opioid addiction",
      "People without a smartphone for video appointments"
    ],
    faqs: [
      {
        q: "Can I get Suboxone online through Bicycle Health?",
        a: "Yes, Bicycle Health physicians can prescribe buprenorphine (Suboxone) via telehealth in states where they're licensed. After a video evaluation, your prescription is sent to a local pharmacy. You'll have regular video check-ins to monitor treatment."
      },
      {
        q: "How much does Bicycle Health cost?",
        a: "Most commercial insurance covers Bicycle Health with copays varying by plan. Medicaid is accepted in many states. Self-pay is $199/month for medication management plus medication costs. This is significantly less than many traditional MAT clinics."
      },
      {
        q: "Is Bicycle Health legitimate?",
        a: "Yes, Bicycle Health is a licensed healthcare provider operating in 30+ states. Their physicians are DEA-registered to prescribe controlled substances for addiction treatment. The company partners with major health systems and has treated thousands of patients."
      },
      {
        q: "How quickly can I start Suboxone through Bicycle Health?",
        a: "Most patients can have an initial evaluation within 24-48 hours and start medication the same day if clinically appropriate. This is much faster than the weeks-long waits at many traditional MAT clinics."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Opioid use disorder treatment", "MAT/MOUD", "Buprenorphine prescribing", "Recovery support"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Substance use records have additional 42 CFR Part 2 protections." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$199/month self-pay", notes: "Most insurance and Medicaid accepted. Medication costs additional." },
    conditions: ["opioid-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "boulder-care": {
    one_liner: "Boulder Care provides telehealth Suboxone treatment for opioid addiction with peer coaching support, covered by most Medicaid and commercial insurance.",
    long_description: "Boulder Care offers medication-assisted treatment (MAT) for opioid use disorder through a compassionate, patient-centered telehealth model. The platform combines video visits with licensed clinicians who prescribe buprenorphine (Suboxone) with peer recovery coach support for ongoing guidance. Boulder's approach emphasizes harm reduction—meeting patients where they are without judgment. Medications are sent to a local pharmacy. Most Medicaid programs and commercial insurance cover Boulder Care. The company operates in 15+ states with a focus on underserved communities. Peer coaches, many in recovery themselves, provide text-based support and help navigate recovery challenges.",
    best_for: [
      "People seeking non-judgmental Suboxone treatment for opioid use",
      "Those with Medicaid looking for covered MAT services",
      "People who want peer recovery coaching alongside medication",
      "Those in states where Boulder Care operates"
    ],
    not_for: [
      "People requiring inpatient medical detox",
      "Those seeking alcohol or non-opioid addiction treatment",
      "Patients in states where Boulder doesn't operate"
    ],
    faqs: [
      {
        q: "Does Medicaid cover Boulder Care?",
        a: "Yes, Boulder Care accepts Medicaid in most states where they operate. They focus specifically on serving Medicaid populations who often have limited access to MAT. Many commercial insurance plans are also accepted. Check their website for coverage in your state."
      },
      {
        q: "What is Boulder Care's approach to treatment?",
        a: "Boulder uses a harm reduction approach—they meet you where you are without judgment. You don't need to be 'ready to quit' to start treatment. Buprenorphine reduces cravings and withdrawal, while peer coaches provide ongoing support. The goal is progress, not perfection."
      },
      {
        q: "Who are Boulder Care's peer coaches?",
        a: "Boulder's peer recovery coaches are often people with lived experience of addiction and recovery. They provide text-based support, help you navigate challenges, and connect you with resources. Peer support is included with medication management at no extra cost."
      },
      {
        q: "How is Boulder Care different from Bicycle Health?",
        a: "Both offer telehealth Suboxone treatment. Boulder has a strong Medicaid focus and emphasizes peer recovery coaching. Bicycle Health has broader insurance coverage and more states. Both are legitimate—choose based on your insurance and state availability."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Opioid use disorder treatment", "MAT with peer support", "Buprenorphine prescribing", "Harm reduction"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Enhanced privacy under 42 CFR Part 2 for substance use records." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$0 with Medicaid", notes: "Medicaid and commercial insurance accepted. Focus on serving underinsured populations." },
    conditions: ["opioid-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  // === BATCH 2: HIGH-PRIORITY CLINICAL PLATFORMS ===

  "betterhelp": {
    one_liner: "BetterHelp is the largest online therapy platform connecting users with licensed therapists via text, phone, or video for $65-100/week, not covered by insurance.",
    long_description: "BetterHelp is the world's largest online therapy platform with over 30,000 licensed therapists serving millions of users. After completing a questionnaire, you're matched with a therapist within 24-48 hours based on your preferences and needs. Communication happens through unlimited messaging plus weekly live video, phone, or chat sessions. Pricing is $65-100/week billed monthly, with financial aid available. BetterHelp does NOT accept insurance. The platform is accessible, convenient, and works well for general anxiety, depression, stress, and relationship issues. It's not designed for severe mental illness, psychiatric medication, or crisis care.",
    best_for: [
      "People wanting convenient, affordable access to licensed therapy",
      "Those comfortable with text-based communication between sessions",
      "People with mild to moderate anxiety, depression, or stress",
      "Those who prefer flexibility in scheduling sessions"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking medication management (therapy only)",
      "Those wanting insurance-covered therapy",
      "People with severe mental illness requiring intensive treatment"
    ],
    faqs: [
      {
        q: "How much does BetterHelp cost?",
        a: "BetterHelp costs $65-100 per week, billed monthly ($260-400/month). This includes unlimited messaging with your therapist plus one live session per week. Financial aid is available for qualifying individuals. BetterHelp does NOT accept insurance, so this is entirely out-of-pocket."
      },
      {
        q: "Is BetterHelp covered by insurance?",
        a: "No, BetterHelp is not covered by insurance or health plans. It's an out-of-pocket expense. If you need insurance-covered therapy, consider platforms like Teladoc, Amwell, Cerebral, or Talkspace (which offers insurance options), or use your insurance's mental health directory."
      },
      {
        q: "Is BetterHelp legitimate therapy?",
        a: "Yes, BetterHelp connects you with licensed therapists (psychologists, LCSWs, LPCs, LMFTs). However, the convenience trade-off means you may not get the depth of in-person care. It works well for general mental wellness but isn't appropriate for severe conditions, trauma requiring specialized treatment, or crisis situations."
      },
      {
        q: "How is BetterHelp different from Talkspace?",
        a: "Both are large online therapy platforms. BetterHelp is slightly cheaper and has more therapists but doesn't accept insurance. Talkspace accepts some insurance plans and offers psychiatry services. Both offer text messaging plus live sessions. Choose based on whether you have insurance coverage and need medication management."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["General therapy", "Anxiety treatment", "Depression support", "Relationship counseling"] },
    privacy: { grade: "B", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant but has faced scrutiny over data practices. Review their privacy policy." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$65/week", notes: "Billed monthly $260-400. Financial aid available. No insurance accepted." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "talkspace": {
    one_liner: "Talkspace offers online therapy and psychiatry with licensed providers, accepting many insurance plans, with unlimited messaging plus live sessions starting at $69/week.",
    long_description: "Talkspace is a leading telehealth platform for therapy and psychiatry serving millions of users. The platform offers unlimited text, video, and audio messaging with licensed therapists plus optional live video sessions. Talkspace accepts many major insurance plans including Aetna, Cigna, Optum, and employer EAPs, making it more accessible than cash-pay competitors. Psychiatry services are available for medication management. Therapy plans start at $69/week without insurance. The platform uses evidence-based approaches including CBT, DBT, and psychodynamic therapy. Teen therapy (13-17) is available with parental consent.",
    best_for: [
      "People whose insurance covers Talkspace therapy",
      "Those wanting both therapy and psychiatry in one platform",
      "People who prefer asynchronous text-based therapy",
      "Employees with Talkspace as an EAP benefit"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking controlled substance prescriptions (limited availability)",
      "Those preferring frequent live video sessions over messaging"
    ],
    faqs: [
      {
        q: "Does insurance cover Talkspace?",
        a: "Talkspace accepts many major insurance plans including Aetna, Cigna, Optum/UnitedHealthcare, Premera, and some Blue Cross plans. Many employers also offer Talkspace as an EAP benefit. Check the Talkspace website to verify your specific plan's coverage before signing up."
      },
      {
        q: "How much does Talkspace cost without insurance?",
        a: "Without insurance, Talkspace therapy costs $69-109/week depending on the plan. Psychiatry for medication management costs $249 for the initial evaluation plus $125 for follow-up appointments. These are out-of-pocket costs if your insurance doesn't cover telehealth therapy."
      },
      {
        q: "Does Talkspace prescribe medication?",
        a: "Yes, Talkspace offers psychiatry services for medication management. Licensed psychiatrists and psychiatric nurse practitioners can prescribe non-controlled medications for anxiety, depression, and other conditions. Controlled substances (Adderall, benzodiazepines) have significant restrictions."
      },
      {
        q: "Is Talkspace or BetterHelp better?",
        a: "Talkspace advantages: accepts insurance, offers psychiatry. BetterHelp advantages: larger therapist network, slightly cheaper without insurance. If your insurance covers Talkspace, it's usually the better value. If paying cash, BetterHelp offers similar therapy at lower cost."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Online therapy", "Text-based counseling", "Psychiatry", "Medication management"] },
    privacy: { grade: "B+", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Review their privacy practices before sharing sensitive information." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$69/week", notes: "Many insurance plans accepted. Employer EAP benefits common." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "brightside-health": {
    one_liner: "Brightside Health offers online psychiatry and therapy for anxiety and depression with insurance coverage, delivering medication directly to your door.",
    long_description: "Brightside Health specializes in evidence-based treatment for anxiety and depression, combining therapy with psychiatric medication management. The platform uses measurement-based care with regular symptom assessments to track progress and adjust treatment. Video appointments with psychiatrists or nurse practitioners lead to prescribed medications delivered to your home. Therapy is available as an add-on or standalone service. Brightside accepts many major insurance plans and offers affordable self-pay rates. The focused approach on anxiety and depression (rather than trying to treat everything) results in strong clinical outcomes. Available in most US states.",
    best_for: [
      "People seeking medication management for anxiety or depression",
      "Those who want combined therapy and psychiatry",
      "People whose insurance covers Brightside Health",
      "Those wanting medications delivered to their home"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking ADHD or controlled substance treatment",
      "Those with conditions outside anxiety and depression"
    ],
    faqs: [
      {
        q: "Does Brightside Health accept insurance?",
        a: "Yes, Brightside Health accepts many major insurance plans including Cigna, Aetna, UnitedHealthcare, and others. Coverage varies by state and plan. Check their website to verify your specific insurance is accepted. Self-pay options are also available."
      },
      {
        q: "What medications does Brightside prescribe?",
        a: "Brightside prescribes FDA-approved medications for anxiety and depression, including SSRIs, SNRIs, and other non-controlled antidepressants and anti-anxiety medications. They do not prescribe controlled substances like benzodiazepines or stimulants."
      },
      {
        q: "How does Brightside's measurement-based care work?",
        a: "Brightside uses regular symptom assessments (PHQ-9, GAD-7) to track your progress over time. This data helps your provider make evidence-based adjustments to your treatment. Research shows measurement-based care leads to better outcomes than treatment without regular monitoring."
      },
      {
        q: "Can I get therapy through Brightside without medication?",
        a: "Yes, Brightside offers therapy-only plans with licensed therapists. You can also combine therapy with medication management. The choice depends on your needs and preferences—many people benefit from both together, while others prefer one or the other."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Anxiety treatment", "Depression treatment", "Medication management", "Measurement-based care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Uses standard security practices for healthcare data." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$95/month self-pay", notes: "Many insurance plans accepted. Medication costs additional." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "find-support"]
  },

  "bend-health": {
    one_liner: "Bend Health provides virtual behavioral health care for children and families, combining therapy, coaching, and psychiatry through a whole-family treatment model.",
    long_description: "Bend Health is a pediatric and family behavioral health platform providing comprehensive virtual care for children, teens, and their families. The platform offers a whole-family treatment approach, recognizing that kids' mental health is connected to family dynamics. Services include therapy with licensed clinicians, behavioral coaching, psychiatry for medication management, and parent support. Bend Health accepts many insurance plans and focuses on anxiety, depression, ADHD, behavior challenges, and family stress. The collaborative care model means multiple providers work together on your child's treatment team rather than operating in silos.",
    best_for: [
      "Families seeking mental health care for children or teens",
      "Parents wanting involvement in their child's treatment",
      "Those looking for a collaborative care team approach",
      "Families whose insurance covers Bend Health"
    ],
    not_for: [
      "Adults seeking individual therapy (family focus)",
      "Those requiring in-person or intensive care",
      "Children in acute crisis requiring hospitalization"
    ],
    faqs: [
      {
        q: "What ages does Bend Health serve?",
        a: "Bend Health primarily serves children and adolescents from early childhood through high school age, plus their parents/caregivers. The whole-family model means parents are actively involved in treatment. Adult-only services are not the focus."
      },
      {
        q: "What conditions does Bend Health treat?",
        a: "Bend Health treats childhood anxiety, depression, ADHD, behavioral challenges, school stress, family conflict, and adjustment issues. They use evidence-based approaches appropriate for children and teens. For severe conditions or active safety concerns, a higher level of care may be needed."
      },
      {
        q: "Does Bend Health accept insurance?",
        a: "Yes, Bend Health accepts many major insurance plans. They also partner with employers to provide covered services. Check their website or contact them to verify your specific plan's coverage in your state."
      },
      {
        q: "How is Bend Health different from regular therapy?",
        a: "Bend Health uses a collaborative care team model rather than just one therapist. Your child might work with a therapist, coach, and psychiatrist who coordinate together. Parents receive support and coaching too. This integrated approach often produces better outcomes than fragmented care."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Pediatric mental health", "Family therapy", "Child psychiatry", "ADHD treatment"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Additional protections for minors' health information." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Varies by insurance", notes: "Many insurance plans and employer benefits accepted." },
    conditions: ["generalized-anxiety-disorder", "attention-deficit-hyperactivity-disorder"],
    primary_hubs: ["find-support", "focus-adhd", "anxiety-stress"]
  },

  "cleanslate-centers": {
    one_liner: "CleanSlate Centers provides outpatient addiction treatment combining medication-assisted treatment (MAT) with counseling for opioid and alcohol use disorders.",
    long_description: "CleanSlate Centers is one of the largest outpatient addiction treatment providers in the US, operating 80+ centers across multiple states. They specialize in medication-assisted treatment (MAT) for opioid and alcohol use disorders, combining FDA-approved medications (buprenorphine, naltrexone) with individual and group counseling. CleanSlate uses a chronic disease management approach, treating addiction as a medical condition rather than a moral failing. Most insurance including Medicaid is accepted. Patients typically visit in-person initially but can transition to telehealth follow-ups. The low-barrier approach means quick access to treatment without lengthy waitlists.",
    best_for: [
      "People seeking outpatient opioid or alcohol addiction treatment",
      "Those wanting medication-assisted treatment (MAT/MOUD)",
      "People with insurance or Medicaid coverage",
      "Those near a CleanSlate physical location"
    ],
    not_for: [
      "Those requiring inpatient medical detox",
      "People without a CleanSlate center nearby",
      "Those seeking treatment for non-substance conditions"
    ],
    faqs: [
      {
        q: "Does CleanSlate accept Medicaid?",
        a: "Yes, CleanSlate accepts Medicaid in most states where they operate. They also accept most commercial insurance plans. The goal is to remove financial barriers to addiction treatment. Call your local CleanSlate center to verify your specific coverage."
      },
      {
        q: "What medications does CleanSlate prescribe?",
        a: "CleanSlate prescribes FDA-approved medications for addiction treatment including buprenorphine (Suboxone) for opioid use disorder and naltrexone (Vivitrol) for both opioid and alcohol use disorders. Medication is combined with counseling for comprehensive treatment."
      },
      {
        q: "Is CleanSlate treatment in-person or telehealth?",
        a: "CleanSlate operates physical outpatient centers where you'll have initial visits. After stabilization, many patients can transition to telehealth follow-ups for convenience. The hybrid model combines the benefits of in-person care with telehealth accessibility."
      },
      {
        q: "How quickly can I start treatment at CleanSlate?",
        a: "CleanSlate emphasizes low-barrier, quick access to treatment. Many centers can see patients within days rather than weeks. Walk-ins may be accepted depending on location. Call your nearest center for current availability."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Opioid addiction treatment", "Alcohol use disorder treatment", "MAT/MOUD", "Outpatient SUD care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Substance use records protected under 42 CFR Part 2." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Covered by most insurance", notes: "Medicaid and commercial insurance accepted at most locations." },
    conditions: ["opioid-use-disorder", "alcohol-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "spring-health": {
    one_liner: "Spring Health is an employer-sponsored mental health platform offering therapy, coaching, psychiatry, and personalized treatment plans powered by AI-driven care matching.",
    long_description: "Spring Health is a comprehensive mental health benefits platform offered through employers, serving millions of employees at companies like Target, Adobe, and General Mills. The platform uses proprietary AI technology to assess each person's needs and match them with appropriate care—from self-guided exercises to therapy to psychiatry. Most employees receive several free therapy sessions through their employer benefit. Spring Health's network includes 10,000+ licensed therapists and psychiatrists. The platform emphasizes measurement-based care with regular check-ins to track progress. Employees typically access Spring Health at no cost or with minimal copays through their benefits.",
    best_for: [
      "Employees whose company offers Spring Health benefits",
      "People wanting AI-assisted care matching",
      "Those seeking therapy, coaching, or psychiatry through one platform",
      "Employees looking for free or low-cost mental health support"
    ],
    not_for: [
      "Individuals without employer-sponsored access",
      "Those in crisis needing emergency care (call 988)",
      "People seeking direct-to-consumer mental health services"
    ],
    faqs: [
      {
        q: "Is Spring Health free?",
        a: "Spring Health is offered through employers, so cost depends on your company's benefit package. Many employers cover a number of therapy sessions completely free. Additional sessions may have a copay. Check with your HR department or the Spring Health app to see your specific coverage."
      },
      {
        q: "How do I know if my employer offers Spring Health?",
        a: "Check with your HR department or employee benefits portal. Major companies like Target, Adobe, Docusign, and General Mills offer Spring Health. If your employer does offer it, you'll typically receive information during benefits enrollment or can find it in your benefits guide."
      },
      {
        q: "What does Spring Health's AI matching do?",
        a: "Spring Health uses AI to analyze your assessment responses and match you with the most appropriate care pathway. This might be self-guided tools, coaching, therapy, or psychiatry depending on your needs. The goal is to get you to effective care faster rather than one-size-fits-all."
      },
      {
        q: "Does Spring Health offer psychiatry?",
        a: "Yes, Spring Health offers psychiatry services for medication management alongside therapy and coaching. Psychiatric services may be included in your employer's benefit or may have additional costs. The integrated platform means your therapist and psychiatrist can coordinate care."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Employee mental health benefits", "Therapy", "Psychiatry", "Coaching"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Employers cannot see individual employee health data." },
    pricing: { model: "insurance-covered", free_tier: true, starting_price: "Free through employer", notes: "Employer-sponsored benefit. Coverage varies by company." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "modern-health": {
    one_liner: "Modern Health is an employer mental health benefit platform offering therapy, coaching, digital programs, and global coverage in 35+ languages.",
    long_description: "Modern Health is a workplace mental health platform serving employees at companies like Pixar, Lyft, and Electronic Arts. The platform offers a full spectrum of care: self-guided digital programs, one-on-one coaching for stress and life challenges, therapy with licensed clinicians, and circles (group support sessions). A key differentiator is global coverage with providers in 35+ languages and 60+ countries, making it suitable for multinational companies. Employees typically receive a set number of free sessions through their employer. Modern Health emphasizes proactive mental wellness rather than waiting for clinical conditions to develop.",
    best_for: [
      "Employees at companies offering Modern Health benefits",
      "Global employees needing care in languages other than English",
      "People wanting coaching for stress, not just clinical therapy",
      "Those interested in group support circles"
    ],
    not_for: [
      "Individuals without employer-sponsored access",
      "Those in crisis needing immediate care (call 988)",
      "People requiring specialized psychiatric medication management"
    ],
    faqs: [
      {
        q: "What's the difference between Modern Health coaching and therapy?",
        a: "Coaches help with stress, work challenges, life transitions, and goal-setting. They're not licensed therapists but are certified professionals. Therapy is provided by licensed clinicians (psychologists, therapists) for mental health conditions like anxiety and depression. Many people start with coaching and step up to therapy if needed."
      },
      {
        q: "How many free sessions do I get with Modern Health?",
        a: "The number of free sessions depends on your employer's benefit package. Common configurations include 6-12 sessions annually. Some employers offer unlimited access. Check the Modern Health app or your benefits portal for your specific allocation."
      },
      {
        q: "Does Modern Health work internationally?",
        a: "Yes, Modern Health operates in 60+ countries with providers who speak 35+ languages. This makes it particularly valuable for employees at global companies who need care in their native language or local timezone."
      },
      {
        q: "What are Modern Health Circles?",
        a: "Circles are small group sessions led by providers around specific topics like managing stress, new parenthood, or career development. They provide community support alongside individual care. Circles are typically included in employer benefits at no additional cost."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Employee mental health", "Coaching", "Therapy", "Global mental health access"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA and GDPR compliant. Employer cannot access individual session content." },
    pricing: { model: "insurance-covered", free_tier: true, starting_price: "Free through employer", notes: "Employer-sponsored. Session allocation varies by company." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "quartet-health": {
    one_liner: "Quartet Health is a behavioral health coordination platform that helps health plans and providers connect patients to appropriate mental health care.",
    long_description: "Quartet Health works behind the scenes with health insurance plans and primary care providers to identify patients who may need mental health support and connect them with appropriate care. If your insurance plan uses Quartet, you may receive outreach about available mental health resources when your data suggests you could benefit. Quartet doesn't provide therapy directly—instead, they facilitate referrals to in-network therapists, psychiatrists, and digital programs. The platform addresses the common problem of patients needing mental health care but not knowing where to start or facing long wait times for appointments.",
    best_for: [
      "People whose insurance plan uses Quartet for care coordination",
      "Those struggling to find in-network mental health providers",
      "Patients wanting help navigating mental health resources",
      "Health systems looking to improve behavioral health integration"
    ],
    not_for: [
      "Those seeking direct therapy services (Quartet coordinates, doesn't provide care)",
      "People with insurance plans that don't partner with Quartet",
      "Those in crisis needing immediate care (call 988)"
    ],
    faqs: [
      {
        q: "Is Quartet Health a therapy provider?",
        a: "No, Quartet Health doesn't provide therapy directly. They're a care coordination platform that helps connect you with therapists, psychiatrists, and programs in your insurance network. Think of them as navigators who help you access appropriate mental health care faster."
      },
      {
        q: "How do I know if my insurance uses Quartet?",
        a: "You may receive outreach from Quartet through your insurance plan or primary care provider. Major health plans in several states partner with Quartet. If you're interested, contact your insurance's member services to ask about behavioral health coordination services."
      },
      {
        q: "Is Quartet Health free?",
        a: "Quartet's coordination services are typically free—they're paid by health plans and providers, not patients. The actual therapy or psychiatry you're connected to will have costs determined by your insurance coverage like any other in-network provider."
      },
      {
        q: "Why did I receive outreach from Quartet?",
        a: "Quartet uses data analytics to identify patients who may benefit from mental health support. If you received outreach, your health plan or provider believes you might benefit from connecting with care. Participation is voluntary—you decide whether to engage."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Care coordination", "Behavioral health navigation", "Provider matching", "Health plan services"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Works within your existing insurance relationship." },
    pricing: { model: "insurance-covered", free_tier: true, starting_price: "Free coordination", notes: "Quartet services free. Connected providers subject to normal insurance coverage." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support"]
  },

  "amwell-behavioral-health": {
    one_liner: "Amwell Behavioral Health provides video therapy and psychiatry through major health insurance plans with licensed providers available in all 50 states.",
    long_description: "Amwell is one of the largest telehealth platforms in the US, offering behavioral health services including therapy and psychiatry through video visits. The platform is deeply integrated with major health insurance plans—many insurers offer Amwell as their telehealth provider, meaning visits are covered like any other in-network care. Amwell connects you with licensed therapists, psychologists, and psychiatrists for video appointments. The platform emphasizes insurance-covered care rather than cash-pay subscriptions. Available nationwide with providers licensed in all 50 states. Amwell also serves health systems and employers as a white-label telehealth solution.",
    best_for: [
      "People whose insurance offers Amwell as a telehealth benefit",
      "Those wanting video psychiatry or therapy with insurance coverage",
      "People preferring established telehealth platforms over startups",
      "Employer groups using Amwell for behavioral health benefits"
    ],
    not_for: [
      "Those without insurance or with plans that don't include Amwell",
      "People seeking text-based ongoing therapy (video only)",
      "Those in crisis needing emergency care (call 988)"
    ],
    faqs: [
      {
        q: "Does my insurance cover Amwell?",
        a: "Many major insurance plans include Amwell as a covered telehealth option. Check with your insurance or search for 'Amwell' or 'telehealth' in your plan benefits. Some insurers white-label Amwell under their own branding. If covered, visits typically cost your normal specialist copay."
      },
      {
        q: "How much does Amwell therapy cost?",
        a: "With insurance coverage, Amwell visits typically cost your standard telehealth or specialist copay ($20-50). Without insurance, self-pay rates are around $199-299 per visit. Amwell focuses on insurance-covered care, so check your benefits before assuming self-pay."
      },
      {
        q: "Does Amwell prescribe psychiatric medications?",
        a: "Yes, Amwell psychiatrists can prescribe medications for anxiety, depression, and other conditions. Controlled substance prescribing is limited based on state regulations. For medication management, you'll have video appointments with a psychiatric provider."
      },
      {
        q: "Is Amwell the same as Amwell Medical Group?",
        a: "Amwell is the platform/technology company. Amwell Medical Group is their employed provider group. When you use Amwell through insurance, you may see providers from Amwell Medical Group or other contracted providers. The experience is similar regardless."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Video therapy", "Telehealth psychiatry", "Insurance-covered mental health", "Behavioral health access"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Enterprise-grade security used by major health systems." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance copay", notes: "Many insurance plans cover Amwell. Self-pay available but expensive." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "amazon-one-medical": {
    one_liner: "Amazon One Medical offers virtual primary care with integrated mental health services including therapy and medication management for members and Prime subscribers.",
    long_description: "One Medical, acquired by Amazon, is a membership-based primary care practice with integrated mental health services. Members can access virtual and in-person care with same-day or next-day appointments. Mental health services include therapy with licensed therapists and medication management through primary care providers or psychiatric specialists. The $199/year membership (free for Prime members) provides access to virtual visits, but actual care costs depend on your insurance. One Medical accepts most major insurance plans. The integration of physical and mental health care under one roof simplifies coordinated treatment for conditions where both are relevant.",
    best_for: [
      "Amazon Prime members wanting integrated health care",
      "People seeking both primary care and mental health in one platform",
      "Those with insurance who want concierge-style access",
      "People in cities with One Medical physical locations"
    ],
    not_for: [
      "Those seeking specialized psychiatric care for severe conditions",
      "People without insurance (visits can be expensive)",
      "Those in areas without One Medical coverage"
    ],
    faqs: [
      {
        q: "Is One Medical free for Amazon Prime members?",
        a: "The $199/year One Medical membership is included free with Amazon Prime. However, actual medical visits still cost your normal insurance copay. The membership provides access and convenience features—insurance covers the care itself."
      },
      {
        q: "What mental health services does One Medical offer?",
        a: "One Medical offers therapy with licensed therapists, mental health medication management through your primary care provider, and referrals to specialists when needed. Services are virtual and in-person depending on your location. It's good for mild to moderate conditions."
      },
      {
        q: "Does One Medical accept insurance for mental health visits?",
        a: "Yes, One Medical accepts most major insurance plans. Mental health visits are billed to insurance like any other medical visit. Your cost is typically your plan's telehealth or specialist copay. Check coverage before your first visit."
      },
      {
        q: "Is One Medical good for serious mental health conditions?",
        a: "One Medical works best for mild to moderate mental health concerns integrated with primary care. For severe depression, bipolar disorder, complex trauma, or conditions requiring specialist psychiatric care, you may need a dedicated mental health provider or specialized program."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Integrated primary and mental health care", "Therapy", "Medication management", "Accessible care"] },
    privacy: { grade: "B+", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Now owned by Amazon—review privacy policy for data practices." },
    pricing: { model: "subscription", free_tier: true, starting_price: "Free with Prime ($199/yr otherwise)", notes: "Membership provides access. Actual visits billed to insurance." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "carelon-behavioral-health": {
    one_liner: "Carelon Behavioral Health (formerly Beacon Health Options) provides managed behavioral health services and EAP programs through employer and insurance partnerships.",
    long_description: "Carelon Behavioral Health, formerly known as Beacon Health Options, is one of the largest behavioral health management companies in the US, serving over 40 million members through insurance plans, employers, and government programs. If your insurance plan or employer uses Carelon for behavioral health, they manage your mental health benefits—authorizing care, maintaining provider networks, and offering care management programs. Carelon also provides EAP (Employee Assistance Program) services with free counseling sessions. The platform connects members with in-network therapists, psychiatrists, and substance use treatment programs. Members access services through their insurance or employer benefits.",
    best_for: [
      "People whose insurance uses Carelon for behavioral health management",
      "Employees with Carelon-administered EAP benefits",
      "Those seeking help finding in-network mental health providers",
      "Members needing care coordination for complex conditions"
    ],
    not_for: [
      "Those whose insurance doesn't use Carelon (direct access unavailable)",
      "People seeking direct-to-consumer mental health services",
      "Those in crisis needing emergency care (call 988)"
    ],
    faqs: [
      {
        q: "How do I know if my insurance uses Carelon?",
        a: "Check your insurance card or member portal for behavioral health information. Carelon may be listed as the behavioral health manager, or you might see 'Beacon Health Options' (the former name). Your employer HR can confirm if Carelon manages your EAP benefits."
      },
      {
        q: "Does Carelon provide therapy directly?",
        a: "Carelon manages behavioral health benefits rather than providing therapy directly. They maintain networks of therapists and psychiatrists, authorize treatment, and connect you with appropriate providers. The actual therapy comes from in-network clinicians."
      },
      {
        q: "What is Carelon's EAP program?",
        a: "EAP (Employee Assistance Program) provides free short-term counseling sessions (typically 3-8 visits) for employees and their families. If your employer uses Carelon for EAP, you can access these confidential sessions at no cost for stress, relationship issues, grief, and other concerns."
      },
      {
        q: "How do I find a therapist through Carelon?",
        a: "Contact Carelon using the phone number on your insurance card or access their member portal online. They can help you find in-network therapists in your area. If you're using EAP, they'll connect you with an EAP counselor for your free sessions."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Behavioral health management", "EAP services", "Provider networks", "Care coordination"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Manages sensitive behavioral health data with strict privacy controls." },
    pricing: { model: "insurance-covered", free_tier: true, starting_price: "EAP sessions often free", notes: "Costs determined by your insurance plan. EAP typically free through employer." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support"]
  },

  "aware-recovery-care": {
    one_liner: "Aware Recovery Care provides in-home addiction treatment combining medication-assisted treatment with intensive clinical support, covered by most insurance.",
    long_description: "Aware Recovery Care offers a unique in-home addiction treatment model that brings comprehensive care directly to patients. The program includes medication-assisted treatment (MAT) with Suboxone, intensive outpatient-level therapy, family involvement, case management, and 24/7 crisis support—all delivered in the home rather than a treatment facility. This model serves patients who need more support than standard outpatient but don't require residential care. Aware accepts most major insurance including Medicaid in many states. The in-home approach removes barriers like transportation and childcare that prevent many people from accessing treatment.",
    best_for: [
      "People with opioid addiction wanting treatment at home",
      "Those who need intensive support but can't do residential treatment",
      "Families wanting to be involved in recovery",
      "People with insurance covering Aware Recovery Care"
    ],
    not_for: [
      "Those requiring medical detox or residential stabilization",
      "People in unsafe home environments",
      "Those outside Aware's service areas"
    ],
    faqs: [
      {
        q: "How does in-home addiction treatment work?",
        a: "Aware Recovery Care brings clinical staff to your home multiple times per week. You receive MAT medication management, individual and family therapy, case management, and 24/7 crisis support. Treatment intensity is similar to intensive outpatient but happens in your home rather than a clinic."
      },
      {
        q: "Does insurance cover Aware Recovery Care?",
        a: "Yes, Aware accepts most major commercial insurance and Medicaid in many states. The in-home model is typically covered at similar rates to intensive outpatient treatment. Contact them to verify your specific insurance coverage."
      },
      {
        q: "How is Aware different from outpatient MAT?",
        a: "Standard outpatient MAT involves clinic visits for medication and occasional therapy. Aware provides intensive support in your home with multiple weekly visits, family therapy, case management, and 24/7 access to clinical staff. It's more comprehensive than typical outpatient."
      },
      {
        q: "Where is Aware Recovery Care available?",
        a: "Aware operates in multiple states with in-home services. Coverage areas continue to expand. Contact them directly to confirm service availability in your location."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Opioid use disorder", "In-home addiction treatment", "MAT/MOUD", "Family-based treatment"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Substance use records protected under 42 CFR Part 2." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance-based", notes: "Most commercial insurance and Medicaid accepted." },
    conditions: ["opioid-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "bright-heart-health": {
    one_liner: "Bright Heart Health provides virtual eating disorder treatment with medical monitoring, therapy, and nutrition counseling for all eating disorder types.",
    long_description: "Bright Heart Health is a virtual eating disorder treatment program offering medical, psychiatric, therapeutic, and nutritional care through telehealth. The program treats anorexia, bulimia, binge eating disorder, ARFID, and other eating disorders with a multidisciplinary team approach. Treatment includes regular video appointments with physicians for medical monitoring, therapists for individual and family therapy, psychiatrists for medication management, and registered dietitians for nutrition counseling. Bright Heart accepts many insurance plans and serves patients across multiple states. The virtual format provides access to specialized eating disorder care for those without local specialists.",
    best_for: [
      "People seeking specialized eating disorder treatment",
      "Those who need medical monitoring alongside therapy",
      "Patients without local eating disorder specialists",
      "Those whose insurance covers virtual eating disorder care"
    ],
    not_for: [
      "Those requiring inpatient or residential level of care",
      "Patients needing intensive medical stabilization",
      "People with conditions outside eating disorders"
    ],
    faqs: [
      {
        q: "What eating disorders does Bright Heart Health treat?",
        a: "Bright Heart treats anorexia nervosa, bulimia nervosa, binge eating disorder, ARFID (avoidant/restrictive food intake disorder), OSFED, and other eating disorders. They work with adolescents and adults. Medical monitoring is included for conditions requiring it."
      },
      {
        q: "Does insurance cover Bright Heart Health?",
        a: "Yes, Bright Heart accepts many major insurance plans for eating disorder treatment. Coverage varies by plan and state. Contact them to verify your specific insurance benefits before starting treatment."
      },
      {
        q: "How is virtual eating disorder treatment delivered?",
        a: "You meet regularly via video with your treatment team: a physician for medical monitoring, therapist for individual/family therapy, psychiatrist for medication if needed, and dietitian for nutrition counseling. The team coordinates care together rather than working in silos."
      },
      {
        q: "Is virtual treatment effective for eating disorders?",
        a: "Research shows telehealth eating disorder treatment can be effective, especially for outpatient-level care. Bright Heart's multidisciplinary approach mirrors what's offered in specialized clinics. For severe cases requiring intensive medical monitoring, higher levels of care may be needed."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Eating disorder treatment", "Medical monitoring", "Nutrition counseling", "Family therapy"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Sensitive eating disorder information handled with care." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance-based", notes: "Many insurance plans accepted. Contact for coverage verification." },
    conditions: ["anorexia-nervosa", "bulimia-nervosa", "binge-eating-disorder"],
    primary_hubs: ["anxiety-stress", "find-support"]
  },

  "brightline": {
    one_liner: "Brightline provides virtual behavioral health care for children and teens, including therapy, coaching, speech therapy, and psychiatry for ages 1.5-17.",
    long_description: "Brightline is a comprehensive pediatric behavioral health platform offering virtual care for children and families. Services include therapy, behavioral coaching, speech-language therapy, executive function coaching, and psychiatry for children ages 18 months to 17 years. The platform treats anxiety, depression, ADHD, autism spectrum concerns, behavioral challenges, and developmental issues. Brightline is primarily accessed through employer benefits and health plans rather than direct-to-consumer. Parents and caregivers are actively involved in treatment through coaching and family sessions. The care model emphasizes early intervention and parent education alongside direct child treatment.",
    best_for: [
      "Families seeking behavioral health care for children ages 1.5-17",
      "Employees whose company offers Brightline benefits",
      "Parents wanting active involvement in their child's treatment",
      "Children needing ADHD, anxiety, or autism support"
    ],
    not_for: [
      "Adults seeking individual therapy",
      "Those without employer or insurance access to Brightline",
      "Children in acute crisis requiring hospitalization"
    ],
    faqs: [
      {
        q: "What ages does Brightline serve?",
        a: "Brightline serves children and teens from 18 months through 17 years old. Different services are appropriate at different ages—early childhood focuses on parent coaching and developmental support, while older children receive individual therapy and psychiatry when needed."
      },
      {
        q: "How do I access Brightline?",
        a: "Brightline is typically accessed through employer benefits or health plan partnerships. Check with your HR department to see if your company offers Brightline. If offered, enrollment is usually through the Brightline app or website using your employer credentials."
      },
      {
        q: "Does Brightline offer ADHD treatment?",
        a: "Yes, Brightline provides comprehensive ADHD evaluation and treatment including behavioral therapy, parent training, executive function coaching, and medication management through child psychiatrists when appropriate."
      },
      {
        q: "What makes Brightline different from regular therapy?",
        a: "Brightline offers a comprehensive care team (therapists, coaches, psychiatrists, speech therapists) rather than standalone therapy. Parents receive coaching alongside child treatment. The platform specializes exclusively in pediatric care, unlike general telehealth platforms."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Pediatric mental health", "ADHD treatment", "Child therapy", "Parent coaching"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Extra protections for children's health information." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Through employer benefits", notes: "Employer-sponsored benefit. Coverage varies by company." },
    conditions: ["attention-deficit-hyperactivity-disorder", "generalized-anxiety-disorder"],
    primary_hubs: ["find-support", "focus-adhd", "anxiety-stress"]
  },

  "workit-health": {
    one_liner: "Workit Health provides online addiction treatment for alcohol and opioid use disorders with medication, therapy, and coaching covered by most insurance.",
    long_description: "Workit Health is a virtual addiction treatment platform specializing in alcohol and opioid use disorders. The program combines medication-assisted treatment (MAT) with therapy and peer coaching through a smartphone app. For opioid use disorder, Suboxone is prescribed and shipped to your pharmacy. For alcohol use disorder, medications like naltrexone may be used. The app provides CBT-based therapeutic exercises, group sessions, and one-on-one support. Workit accepts most major insurance plans including many Medicaid programs. The model emphasizes flexibility—you can engage with treatment around your work and life schedule without taking time off for clinic visits.",
    best_for: [
      "People seeking online treatment for alcohol or opioid addiction",
      "Those wanting MAT combined with therapy and coaching",
      "People with insurance covering Workit Health",
      "Those needing flexible treatment that fits their schedule"
    ],
    not_for: [
      "Those requiring medical detox or residential treatment",
      "People with addictions other than alcohol or opioids",
      "Those outside Workit's service areas"
    ],
    faqs: [
      {
        q: "Does Workit Health accept insurance?",
        a: "Yes, Workit accepts many major insurance plans and Medicaid in several states. Contact them to verify your specific coverage. Insurance typically covers medication management visits and therapy components."
      },
      {
        q: "What medications does Workit prescribe?",
        a: "For opioid use disorder, Workit prescribes buprenorphine (Suboxone). For alcohol use disorder, medications like naltrexone or other FDA-approved options may be used. Medication is combined with therapy and coaching for comprehensive treatment."
      },
      {
        q: "How does the Workit app work?",
        a: "The Workit app provides CBT-based therapeutic exercises, video sessions with counselors, group support meetings, and peer coaching. You can engage with content between appointments on your own schedule. It's designed for flexibility around work and life."
      },
      {
        q: "Is Workit effective for addiction treatment?",
        a: "Workit uses evidence-based approaches: FDA-approved medications combined with behavioral therapy. Published outcomes show significant reductions in substance use among participants. The combination of medication and therapy is supported by strong clinical evidence."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Opioid use disorder", "Alcohol use disorder", "MAT/MOUD", "Online addiction treatment"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Substance use records have additional 42 CFR Part 2 protections." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance-based", notes: "Many insurance plans and Medicaid accepted." },
    conditions: ["alcohol-use-disorder", "opioid-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "ria-health": {
    one_liner: "Ria Health provides virtual alcohol addiction treatment with medication, coaching, and digital tools, covered by many insurance plans with no abstinence requirement.",
    long_description: "Ria Health is a virtual alcohol addiction treatment program that meets you where you are—whether you want to quit completely or reduce your drinking. The program combines FDA-approved anti-craving medications (naltrexone, others) with weekly coaching calls, progress tracking through their app, and optional support groups. A key differentiator is their evidence-based approach that doesn't require complete abstinence as a goal. The Sinclair Method and other medication-assisted approaches are used. Ria accepts many major insurance plans and operates nationwide. Treatment is entirely virtual with medications shipped to your pharmacy.",
    best_for: [
      "People wanting to reduce or quit alcohol without inpatient treatment",
      "Those interested in medication-assisted alcohol treatment",
      "People who want coaching support alongside medication",
      "Those whose insurance covers Ria Health"
    ],
    not_for: [
      "Those requiring medical alcohol detox",
      "People with alcohol withdrawal risk needing in-person monitoring",
      "Those seeking treatment for drug use other than alcohol"
    ],
    faqs: [
      {
        q: "Does Ria Health require abstinence?",
        a: "No, Ria Health meets you where you are. Some people want to quit alcohol completely; others want to reduce to moderate drinking. The program supports both goals using evidence-based medication and coaching. You define what success looks like for you."
      },
      {
        q: "What medications does Ria Health use?",
        a: "Ria primarily uses naltrexone, which reduces cravings and the reward from drinking. Other FDA-approved medications may be used depending on your situation. The Sinclair Method (naltrexone before drinking) is one approach they support."
      },
      {
        q: "Does insurance cover Ria Health?",
        a: "Yes, Ria accepts many major insurance plans. Coverage varies by plan and state. They also offer self-pay options. Contact them to verify your specific insurance benefits before enrolling."
      },
      {
        q: "How is Ria different from AA?",
        a: "AA is a peer support program emphasizing abstinence and spirituality. Ria is medical treatment using FDA-approved medications with professional coaching. They can complement each other—some people use both. Ria doesn't require abstinence or spiritual components."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Alcohol use disorder", "Medication-assisted treatment", "Harm reduction", "The Sinclair Method"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Substance use records have additional 42 CFR Part 2 protections." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$350/month self-pay", notes: "Many insurance plans accepted. Self-pay available." },
    conditions: ["alcohol-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "oar-health": {
    one_liner: "Oar Health provides virtual alcohol treatment with medication and coaching designed for people who want to cut back on drinking, not necessarily quit entirely.",
    long_description: "Oar Health offers a virtual alcohol treatment program specifically designed for people who want to reduce their drinking but aren't necessarily ready to quit entirely. The program uses FDA-approved medications like naltrexone combined with coaching from alcohol specialists. Oar's approach is rooted in harm reduction—meeting people where they are rather than demanding abstinence. Treatment is entirely virtual with quick onboarding: complete an assessment, get a prescription, and start coaching. The program works well for people who recognize their drinking is problematic but don't identify as alcoholics or want traditional treatment.",
    best_for: [
      "People wanting to cut back on drinking without full abstinence",
      "Those interested in medication-assisted alcohol reduction",
      "People who don't want traditional 'alcoholic' treatment programs",
      "Those looking for quick-start virtual alcohol treatment"
    ],
    not_for: [
      "Those requiring medical detox for alcohol withdrawal",
      "People seeking treatment for other substances",
      "Those with severe alcohol dependence needing intensive care"
    ],
    faqs: [
      {
        q: "Is Oar Health for people who want to quit drinking?",
        a: "Oar serves both people who want to quit and those who want to reduce drinking to a healthier level. Their harm reduction approach doesn't require abstinence as a goal. You set your own targets based on what's right for you."
      },
      {
        q: "How does Oar Health's medication work?",
        a: "Oar typically uses naltrexone, which reduces cravings and the reward from alcohol. Some people take it daily; others use it strategically before drinking (the Sinclair Method). Your Oar physician will recommend the best approach for you."
      },
      {
        q: "How quickly can I start Oar?",
        a: "Oar is designed for quick access. Complete an online assessment, have a brief physician consultation, and start medication within days. Coaching begins alongside medication. There's no waitlist or lengthy intake process."
      },
      {
        q: "Does insurance cover Oar Health?",
        a: "Coverage varies by plan. Some insurance plans cover Oar's services; others don't. They also offer self-pay options. Contact them to check your specific coverage before enrolling."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Alcohol reduction", "Harm reduction", "Medication-assisted treatment", "Naltrexone therapy"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Confidential alcohol treatment records." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$195/month", notes: "Some insurance coverage available. Self-pay option." },
    conditions: ["alcohol-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "monument": {
    one_liner: "Monument provides virtual alcohol treatment with medication, therapy groups, and one-on-one coaching designed for people who want to change their relationship with alcohol.",
    long_description: "Monument (formerly Tempest) is a virtual alcohol treatment platform offering medication management, therapist-led groups, and personal coaching. The program is designed for people who want to change their relationship with alcohol—whether that means quitting, cutting back, or exploring moderation. Physicians prescribe FDA-approved medications like naltrexone. Therapist-led groups provide community and CBT-based education. Personal coaches offer ongoing accountability and support. Monument accepts some insurance plans and offers affordable self-pay options. The approach is modern and non-judgmental, designed for people who don't identify with traditional 'alcoholic' labels.",
    best_for: [
      "People wanting to change their relationship with alcohol",
      "Those interested in community support through therapist-led groups",
      "People seeking a modern, non-judgmental approach to alcohol treatment",
      "Those wanting combined medication, therapy, and coaching"
    ],
    not_for: [
      "Those requiring medical alcohol detox",
      "People with severe withdrawal risk needing in-person monitoring",
      "Those seeking treatment for substances other than alcohol"
    ],
    faqs: [
      {
        q: "What's included in Monument's treatment program?",
        a: "Monument includes physician-prescribed medication (if appropriate), unlimited therapist-led group sessions, personal coaching sessions, and community support. You choose your level of engagement based on your needs and goals."
      },
      {
        q: "Does Monument require abstinence?",
        a: "No, Monument supports various goals—complete abstinence, moderation, or simply 'drinking less.' You define success based on what's right for you. Their approach is harm reduction focused rather than abstinence-only."
      },
      {
        q: "How much does Monument cost?",
        a: "Monument's Essential plan (groups and community) starts around $14.99/month. Full plans with medication and coaching are $199-299/month. Some insurance plans are accepted. Financial assistance may be available."
      },
      {
        q: "What medications does Monument prescribe?",
        a: "Monument physicians prescribe FDA-approved medications for alcohol treatment, primarily naltrexone. Medication reduces cravings and the rewarding effects of alcohol, making it easier to cut back or stop."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Alcohol use disorder", "Medication-assisted treatment", "Group therapy", "Alcohol moderation"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Alcohol treatment records handled confidentially." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$14.99/month (groups only)", notes: "Full programs $199-299/month. Some insurance accepted." },
    conditions: ["alcohol-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "equip": {
    one_liner: "Equip provides virtual eating disorder treatment for all ages with a family-based approach, including therapy, medical monitoring, and nutrition counseling.",
    long_description: "Equip is a virtual eating disorder treatment program that brings gold-standard Family-Based Treatment (FBT) to patients of all ages through telehealth. The program includes a dedicated 5-person treatment team: therapist, dietitian, physician, peer mentor (someone with lived experience), and family mentor. Equip treats anorexia, bulimia, binge eating disorder, ARFID, and other eating disorders. The family-based approach means caregivers are actively involved in treatment, which research shows produces better outcomes especially for adolescents. Treatment happens through video appointments and the Equip app. Most major insurance plans are accepted.",
    best_for: [
      "Families seeking evidence-based eating disorder treatment",
      "Adolescents with eating disorders (FBT specialization)",
      "Those wanting comprehensive team-based care",
      "People whose insurance covers Equip"
    ],
    not_for: [
      "Those requiring inpatient or residential level of care",
      "Patients needing acute medical stabilization",
      "People without family/caregiver involvement (FBT requires it)"
    ],
    faqs: [
      {
        q: "What is Family-Based Treatment (FBT)?",
        a: "FBT is the most effective evidence-based treatment for adolescent eating disorders. Parents/caregivers take an active role in helping their child recover, with therapist guidance. Equip adapts FBT principles for all ages, involving support people in treatment."
      },
      {
        q: "What's included in the Equip treatment team?",
        a: "Each patient gets a 5-person team: therapist for individual/family therapy, dietitian for nutrition rehabilitation, physician for medical monitoring, peer mentor (someone in recovery), and family mentor (a parent who supported recovery). They coordinate your comprehensive care."
      },
      {
        q: "Does insurance cover Equip?",
        a: "Yes, Equip accepts most major insurance plans for eating disorder treatment. Coverage varies by plan. Contact them to verify your specific benefits before starting. Insurance often covers telehealth eating disorder treatment at similar rates to in-person care."
      },
      {
        q: "Who are the peer and family mentors?",
        a: "Peer mentors are people with lived eating disorder recovery experience. Family mentors are parents who've supported a loved one through recovery. They provide unique support and hope that comes from having 'been there'—complementing clinical treatment."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Eating disorder treatment", "Family-Based Treatment", "Adolescent eating disorders", "Nutrition rehabilitation"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Eating disorder records handled with sensitivity." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance-based", notes: "Most major insurance plans accepted." },
    conditions: ["anorexia-nervosa", "bulimia-nervosa", "binge-eating-disorder"],
    primary_hubs: ["anxiety-stress", "find-support"]
  },

  "within-health": {
    one_liner: "Within Health provides virtual eating disorder treatment at the intensive outpatient level with medical monitoring, therapy, and meal support multiple times per week.",
    long_description: "Within Health offers intensive virtual eating disorder treatment that brings outpatient and intensive outpatient (IOP) level care into patients' homes. The program includes medical monitoring, psychiatric services, individual therapy, group therapy, family therapy, meal support, and nutrition counseling. Treatment intensity typically involves multiple sessions per week—more than standard outpatient but flexible enough to maintain work or school. Within treats all eating disorders including anorexia, bulimia, binge eating disorder, and ARFID across the lifespan. The virtual format allows access to specialized eating disorder care regardless of location. Most major insurance plans are accepted.",
    best_for: [
      "Those needing intensive outpatient level eating disorder care",
      "People stepping down from higher levels of care",
      "Those without local specialized eating disorder treatment",
      "Patients whose insurance covers Within Health"
    ],
    not_for: [
      "Those requiring 24/7 residential or inpatient care",
      "Patients with acute medical instability",
      "Those who need in-person medical interventions"
    ],
    faqs: [
      {
        q: "What level of care does Within Health provide?",
        a: "Within provides virtual intensive outpatient (IOP) and outpatient levels of care. IOP typically involves 9-15+ hours per week of treatment—multiple group sessions, individual therapy, and meal support. This is more intensive than weekly therapy but flexible for daily life."
      },
      {
        q: "Does Within Health accept insurance?",
        a: "Yes, Within accepts most major insurance plans for eating disorder treatment. They handle insurance verification and prior authorization. Contact them to confirm your specific coverage before enrolling."
      },
      {
        q: "What's included in Within Health treatment?",
        a: "Treatment includes medical monitoring, psychiatric evaluation and medication management, individual therapy, multiple weekly groups, family therapy, meal observation and support, and nutrition counseling. Your treatment team coordinates comprehensive care."
      },
      {
        q: "Is virtual IOP effective for eating disorders?",
        a: "Research shows virtual eating disorder treatment can be effective at the IOP level, especially when it includes medical monitoring and meal support. Within's approach mirrors the components of in-person IOP programs. Outcomes are tracked to ensure progress."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Intensive eating disorder treatment", "Virtual IOP", "Eating disorder recovery", "Meal support"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Eating disorder treatment records protected." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance-based", notes: "Most major insurance accepted for eating disorder treatment." },
    conditions: ["anorexia-nervosa", "bulimia-nervosa", "binge-eating-disorder"],
    primary_hubs: ["anxiety-stress", "find-support"]
  },

  // === BATCH 3: MORE CLINICAL PLATFORMS ===

  "sondermind": {
    one_liner: "SonderMind matches you with in-network therapists for video or in-person sessions, with most appointments available within 48 hours.",
    long_description: "SonderMind is a mental health company connecting patients with licensed therapists for video and in-person appointments. The platform focuses on solving two key problems: therapist matching and insurance access. Their matching process considers your specific needs, preferences, and insurance to find therapists who are a good fit. Most major insurance plans are accepted, and copays are typically $0-50 per session. SonderMind therapists are available in most US states, with appointments often available within 48 hours. The platform emphasizes measurement-based care, tracking progress to ensure treatment is effective.",
    best_for: [
      "People wanting in-network therapy covered by insurance",
      "Those seeking quick access to therapist appointments",
      "People who want matching based on their specific needs",
      "Those wanting video or in-person session options"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking psychiatry or medication management (therapy only)",
      "Those without insurance SonderMind accepts"
    ],
    faqs: [
      {
        q: "Does insurance cover SonderMind therapy?",
        a: "Yes, SonderMind accepts most major insurance plans including Aetna, Cigna, UnitedHealthcare, Blue Cross Blue Shield, and others. They verify your benefits before your first appointment so you know your copay upfront. Most clients pay $0-50 per session."
      },
      {
        q: "How does SonderMind therapist matching work?",
        a: "You complete an assessment about your needs, preferences, and what you're looking for in a therapist. SonderMind uses this plus your insurance to match you with compatible therapists. You can review therapist profiles and choose who to book with."
      },
      {
        q: "How quickly can I see a therapist through SonderMind?",
        a: "Most clients can get an appointment within 48 hours. This is much faster than the weeks or months wait at many traditional practices. Availability varies by location and insurance, but quick access is a core focus."
      },
      {
        q: "Does SonderMind offer in-person therapy?",
        a: "Yes, SonderMind offers both video and in-person sessions depending on therapist and location availability. Many therapists offer hybrid options. During booking, you can filter for your preferred format."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Therapy matching", "Insurance-covered therapy", "Quick access mental health", "Measurement-based care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Standard healthcare privacy protections." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$0-50 copay", notes: "Most major insurance accepted. Cost is your insurance copay." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "two-chairs": {
    one_liner: "Two Chairs provides therapist matching and therapy services with a research-backed matching process, primarily serving California and expanding markets.",
    long_description: "Two Chairs is a therapy company that emphasizes the importance of client-therapist fit. Their research-backed matching process aims to connect you with a therapist who is right for your specific needs, personality, and preferences. The company operates primarily in California with expansion to other markets. Sessions are available via video and in-person at their physical offices in the Bay Area and Los Angeles. Two Chairs accepts many insurance plans and offers sliding scale for self-pay. The focus on matching quality reflects research showing the therapeutic relationship is a key predictor of outcomes.",
    best_for: [
      "California residents seeking therapy",
      "People who value therapist matching and fit",
      "Those with insurance Two Chairs accepts",
      "People wanting both video and in-person options"
    ],
    not_for: [
      "Those outside Two Chairs' service areas",
      "People seeking psychiatry or medication",
      "Those in crisis needing immediate care (call 988)"
    ],
    faqs: [
      {
        q: "Where does Two Chairs operate?",
        a: "Two Chairs primarily serves California, with physical offices in San Francisco, Oakland, Los Angeles, and other Bay Area/LA locations. They offer video therapy throughout California. Check their website for current availability in your area."
      },
      {
        q: "How does Two Chairs' matching process work?",
        a: "You start with a free consultation call to discuss your needs. Two Chairs uses a research-backed process to match you with a therapist based on your concerns, personality, and preferences. The focus on fit reflects research showing the relationship matters for outcomes."
      },
      {
        q: "Does Two Chairs accept insurance?",
        a: "Yes, Two Chairs accepts many major insurance plans in their service areas. They also offer sliding scale for self-pay clients. Contact them to verify your specific insurance coverage."
      },
      {
        q: "What makes Two Chairs different from other therapy platforms?",
        a: "Two Chairs emphasizes matching quality over quick access. Their research-backed process aims to find the right therapist fit, which studies show predicts better outcomes. They also operate physical offices for in-person sessions in addition to video."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Therapist matching", "Individual therapy", "California mental health", "Research-based matching"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare provider." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance copay or sliding scale", notes: "Many insurance plans accepted. Sliding scale available." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "compsych-guidanceresources": {
    one_liner: "ComPsych GuidanceResources is the world's largest EAP provider, offering free confidential counseling, work-life services, and crisis support through employer benefits.",
    long_description: "ComPsych GuidanceResources is the world's largest Employee Assistance Program (EAP) provider, serving over 60,000 organizations and 120+ million individuals worldwide. If your employer uses ComPsych, you have access to free confidential counseling sessions (typically 3-8), 24/7 crisis support, work-life services (legal, financial, childcare resources), and wellness programs. EAP services are separate from your health insurance—your employer pays for them, and usage is confidential. ComPsych connects you with licensed counselors for short-term support on stress, anxiety, relationship issues, grief, and more.",
    best_for: [
      "Employees whose company offers ComPsych EAP",
      "People wanting free confidential counseling sessions",
      "Those needing work-life resources (legal, financial)",
      "Employees seeking 24/7 crisis support"
    ],
    not_for: [
      "Those without employer-sponsored ComPsych access",
      "People needing long-term ongoing therapy",
      "Those seeking psychiatric medication"
    ],
    faqs: [
      {
        q: "How do I know if my employer offers ComPsych?",
        a: "Check with your HR department or employee benefits portal. ComPsych serves major employers across all industries. You may have received information during benefits enrollment. The GuidanceResources website or app login typically requires your organization ID."
      },
      {
        q: "Are EAP counseling sessions really free?",
        a: "Yes, if your employer offers ComPsych, your EAP sessions are free—paid by your employer, not charged to you or your insurance. Most plans include 3-8 free sessions. If you need more, the counselor can help you transition to your regular health insurance benefits."
      },
      {
        q: "Is ComPsych EAP confidential from my employer?",
        a: "Yes, EAP is confidential. Your employer receives only aggregate usage statistics, never individual information about who uses services or why. The only exceptions are standard limits of confidentiality (imminent danger, abuse reporting, etc.)."
      },
      {
        q: "What else does ComPsych offer besides counseling?",
        a: "ComPsych GuidanceResources includes legal consultations, financial coaching, childcare/eldercare resources, wellness programs, and work-life balance support. These services are included with EAP access at no additional cost."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["EAP counseling", "Work-life services", "Crisis support", "Employee wellness"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "Confidential EAP. Employer sees only aggregate data, never individual usage." },
    pricing: { model: "insurance-covered", free_tier: true, starting_price: "Free through employer", notes: "EAP sessions free. Paid by employer benefit." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress"]
  },

  "magellan-health": {
    one_liner: "Magellan Health manages behavioral health benefits for insurance plans and employers, connecting members with in-network mental health providers.",
    long_description: "Magellan Health is one of the largest behavioral health management companies in the US, managing mental health and substance use benefits for insurance plans, employers, and government programs. If your insurance uses Magellan for behavioral health, they manage your network of therapists and psychiatrists, authorize treatment, and provide care coordination. Magellan also offers EAP services and specialty programs for conditions like autism, eating disorders, and substance use. Members access care through Magellan's provider directory and member services. As a managed care company, Magellan facilitates access to care rather than providing direct treatment.",
    best_for: [
      "People whose insurance uses Magellan for behavioral health",
      "Those seeking help finding in-network providers",
      "Members needing care coordination for complex conditions",
      "Employees with Magellan-administered EAP"
    ],
    not_for: [
      "Those whose insurance doesn't use Magellan",
      "People seeking direct-to-consumer therapy services",
      "Those in crisis needing immediate care (call 988)"
    ],
    faqs: [
      {
        q: "Is Magellan a therapy provider?",
        a: "No, Magellan manages behavioral health benefits—they maintain networks of providers, authorize treatment, and coordinate care. The actual therapy comes from in-network clinicians. Think of Magellan as the organization behind your mental health insurance benefits."
      },
      {
        q: "How do I find a therapist through Magellan?",
        a: "Contact Magellan member services (phone number on your insurance card) or use their online provider directory. They can help you find in-network therapists and psychiatrists in your area. Prior authorization may be required for some services."
      },
      {
        q: "Does Magellan offer EAP services?",
        a: "Yes, many employers contract with Magellan for EAP (Employee Assistance Program). This provides free confidential counseling sessions, work-life resources, and crisis support. Check with your HR department to see if Magellan manages your EAP."
      },
      {
        q: "What specialty programs does Magellan offer?",
        a: "Magellan offers specialty care management for autism spectrum disorder, eating disorders, substance use treatment, and complex behavioral health conditions. These programs provide additional coordination and support beyond standard benefits."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Behavioral health management", "Provider networks", "Care coordination", "EAP services"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Manages protected health information under strict privacy standards." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Per insurance plan", notes: "Costs determined by your insurance. Magellan manages benefits, not pricing." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support"]
  },

  "array-behavioral-care": {
    one_liner: "Array Behavioral Care provides telehealth psychiatry and therapy to hospitals, health systems, and employers facing behavioral health provider shortages.",
    long_description: "Array Behavioral Care is a telepsychiatry company providing behavioral health clinicians to hospitals, emergency departments, health systems, and employers. Rather than serving patients directly, Array contracts with healthcare organizations to provide psychiatric and therapy coverage via telehealth. This helps address the national shortage of psychiatrists, especially in rural areas. Patients at partner hospitals and health systems access Array providers during their care without needing to know they're using Array specifically. The company serves over 2,000 healthcare organizations and covers all 50 states.",
    best_for: [
      "Patients at hospitals or health systems using Array for telepsychiatry",
      "People in rural areas accessing psychiatric care through Array partnerships",
      "Employees at companies contracting with Array for behavioral health",
      "Healthcare organizations needing telepsychiatry staffing"
    ],
    not_for: [
      "Individual consumers seeking direct psychiatric services",
      "Those looking to sign up independently for therapy",
      "People in crisis needing emergency care (call 988 or go to ER)"
    ],
    faqs: [
      {
        q: "Can I sign up for Array Behavioral Care directly?",
        a: "No, Array provides services through healthcare organizations, not directly to consumers. If your hospital, health system, or employer partners with Array, you'll access their providers through that relationship. You typically won't know you're using Array—it integrates with your existing care."
      },
      {
        q: "What does Array Behavioral Care do?",
        a: "Array provides psychiatrists, nurse practitioners, and therapists via telehealth to organizations facing provider shortages. They cover psychiatric consultations in emergency departments, inpatient units, outpatient clinics, and employer health programs across all 50 states."
      },
      {
        q: "How does Array help with psychiatrist shortages?",
        a: "Array uses telehealth to connect psychiatric providers with facilities that don't have enough local psychiatrists. A hospital in a rural area might have Array psychiatrists available via video for emergency evaluations and consultations, expanding access to care."
      },
      {
        q: "Is Array Behavioral Care the same as Genoa Healthcare?",
        a: "Array Behavioral Care and Genoa Healthcare are both behavioral health companies but serve different functions. Array provides telepsychiatry to organizations. Genoa operates pharmacies and outpatient clinics. They may serve overlapping populations but are distinct services."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Telepsychiatry", "Health system partnerships", "Rural mental health access", "Emergency psychiatric consultations"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Enterprise healthcare security standards." },
    pricing: { model: "enterprise", free_tier: false, starting_price: "B2B contracts", notes: "Array contracts with organizations. Patient costs depend on your insurance/health system." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "bipolar-disorder"],
    primary_hubs: ["find-support", "serious-mental-illness"]
  },

  "daybreak-health": {
    one_liner: "Daybreak Health provides virtual therapy for teens ages 11-18 through school partnerships, connecting students with licensed therapists at no cost to families.",
    long_description: "Daybreak Health partners with schools to provide free virtual therapy for students ages 11-18. The program addresses the teen mental health crisis by making therapy accessible during or after school hours via video sessions. Licensed therapists work with teens on anxiety, depression, stress, and other concerns. Schools contract with Daybreak, so families pay nothing out of pocket. The platform integrates with school counselors who can make referrals. Daybreak serves students across multiple states through its school partnerships, removing traditional barriers like cost, transportation, and stigma.",
    best_for: [
      "Teens ages 11-18 at schools partnering with Daybreak",
      "Families wanting free therapy for their teen",
      "Students comfortable with video-based therapy",
      "Schools looking to provide mental health services"
    ],
    not_for: [
      "Adults seeking individual therapy",
      "Teens at schools without Daybreak partnerships",
      "Those requiring in-person or intensive treatment"
    ],
    faqs: [
      {
        q: "How do I access Daybreak Health therapy?",
        a: "Daybreak works through school partnerships. If your school partners with Daybreak, students can be referred by school counselors, parents, or can self-refer. Check with your school counselor to see if Daybreak is available. It's free for students at partner schools."
      },
      {
        q: "Is Daybreak really free for families?",
        a: "Yes, when schools partner with Daybreak, therapy is provided at no cost to families. Schools pay for the service as part of their student mental health support. There are no copays, no insurance required, and no hidden fees."
      },
      {
        q: "What ages does Daybreak serve?",
        a: "Daybreak serves teens ages 11-18 (middle and high school). Therapists are specially trained to work with adolescents. The video format and school integration are designed specifically for the teen population."
      },
      {
        q: "Can parents be involved in Daybreak therapy?",
        a: "Parents can be involved with the teen's consent, which is standard for adolescent therapy. Daybreak therapists work with families when appropriate while respecting teen confidentiality. Parent sessions or family work can be included in treatment."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Teen therapy", "School-based mental health", "Adolescent anxiety", "Youth depression"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Extra protections for minors' health information." },
    pricing: { model: "enterprise", free_tier: true, starting_price: "Free through schools", notes: "Schools pay for service. Free for students and families." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "little-otter": {
    one_liner: "Little Otter provides virtual mental health care for children ages 0-14 and their families, with therapy, psychiatry, and parent coaching.",
    long_description: "Little Otter is a pediatric mental health platform serving children from infancy through age 14 and their families. The platform offers therapy, psychiatric medication management, and parent coaching through video appointments. Little Otter treats anxiety, depression, ADHD, behavioral challenges, and other childhood mental health concerns. The family-centered approach recognizes that children's mental health is connected to family dynamics. Parents receive coaching and support alongside their child's direct treatment. Little Otter accepts some insurance plans and partners with employers to provide covered benefits.",
    best_for: [
      "Families with children ages 0-14 needing mental health care",
      "Parents wanting active involvement in their child's treatment",
      "Those whose insurance or employer covers Little Otter",
      "Families seeking both therapy and psychiatry for children"
    ],
    not_for: [
      "Teens over 14 or adults",
      "Those without Little Otter coverage",
      "Children requiring in-person or intensive care"
    ],
    faqs: [
      {
        q: "What ages does Little Otter serve?",
        a: "Little Otter serves children from birth through 14 years old. Services are tailored to developmental stage—infant/toddler care focuses heavily on parent coaching, while older children receive more direct therapy. The family-centered model applies across all ages."
      },
      {
        q: "Does Little Otter accept insurance?",
        a: "Little Otter accepts some insurance plans and partners with employers to provide covered mental health benefits. Coverage varies by plan and location. Contact them to verify if your insurance or employer benefit includes Little Otter."
      },
      {
        q: "What is parent coaching at Little Otter?",
        a: "Parent coaching helps caregivers learn strategies to support their child's mental health at home. Since children spend most time with family, parent coaching extends treatment beyond therapy sessions. It's included as part of the family-centered care model."
      },
      {
        q: "Can Little Otter prescribe ADHD medication?",
        a: "Yes, Little Otter offers child psychiatry for medication management including ADHD medications when appropriate. Psychiatric evaluation and ongoing medication management happen via video appointments with child psychiatrists."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Child mental health", "Family therapy", "Parent coaching", "Child psychiatry"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Enhanced protections for children's health information." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Varies by coverage", notes: "Some insurance and employer benefits accepted." },
    conditions: ["generalized-anxiety-disorder", "attention-deficit-hyperactivity-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "focus-adhd"]
  },

  "rethink-first": {
    one_liner: "RethinkFirst (now part of CareFirst) provides ABA therapy and autism services for children, plus mental health support for employees and families.",
    long_description: "RethinkFirst is a behavioral health platform offering Applied Behavior Analysis (ABA) therapy for children with autism, developmental support, and employee mental health programs. Their autism services include video-based parent training, direct ABA therapy, and developmental assessments. For employers, RethinkFirst provides digital mental health resources, counseling access, and family support programs. The platform is often accessed through employer benefits or insurance coverage. RethinkFirst combines technology (video training, apps) with clinical services to make behavioral health more accessible.",
    best_for: [
      "Families seeking ABA therapy or autism services for children",
      "Employees with RethinkFirst benefits through their employer",
      "Parents wanting autism support and training",
      "Those with insurance covering RethinkFirst services"
    ],
    not_for: [
      "Adults seeking individual therapy for themselves",
      "Those without employer or insurance RethinkFirst coverage",
      "People seeking services unrelated to autism/developmental needs"
    ],
    faqs: [
      {
        q: "What is ABA therapy?",
        a: "Applied Behavior Analysis (ABA) is an evidence-based treatment for autism that focuses on developing communication, social, and daily living skills while reducing challenging behaviors. RethinkFirst provides ABA through trained therapists working with children and families."
      },
      {
        q: "How do I access RethinkFirst autism services?",
        a: "RethinkFirst autism services are typically accessed through insurance coverage or employer benefits. Some insurance plans cover ABA therapy. Contact RethinkFirst or check with your insurance to verify coverage and access the autism services program."
      },
      {
        q: "Does RethinkFirst offer employee mental health benefits?",
        a: "Yes, RethinkFirst provides employee mental health programs including digital wellness tools, counseling access, and family support resources. If your employer offers RethinkFirst, check your benefits portal for available services."
      },
      {
        q: "Is RethinkFirst evidence-based?",
        a: "Yes, ABA therapy is one of the most researched and effective treatments for autism. RethinkFirst's programs are designed by behavior analysts and follow evidence-based ABA principles. Their digital tools supplement clinical treatment."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["ABA therapy", "Autism services", "Parent training", "Employee mental health"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Protections for children's health information." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance or employer benefit", notes: "Coverage varies. Often accessed through employer benefits or ABA insurance coverage." },
    conditions: ["autism-spectrum-disorder"],
    primary_hubs: ["find-support"]
  },

  "plushcare": {
    one_liner: "PlushCare provides online doctor visits for primary care and mental health, with licensed providers available same-day for video appointments.",
    long_description: "PlushCare is a telehealth platform offering primary care, mental health services, and ongoing condition management through video appointments with licensed physicians. For mental health, PlushCare treats anxiety, depression, and other conditions with therapy and medication management. Same-day appointments are often available. PlushCare accepts many insurance plans, making visits affordable with copays typically $20-50. The platform is designed for convenient access to medical care without the wait times of traditional practices. PlushCare physicians can prescribe medications (including some controlled substances with limitations) and provide referrals.",
    best_for: [
      "People wanting quick telehealth access for mental health concerns",
      "Those seeking medication management for anxiety or depression",
      "People with insurance covering PlushCare visits",
      "Those who want combined primary care and mental health"
    ],
    not_for: [
      "Those seeking in-depth psychotherapy (limited therapy focus)",
      "People needing specialized psychiatric care",
      "Those in crisis needing emergency care (call 988)"
    ],
    faqs: [
      {
        q: "Does PlushCare prescribe mental health medications?",
        a: "Yes, PlushCare physicians can prescribe medications for anxiety, depression, and other mental health conditions. Some controlled substances have restrictions based on state regulations. For complex psychiatric needs, they may refer to specialists."
      },
      {
        q: "Does insurance cover PlushCare?",
        a: "PlushCare accepts many major insurance plans. With insurance, visits typically cost $20-50 (your copay). They also offer self-pay memberships for those without coverage. Check their website to verify your specific insurance."
      },
      {
        q: "How quickly can I see a PlushCare doctor?",
        a: "Same-day appointments are often available. You can typically see a doctor within hours of requesting an appointment. This quick access is helpful for refilling medications or addressing concerns that can't wait for traditional office availability."
      },
      {
        q: "Does PlushCare offer therapy or just medication?",
        a: "PlushCare focuses primarily on medical care and medication management rather than ongoing therapy. While doctors provide supportive counseling during visits, it's not a substitute for regular psychotherapy. They can refer to therapy resources if needed."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Telehealth primary care", "Mental health medication", "Quick access care", "Anxiety treatment"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant telehealth platform." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$20-50 copay", notes: "Many insurance plans accepted. Self-pay memberships available." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "done-adhd": {
    one_liner: "Done provides online ADHD diagnosis and medication management with licensed clinicians, offering video appointments and medication delivery.",
    long_description: "Done (formerly Done ADHD) is a telehealth platform specializing in ADHD evaluation and treatment. The platform connects patients with licensed clinicians for ADHD assessment via video and ongoing medication management. Medications can be delivered directly or sent to a local pharmacy. Done is designed for adults who suspect they have ADHD and want efficient access to evaluation and treatment. Note: Done and similar ADHD telehealth platforms have faced regulatory scrutiny since 2022 regarding prescribing practices. Controlled substance prescriptions may have additional requirements or restrictions depending on your state.",
    best_for: [
      "Adults seeking ADHD evaluation and diagnosis",
      "Those wanting convenient ADHD medication management",
      "People who struggle to access ADHD care locally",
      "Those preferring video appointments over in-person visits"
    ],
    not_for: [
      "Those seeking therapy for ADHD (medication focus)",
      "Children or adolescents (adult-focused)",
      "People in states where Done has prescribing restrictions"
    ],
    faqs: [
      {
        q: "How does Done's ADHD evaluation work?",
        a: "Done's evaluation includes completing questionnaires about your symptoms, history, and functioning, followed by a video appointment with a licensed clinician. If you meet criteria for ADHD, they can discuss treatment options including medication."
      },
      {
        q: "Does Done prescribe stimulant medications?",
        a: "Done prescribes FDA-approved ADHD medications including stimulants when clinically appropriate. However, controlled substance prescribing through telehealth has faced regulatory changes since 2022. Availability and requirements vary by state. Verify current policies before enrolling."
      },
      {
        q: "How much does Done cost?",
        a: "Done offers subscription plans for ongoing care, typically $199-299/month. Some insurance plans may be accepted. Medication costs are separate. Self-pay options are available for those without coverage."
      },
      {
        q: "Is Done legitimate for ADHD treatment?",
        a: "Done uses licensed clinicians for ADHD evaluation and treatment. However, like other ADHD telehealth platforms, it has faced scrutiny over prescribing practices. Do your research, understand the limitations, and ensure you're comfortable with the care model."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["ADHD diagnosis", "ADHD medication management", "Telehealth psychiatry", "Stimulant prescribing"] },
    privacy: { grade: "B+", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Review their privacy policy for data practices." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$199/month", notes: "Subscription model. Medication costs separate. Some insurance accepted." },
    conditions: ["attention-deficit-hyperactivity-disorder"],
    primary_hubs: ["focus-adhd", "find-support"]
  },

  "adhd-online": {
    one_liner: "ADHD Online provides comprehensive ADHD assessments and telehealth treatment with board-certified providers, including medication management.",
    long_description: "ADHD Online offers a comprehensive approach to ADHD evaluation and treatment through telehealth. Their proprietary assessment combines clinical interviews with cognitive testing to provide thorough ADHD diagnosis. After evaluation, patients can continue with ADHD Online for medication management with board-certified providers. The platform serves adults and adolescents (ages 12+). Treatment includes ongoing video appointments for medication management and prescription services. ADHD Online accepts some insurance plans for treatment visits. Their detailed assessment approach differentiates them from simpler questionnaire-only evaluations.",
    best_for: [
      "Adults or teens seeking comprehensive ADHD evaluation",
      "Those wanting detailed assessment beyond basic screening",
      "People seeking ongoing telehealth ADHD medication management",
      "Those preferring board-certified providers for ADHD care"
    ],
    not_for: [
      "Children under 12",
      "Those seeking therapy-only ADHD treatment",
      "People in states where services aren't available"
    ],
    faqs: [
      {
        q: "What does ADHD Online's assessment include?",
        a: "The assessment includes standardized questionnaires, clinical interview components, and cognitive testing. It's more comprehensive than basic screenings, providing detailed information about attention, executive function, and whether you meet criteria for ADHD."
      },
      {
        q: "How much does ADHD Online cost?",
        a: "The initial assessment costs around $199-299. Treatment plans with ongoing medication management are subscription-based. Some insurance plans cover treatment visits. The assessment fee is typically self-pay."
      },
      {
        q: "Does ADHD Online prescribe stimulants?",
        a: "ADHD Online providers can prescribe FDA-approved ADHD medications including stimulants when clinically appropriate. Controlled substance telehealth prescribing has regulations that vary by state. Verify current availability for your state."
      },
      {
        q: "What ages does ADHD Online serve?",
        a: "ADHD Online serves adults and adolescents ages 12 and older. The assessment and treatment are designed for teens and adults, not younger children who may need specialized pediatric evaluation."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["ADHD assessment", "ADHD medication management", "Comprehensive evaluation", "Telehealth treatment"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Healthcare-grade security for assessments and treatment." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$199 assessment", notes: "Assessment fee plus subscription for ongoing treatment. Some insurance accepted for visits." },
    conditions: ["attention-deficit-hyperactivity-disorder"],
    primary_hubs: ["focus-adhd", "find-support"]
  },

  // === BATCH 4: CONSUMER APPS & PEER SUPPORT ===

  "calm": {
    one_liner: "Calm is a meditation and sleep app with guided sessions, sleep stories, and relaxation music to reduce stress and improve sleep quality.",
    long_description: "Calm is one of the most popular mental wellness apps worldwide, with over 100 million downloads and the App Store's App of the Year award. The app offers guided meditations ranging from 3-25 minutes, Sleep Stories narrated by celebrities, breathing exercises, stretching routines, and relaxing music. Programs target stress reduction, anxiety management, focus improvement, and better sleep. A 7-day free trial is available, after which premium costs about $70/year. Calm is a self-help tool designed for general wellness—it's not a replacement for clinical treatment of mental health conditions but can complement therapy.",
    best_for: [
      "People wanting to start a meditation practice",
      "Those struggling with sleep or stress",
      "Anyone interested in guided relaxation and mindfulness",
      "People who enjoy celebrity-narrated sleep content"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking clinical treatment for mental health conditions",
      "Those who need therapist support (this is self-guided)"
    ],
    faqs: [
      {
        q: "How much does Calm cost?",
        a: "Calm offers a 7-day free trial, then costs approximately $70/year or $15/month for premium. A free version provides limited content. Lifetime subscriptions are occasionally offered. Some employers and health plans provide Calm as a covered benefit—check your benefits."
      },
      {
        q: "Is Calm effective for anxiety?",
        a: "Studies show meditation apps like Calm can reduce stress and anxiety symptoms for mild to moderate concerns. Calm is a wellness tool, not clinical treatment. It works best as part of a broader self-care routine or alongside professional treatment for those with diagnosed conditions."
      },
      {
        q: "What are Sleep Stories?",
        a: "Sleep Stories are bedtime stories for adults, narrated by soothing voices including celebrities like Matthew McConaughey, Harry Styles, and LeBron James. The stories are designed to help you fall asleep through calming narratives and relaxing pacing."
      },
      {
        q: "How is Calm different from Headspace?",
        a: "Both are top meditation apps. Calm emphasizes sleep content (Sleep Stories), relaxing music, and celebrity narration. Headspace focuses more on structured meditation courses and animations. Try both free trials to see which style resonates with you."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Meditation", "Sleep improvement", "Stress reduction", "Relaxation"] },
    privacy: { grade: "B+", hipaa_compliant: false, gdpr_compliant: true, data_sold: false, notes: "Consumer wellness app, not healthcare. Review privacy policy for data practices." },
    pricing: { model: "subscription", free_tier: true, starting_price: "$70/year", notes: "7-day free trial. Limited free content. Some employers provide free access." },
    conditions: ["generalized-anxiety-disorder"],
    primary_hubs: ["sleep", "anxiety-stress"]
  },

  "headspace": {
    one_liner: "Headspace is a meditation and mindfulness app offering guided sessions, sleep content, and focus music to improve mental wellness.",
    long_description: "Headspace is a leading meditation app founded by a former Buddhist monk, offering guided meditations, sleep sounds, focus music, and mindfulness exercises. The app features structured courses for beginners through advanced meditators, covering stress, anxiety, sleep, focus, and relationships. Animations explain meditation concepts accessibly. Headspace for Work serves employers, and Headspace Health (acquired Ginger) offers clinical mental health services. The consumer app costs about $70/year after a free trial. Research studies show Headspace reduces stress and improves focus. Like Calm, it's a wellness tool rather than clinical treatment.",
    best_for: [
      "People wanting structured meditation courses",
      "Beginners learning mindfulness practices",
      "Those who enjoy animated, approachable content",
      "Employees with Headspace workplace benefits"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking clinical treatment for mental health conditions",
      "Those who need therapist support (self-guided app)"
    ],
    faqs: [
      {
        q: "How much does Headspace cost?",
        a: "Headspace costs approximately $70/year or $13/month after a free trial. Students get 85% off. Many employers provide Headspace free through workplace benefits. A limited free version offers some content without subscription."
      },
      {
        q: "Is Headspace clinically proven?",
        a: "Multiple peer-reviewed studies show Headspace reduces stress, improves focus, and enhances well-being. It's one of the most researched meditation apps. However, it's a wellness tool—not a substitute for clinical treatment of diagnosed mental health conditions."
      },
      {
        q: "What is Headspace Health?",
        a: "Headspace Health is the company formed when Headspace merged with Ginger (clinical mental health platform). Headspace Health offers the meditation app plus clinical services (therapy, psychiatry, coaching) for employers and health plans."
      },
      {
        q: "Is Headspace or Calm better?",
        a: "Both are excellent meditation apps. Headspace has more structured courses and an educational approach. Calm emphasizes sleep content and celebrity narration. Try both free trials—personal preference matters more than objective differences."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Meditation", "Mindfulness training", "Stress reduction", "Focus improvement"] },
    privacy: { grade: "B+", hipaa_compliant: false, gdpr_compliant: true, data_sold: false, notes: "Consumer wellness app. Headspace Health services are HIPAA compliant." },
    pricing: { model: "subscription", free_tier: true, starting_price: "$70/year", notes: "Free trial available. Student discounts. Employer benefits common." },
    conditions: ["generalized-anxiety-disorder"],
    primary_hubs: ["anxiety-stress", "sleep"]
  },

  "woebot": {
    one_liner: "Woebot is an AI-powered mental health chatbot using CBT techniques, available 24/7 for free to help manage anxiety, depression, and stress.",
    long_description: "Woebot is an AI chatbot designed by Stanford psychologists and researchers to deliver Cognitive Behavioral Therapy (CBT) techniques through conversation. The app provides 24/7 access to evidence-based mental health support through text-based check-ins, mood tracking, and therapeutic exercises. Woebot uses natural language processing to respond empathetically while teaching CBT skills like cognitive restructuring and mindfulness. The consumer app is free. Woebot Health also partners with health systems and payers for clinical applications. Research shows Woebot can reduce symptoms of depression and anxiety, though it's not a replacement for human therapy.",
    best_for: [
      "People wanting 24/7 access to mental health support",
      "Those interested in learning CBT techniques through an app",
      "People who prefer text-based interaction",
      "Those seeking free mental health tools"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People needing human therapist connection",
      "Those requiring medication management",
      "People with severe mental health conditions"
    ],
    faqs: [
      {
        q: "Is Woebot free?",
        a: "Yes, the Woebot consumer app is free. There are no subscriptions or in-app purchases for the basic experience. Woebot Health also offers clinical programs through healthcare organizations, which may have different arrangements."
      },
      {
        q: "Is Woebot actually effective?",
        a: "Research published in peer-reviewed journals shows Woebot can significantly reduce symptoms of depression and anxiety. A Stanford study found users experienced reduced depression symptoms after just two weeks. However, it's a supplement to—not replacement for—human therapy when needed."
      },
      {
        q: "How does Woebot use AI?",
        a: "Woebot uses natural language processing to understand your messages and respond conversationally. The AI delivers CBT-based therapeutic techniques, tracks your mood patterns, and provides personalized exercises. It's designed by clinical psychologists to be therapeutically sound."
      },
      {
        q: "Is Woebot a replacement for therapy?",
        a: "No, Woebot is a mental health tool that can complement therapy or help those with mild symptoms who can't access traditional care. For moderate to severe conditions, Woebot should be used alongside—not instead of—professional treatment. If you need human support, seek a therapist."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["CBT delivery", "Mood tracking", "Anxiety support", "Depression support"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "Woebot Health is HIPAA compliant. Consumer app has strong privacy protections." },
    pricing: { model: "free", free_tier: true, starting_price: "Free", notes: "Consumer app is free. Clinical programs through healthcare organizations." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression"]
  },

  "wysa": {
    one_liner: "Wysa is an AI mental health chatbot offering CBT-based support, with optional human coaching for anxiety, depression, and stress management.",
    long_description: "Wysa is an AI-powered mental health app combining chatbot support with optional access to human coaches. The AI uses CBT, DBT, meditation, and other evidence-based techniques to help users manage anxiety, depression, stress, and sleep issues. Daily check-ins track mood and suggest personalized exercises. For those wanting human support, Wysa offers text-based coaching with trained professionals for an additional fee. The app is available in 60+ countries and partners with employers and health plans. Research shows Wysa's AI can reduce depression symptoms. The free version provides substantial AI support; premium adds coaching.",
    best_for: [
      "People wanting AI support with option for human coaches",
      "Those looking for CBT and DBT techniques in an app",
      "People with mild to moderate anxiety or depression",
      "Employees whose company offers Wysa benefits"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People requiring clinical therapy or medication",
      "Those with severe mental health conditions"
    ],
    faqs: [
      {
        q: "Is Wysa free?",
        a: "Wysa's AI chatbot is free to use with substantial content. Premium features and human coaching sessions cost extra—typically around $99/month for unlimited coaching. Some employers and health plans provide Wysa premium as a benefit."
      },
      {
        q: "Does Wysa offer real human support?",
        a: "Yes, Wysa offers text-based coaching with trained mental health professionals as a premium add-on. You chat with the AI for immediate support and can book coaching sessions for more personalized human guidance. Coaches are not licensed therapists but trained in supportive techniques."
      },
      {
        q: "Is Wysa effective?",
        a: "Multiple studies show Wysa's AI significantly reduces symptoms of depression and anxiety. Research published in JMIR demonstrated clinical improvements after 2 weeks of use. It's evidence-based but should complement, not replace, professional care for moderate to severe conditions."
      },
      {
        q: "How is Wysa different from Woebot?",
        a: "Both are AI mental health chatbots. Wysa offers optional human coaching for additional support. Woebot is entirely free but AI-only. Both use CBT techniques. Try both to see which conversation style resonates—they have different personalities."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["AI mental health support", "CBT techniques", "Mood tracking", "Stress management"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Strong privacy protections for health data." },
    pricing: { model: "freemium", free_tier: true, starting_price: "Free (premium ~$99/mo)", notes: "AI is free. Human coaching is premium. Employer benefits available." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression"]
  },

  "sanvello": {
    one_liner: "Sanvello offers CBT-based tools for anxiety and depression with mood tracking, coping exercises, and peer community support, free with premium upgrades.",
    long_description: "Sanvello (formerly Pacifica) is a mental health app offering clinically-validated CBT tools for anxiety, depression, and stress. The app includes mood tracking, guided journeys, coping exercises, and a peer community for support. The free version provides essential tools; premium unlocks full content and optional coaching. Sanvello partners with many health insurance plans to provide free premium access—check if your plan covers it. The app has been used by over 5 million people and shows clinical improvements in anxiety and depression symptoms. It bridges self-help and clinical care with optional therapist matching.",
    best_for: [
      "People seeking CBT-based self-help tools",
      "Those wanting mood tracking and coping exercises",
      "People whose health insurance covers Sanvello premium",
      "Those interested in peer community support"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People requiring intensive clinical treatment",
      "Those seeking medication management"
    ],
    faqs: [
      {
        q: "Is Sanvello free?",
        a: "Sanvello offers substantial free content including mood tracking and basic CBT tools. Premium features cost about $9/month. However, many health insurance plans (UnitedHealthcare, Cigna, and others) provide free premium access—check your benefits portal."
      },
      {
        q: "Does my insurance cover Sanvello?",
        a: "Many health plans partner with Sanvello to provide free premium access. Check your insurance benefits or search for Sanvello in your plan's app/wellness offerings. If covered, you get full access at no cost."
      },
      {
        q: "What's included in Sanvello?",
        a: "Sanvello includes daily mood tracking, guided journeys for specific challenges, CBT-based coping exercises, mindfulness meditations, a peer community, and progress insights. Premium adds full content library and optional coaching sessions."
      },
      {
        q: "Is Sanvello evidence-based?",
        a: "Yes, Sanvello uses clinically-validated CBT techniques. Studies show the app produces significant reductions in anxiety and depression symptoms. It's designed with clinical input and used by health systems as part of care pathways."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["CBT tools", "Mood tracking", "Anxiety management", "Depression support"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Partners with health plans under healthcare privacy standards." },
    pricing: { model: "freemium", free_tier: true, starting_price: "$9/month", notes: "Many insurance plans provide free premium. Check your benefits." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression"]
  },

  "happify": {
    one_liner: "Happify uses science-based games and activities to build emotional resilience, reduce stress, and increase happiness and well-being.",
    long_description: "Happify is a mental wellness platform using positive psychology, CBT, and mindfulness techniques delivered through games, activities, and guided programs. The app targets stress reduction, building resilience, overcoming negative thoughts, and increasing happiness. Programs are designed by scientists and backed by research. Happify offers both consumer apps and enterprise solutions (Happify Health) for employers and health plans. The gamified approach makes mental wellness engaging. A free version provides limited access; premium unlocks full content. Clinical studies show Happify users experience significant improvements in well-being and reductions in depression and anxiety.",
    best_for: [
      "People who enjoy game-based learning approaches",
      "Those wanting to build resilience and positive thinking",
      "Employees with Happify workplace benefits",
      "People seeking evidence-based wellness activities"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People requiring clinical treatment for mental illness",
      "Those who prefer traditional meditation or therapy formats"
    ],
    faqs: [
      {
        q: "How does Happify work?",
        a: "Happify delivers positive psychology and CBT techniques through interactive games, activities, and guided tracks. You complete daily activities that build skills like gratitude, mindfulness, and cognitive reframing. The gamified format makes mental wellness practice more engaging."
      },
      {
        q: "Is Happify free?",
        a: "Happify offers limited free access. Premium costs approximately $12-15/month or $140/year. Many employers provide Happify free through workplace wellness benefits. Happify Health serves enterprise customers with additional clinical features."
      },
      {
        q: "Is Happify evidence-based?",
        a: "Yes, Happify is backed by multiple peer-reviewed studies showing users experience significant increases in well-being and decreases in depression and anxiety. The approach is grounded in positive psychology research and CBT principles."
      },
      {
        q: "What is Happify Health?",
        a: "Happify Health is the enterprise/clinical side of Happify, serving employers, health plans, and healthcare organizations. It includes additional features for population health, clinical integration, and outcomes tracking beyond the consumer app."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Positive psychology", "Resilience building", "Stress reduction", "Well-being improvement"] },
    privacy: { grade: "B+", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "Happify Health is HIPAA compliant. Consumer app follows privacy best practices." },
    pricing: { model: "freemium", free_tier: true, starting_price: "$12/month", notes: "Limited free version. Many employers provide free access." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression"]
  },

  "7cups": {
    one_liner: "7 Cups provides free peer support through trained listeners plus optional online therapy, connecting millions seeking emotional support worldwide.",
    long_description: "7 Cups is a peer support platform connecting people who need emotional support with trained volunteer listeners for free, anonymous chat conversations. Over 500,000 listeners have been trained to provide empathetic support for stress, anxiety, depression, relationships, and life challenges. For those wanting professional help, 7 Cups offers paid online therapy with licensed therapists. The community includes forums, group support, and self-help guides. 7 Cups serves people in 189 countries and has facilitated millions of supportive conversations. It's particularly valuable for those who want someone to talk to but aren't ready for formal therapy.",
    best_for: [
      "People wanting free, anonymous emotional support",
      "Those who need someone to talk to about stress or problems",
      "People not ready for formal therapy but wanting human connection",
      "Those interested in peer support communities"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People requiring clinical mental health treatment",
      "Those seeking medication management"
    ],
    faqs: [
      {
        q: "Is 7 Cups really free?",
        a: "Yes, peer support with trained listeners is completely free. You can chat anonymously with volunteers who provide emotional support. Paid online therapy with licensed therapists is also available for those wanting professional treatment, but the core peer support is free."
      },
      {
        q: "Who are 7 Cups listeners?",
        a: "Listeners are volunteers who complete 7 Cups' active listening training. They're not therapists but are trained to provide empathetic, non-judgmental support. Anyone can become a listener. Quality varies, but the training emphasizes supportive listening skills."
      },
      {
        q: "Is 7 Cups confidential?",
        a: "Yes, you can use 7 Cups anonymously. Conversations with listeners are private. Like all platforms, there are limits around imminent harm. Review their privacy policy for details on data handling."
      },
      {
        q: "Should I use 7 Cups or see a therapist?",
        a: "7 Cups peer support is great for everyday stress and needing someone to talk to. For mental health conditions like depression or anxiety, professional therapy is more appropriate. 7 Cups also offers paid therapy for those ready for professional treatment."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "emerging", primary_uses: ["Peer support", "Emotional support", "Anonymous listening", "Community support"] },
    privacy: { grade: "B", hipaa_compliant: false, gdpr_compliant: true, data_sold: false, notes: "Peer support is not healthcare. Therapy services follow appropriate standards." },
    pricing: { model: "freemium", free_tier: true, starting_price: "Free (therapy extra)", notes: "Peer support free. Professional therapy available for additional cost." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress"]
  },

  "nami": {
    one_liner: "NAMI (National Alliance on Mental Illness) provides free education, support groups, and advocacy for people with mental illness and their families.",
    long_description: "NAMI (National Alliance on Mental Illness) is the nation's largest grassroots mental health organization, offering free programs, support groups, and resources. NAMI provides education classes like Family-to-Family for caregivers and Peer-to-Peer for those with mental illness. Local NAMI affiliates across the US offer in-person support groups and programs. The NAMI HelpLine (1-800-950-NAMI) provides free information and referrals. NAMI also advocates for better mental health policies and fights stigma. All programs are free, led by trained peers with lived experience. NAMI is a complement to—not replacement for—clinical treatment.",
    best_for: [
      "People with mental illness seeking peer support",
      "Family members wanting to understand mental illness",
      "Those looking for free mental health education",
      "People wanting to connect with the mental health community"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking clinical treatment (NAMI provides support, not treatment)",
      "Those wanting therapy or medication management"
    ],
    faqs: [
      {
        q: "Is NAMI free?",
        a: "Yes, all NAMI programs, classes, and support groups are free. NAMI is a nonprofit funded by donations. You can attend Family-to-Family classes, Peer-to-Peer groups, and support meetings at no cost."
      },
      {
        q: "What is NAMI's Family-to-Family program?",
        a: "Family-to-Family is a free 8-week education class for family members and caregivers of people with mental illness. It covers diagnosis, treatment, coping strategies, and self-care. Classes are taught by trained family members who've been there."
      },
      {
        q: "Does NAMI provide therapy?",
        a: "No, NAMI provides education and peer support, not clinical treatment. NAMI support groups are led by people with lived experience, not therapists. For therapy, use NAMI's HelpLine to find treatment resources in your area."
      },
      {
        q: "How do I find my local NAMI?",
        a: "Visit nami.org and search for your local NAMI affiliate. There are NAMI chapters throughout the US offering in-person and virtual programs. The NAMI HelpLine (1-800-950-NAMI) can also connect you with local resources."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Peer support", "Family education", "Mental health advocacy", "Community resources"] },
    privacy: { grade: "A", hipaa_compliant: false, gdpr_compliant: true, data_sold: false, notes: "Nonprofit organization. Not a healthcare provider—different privacy standards apply." },
    pricing: { model: "free", free_tier: true, starting_price: "Free", notes: "All NAMI programs are free. Funded by donations." },
    conditions: ["bipolar-disorder", "schizophrenia", "major-depressive-disorder"],
    primary_hubs: ["serious-mental-illness", "find-support"]
  },

  "hims-mental-health": {
    one_liner: "Hims provides online mental health treatment for men including anxiety and depression medication and therapy, with prescriptions delivered discreetly.",
    long_description: "Hims offers online mental health services for men as part of its broader telehealth platform. Services include psychiatric evaluation, medication prescriptions (for anxiety, depression), and therapy sessions via video. The process is simple: complete an online assessment, consult with a provider, and receive medications delivered to your door. Hims focuses on reducing stigma and making care accessible for men who might not otherwise seek help. Pricing is transparent—medications like generic Lexapro start around $25/month. Hims doesn't accept insurance but offers affordable cash-pay pricing. It's designed for convenience but isn't appropriate for severe conditions.",
    best_for: [
      "Men seeking convenient online mental health care",
      "Those wanting straightforward medication access",
      "People who prefer discreet, direct-to-consumer healthcare",
      "Those comfortable with cash-pay telehealth"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People with severe or complex mental health conditions",
      "Those seeking insurance-covered treatment",
      "Women (see Hers for women's health)"
    ],
    faqs: [
      {
        q: "How much does Hims mental health cost?",
        a: "Hims doesn't accept insurance—it's cash-pay only. Medication consultations start around $25. Generic antidepressants and anti-anxiety medications cost approximately $20-30/month. Therapy sessions are additional. Pricing is transparent on their website."
      },
      {
        q: "What mental health medications does Hims prescribe?",
        a: "Hims prescribes common anxiety and depression medications including SSRIs (like generic Lexapro, Zoloft) and other non-controlled medications. They don't prescribe controlled substances like benzodiazepines or stimulants. A licensed provider evaluates your needs."
      },
      {
        q: "Does Hims accept insurance?",
        a: "No, Hims operates on a cash-pay model without insurance. Pricing is straightforward and often competitive with insurance copays, but you can't use your health insurance benefits. HSA/FSA cards may be accepted."
      },
      {
        q: "Is Hims legitimate for mental health?",
        a: "Yes, Hims uses licensed physicians and nurse practitioners. It's convenient for mild to moderate anxiety and depression when you want simple medication access. For complex conditions or those needing therapy, other platforms may be more appropriate."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Anxiety medication", "Depression treatment", "Online psychiatry", "Men's mental health"] },
    privacy: { grade: "B+", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant telehealth. Review privacy policy for marketing data use." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$25/consultation", notes: "Cash-pay only. No insurance accepted. Medications additional." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "find-support"]
  },

  "cerebral-care": {
    one_liner: "Cerebral Care provides online psychiatry and therapy for anxiety, depression, and insomnia with medication delivery and insurance options.",
    long_description: "Cerebral Care (distinct from the main Cerebral platform) offers telehealth mental health services with a focus on medication management and therapy. Services include psychiatric evaluation via video, prescription medications delivered to your door, and therapy sessions with licensed therapists. Cerebral Care accepts some insurance plans and offers self-pay options. The platform treats anxiety, depression, insomnia, and related conditions. Note that like all telehealth ADHD services, controlled substance prescribing has faced regulatory changes—verify current policies. The platform emphasizes accessible, convenient mental health care.",
    best_for: [
      "People seeking online psychiatry and medication management",
      "Those wanting combined therapy and medication treatment",
      "People with insurance Cerebral Care accepts",
      "Those preferring medication delivery to pharmacy pickup"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking controlled substances (limited availability)",
      "Those requiring in-person psychiatric care"
    ],
    faqs: [
      {
        q: "Is Cerebral Care the same as Cerebral?",
        a: "Cerebral Care is related to the Cerebral platform but may have distinct offerings or insurance arrangements. Check the specific services and coverage available through Cerebral Care versus the main Cerebral platform based on your needs."
      },
      {
        q: "Does Cerebral Care accept insurance?",
        a: "Yes, Cerebral Care accepts some insurance plans. Coverage varies by plan and state. Check their website to verify your specific insurance is accepted. Self-pay options are also available."
      },
      {
        q: "What conditions does Cerebral Care treat?",
        a: "Cerebral Care treats anxiety, depression, insomnia, and related conditions. For ADHD and controlled substances, availability varies significantly by state due to regulatory changes. Verify current offerings for your specific needs."
      },
      {
        q: "How does medication delivery work?",
        a: "After your psychiatric evaluation, prescriptions can be sent to your pharmacy or delivered directly to your home depending on the medication and your state. Non-controlled medications have easier delivery options."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Online psychiatry", "Anxiety treatment", "Depression medication", "Telehealth therapy"] },
    privacy: { grade: "B+", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant telehealth platform." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$85/month self-pay", notes: "Some insurance accepted. Self-pay available. Medication costs additional." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "find-support"]
  },

  "k-health": {
    one_liner: "K Health offers AI-assisted primary care and mental health treatment with real doctors, providing anxiety and depression medication for affordable prices.",
    long_description: "K Health is a telehealth platform using AI to help users understand symptoms and connect with licensed doctors for treatment. The mental health services treat anxiety and depression with medication, therapy, and ongoing care. The AI helps triage your concerns before you see a provider, making consultations efficient. K Health offers affordable cash-pay pricing plus insurance options. Unlimited primary care membership (including mental health) costs around $49/year plus per-visit fees. The platform is designed for common conditions that can be effectively treated remotely. It's not suited for complex psychiatric needs.",
    best_for: [
      "People wanting affordable telehealth mental health care",
      "Those comfortable with AI-assisted health platforms",
      "People with mild to moderate anxiety or depression",
      "Those seeking both primary care and mental health in one platform"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People with complex psychiatric conditions",
      "Those seeking controlled substance prescriptions"
    ],
    faqs: [
      {
        q: "How does K Health use AI?",
        a: "K Health's AI analyzes your symptoms based on data from millions of patient records to help identify potential conditions. You then connect with a real doctor who makes treatment decisions. The AI assists but doesn't replace physician care."
      },
      {
        q: "How much does K Health mental health cost?",
        a: "K Health offers $49/year membership for unlimited free assessments. Mental health visits cost approximately $49-73 per visit on top of membership. Medications are additional. Some insurance plans are also accepted."
      },
      {
        q: "What mental health medications can K Health prescribe?",
        a: "K Health prescribes common anxiety and depression medications including SSRIs and non-controlled anti-anxiety medications. They don't prescribe controlled substances. A licensed physician evaluates your needs during the consultation."
      },
      {
        q: "Is K Health legitimate?",
        a: "Yes, K Health uses licensed physicians and has millions of users. The AI is a tool that helps providers work efficiently. For straightforward anxiety and depression, it's a legitimate affordable option. Complex conditions may need more specialized care."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["AI-assisted healthcare", "Anxiety medication", "Depression treatment", "Affordable telehealth"] },
    privacy: { grade: "B+", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. AI uses anonymized data. Review privacy policy for details." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$49/year membership", notes: "Membership plus per-visit fees. Some insurance accepted." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["anxiety-stress", "mood-depression", "find-support"]
  },

  "mantra-health": {
    one_liner: "Mantra Health provides online mental health services specifically for college students, with therapy, psychiatry, and crisis support through campus partnerships.",
    long_description: "Mantra Health partners with colleges and universities to provide comprehensive mental health support for students. Services include therapy, psychiatry, crisis support, and self-care tools—all delivered virtually and often at no cost to students through their school. Mantra addresses the college mental health crisis by expanding capacity beyond campus counseling centers. Students can access care without long waitlists common at campus mental health services. The platform integrates with school counseling services rather than replacing them. Mantra serves over 100 institutions and reaches millions of students.",
    best_for: [
      "College students at schools partnering with Mantra",
      "Students facing waitlists at campus counseling",
      "Young adults wanting convenient virtual mental health care",
      "Students needing psychiatry or therapy during school"
    ],
    not_for: [
      "Non-students or those at schools without Mantra",
      "Adults outside the college context",
      "Those in crisis needing immediate emergency care (call 988)"
    ],
    faqs: [
      {
        q: "Is Mantra Health free for students?",
        a: "If your college partners with Mantra, services are typically free or heavily subsidized for enrolled students. The school pays for the partnership. Check with your campus counseling center or student health to see if Mantra is available."
      },
      {
        q: "How do I know if my college has Mantra?",
        a: "Check with your campus counseling center, student health services, or search for mental health resources on your school's website. Mantra partners with over 100 institutions. Your school should promote available resources during orientation."
      },
      {
        q: "What services does Mantra offer?",
        a: "Mantra provides individual therapy, group therapy, psychiatric medication management, crisis support, and self-care tools. Services are delivered virtually by licensed providers who specialize in working with college students."
      },
      {
        q: "How does Mantra work with campus counseling?",
        a: "Mantra supplements campus counseling centers rather than replacing them. Students with immediate or complex needs may see campus counselors, while Mantra provides overflow capacity and specific services. The systems coordinate to serve students better."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["College mental health", "Student therapy", "Campus psychiatry", "Young adult care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Student health information protected. Schools don't see individual records." },
    pricing: { model: "enterprise", free_tier: true, starting_price: "Free through school", notes: "Typically free for students at partner institutions." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "uwill": {
    one_liner: "Uwill provides telehealth mental health services for college students through campus partnerships, offering therapy and psychiatry at no cost to students.",
    long_description: "Uwill is a telehealth mental health platform serving college students through institutional partnerships. The platform provides individual therapy, group therapy, and psychiatry services via video appointments with licensed providers. Students access Uwill through their school at no out-of-pocket cost. Uwill helps colleges expand mental health capacity beyond traditional counseling centers, addressing the student mental health crisis. Appointments are typically available within days rather than the weeks-long waits common at campus health. The platform serves hundreds of institutions across the US.",
    best_for: [
      "College students at Uwill partner schools",
      "Students needing faster access than campus counseling waitlists",
      "Those wanting video therapy from anywhere",
      "Students needing ongoing mental health support during school"
    ],
    not_for: [
      "Non-students or those at schools without Uwill",
      "Adults outside the college population",
      "Those in crisis needing emergency care (call 988)"
    ],
    faqs: [
      {
        q: "Is Uwill free?",
        a: "Yes, if your college partners with Uwill, services are free for enrolled students. Your school pays for the service. Check your campus health or counseling center to confirm Uwill availability at your institution."
      },
      {
        q: "How do I access Uwill?",
        a: "If your school offers Uwill, you typically access it through your student portal or campus health website. You'll need your school email to verify enrollment. From there, you can schedule appointments with available providers."
      },
      {
        q: "What's the difference between Uwill and campus counseling?",
        a: "Uwill supplements campus counseling by providing additional telehealth capacity. Campus counseling may offer in-person services and specific campus resources. Uwill providers are external clinicians focused on telehealth delivery. Both serve students."
      },
      {
        q: "Does Uwill offer psychiatry?",
        a: "Yes, Uwill offers psychiatric services for medication management alongside therapy. Availability depends on your school's specific contract. Most partnerships include both therapy and psychiatry options."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["College mental health", "Student teletherapy", "Campus psychiatry", "Young adult care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Student records not shared with schools except as required for safety." },
    pricing: { model: "enterprise", free_tier: true, starting_price: "Free through school", notes: "Free for students at partner institutions." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "togetherall": {
    one_liner: "Togetherall is an online peer support community for mental health, offering anonymous support, self-guided courses, and 24/7 clinical moderation.",
    long_description: "Togetherall (formerly Big White Wall) is a clinically moderated online mental health community providing peer support 24/7. Users share experiences anonymously in forums and group support, complete self-guided courses, and access therapeutic tools. The community is moderated by trained Wall Guides who ensure safety and appropriate support. Togetherall is typically offered free through employers, colleges, or health plans. The anonymous format reduces stigma and encourages open discussion about mental health challenges. Clinical research shows participation improves well-being and reduces anxiety and depression symptoms.",
    best_for: [
      "People who want anonymous peer support for mental health",
      "Those whose employer or school offers Togetherall",
      "People who prefer community support over one-on-one therapy",
      "Night owls needing 24/7 mental health support"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People requiring clinical treatment or medication",
      "Those without sponsored access (not available direct-to-consumer)"
    ],
    faqs: [
      {
        q: "Is Togetherall free?",
        a: "Togetherall is free for users when their employer, college, or health plan provides it as a benefit. It's not available for direct individual purchase. Check if your organization offers Togetherall access."
      },
      {
        q: "Is Togetherall anonymous?",
        a: "Yes, Togetherall is designed for anonymous participation. You create a username not connected to your real identity. The community format allows honest sharing without personal exposure. Clinical moderators ensure safety."
      },
      {
        q: "What is clinical moderation?",
        a: "Wall Guides are trained professionals who monitor the community 24/7 to ensure conversations remain supportive and safe. They intervene when someone might be at risk and guide discussions constructively. It's not a replacement for therapy but adds safety to peer support."
      },
      {
        q: "How is Togetherall different from Reddit or forums?",
        a: "Togetherall is purpose-built for mental health with clinical oversight. Unlike general forums, trained moderators ensure safety, conversations are therapeutic, and evidence-based resources are integrated. It's a structured, safe environment rather than open internet discussion."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Peer support", "Anonymous community", "Self-guided courses", "24/7 support"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "Anonymous by design. Clinical moderation with strict privacy protocols." },
    pricing: { model: "enterprise", free_tier: true, starting_price: "Free through sponsor", notes: "Available through employers, colleges, and health plans. Not direct-to-consumer." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  // === BATCH 5: MORE CLINICAL & SPECIALTY PLATFORMS ===

  "carbon-health-virtual-care": {
    one_liner: "Carbon Health provides virtual urgent care and primary care including mental health services, with same-day appointments and insurance accepted.",
    long_description: "Carbon Health is a modern healthcare company offering virtual and in-person urgent care, primary care, and mental health services. Virtual visits provide same-day access to licensed clinicians who can treat anxiety, depression, and other mental health concerns. Carbon Health accepts most major insurance plans and offers transparent self-pay pricing. Mental health services include evaluation, medication management, and referrals for ongoing therapy. The platform is designed for accessible, tech-enabled healthcare. While not a specialized mental health platform, Carbon Health serves those needing quick access to mental health medication or evaluation.",
    best_for: [
      "People needing same-day access to mental health evaluation",
      "Those wanting combined primary care and mental health",
      "People with insurance seeking covered telehealth",
      "Those in urgent need of anxiety or depression medication"
    ],
    not_for: [
      "Those in crisis needing emergency care (call 988)",
      "People seeking ongoing psychotherapy",
      "Those with complex psychiatric conditions"
    ],
    faqs: [
      {
        q: "Does Carbon Health offer mental health services?",
        a: "Yes, Carbon Health provides mental health evaluation and medication management through virtual and in-person visits. Clinicians can prescribe common anxiety and depression medications. For ongoing therapy, they can provide referrals."
      },
      {
        q: "Does Carbon Health accept insurance?",
        a: "Yes, Carbon Health accepts most major insurance plans. Check their website to verify your specific plan. They also offer transparent self-pay pricing for those without coverage."
      },
      {
        q: "How quickly can I see a provider?",
        a: "Carbon Health offers same-day virtual appointments in most cases. For mental health concerns, you can typically see a provider within hours rather than waiting days or weeks like traditional practices."
      },
      {
        q: "Is Carbon Health good for mental health treatment?",
        a: "Carbon Health works well for initial evaluation and medication for common conditions like anxiety and depression. For specialized psychiatric care, complex conditions, or ongoing therapy, a dedicated mental health platform may be more appropriate."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Virtual primary care", "Mental health medication", "Urgent care", "Telehealth"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare provider." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance copay", notes: "Most insurance accepted. Transparent self-pay pricing available." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress"]
  },

  "circle-medical": {
    one_liner: "Circle Medical is a primary care practice with integrated mental health services, offering video visits for anxiety and depression treatment.",
    long_description: "Circle Medical is a technology-enabled primary care practice offering comprehensive healthcare including mental health services. Patients can see providers via video for anxiety, depression, and other mental health concerns alongside their primary care. Circle Medical accepts most major insurance plans and provides same-day or next-day appointments. Mental health services include evaluation, medication management, and coordination with therapists. The integrated approach means your primary care provider understands your mental health alongside physical health. Circle Medical operates in multiple states with plans to expand.",
    best_for: [
      "People wanting integrated primary and mental health care",
      "Those seeking insurance-covered video visits",
      "People who prefer their PCP to manage mental health medication",
      "Those wanting quick appointment availability"
    ],
    not_for: [
      "Those in crisis needing emergency care (call 988)",
      "People seeking intensive psychiatric care",
      "Those outside Circle Medical's service areas"
    ],
    faqs: [
      {
        q: "Does Circle Medical treat mental health conditions?",
        a: "Yes, Circle Medical providers treat common mental health conditions including anxiety, depression, and stress. They can prescribe medications and coordinate with therapists for comprehensive care."
      },
      {
        q: "Does Circle Medical accept insurance?",
        a: "Yes, Circle Medical accepts most major insurance plans. Video visits are typically covered at your standard telehealth or office visit copay. Check their website for specific plan acceptance."
      },
      {
        q: "Where is Circle Medical available?",
        a: "Circle Medical operates in multiple states with ongoing expansion. Check their website for current availability in your area. Services are primarily delivered via video visits."
      },
      {
        q: "Is Circle Medical just for primary care?",
        a: "Circle Medical provides comprehensive primary care including mental health services. They're designed for integrated care—managing both physical and mental health together rather than fragmenting care across providers."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Primary care", "Mental health medication", "Integrated care", "Telehealth"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare provider." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance copay", notes: "Most major insurance accepted." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress"]
  },

  "affect-therapeutics": {
    one_liner: "Affect Therapeutics provides virtual substance use treatment combining medication, therapy, and peer support for alcohol and opioid addiction.",
    long_description: "Affect Therapeutics offers virtual addiction treatment for alcohol and opioid use disorders, combining FDA-approved medications with behavioral therapy and peer recovery support. The program includes video appointments with providers for medication management (Suboxone, naltrexone), therapy sessions with licensed counselors, and support from peer recovery coaches. Affect accepts many insurance plans including Medicaid. The comprehensive approach addresses addiction as a chronic disease requiring ongoing support. Treatment is entirely virtual, making it accessible for those who can't attend in-person programs.",
    best_for: [
      "People seeking virtual addiction treatment",
      "Those wanting medication-assisted treatment (MAT)",
      "People with insurance covering substance use treatment",
      "Those who need flexible, remote addiction care"
    ],
    not_for: [
      "Those requiring medical detox",
      "People needing residential treatment",
      "Those outside Affect's service areas"
    ],
    faqs: [
      {
        q: "What addictions does Affect Therapeutics treat?",
        a: "Affect specializes in alcohol use disorder and opioid use disorder. Treatment includes FDA-approved medications like Suboxone and naltrexone combined with therapy and peer support."
      },
      {
        q: "Does Affect accept insurance?",
        a: "Yes, Affect accepts many insurance plans including Medicaid in several states. Contact them to verify your specific coverage. Treatment for substance use disorder is often covered by insurance."
      },
      {
        q: "Is Affect treatment effective?",
        a: "Affect uses evidence-based approaches: FDA-approved medications combined with behavioral therapy, which is the gold standard for addiction treatment. Outcomes track retention and substance use reduction."
      },
      {
        q: "How does virtual addiction treatment work?",
        a: "You have video appointments with prescribers for medication management, therapy sessions with counselors, and ongoing support from peer recovery coaches. All care is delivered virtually through your phone or computer."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Substance use treatment", "MAT", "Addiction therapy", "Peer support"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Substance use records protected under 42 CFR Part 2." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance-based", notes: "Many insurance and Medicaid plans accepted." },
    conditions: ["alcohol-use-disorder", "opioid-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "ophelia": {
    one_liner: "Ophelia provides telehealth Suboxone treatment for opioid addiction, combining medication management with clinical support and care coordination.",
    long_description: "Ophelia is a telehealth platform specializing in medication-assisted treatment (MAT) for opioid use disorder using buprenorphine (Suboxone). The program connects patients with clinicians via video for evaluation and ongoing medication management. Ophelia accepts most commercial insurance and some Medicaid plans. Treatment includes regular check-ins, care coordination, and support from a dedicated care team. The focus is specifically on opioid addiction—they don't treat other substances. Ophelia operates in multiple states with a mission to expand access to evidence-based opioid treatment.",
    best_for: [
      "People seeking Suboxone treatment for opioid addiction",
      "Those with insurance covering MAT",
      "People wanting telehealth addiction treatment",
      "Those in states where Ophelia operates"
    ],
    not_for: [
      "Those requiring medical detox",
      "People seeking alcohol or other substance treatment",
      "Those needing in-person care or residential treatment"
    ],
    faqs: [
      {
        q: "How does Ophelia treatment work?",
        a: "Start with a video evaluation with a licensed clinician. If appropriate, you receive a Suboxone prescription sent to your pharmacy. Ongoing video check-ins and care team support help you stay on track with recovery."
      },
      {
        q: "Does Ophelia accept insurance?",
        a: "Yes, Ophelia accepts most commercial insurance and some Medicaid plans. Coverage varies by state. Contact them to verify your specific insurance before enrolling."
      },
      {
        q: "What medication does Ophelia prescribe?",
        a: "Ophelia prescribes buprenorphine (Suboxone, Subutex) for opioid use disorder. This FDA-approved medication reduces cravings and withdrawal symptoms. Your clinician determines the appropriate medication and dosage."
      },
      {
        q: "Where is Ophelia available?",
        a: "Ophelia operates in multiple states and continues expanding. Check their website for current availability in your area. All care is delivered via telehealth."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Opioid addiction treatment", "Buprenorphine prescribing", "MAT", "Telehealth addiction care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. 42 CFR Part 2 protections for substance use records." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance-based", notes: "Most commercial insurance and some Medicaid accepted." },
    conditions: ["opioid-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "groups-recover-together": {
    one_liner: "Groups Recover Together provides in-person and virtual opioid addiction treatment with medication, group therapy, and peer support.",
    long_description: "Groups Recover Together is an addiction treatment provider offering comprehensive care for opioid use disorder through a combination of medication, group therapy, and peer support. Treatment includes MAT with Suboxone, weekly group counseling sessions, and access to peer recovery support. Groups operates over 100 locations across multiple states with both in-person and telehealth options. The model emphasizes community and accountability through group-based recovery. Most commercial insurance and Medicaid are accepted. Treatment approaches addiction as a chronic condition requiring ongoing support.",
    best_for: [
      "People seeking opioid addiction treatment with group support",
      "Those wanting combination of medication and counseling",
      "People with insurance covering addiction treatment",
      "Those who benefit from peer accountability"
    ],
    not_for: [
      "Those requiring medical detox",
      "People seeking alcohol-only or other substance treatment",
      "Those who strongly prefer individual over group therapy"
    ],
    faqs: [
      {
        q: "How does Groups Recover Together work?",
        a: "Treatment includes medication (Suboxone) for physical recovery, weekly group therapy sessions for behavioral support, and access to peer recovery community. You meet regularly with your care team and other members in recovery."
      },
      {
        q: "Does Groups accept insurance?",
        a: "Yes, Groups accepts most commercial insurance and Medicaid in their service areas. Coverage for MAT and group therapy is required under parity laws. Contact them to verify your specific plan."
      },
      {
        q: "Is treatment in-person or virtual?",
        a: "Groups offers both. Many locations provide in-person group sessions while telehealth is available for medical appointments and some groups. The mix depends on your location and preferences."
      },
      {
        q: "Why group therapy for addiction?",
        a: "Research shows group-based recovery provides accountability, peer support, and community that enhance outcomes. Sharing experiences with others in recovery reduces isolation and builds lasting support networks."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Opioid addiction treatment", "Group therapy", "MAT", "Peer recovery support"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Substance use records protected under 42 CFR Part 2." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Insurance-based", notes: "Most commercial insurance and Medicaid accepted." },
    conditions: ["opioid-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "hazelden-betty-ford": {
    one_liner: "Hazelden Betty Ford provides comprehensive addiction treatment from virtual care to residential rehab, with 75+ years of experience in recovery.",
    long_description: "Hazelden Betty Ford is one of the most recognized names in addiction treatment, offering a full continuum of care from virtual outpatient to residential rehabilitation. Services include medical detox, residential treatment, outpatient programs, MAT, family programs, and alumni support. The organization operates treatment centers across the US and provides virtual services nationwide. Treatment integrates the 12-Step philosophy with evidence-based clinical care. While residential programs are intensive (and expensive without insurance), Hazelden Betty Ford's virtual and outpatient options provide more accessible entry points.",
    best_for: [
      "People seeking reputable, established addiction treatment",
      "Those needing residential or intensive care",
      "Families wanting comprehensive addiction support",
      "Those whose insurance covers Hazelden Betty Ford"
    ],
    not_for: [
      "Those seeking only medication without intensive programming",
      "People without insurance or ability to pay high costs",
      "Those opposed to 12-Step philosophy in treatment"
    ],
    faqs: [
      {
        q: "How much does Hazelden Betty Ford cost?",
        a: "Costs vary significantly by program level. Residential treatment can be $30,000+ per month, while virtual and outpatient programs are much more affordable. Many insurance plans cover Hazelden Betty Ford at various levels of care."
      },
      {
        q: "Does Hazelden Betty Ford use 12-Step programs?",
        a: "Yes, Hazelden Betty Ford integrates 12-Step principles with evidence-based clinical treatment. This includes introducing patients to AA/NA while also providing medical care, therapy, and MAT when appropriate."
      },
      {
        q: "What levels of care does Hazelden Betty Ford offer?",
        a: "They offer medical detox, residential treatment, partial hospitalization, intensive outpatient, outpatient, and virtual programs. Patients step through levels as appropriate for their recovery stage."
      },
      {
        q: "Does insurance cover Hazelden Betty Ford?",
        a: "Many insurance plans cover treatment at Hazelden Betty Ford. Coverage varies by plan and level of care. Their admissions team helps verify benefits and explore coverage options."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Addiction treatment", "Residential rehab", "12-Step treatment", "Substance use continuum"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. 42 CFR Part 2 protections for substance use records." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Varies by program", notes: "Insurance often covers. Residential programs expensive without coverage." },
    conditions: ["alcohol-use-disorder", "opioid-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "crisis-text-line": {
    one_liner: "Crisis Text Line provides free 24/7 crisis support via text message, connecting people in crisis with trained counselors.",
    long_description: "Crisis Text Line is a free, 24/7 text-based crisis service available to anyone in the US. Text HOME to 741741 to connect with a trained crisis counselor who can help with any emotional crisis—anxiety, depression, suicidal thoughts, abuse, or any overwhelming situation. Conversations are confidential and anonymous. Crisis counselors are volunteers who complete extensive training in crisis intervention. This is not ongoing therapy but immediate support for people in distress. Crisis Text Line has handled millions of conversations since 2013 and is a vital resource for those who prefer texting to calling.",
    best_for: [
      "People in emotional crisis who prefer texting",
      "Those uncomfortable calling crisis hotlines",
      "Young people who communicate primarily via text",
      "Anyone needing immediate support for overwhelming emotions"
    ],
    not_for: [
      "Those with life-threatening emergencies (call 911)",
      "People seeking ongoing therapy or treatment",
      "Those needing medication management"
    ],
    faqs: [
      {
        q: "How do I reach Crisis Text Line?",
        a: "Text HOME to 741741 from anywhere in the US to connect with a trained crisis counselor. Conversations are free, confidential, and available 24/7."
      },
      {
        q: "Who answers Crisis Text Line?",
        a: "Trained volunteer crisis counselors answer texts. They complete 30+ hours of training in crisis intervention and are supervised by mental health professionals. They're there to listen and help you through difficult moments."
      },
      {
        q: "Is Crisis Text Line confidential?",
        a: "Yes, conversations are confidential and you don't need to share identifying information. The only exception is if there's imminent risk to life, where counselors follow safety protocols."
      },
      {
        q: "What qualifies as a crisis for Crisis Text Line?",
        a: "Any overwhelming emotional distress—anxiety, depression, suicidal thoughts, relationship issues, abuse, grief. You don't need to be suicidal to reach out. If you're struggling emotionally, Crisis Text Line is there."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Crisis intervention", "Text-based support", "Suicide prevention", "Emotional crisis support"] },
    privacy: { grade: "A", hipaa_compliant: false, gdpr_compliant: true, data_sold: false, notes: "Crisis service with strong privacy protections. Anonymous support available." },
    pricing: { model: "free", free_tier: true, starting_price: "Free", notes: "Completely free crisis text service. Text HOME to 741741." },
    conditions: ["major-depressive-disorder"],
    primary_hubs: ["find-support", "mood-depression"]
  },

  "988-suicide-lifeline": {
    one_liner: "The 988 Suicide & Crisis Lifeline provides free 24/7 support via call or text for anyone in emotional distress or suicidal crisis.",
    long_description: "The 988 Suicide & Crisis Lifeline (formerly National Suicide Prevention Lifeline) is the national crisis hotline for anyone experiencing emotional distress, suicidal thoughts, or mental health crisis. Call or text 988 to connect with trained crisis counselors 24/7. The service is free, confidential, and available nationwide. Specialized services include lines for veterans (press 1), Spanish speakers (press 2), and LGBTQ+ youth (press 3). 988 connects you with your local crisis center where counselors provide immediate support, safety planning, and connection to ongoing care. This is America's mental health emergency line.",
    best_for: [
      "Anyone experiencing suicidal thoughts",
      "People in mental health crisis",
      "Those needing immediate emotional support",
      "Friends or family concerned about someone in crisis"
    ],
    not_for: [
      "Life-threatening physical emergencies (call 911)",
      "Ongoing therapy or non-urgent support",
      "Medication prescriptions or refills"
    ],
    faqs: [
      {
        q: "What is 988?",
        a: "988 is the Suicide & Crisis Lifeline, a national mental health emergency number like 911 for physical emergencies. Call or text 988 for free, 24/7 crisis support."
      },
      {
        q: "What happens when I call 988?",
        a: "You're connected with a trained crisis counselor at a local crisis center. They'll listen, provide support, help you stay safe, and connect you with local resources. You control the conversation."
      },
      {
        q: "Can I text 988 instead of calling?",
        a: "Yes, you can text 988 for crisis support if you're uncomfortable calling. You'll be connected with a crisis counselor via text message. Both calling and texting are available 24/7."
      },
      {
        q: "Is 988 only for suicidal thoughts?",
        a: "No, 988 is for any emotional crisis—severe anxiety, overwhelming stress, self-harm urges, or supporting someone else in crisis. You don't need to be suicidal to reach out."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "high", primary_uses: ["Suicide prevention", "Crisis intervention", "Mental health emergency", "24/7 support"] },
    privacy: { grade: "A", hipaa_compliant: false, gdpr_compliant: false, data_sold: false, notes: "National crisis line with privacy protections. Anonymous support available." },
    pricing: { model: "free", free_tier: true, starting_price: "Free", notes: "Free national crisis service. Call or text 988." },
    conditions: ["major-depressive-disorder"],
    primary_hubs: ["find-support", "mood-depression", "serious-mental-illness"]
  },

  "insight-timer": {
    one_liner: "Insight Timer is a free meditation app with over 150,000 guided meditations, music tracks, and courses from thousands of teachers worldwide.",
    long_description: "Insight Timer is the world's largest free meditation library, offering over 150,000 guided meditations, music tracks, ambient sounds, and courses from 10,000+ teachers. The app is free with optional premium membership. Features include a meditation timer, progress tracking, community groups, and live events. Content covers mindfulness, sleep, stress, anxiety, and personal growth. Unlike subscription-focused competitors, Insight Timer's model keeps most content free while premium unlocks additional features. The global community aspect connects millions of meditators worldwide.",
    best_for: [
      "People wanting free meditation content",
      "Those who like variety in teachers and styles",
      "People interested in community and live events",
      "Budget-conscious meditators"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking clinical mental health treatment",
      "Those preferring polished, curated apps like Calm"
    ],
    faqs: [
      {
        q: "Is Insight Timer really free?",
        a: "Yes, Insight Timer's core offering is free—over 150,000 meditations, music tracks, and courses. Premium membership (~$60/year) adds offline listening, advanced features, and courses, but most users find the free version sufficient."
      },
      {
        q: "How is Insight Timer different from Calm or Headspace?",
        a: "Insight Timer offers vastly more free content from thousands of teachers, while Calm and Headspace have smaller, more curated libraries behind paywalls. Insight Timer has more variety but less polish. Try all three to find your preference."
      },
      {
        q: "What content does Insight Timer offer?",
        a: "Guided meditations across all styles, sleep music, ambient sounds, meditation courses, talks on mindfulness and personal growth, and live community events. Content ranges from 1 minute to multi-hour."
      },
      {
        q: "Is Insight Timer good for beginners?",
        a: "Yes, Insight Timer has extensive beginner content. However, the sheer volume can be overwhelming. Use collections, teacher filtering, or their beginner courses to navigate. Many prefer simpler apps initially."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Meditation", "Mindfulness", "Sleep sounds", "Stress relief"] },
    privacy: { grade: "B+", hipaa_compliant: false, gdpr_compliant: true, data_sold: false, notes: "Consumer app, not healthcare. Review privacy policy." },
    pricing: { model: "freemium", free_tier: true, starting_price: "Free (premium ~$60/yr)", notes: "Most content free. Premium adds features." },
    conditions: ["generalized-anxiety-disorder"],
    primary_hubs: ["anxiety-stress", "sleep"]
  },

  "daylio": {
    one_liner: "Daylio is a mood tracking journal app that uses icons instead of writing, making it easy to track emotions, activities, and mental health patterns.",
    long_description: "Daylio is a popular mood tracking app designed for people who don't like writing. Instead of journaling, you select mood levels and activities using icons. The app shows patterns over time—which activities correlate with better moods, how you feel on different days, and long-term trends. Daily reminders help build tracking habits. Data can be exported and shared with therapists. The free version provides core tracking; premium ($2.99/mo) adds advanced statistics and unlimited entries. Daylio has been downloaded millions of times and is particularly popular with people who find traditional journaling burdensome.",
    best_for: [
      "People who want to track moods without writing",
      "Those curious about patterns in their mental health",
      "People working with therapists who want data to share",
      "Anyone building mental health awareness habits"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking treatment or therapy",
      "Those who prefer written journaling"
    ],
    faqs: [
      {
        q: "How does Daylio mood tracking work?",
        a: "Each day, select your mood level (great to awful) and tag activities you did. Daylio requires no writing—just tapping icons. Over time, the app shows patterns and correlations between activities and moods."
      },
      {
        q: "Is Daylio free?",
        a: "Basic mood tracking is free. Premium ($2.99/month or $35.99/year) adds unlimited entries per day, advanced statistics, automatic backups, and no ads. The free version works well for basic tracking."
      },
      {
        q: "Can I share Daylio data with my therapist?",
        a: "Yes, Daylio allows exporting data as PDF or CSV files. Many people share mood reports with therapists to identify patterns and track progress between sessions."
      },
      {
        q: "What patterns does Daylio reveal?",
        a: "Daylio shows which activities correlate with better or worse moods, mood trends over weeks/months, day-of-week patterns, and how consistent your mood tracking is. These insights help identify what supports your mental health."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "emerging", primary_uses: ["Mood tracking", "Mental health awareness", "Pattern recognition", "Self-monitoring"] },
    privacy: { grade: "B", hipaa_compliant: false, gdpr_compliant: true, data_sold: false, notes: "Consumer app, not healthcare. Data stored on device and optional cloud backup." },
    pricing: { model: "freemium", free_tier: true, starting_price: "$2.99/month", notes: "Basic tracking free. Premium for advanced features." },
    conditions: ["major-depressive-disorder"],
    primary_hubs: ["mood-depression", "anxiety-stress"]
  },

  "moodfit": {
    one_liner: "MoodFit is a mental health app combining mood tracking, CBT tools, gratitude journaling, and breathing exercises in one platform.",
    long_description: "MoodFit brings together multiple mental health tools in one app: mood tracking with customizable factors, CBT-based thought exercises, gratitude journaling, breathing exercises, and goal setting. The app helps users understand their mental health patterns while providing evidence-based tools for improvement. MoodFit is designed to complement therapy or standalone self-help. The free version includes basic features; premium unlocks advanced analytics and tools. The all-in-one approach appeals to users who want comprehensive mental wellness support without multiple apps.",
    best_for: [
      "People wanting multiple mental health tools in one app",
      "Those who like data-driven approaches to wellness",
      "People using apps alongside therapy",
      "Those interested in CBT techniques"
    ],
    not_for: [
      "Those in crisis needing immediate care (call 988)",
      "People seeking clinical treatment",
      "Those who prefer single-purpose apps"
    ],
    faqs: [
      {
        q: "What tools does MoodFit include?",
        a: "MoodFit includes mood tracking with customizable factors, CBT thought records, gratitude journaling, breathing exercises, meditation, goal tracking, and sleep logging. It's designed as an all-in-one mental wellness toolkit."
      },
      {
        q: "Is MoodFit free?",
        a: "MoodFit has a free version with basic features. Premium (around $5/month) unlocks advanced analytics, additional exercises, and full feature access. The free version provides a good starting point."
      },
      {
        q: "Is MoodFit evidence-based?",
        a: "MoodFit's tools are based on evidence-based approaches like CBT and gratitude practices. It's a self-help tool designed with clinical input. For diagnosable conditions, it should complement rather than replace professional treatment."
      },
      {
        q: "Can I share MoodFit data with my therapist?",
        a: "Yes, MoodFit allows data export to share with healthcare providers. Therapists often find mood tracking data helpful for identifying patterns and adjusting treatment."
      }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Mood tracking", "CBT exercises", "Gratitude journaling", "Breathing exercises"] },
    privacy: { grade: "B+", hipaa_compliant: false, gdpr_compliant: true, data_sold: false, notes: "Consumer wellness app with reasonable privacy practices." },
    pricing: { model: "freemium", free_tier: true, starting_price: "$5/month", notes: "Basic features free. Premium for full access." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["mood-depression", "anxiety-stress"]
  },

  // === BATCH 6: Clinical Therapy & Telehealth Platforms ===

  "bicycle-health": {
    one_liner: "Bicycle Health provides virtual Suboxone treatment for opioid use disorder with licensed physicians, therapy, and 24/7 support, covered by most insurance.",
    long_description: "Bicycle Health is a telemedicine platform specializing in medication-assisted treatment (MAT) for opioid use disorder. The platform connects patients with physicians who prescribe Suboxone (buprenorphine/naloxone) via video appointments, combined with peer support, therapy, and 24/7 crisis resources. Treatment follows evidence-based protocols with an 87% retention rate in one study. Bicycle Health accepts most major insurance including Medicaid in many states, with self-pay options around $195/month for medication management. The platform operates in 32+ states with licensed providers. The comprehensive approach addresses the access gap for addiction treatment in underserved areas.",
    best_for: [
      "People seeking medication-assisted treatment for opioid addiction",
      "Those wanting discreet, virtual addiction treatment",
      "People in areas with limited MAT providers",
      "Those looking for Suboxone treatment with support services"
    ],
    not_for: [
      "Those in acute withdrawal needing immediate medical detox",
      "People seeking treatment for alcohol or other substance use only",
      "Those requiring inpatient treatment level of care"
    ],
    faqs: [
      { q: "How much does Bicycle Health cost?", a: "With insurance, copays typically range from $0-50 per visit. Without insurance, medication management is approximately $195/month. Medication costs (Suboxone) are separate and vary by pharmacy. Many patients qualify for insurance or assistance programs." },
      { q: "Is Bicycle Health legitimate for Suboxone treatment?", a: "Yes, Bicycle Health uses licensed physicians who can legally prescribe buprenorphine for opioid use disorder. The platform follows DEA and state regulations for controlled substance prescribing via telemedicine. An 87% retention rate demonstrates treatment effectiveness." },
      { q: "What states does Bicycle Health operate in?", a: "Bicycle Health operates in 32+ states. Coverage expands regularly. Check their website for current availability in your state. Some states have restrictions on controlled substance telemedicine prescribing." },
      { q: "What support does Bicycle Health include beyond medication?", a: "Beyond prescribing, Bicycle Health provides peer recovery support, therapy access, 24/7 crisis support, and care coordination. The comprehensive approach addresses addiction as a medical condition requiring ongoing support." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "strong", primary_uses: ["Opioid addiction treatment", "MAT/Suboxone", "Virtual addiction care", "Recovery support"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare platform. 42 CFR Part 2 protections for substance use records." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$195/month (self-pay)", notes: "Insurance accepted including Medicaid. Self-pay available." },
    conditions: ["opioid-use-disorder", "substance-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "boulder-care": {
    one_liner: "Boulder Care provides virtual Suboxone treatment for opioid addiction with compassionate, judgment-free care from licensed clinicians.",
    long_description: "Boulder Care is a virtual addiction treatment platform offering medication-assisted treatment (MAT) for opioid use disorder. The platform emphasizes compassionate, trauma-informed care with licensed prescribers who provide Suboxone prescriptions via video appointments. Boulder Care combines medication management with peer support, behavioral therapy, and care coordination. The platform accepts Medicaid and commercial insurance in available states. Boulder Care's patient-centered approach aims to reduce stigma and increase treatment accessibility. Available in select states with expanding coverage.",
    best_for: [
      "People seeking judgment-free addiction treatment",
      "Those wanting virtual Suboxone treatment",
      "People with Medicaid seeking MAT services",
      "Those preferring trauma-informed addiction care"
    ],
    not_for: [
      "Those needing immediate medical detox",
      "People seeking treatment for non-opioid addiction only",
      "Those requiring residential treatment"
    ],
    faqs: [
      { q: "How much does Boulder Care cost?", a: "Boulder Care accepts Medicaid and commercial insurance, often with low or no copays. Self-pay options are available where insurance isn't accepted. Medication costs are separate and may be covered by insurance or assistance programs." },
      { q: "Is Boulder Care effective for opioid addiction?", a: "MAT with buprenorphine is the gold standard for opioid use disorder treatment. Boulder Care follows evidence-based protocols. Their compassionate approach helps patients stay engaged in treatment, which is key to recovery success." },
      { q: "What states does Boulder Care serve?", a: "Boulder Care currently operates in select states with ongoing expansion. Check their website for current availability. State telemedicine regulations affect controlled substance prescribing." },
      { q: "What happens at my first Boulder Care appointment?", a: "Your first appointment includes a medical evaluation, discussion of treatment goals, and if appropriate, a Suboxone prescription. The prescriber assesses your history and creates a personalized treatment plan. Appointments are typically 15-30 minutes via video." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "strong", primary_uses: ["Opioid addiction treatment", "MAT/Suboxone", "Trauma-informed care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant with 42 CFR Part 2 substance use protections." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Varies by insurance", notes: "Medicaid and commercial insurance accepted." },
    conditions: ["opioid-use-disorder", "substance-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "ophelia": {
    one_liner: "Ophelia provides private, online Suboxone treatment for opioid addiction with licensed clinicians and ongoing support, accepting most insurance.",
    long_description: "Ophelia is a telemedicine platform specializing in medication-assisted treatment for opioid use disorder. The platform offers private, stigma-free treatment with board-certified clinicians who prescribe Suboxone via video appointments. Ophelia combines medication management with coaching support, helping patients build sustainable recovery. Treatment is delivered through a secure app with at-home urine testing. Ophelia accepts most commercial insurance and Medicare, with self-pay options around $195/month. The platform operates in 15+ states with licensed prescribers. Ophelia's modern, patient-centered approach appeals to those seeking discreet, high-quality addiction treatment.",
    best_for: [
      "People wanting private, discreet addiction treatment",
      "Those seeking modern, app-based MAT care",
      "People with commercial insurance seeking Suboxone treatment",
      "Professionals wanting confidential addiction care"
    ],
    not_for: [
      "Those needing medically supervised detox",
      "People requiring intensive outpatient or residential treatment",
      "Those in states where Ophelia doesn't operate"
    ],
    faqs: [
      { q: "How much does Ophelia cost?", a: "With insurance, copays typically range from $0-50 per visit. Self-pay is approximately $195/month for medication management. Medication costs are separate. Ophelia works with major commercial insurers and Medicare." },
      { q: "Is Ophelia treatment confidential?", a: "Yes, Ophelia provides discreet treatment through a private app. No physical pharmacy visits are required as at-home testing is used. Medical records are protected by HIPAA and 42 CFR Part 2 substance use privacy rules." },
      { q: "How quickly can I start treatment with Ophelia?", a: "Most patients can schedule their first appointment within days. If clinically appropriate, medication can be prescribed at your first visit. Treatment starts quickly compared to traditional addiction treatment wait times." },
      { q: "What support does Ophelia provide beyond prescriptions?", a: "Ophelia includes a dedicated care team, coaching support, and ongoing clinical monitoring. The app provides tools for tracking progress and connecting with your team. Some plans include therapy access." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "strong", primary_uses: ["Opioid addiction treatment", "MAT/Suboxone", "Virtual addiction care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant with strong privacy protections." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$195/month (self-pay)", notes: "Most commercial insurance and Medicare accepted." },
    conditions: ["opioid-use-disorder", "substance-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "groups-recover-together": {
    one_liner: "Groups Recover Together provides office-based and virtual group therapy combined with Suboxone treatment for opioid addiction, with peer support at the core.",
    long_description: "Groups Recover Together (GRT) offers medication-assisted treatment for opioid use disorder with a unique group-based model. Treatment combines Suboxone prescribing from medical providers with weekly group therapy sessions led by licensed counselors. The peer support model builds community and accountability. GRT operates 100+ locations across 14+ states with both in-person and virtual options. Insurance is widely accepted including Medicaid. The group format offers connection and support that many find more effective than individual treatment alone. Sessions typically last 60-90 minutes weekly.",
    best_for: [
      "People who benefit from peer support in recovery",
      "Those seeking structure and community in addiction treatment",
      "People wanting combined medication and group therapy",
      "Those with Medicaid or commercial insurance"
    ],
    not_for: [
      "Those strongly preferring individual-only treatment",
      "People uncomfortable with group settings",
      "Those requiring immediate medical detox"
    ],
    faqs: [
      { q: "How does group treatment work at GRT?", a: "Weekly group sessions combine check-ins, skill building, and peer support with 8-12 members. A licensed counselor facilitates each group. Medical appointments for Suboxone prescribing happen separately with a provider. Most find the community aspect crucial to their recovery." },
      { q: "How much does Groups Recover Together cost?", a: "GRT accepts most insurance including Medicaid, often with low or no copays. Self-pay options exist where needed. The group model keeps costs manageable compared to individual therapy-only approaches." },
      { q: "Can I do virtual groups with GRT?", a: "Yes, GRT offers both in-person and virtual group options in most locations. Virtual groups provide flexibility while maintaining the peer support element. Some patients combine virtual and in-person attendance." },
      { q: "Is group treatment effective for opioid addiction?", a: "Research shows group therapy combined with MAT has strong outcomes. The peer support component helps with accountability and reduces isolation common in addiction. Many prefer groups to individual treatment for the community aspect." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "strong", primary_uses: ["Opioid addiction treatment", "Group therapy", "MAT/Suboxone", "Peer support"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare provider with 42 CFR Part 2 protections." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Varies by insurance", notes: "Most insurance including Medicaid accepted." },
    conditions: ["opioid-use-disorder", "substance-use-disorder"],
    primary_hubs: ["substance-use", "find-support"]
  },

  "done": {
    one_liner: "Done (Cerebral's ADHD brand) provides online ADHD diagnosis and treatment with medication management from licensed clinicians via telehealth.",
    long_description: "Done (now part of Cerebral) is a telehealth platform focused on ADHD diagnosis and treatment. The platform offers comprehensive ADHD evaluations via video with licensed prescribers who can diagnose and prescribe medications including stimulants where appropriate. Treatment includes ongoing medication management with monthly check-ins. Done became part of Cerebral in 2022, combining resources for ADHD care. The platform operates in most US states with varying policies on controlled substance prescribing. Note: Like other telehealth ADHD platforms, Done/Cerebral has implemented additional safeguards following DEA and industry scrutiny in 2022.",
    best_for: [
      "Adults seeking ADHD evaluation and diagnosis",
      "Those wanting convenient telehealth ADHD medication management",
      "People with insurance covering telehealth psychiatry",
      "Those who've already been diagnosed seeking medication refills"
    ],
    not_for: [
      "Children under 18 (adult-focused)",
      "Those requiring in-person psychiatric evaluation",
      "People seeking therapy-only ADHD treatment"
    ],
    faqs: [
      { q: "How much does Done ADHD treatment cost?", a: "With insurance, copays typically range $0-99/month. Without insurance, expect $199-299/month for evaluations and medication management. Medication costs are separate and vary by prescription. Many stimulant medications have generics available." },
      { q: "Can Done prescribe Adderall or other stimulants?", a: "Done prescribes medications including stimulants when clinically appropriate, subject to state regulations and clinical guidelines. After 2022 industry changes, telehealth ADHD platforms follow stricter protocols. Your prescriber will determine the best treatment approach." },
      { q: "How long does the Done ADHD evaluation take?", a: "Initial evaluations typically take 30-60 minutes via video. The clinician reviews symptoms, history, and validated ADHD assessments. A diagnosis and treatment plan may be provided at the first or follow-up appointment depending on clinical needs." },
      { q: "Is Done the same as Cerebral?", a: "Done was acquired by Cerebral in 2022. While the brands may operate separately, they share resources and clinical infrastructure. Both platforms offer ADHD services under Cerebral's clinical oversight." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["ADHD diagnosis", "ADHD medication management", "Telehealth psychiatry"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant telehealth platform." },
    pricing: { model: "subscription", free_tier: false, starting_price: "$199/month", notes: "Insurance may reduce costs. Medication costs separate." },
    conditions: ["adhd"],
    primary_hubs: ["focus-adhd", "find-support"]
  },

  "ahead": {
    one_liner: "AHEAD provides online ADHD treatment with licensed psychiatrists and therapists, offering personalized medication management and support.",
    long_description: "AHEAD is a telehealth platform specializing in adult ADHD treatment. The platform connects patients with psychiatrists and therapists who understand ADHD for diagnosis, medication management, and therapy. Treatment plans are personalized based on symptoms, lifestyle, and goals. AHEAD accepts most major insurance and offers transparent pricing for self-pay patients. The platform emphasizes understanding ADHD as a whole-person condition, addressing not just symptoms but life impacts. Available in multiple states with licensed providers.",
    best_for: [
      "Adults seeking comprehensive ADHD care",
      "Those wanting combined medication and therapy for ADHD",
      "People with insurance covering telehealth psychiatry",
      "Those who want ADHD-specialized providers"
    ],
    not_for: [
      "Children or adolescents",
      "Those requiring in-person psychiatric care",
      "People seeking treatment for conditions other than ADHD"
    ],
    faqs: [
      { q: "How much does AHEAD cost?", a: "AHEAD accepts most major insurance plans. For self-pay, expect $200-300/month for medication management. Therapy sessions are additional. Contact them for current pricing as it varies by service and location." },
      { q: "Does AHEAD prescribe stimulant medications?", a: "AHEAD psychiatrists can prescribe ADHD medications including stimulants when clinically appropriate. Your provider will work with you to find the right medication and dosage based on your needs and medical history." },
      { q: "What makes AHEAD different from other ADHD platforms?", a: "AHEAD specializes exclusively in ADHD, with providers who understand the condition deeply. They offer both medication management and therapy, recognizing ADHD affects multiple life areas. The focused approach may benefit those wanting specialized care." },
      { q: "How quickly can I get an appointment with AHEAD?", a: "Most patients can schedule initial appointments within 1-2 weeks. Wait times vary by location and provider availability. The platform works to minimize waiting as ADHD treatment timing matters." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["ADHD diagnosis", "ADHD treatment", "Medication management", "ADHD therapy"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare platform." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$200/month (self-pay)", notes: "Most major insurance accepted." },
    conditions: ["adhd"],
    primary_hubs: ["focus-adhd", "find-support"]
  },

  "grow-therapy": {
    one_liner: "Grow Therapy connects patients with licensed therapists who accept insurance, offering in-network therapy with no out-of-pocket costs for many.",
    long_description: "Grow Therapy is a platform that helps patients find therapists who take their insurance, making therapy more accessible and affordable. The platform credentials therapists with insurance networks so patients can receive in-network care, often with $0 copays. Therapists on Grow Therapy offer video sessions for anxiety, depression, trauma, relationships, and more. The platform handles insurance billing, making it simple for patients. Grow Therapy emphasizes diversity in its therapist network with providers from varied backgrounds. Available nationwide with therapists licensed in most states.",
    best_for: [
      "People wanting therapy covered by insurance",
      "Those seeking diverse therapist options",
      "People who prefer video therapy sessions",
      "Those frustrated by out-of-network therapy costs"
    ],
    not_for: [
      "Those requiring in-person therapy only",
      "People seeking medication management (therapy only)",
      "Those in crisis needing immediate care (call 988)"
    ],
    faqs: [
      { q: "Is Grow Therapy really free with insurance?", a: "With in-network insurance coverage, many patients pay $0-30 per session depending on their plan. Grow Therapy works with most major insurers. The platform verifies benefits before matching you with therapists to ensure affordability." },
      { q: "How is Grow Therapy different from BetterHelp?", a: "Unlike BetterHelp's subscription model, Grow Therapy works with insurance for per-session billing like traditional therapy. This means potentially lower costs if you have good insurance. Grow Therapy offers scheduled video sessions rather than messaging-based care." },
      { q: "What kinds of therapists are on Grow Therapy?", a: "Grow Therapy has licensed therapists (LCSWs, LMFTs, LPCs, psychologists) with various specialties including anxiety, depression, trauma, relationships, and more. The platform emphasizes diverse providers from different backgrounds and approaches." },
      { q: "Can I choose my therapist on Grow Therapy?", a: "Yes, you browse therapist profiles filtered by specialty, approach, insurance, and availability. You can see photos, videos, and detailed bios before booking. If a match isn't right, you can switch therapists easily." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "strong", primary_uses: ["Individual therapy", "Anxiety treatment", "Depression treatment", "Relationship counseling"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant platform connecting patients with licensed therapists." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$0-30/session with insurance", notes: "Works with most major insurance plans." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "ptsd"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "sondermind": {
    one_liner: "SonderMind matches you with licensed therapists who take your insurance, offering personalized matching and easy scheduling for video or in-person sessions.",
    long_description: "SonderMind is a mental health platform that matches patients with in-network therapists based on needs, preferences, and insurance coverage. The platform's matching algorithm considers specialty, approach, personality, and schedule to find appropriate therapist fits. SonderMind works with most major insurance plans for affordable care. Patients can choose video or in-person sessions where available. The platform has grown rapidly, with thousands of therapists across most US states. SonderMind handles insurance verification, billing, and scheduling to simplify access to care.",
    best_for: [
      "People wanting personalized therapist matching",
      "Those seeking in-network insurance coverage",
      "People who value having in-person therapy as an option",
      "Those wanting data-driven therapist matching"
    ],
    not_for: [
      "Those requiring psychiatric medication management",
      "People seeking couples therapy in all areas (availability varies)",
      "Those in crisis needing immediate care (call 988)"
    ],
    faqs: [
      { q: "How does SonderMind match me with a therapist?", a: "SonderMind uses a matching algorithm considering your symptoms, therapy preferences, personality factors, schedule, and insurance. You'll receive therapist recommendations to review. You can also browse and choose therapists directly if you prefer." },
      { q: "Does SonderMind accept my insurance?", a: "SonderMind works with most major insurance plans including Aetna, Cigna, United, Blue Cross, and others. The platform verifies your specific benefits before matching to ensure in-network coverage. Copays typically range from $0-50/session." },
      { q: "Can I do in-person therapy through SonderMind?", a: "Yes, SonderMind offers both video and in-person sessions depending on your location and therapist availability. Many patients start with video then add in-person sessions, or vice versa. Hybrid options are available." },
      { q: "How quickly can I start therapy with SonderMind?", a: "Most patients can match with a therapist and schedule their first session within a week. The platform prioritizes reducing wait times for care access. Urgency matching helps those needing faster appointments." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "strong", primary_uses: ["Individual therapy", "Therapist matching", "Insurance-covered therapy"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare platform." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$0-50/session with insurance", notes: "Most major insurance accepted. Self-pay available." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "rula": {
    one_liner: "Rula connects you with licensed therapists and psychiatrists who accept your insurance, with average wait times under 5 days.",
    long_description: "Rula (formerly Path Mental Health) is a mental health platform focused on fast access to care. The platform connects patients with licensed therapists and psychiatrists who take their insurance, with an emphasis on reducing wait times—averaging under 5 days for first appointments. Rula handles insurance verification, matching, and scheduling to simplify the process. The platform offers both therapy and psychiatry for comprehensive care. Available nationwide with providers in most states. Rula's operational efficiency helps more people access mental health care when they need it.",
    best_for: [
      "People who need to see a therapist quickly",
      "Those wanting both therapy and psychiatry options",
      "People with insurance seeking in-network care",
      "Those frustrated by long wait times elsewhere"
    ],
    not_for: [
      "Those requiring in-person sessions only",
      "People seeking specialized treatment (availability varies)",
      "Those in crisis needing immediate care (call 988)"
    ],
    faqs: [
      { q: "How fast can I get an appointment with Rula?", a: "Rula averages under 5 days for first appointments, significantly faster than the typical 6-8 week wait for new patients in traditional settings. Many patients can schedule within 2-3 days depending on availability." },
      { q: "Does Rula offer both therapy and medication?", a: "Yes, Rula offers both licensed therapists and psychiatrists/nurse practitioners. You can receive therapy, medication management, or both depending on your needs. The platform coordinates care if you're seeing multiple providers." },
      { q: "Is Rula covered by insurance?", a: "Rula works with most major insurance plans for in-network coverage. The platform verifies your benefits before scheduling. Copays typically range from $0-50/session depending on your plan." },
      { q: "What happened to Path Mental Health?", a: "Path Mental Health rebranded to Rula in 2023. The same platform and mission continue under the new name with expanded services and coverage." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Individual therapy", "Psychiatry", "Medication management", "Fast access mental health care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare platform." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$0-50/session with insurance", notes: "Most major insurance accepted." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "adhd"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression", "focus-adhd"]
  },

  "brightside-health": {
    one_liner: "Brightside Health provides online psychiatry and therapy for anxiety, depression, and related conditions, with medication delivery and insurance accepted.",
    long_description: "Brightside Health is a telehealth platform offering comprehensive mental health treatment for anxiety, depression, PTSD, and related conditions. The platform provides psychiatric medication management, therapy, and care coordination through video appointments with licensed clinicians. Brightside emphasizes evidence-based treatment with outcome tracking to optimize care. The platform accepts most major insurance plans and delivers medications directly to patients. Available in most US states with licensed prescribers and therapists. Brightside's integrated approach combines medication and therapy when appropriate.",
    best_for: [
      "People seeking online treatment for anxiety or depression",
      "Those wanting combined medication and therapy",
      "People with insurance covering telehealth",
      "Those who prefer outcome-tracked treatment"
    ],
    not_for: [
      "Those seeking controlled substance treatment (not Brightside's focus)",
      "People requiring in-person psychiatric care",
      "Those in crisis needing emergency services (call 988)"
    ],
    faqs: [
      { q: "How much does Brightside Health cost?", a: "With insurance, copays typically range from $0-60 per visit. Self-pay plans start around $95-200/month depending on services. Medication costs are separate and may be covered by insurance. The platform provides clear pricing upfront." },
      { q: "Does Brightside Health prescribe anxiety medication?", a: "Yes, Brightside psychiatrists and psychiatric NPs prescribe medications for anxiety, depression, and related conditions. They focus on appropriate first-line treatments and avoid controlled substances as their primary focus. Your provider will recommend the best treatment approach." },
      { q: "Can I get therapy and medication through Brightside?", a: "Yes, Brightside offers both psychiatry and therapy. Many patients benefit from combined treatment. You can receive medication management, therapy, or both based on your needs and clinician recommendations." },
      { q: "How does Brightside track treatment outcomes?", a: "Brightside uses standardized assessments (PHQ-9, GAD-7) to track symptom improvement over time. This data helps clinicians adjust treatment. Patients can see their progress, and research shows outcome tracking improves results." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Anxiety treatment", "Depression treatment", "Psychiatry", "Telehealth therapy"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant healthcare platform." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "$95/month (self-pay)", notes: "Most insurance accepted. Medication costs separate." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "ptsd"],
    primary_hubs: ["anxiety-stress", "mood-depression", "find-support"]
  },

  "teladoc-mental-health": {
    one_liner: "Teladoc Mental Health provides 24/7 access to therapists and psychiatrists via video and phone, often included free through employer or insurance benefits.",
    long_description: "Teladoc is the largest telehealth platform in the US, and its mental health services provide 24/7 access to licensed therapists and psychiatrists. Many people have Teladoc included free through employer benefits or health insurance. The platform offers video and phone sessions for therapy and psychiatry, with both scheduled appointments and on-demand access. Teladoc's mental health clinicians treat anxiety, depression, stress, grief, and other concerns. The service integrates with Teladoc's broader healthcare platform for coordinated care. Available nationwide with thousands of licensed providers.",
    best_for: [
      "People with Teladoc through employer or insurance",
      "Those wanting 24/7 mental health access",
      "People who prefer phone or video flexibility",
      "Those wanting mental health integrated with other telehealth"
    ],
    not_for: [
      "Those seeking specialized or intensive treatment",
      "People wanting long-term relationship with one therapist (assignment varies)",
      "Those in crisis needing emergency services (call 988)"
    ],
    faqs: [
      { q: "Is Teladoc mental health free?", a: "Many employers and insurance plans include Teladoc at no cost to members. Check your benefits to see if Teladoc is covered. If paying directly, visits cost around $99-299 depending on service type. Mental health visits may have separate copays from medical visits." },
      { q: "Can I get medication through Teladoc mental health?", a: "Yes, Teladoc psychiatrists can prescribe mental health medications when appropriate. Controlled substances may have restrictions depending on your state and situation. Non-controlled medications for anxiety and depression are commonly prescribed." },
      { q: "How quickly can I see someone on Teladoc?", a: "Teladoc offers both scheduled appointments (often within days) and on-demand access for urgent needs. Availability varies by service type and time of day. The 24/7 nature means you can often connect when needed." },
      { q: "Will I see the same therapist each time on Teladoc?", a: "Teladoc allows you to schedule with the same provider for continuity, though availability varies. Some people prefer building a relationship with one clinician; others appreciate the flexibility of seeing available providers. You can express your preference." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Telehealth therapy", "Psychiatry", "On-demand mental health care"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant major healthcare platform." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Often free through benefits", notes: "Check employer or insurance for coverage. Self-pay ~$99-299/visit." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "mdlive-mental-health": {
    one_liner: "MDLive Mental Health offers on-demand video psychiatry and therapy, often included free through Cigna and other insurance plans.",
    long_description: "MDLive (owned by Cigna) provides telehealth mental health services including psychiatry and therapy via video appointments. Many Cigna members have MDLive included free with their insurance. The platform connects patients with licensed psychiatrists for medication management and therapists for counseling. MDLive offers scheduled and on-demand appointments with relatively short wait times. The service treats anxiety, depression, stress, relationship issues, and other common concerns. MDLive integrates with the broader Cigna healthcare network when applicable. Available nationwide with licensed providers in all states.",
    best_for: [
      "Cigna members (often included free)",
      "Those wanting video psychiatry appointments",
      "People who want relatively quick access to prescribers",
      "Those whose insurance includes MDLive"
    ],
    not_for: [
      "Those requiring specialized psychiatric care",
      "People seeking in-person treatment only",
      "Those in crisis needing emergency services (call 988)"
    ],
    faqs: [
      { q: "Is MDLive mental health free with Cigna?", a: "Many Cigna plans include MDLive at no cost for behavioral health visits. Check your specific Cigna benefits to confirm coverage. Other insurers may also cover MDLive. Self-pay costs around $99-284 per visit depending on service type." },
      { q: "Can MDLive psychiatrists prescribe medication?", a: "Yes, MDLive psychiatrists can prescribe mental health medications including non-controlled medications for anxiety and depression. Controlled substances have restrictions. Your psychiatrist will recommend appropriate treatment based on your evaluation." },
      { q: "How long do I wait for an MDLive psychiatry appointment?", a: "MDLive typically offers psychiatry appointments within a few days to a week, faster than traditional psychiatry wait times. Therapy appointments may be available sooner. On-demand options exist for urgent needs." },
      { q: "What conditions does MDLive mental health treat?", a: "MDLive treats anxiety, depression, stress, grief, relationship issues, bipolar disorder, PTSD, and other mental health conditions. The platform is designed for outpatient-level care rather than severe or complex cases requiring specialized treatment." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Telehealth psychiatry", "Video therapy", "Medication management"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant major healthcare platform (Cigna-owned)." },
    pricing: { model: "insurance-covered", free_tier: false, starting_price: "Often free with Cigna", notes: "Check insurance for coverage. Self-pay ~$99-284/visit." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder", "bipolar-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "spring-health": {
    one_liner: "Spring Health provides employer-sponsored mental health care with therapy, coaching, medication, and personalized treatment recommendations based on clinical assessments.",
    long_description: "Spring Health is an employer-sponsored mental health platform offering comprehensive care including therapy, coaching, medication management, and self-guided resources. The platform uses a proprietary assessment to match employees with appropriate care levels and providers. Spring Health covers a range of mental health needs from mild stress to clinical conditions. Many Fortune 500 companies provide Spring Health as an employee benefit. The platform emphasizes measurable outcomes and care navigation. Sessions are typically available within 1-2 days through their large provider network. Treatment often comes at no cost to employees through their employer benefits.",
    best_for: [
      "Employees whose companies offer Spring Health benefits",
      "Those wanting matched care based on clinical assessment",
      "People seeking fast access to therapy or coaching",
      "Those who want comprehensive mental health support"
    ],
    not_for: [
      "Individuals without employer-provided access",
      "Those preferring to choose their own therapist independently",
      "People in crisis needing immediate emergency care (call 988)"
    ],
    faqs: [
      { q: "Is Spring Health free through my employer?", a: "If your employer offers Spring Health, you typically receive covered sessions at no cost. The number of free sessions varies by employer—commonly 6-12 per year. Additional sessions may be covered by insurance or available at reduced rates." },
      { q: "How does Spring Health match me with a provider?", a: "Spring Health uses a clinical assessment to understand your needs, then recommends appropriate care levels (coaching, therapy, psychiatry). You can view matched provider profiles and choose based on specialty, approach, and availability." },
      { q: "What's the difference between Spring Health and an EAP?", a: "Spring Health provides more comprehensive services than traditional EAPs—typically more covered sessions, faster access (days vs weeks), broader provider networks, and integrated psychiatry. Many employers are replacing EAPs with Spring Health or similar platforms." },
      { q: "Does Spring Health offer medication management?", a: "Yes, Spring Health includes psychiatric services for medication management. Your clinical assessment may recommend psychiatry if appropriate. Psychiatrists and psychiatric NPs are available via video appointments." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: ["Employer mental health benefits", "Therapy matching", "Coaching", "Psychiatry"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Aggregate data shared with employers is de-identified." },
    pricing: { model: "enterprise", free_tier: false, starting_price: "Free through employer benefits", notes: "Available through employer benefits only." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  },

  "lyra-health": {
    one_liner: "Lyra Health provides employer-sponsored mental health care with evidence-based therapy, coaching, and family support, typically at no cost to employees.",
    long_description: "Lyra Health is a leading employer-sponsored mental health platform offering evidence-based therapy, coaching, medication management, and family support services. The platform emphasizes matching patients with providers trained in specific evidence-based treatments (CBT, DBT, etc.) for better outcomes. Lyra covers individual therapy, couples therapy, family therapy, coaching, and child/teen services depending on employer plans. Available through major employers including tech companies, financial services, and Fortune 500s. Sessions are typically fully covered through employer benefits with short wait times. Lyra's focus on quality and outcomes has made it a leader in employer mental health.",
    best_for: [
      "Employees with Lyra through their employer",
      "Those seeking evidence-based therapy approaches",
      "Families wanting child/teen mental health coverage",
      "People wanting fast access to quality therapists"
    ],
    not_for: [
      "Individuals without employer-provided Lyra access",
      "Those preferring open-network therapy choice",
      "People in crisis needing emergency services (call 988)"
    ],
    faqs: [
      { q: "How many free sessions does Lyra Health provide?", a: "The number of covered sessions depends on your employer's plan—typically 8-20 sessions per year at no cost. Some employers offer unlimited sessions. Check your benefits for specific coverage. Additional sessions may be available through insurance." },
      { q: "What makes Lyra different from other therapy platforms?", a: "Lyra emphasizes evidence-based care, recruiting therapists trained in specific treatments like CBT and DBT. The platform measures outcomes and provides guidance to therapists. This focus on quality and evidence may lead to better results for many patients." },
      { q: "Does Lyra Health cover family members?", a: "Many employer Lyra plans cover dependents including children and teens. Family therapy, couples therapy, and individual child therapy may be available. Coverage varies by employer plan—check your specific benefits." },
      { q: "How quickly can I get an appointment with Lyra?", a: "Lyra typically offers appointments within days rather than weeks. The platform maintains a large provider network to ensure timely access. You can browse available therapists and book directly online." }
    ],
    clinical_metadata: { evidence_based: true, evidence_level: "strong", primary_uses: ["Evidence-based therapy", "Family mental health", "Coaching", "Employer benefits"] },
    privacy: { grade: "A", hipaa_compliant: true, gdpr_compliant: true, data_sold: false, notes: "HIPAA compliant. Strong privacy protections for employee mental health data." },
    pricing: { model: "enterprise", free_tier: false, starting_price: "Free through employer benefits", notes: "Available through employer benefits only." },
    conditions: ["generalized-anxiety-disorder", "major-depressive-disorder"],
    primary_hubs: ["find-support", "anxiety-stress", "mood-depression"]
  }
};

// ============================================================================
// APPLY GODZILLA TRANSFORMATIONS
// ============================================================================

function applyGodzilla(tool, godzillaContent) {
  const now = new Date().toISOString().split('T')[0];

  // Apply GODZILLA content
  tool.one_liner = godzillaContent.one_liner;
  tool.long_description = godzillaContent.long_description;
  tool.best_for = godzillaContent.best_for;
  tool.not_for = godzillaContent.not_for;

  // Update SEO FAQs
  tool.seo.faqs = godzillaContent.faqs;

  // Update clinical metadata
  tool.clinical_metadata = godzillaContent.clinical_metadata;

  // Update privacy
  tool.privacy = godzillaContent.privacy;

  // Update pricing
  tool.pricing = godzillaContent.pricing;

  // Update conditions and hubs
  if (godzillaContent.conditions) {
    tool.conditions = godzillaContent.conditions;
  }
  if (godzillaContent.primary_hubs) {
    tool.primary_hubs = godzillaContent.primary_hubs;
  }

  // Update timestamps
  tool.governance.last_reviewed = now;
  tool.updated_at = new Date().toISOString();

  // Update short description from one_liner if needed
  if (godzillaContent.one_liner.length <= 160) {
    tool.short_description = godzillaContent.one_liner;
  } else {
    tool.short_description = godzillaContent.one_liner.slice(0, 157) + '...';
  }

  // Update SEO meta description
  tool.seo.meta_description = tool.short_description;

  return tool;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const files = readdirSync(V3_DIR).filter(f => f.endsWith('.json'));
  let transformed = 0;

  console.log('🦖 GODZILLA ENGINE - Patient Tools Edition\n');
  console.log('Transforming high-priority patient tools...\n');

  for (const file of files) {
    const slug = file.replace('.json', '');

    if (GODZILLA_CONTENT[slug]) {
      try {
        const filepath = join(V3_DIR, file);
        const tool = JSON.parse(readFileSync(filepath, 'utf8'));

        // Apply GODZILLA transformation
        const transformed_tool = applyGodzilla(tool, GODZILLA_CONTENT[slug]);

        // Write back
        writeFileSync(filepath, JSON.stringify(transformed_tool, null, 2) + '\n');

        console.log(`  ✅ ${slug} - GODZILLA'd (${transformed_tool.long_description.length} chars)`);
        transformed++;
      } catch (e) {
        console.log(`  ❌ ${slug} - Error: ${e.message}`);
      }
    }
  }

  console.log('\n========================================');
  console.log('GODZILLA TRANSFORMATION COMPLETE');
  console.log('========================================');
  console.log(`Transformed: ${transformed} patient tools`);
  console.log(`Content entries available: ${Object.keys(GODZILLA_CONTENT).length}`);
}

main().catch(console.error);
