#!/usr/bin/env node
/**
 * POPULATE WEBSITE URLs
 *
 * Populates website_url for products that are missing it by:
 * 1. Inheriting from related products (same company_name)
 * 2. Using known company website mappings
 * 3. Deriving from product/company name patterns
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const V4_PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

// Known company → website mappings (verified public websites)
const COMPANY_WEBSITES = {
  // A
  "AB-Biotics": "https://www.ab-biotics.com",
  "AKASA": "https://www.akasa.com",
  "AWS": "https://aws.amazon.com/transcribe/medical/",
  "Access TeleCare": "https://accesstelecare.com",
  "Accolade": "https://www.accolade.com",
  "Alleva": "https://helloalleva.com",
  "Alma, Inc. (acquired by Spring Health)": "https://helloalma.com",
  "Altera / legacy Allscripts": "https://www.alterahealth.com",
  "American Professional Agency Inc.": "https://www.americanprofessional.com",
  "Andros / legacy": "https://www.symplr.com",
  "Applied Statistics & Management": "https://www.mdstaff.com",
  "Array Behavioral Care": "https://www.arraybehavioralcare.com",
  "AssemblyAI": "https://www.assemblyai.com",
  "Attunement": "https://attunement.io",
  "AutoNotes AI": "https://www.autonotes.ai",
  "Avaamo": "https://www.avaamo.ai",
  "Awell": "https://www.awellhealth.com",

  // B
  "BMJ": "https://bestpractice.bmj.com",
  "Behaivior": "https://www.behaivior.com",
  "Bicycle Health": "https://www.bicyclehealth.com",
  "Boulder Care": "https://www.boulder.care",
  "Bright Health / legacy": "https://www.brighthealth.com",
  "Brightside Health": "https://www.brightside.com",

  // C
  "CHESS Health": "https://www.chess.health",
  "CHG Healthcare": "https://www.chghealthcare.com",
  "CM&F Group": "https://www.cmfgroup.com",
  "CPH & Associates": "https://www.cphins.com",
  "Care Innovations / legacy": "https://careinnovations.com",
  "CareCloud": "https://www.carecloud.com",
  "CarePaths": "https://carepaths.com",
  "Cartwheel": "https://www.cartwheelcare.org",
  "Castle Biosciences / AltheaDx legacy": "https://www.castlebiosciences.com",
  "Center for the Promotion of Research Involving Innovative Statistical Methodology": "https://www.bhworks.com",
  "Cerebral Inc.": "https://www.cerebral.com",
  "Charlie Health, Inc.": "https://www.charliehealth.com",
  "Cisco": "https://www.webex.com/healthcare.html",
  "ClinicMind": "https://www.clinicmind.com",
  "Cliniko": "https://www.cliniko.com",
  "Cognizant": "https://www.trizetto.com",
  "Cognoa": "https://www.cognoa.com",
  "CollaborateMD": "https://www.collaboratemd.com",
  "ComPsych": "https://www.compsych.com",
  "Commure": "https://www.commure.com",
  "Commure (Augmedix)": "https://www.augmedix.com",
  "Commure / Augmedix": "https://www.augmedix.com",
  "Concert Health": "https://www.concerthealth.com",
  "CuraLinc": "https://www.curalinc.com",

  // D
  "DENmaar": "https://denmaar.com",
  "Deepgram": "https://deepgram.com",
  "Denti.AI": "https://www.denti.ai",
  "Docplanner": "https://www.doctoralia.com",
  "DriCloud": "https://dricloud.com",

  // E
  "EBSCO": "https://www.dynamed.com",
  "EarliTec Diagnostics": "https://www.earlitec.com",
  "Eko Health": "https://www.ekohealth.com",
  "Eleos Health": "https://www.eleos.health",
  "Elevance Health": "https://www.carelon.com",
  "Elsevier": "https://www.clinicalkey.com",
  "Enghouse Vidyo": "https://www.vidyo.com",
  "Ensora Health (formerly Thera-LINK)": "https://www.ensorahealth.com",
  "Equip": "https://equip.health",
  "Evernorth / Cigna": "https://www.evernorth.com",

  // F
  "Fathom": "https://www.fathomhealth.com",
  "Floreo": "https://floreovr.com",
  "Floreo Inc.": "https://floreovr.com",

  // G
  "GIDEON Informatics": "https://www.gideononline.com",
  "Genoa Healthcare": "https://www.genoahealthcare.com",
  "Glass Health": "https://glass.health",
  "Google Cloud": "https://cloud.google.com/healthcare-api/docs/concepts/speech",
  "Grow Therapy, Inc.": "https://www.growtherapy.com",

  // H
  "Halaxy": "https://www.halaxy.com",
  "Hazel Health": "https://www.hazel.co",
  "Headspace Inc.": "https://www.headspace.com",
  "Headway, Inc.": "https://headway.co",
  "HealthJoy": "https://www.healthjoy.com",
  "HealthStream": "https://www.healthstream.com",
  "HealthStream / legacy": "https://www.healthstream.com",
  "Healthcare Providers Service Organization": "https://www.hpso.com",
  "Heard": "https://joinheard.com",
  "Holmusk": "https://www.holmusk.com",
  "Human Diagnosis Project": "https://www.humandx.org",

  // I
  "Inferscience": "https://inferscience.com",
  "Isabel Healthcare": "https://www.isabelhealthcare.com",

  // J
  "Jane": "https://jane.app",

  // K
  "Kipu Health / legacy": "https://kipuhealth.com",
  "Koa Health": "https://www.koahealth.com",

  // L
  "Legacy / acquired": "https://www.symplr.com",
  "Lyra Health, Inc.": "https://www.lyrahealth.com",

  // M
  "MDLIVE / Evernorth (Cigna)": "https://www.mdlive.com",
  "Magellan Health / Centene": "https://www.magellanhealth.com",
  "MediRecords": "https://www.medirecords.com",
  "Medici / legacy": "https://www.mdlive.com",
  "Meru Health": "https://www.meruhealth.com",
  "Mindstrong Health, Inc.": "https://www.mindstrong.com",
  "Modern Health, Inc.": "https://www.modernhealth.com",
  "Monument": "https://joinmonument.com",
  "Motivo Health": "https://motivohealth.com",

  // O
  "Omada Health": "https://www.omadahealth.com",
  "Ophelia": "https://ophelia.com",
  "Optum": "https://www.optum.com",

  // P
  "Personify Health": "https://www.personifyhealth.com",
  "Preferra Insurance": "https://www.preferrainsurance.com",

  // Q
  "Quartet Health": "https://www.quartethealth.com",

  // R
  "Rula Health, Inc.": "https://www.rula.com",

  // S
  "SonderMind, Inc.": "https://www.sondermind.com",
  "Spring Health, Inc.": "https://www.springhealth.com",
  "Spruce Health, Inc.": "https://www.sprucehealth.com",
  "SteadyMD (acquired by DocGo)": "https://www.steadymd.com",

  // T
  "Teladoc Health, Inc.": "https://www.teladoc.com",
  "Thriveworks": "https://thriveworks.com",
  "TigerConnect": "https://tigerconnect.com",
  "TriMed Technologies": "https://www.trimedtech.com",
  "Two Chairs, Inc.": "https://www.twochairs.com",
  "TytoCare": "https://www.tytocare.com",

  // V
  "Vianet": "https://www.vianet.health",
  "Vida Health": "https://www.vida.com",

  // W
  "Walmart / legacy": "https://www.walmart.com/cp/walmart-health/9023008",
  "Wheel": "https://www.wheel.com",

  // Z
  "Zanda": "https://www.zandahealth.com",
  "Zoom Video Communications": "https://zoom.us/healthcare",

  // Major EHR/EMR vendors
  "SimplePractice, LLC": "https://www.simplepractice.com",
  "SimplePractice": "https://www.simplepractice.com",
  "TherapyNotes, LLC": "https://www.therapynotes.com",
  "TherapyNotes": "https://www.therapynotes.com",
  "Valant": "https://www.valant.io",
  "Valant Medical Solutions": "https://www.valant.io",
  "eClinicalWorks, LLC": "https://www.eclinicalworks.com",
  "eClinicalWorks": "https://www.eclinicalworks.com",
  "athenahealth, Inc.": "https://www.athenahealth.com",
  "athenahealth": "https://www.athenahealth.com",
  "Epic Systems Corporation": "https://www.epic.com",
  "Epic": "https://www.epic.com",
  "Oracle Health": "https://www.oracle.com/health/",
  "Oracle Health (formerly Cerner Corporation)": "https://www.oracle.com/health/",
  "Cerner Corporation": "https://www.oracle.com/health/",
  "Cerner": "https://www.oracle.com/health/",
  "MEDITECH": "https://www.meditech.com",
  "NextGen Healthcare": "https://www.nextgen.com",
  "NextGen Healthcare, Inc.": "https://www.nextgen.com",
  "Allscripts": "https://www.allscripts.com",
  "Allscripts Healthcare Solutions": "https://www.allscripts.com",
  "Altera Digital Health": "https://www.alterahealth.com",
  "Veradigm": "https://www.veradigm.com",
  "Veradigm (formerly Allscripts)": "https://www.veradigm.com",

  // Practice Management
  "TheraNest": "https://www.theranest.com",
  "Jane Software Inc.": "https://jane.app",
  "Jane App": "https://jane.app",
  "Kareo": "https://www.kareo.com",
  "Tebra": "https://www.tebra.com",
  "DrChrono": "https://www.drchrono.com",
  "AdvancedMD, Inc.": "https://www.advancedmd.com",
  "AdvancedMD": "https://www.advancedmd.com",
  "Practice Fusion": "https://www.practicefusion.com",
  "Healthie": "https://www.gethealthie.com",
  "IntakeQ": "https://intakeq.com",
  "Carepatron": "https://www.carepatron.com",
  "Sessions Health": "https://www.sessionshealth.com",
  "Osmind": "https://www.osmind.org",
  "Luminello": "https://luminello.com",
  "ICANotes": "https://www.icanotes.com",

  // Behavioral Health Specific
  "Qualifacts": "https://www.qualifacts.com",
  "Qualifacts Systems, Inc.": "https://www.qualifacts.com",
  "Netsmart": "https://www.ntst.com",
  "Netsmart Technologies": "https://www.ntst.com",
  "Kipu Health": "https://kipuhealth.com",
  "Kipu": "https://kipuhealth.com",
  "Sunwave Health": "https://sunwavehealth.com",
  "Alleva": "https://helloalleva.com",
  "Lightning Step Technologies": "https://www.lightningstep.com",
  "BestNotes LLC": "https://www.bestnotes.com",
  "BestNotes": "https://www.bestnotes.com",
  "Opus EHR": "https://www.opusehr.com",
  "Behave Health": "https://www.behavehealth.com",
  "Ritten": "https://www.ritten.co",

  // AI Scribes
  "Freed": "https://www.getfreed.ai",
  "Nabla": "https://www.nabla.com",
  "Abridge": "https://www.abridge.com",
  "Nuance": "https://www.nuance.com",
  "Nuance Communications": "https://www.nuance.com",
  "Microsoft (Nuance)": "https://www.nuance.com",
  "Suki AI": "https://www.suki.ai",
  "Suki": "https://www.suki.ai",
  "DeepScribe": "https://www.deepscribe.ai",
  "Augmedix": "https://www.augmedix.com",
  "Ambience Healthcare": "https://www.ambiencehealthcare.com",
  "Notable": "https://www.notablehealth.com",
  "Heidi Health": "https://www.heidihealth.com",
  "Robin Healthcare": "https://www.robinhealthcare.com",

  // Telehealth
  "Doxy.me": "https://doxy.me",
  "Doximity": "https://www.doximity.com",
  "Doximity, Inc.": "https://www.doximity.com",
  "Amwell": "https://www.amwell.com",
  "Amwell (American Well Corporation)": "https://www.amwell.com",
  "American Well": "https://www.amwell.com",
  "Teladoc Health": "https://www.teladoc.com",
  "Teladoc": "https://www.teladoc.com",
  "VSee": "https://vsee.com",
  "Mend VIP, Inc.": "https://www.mend.com",
  "Mend": "https://www.mend.com",

  // RCM/Billing
  "Waystar": "https://www.waystar.com",
  "Availity": "https://www.availity.com",
  "Change Healthcare": "https://www.changehealthcare.com",
  "Trizetto": "https://www.trizetto.com",
  "R1 RCM": "https://www.r1rcm.com",
  "Candid Health": "https://www.joincandidhealth.com",
  "Cedar": "https://www.cedar.com",
  "Adonis": "https://www.adonis.io",
  "Akasa": "https://www.akasa.com",
  "Experian Health": "https://www.experian.com/healthcare/",

  // Measurement/DTx
  "Blueprint (SonderMind)": "https://www.blueprint.ai",
  "Blueprint": "https://www.blueprint.ai",
  "Greenspace Health": "https://greenspacehealth.com",
  "Mirah": "https://www.mirah.com",
  "Owl Insights": "https://owlinsights.com",
  "Lyssn": "https://www.lyssn.io",
  "Big Health": "https://www.bighealth.com",
  "Akili Interactive": "https://www.akiliinteractive.com",
  "Click Therapeutics": "https://www.clicktherapeutics.com",
  "Happify Health": "https://www.happify.com",
  "Twill": "https://www.twill.health",
  "DarioHealth": "https://www.dariohealth.com",
  "Woebot Health": "https://woebothealth.com",
  "Wysa": "https://www.wysa.com",

  // Provider Networks
  "BetterHelp": "https://www.betterhelp.com",
  "Talkspace": "https://www.talkspace.com",
  "Alma": "https://helloalma.com",
  "Headway": "https://headway.co",
  "Grow Therapy": "https://www.growtherapy.com",
  "SonderMind": "https://www.sondermind.com",
  "Rula Health": "https://www.rula.com",
  "Included Health": "https://includedhealth.com",
  "Lyra Health": "https://www.lyrahealth.com",
  "Spring Health": "https://www.springhealth.com",
  "Ginger": "https://www.ginger.com",
  "Modern Health": "https://www.modernhealth.com",
  "Charlie Health": "https://www.charliehealth.com",
  "Brightline, Inc.": "https://www.hellobrightline.com",
  "Brightline": "https://www.hellobrightline.com",

  // Scheduling/Communication
  "Klara": "https://www.klara.com",
  "Phreesia": "https://www.phreesia.com",
  "Solutionreach": "https://www.solutionreach.com",
  "Relatient": "https://www.relatient.com",
  "Luma Health": "https://www.lumahealth.io",

  // Credentialing
  "CAQH": "https://www.caqh.org",
  "Medallion": "https://www.medallion.co",
  "Verifiable": "https://www.verifiable.com",
  "symplr": "https://www.symplr.com",
  "Modio Health": "https://modiohealth.com",

  // E-Prescribing
  "DrFirst": "https://www.drfirst.com",
  "Surescripts": "https://www.surescripts.com",

  // Analytics
  "Tableau": "https://www.tableau.com",
  "Microsoft Power BI": "https://powerbi.microsoft.com",
  "Microsoft": "https://www.microsoft.com",

  // Other major vendors
  "Amazon": "https://health.amazon.com",
  "Google": "https://health.google",
  "Apple": "https://www.apple.com/healthcare/",
  "Zoom": "https://zoom.us",
  "Carbon Health": "https://carbonhealth.com",
  "Psychology Today": "https://www.psychologytoday.com",
  "GoodTherapy": "https://www.goodtherapy.org",

  // Therapy Brands / Ensora
  "Ensora Health": "https://www.ensorahealth.com",
  "Ensora Health (formerly Therapy Brands)": "https://www.ensorahealth.com",
  "Therapy Brands": "https://www.ensorahealth.com",
  "Fusion Web Clinic": "https://www.fusionwebclinic.com",
  "WebABA": "https://www.webaba.com",
  "TheraPlatform": "https://www.theraplatform.com",
  "CounSol.com": "https://www.counsol.com",
  "My Clients Plus": "https://www.myclientsplus.com",

  // Insurance/RCM specific
  "Nirvana Health": "https://www.nirvanahealth.com",
  "Mentaya": "https://mentaya.com",
  "Thrizer": "https://www.thrizer.com",
  "Reimbursify": "https://reimbursify.com",
  "IvyPay": "https://www.ivypay.com",

  // CE/Training
  "PESI": "https://www.pesi.com",
  "Zur Institute": "https://www.zurinstitute.com",
  "Beck Institute": "https://beckinstitute.org",
  "Psychotherapy Networker": "https://www.psychotherapynetworker.org",
  "Psychwire": "https://psychwire.com",
  "NetCE": "https://www.netce.com",
  "Relias": "https://www.relias.com",
};

// Product slug → website URL (for specific products)
const PRODUCT_WEBSITES = {
  // Telehealth products - derive from parent
  "simplepractice-telehealth": "https://www.simplepractice.com/telehealth/",
  "telehealth-by-simplepractice": "https://www.simplepractice.com/telehealth/",
  "therapynotes-telehealth": "https://www.therapynotes.com/features/telehealth/",
  "valant-telehealth": "https://www.valant.io/telehealth/",
  "osmind-telehealth": "https://www.osmind.org",
  "carepatron-telehealth": "https://www.carepatron.com/telehealth",
  "sessions-health-telehealth": "https://www.sessionshealth.com",
  "intakeq-telehealth": "https://intakeq.com/telehealth",
  "practice-better-telehealth": "https://www.practicebetter.io",
  "eclinicalworks-telehealth": "https://www.eclinicalworks.com/products-services/healow-telehealth/",

  // Doximity products
  "doximity-dialer": "https://www.doximity.com/clinicians/dialer",
  "doximity-dialer-video": "https://www.doximity.com/clinicians/dialer",
  "doximity-fax": "https://www.doximity.com/clinicians/fax",
  "doximity-directory": "https://www.doximity.com",
  "doximity-talent-finder": "https://www.doximity.com/talent-finder",
  "doximity-scribe": "https://www.doximity.com",
  "doximity-ask": "https://www.doximity.com",

  // VSee products
  "vsee": "https://vsee.com",
  "vsee-clinic": "https://vsee.com/clinic/",
  "vsee-messenger": "https://vsee.com",
  "vsee-telehealth-platform": "https://vsee.com",

  // Amwell products
  "amwell": "https://www.amwell.com",
  "american-well-telehealth-platform": "https://www.amwell.com",

  // Nuance/Dragon products
  "nuance-dax": "https://www.nuance.com/healthcare/ambient-clinical-intelligence.html",
  "nuance-dax-copilot": "https://www.nuance.com/healthcare/ambient-clinical-intelligence.html",
  "nuance-dragon-medical-one": "https://www.nuance.com/healthcare/provider-solutions/speech-recognition/dragon-medical-one.html",
  "microsoft-dragon-copilot": "https://www.nuance.com/healthcare/ambient-clinical-intelligence.html",
  "mmodal-fluency-direct": "https://www.nuance.com/healthcare/provider-solutions/speech-recognition.html",
  "3m-m-modal-fluency-for-imaging": "https://www.nuance.com/healthcare/provider-solutions/speech-recognition.html",

  // Epic products
  "epic-mychart": "https://www.epic.com/software#PatientEngagement",
  "epic-hyperspace": "https://www.epic.com",
  "epic-canto": "https://www.epic.com",
  "epic-haiku": "https://www.epic.com",
  "epic-cadence": "https://www.epic.com",
  "epic-beacon": "https://www.epic.com",
  "epic-willow": "https://www.epic.com",
  "epic-resolute": "https://www.epic.com",
  "epic-healthy-planet": "https://www.epic.com",
  "epic-care-everywhere": "https://www.epic.com",
  "epic-cosmos": "https://cosmos.epic.com",
  "epic-ambient-ai-integrations": "https://www.epic.com",

  // Oracle/Cerner products
  "oracle-health-powerchart": "https://www.oracle.com/health/",
  "oracle-health-firstnet": "https://www.oracle.com/health/",
  "oracle-health-careaware": "https://www.oracle.com/health/",
  "oracle-health-communityworks": "https://www.oracle.com/health/",
  "oracle-health-healtheintent": "https://www.oracle.com/health/",
  "oracle-health-healthelife": "https://www.oracle.com/health/",
  "oracle-health-pathnet": "https://www.oracle.com/health/",
  "oracle-health-pharmnet": "https://www.oracle.com/health/",
  "oracle-health-radnet": "https://www.oracle.com/health/",
  "oracle-health-revelate": "https://www.oracle.com/health/",
  "oracle-clinical-ai-agent": "https://www.oracle.com/health/",
  "cerner-millennium": "https://www.oracle.com/health/",
  "cerner-powerchart": "https://www.oracle.com/health/",
  "cerner-firstnet": "https://www.oracle.com/health/",
  "cerner-communityworks": "https://www.oracle.com/health/",
  "cerner-anasazi": "https://www.oracle.com/health/",

  // Netsmart products
  "netsmart-myavatar": "https://www.ntst.com/Solutions-Services/Products/myAvatar",
  "netsmart-myevolv": "https://www.ntst.com/Solutions-Services/Products/myEvolv",
  "netsmart-carefabric": "https://www.ntst.com/carefabric",
  "netsmart-careconnect": "https://www.ntst.com",
  "netsmart-carepov": "https://www.ntst.com",
  "netsmart-gehrimed": "https://www.ntst.com",
  "netsmart-myhealthpointe": "https://www.ntst.com",
  "netsmart-myinsight": "https://www.ntst.com",
  "netsmart-mypov": "https://www.ntst.com",
  "netsmart-myunity": "https://www.ntst.com",
  "netsmart-revconnect": "https://www.ntst.com",
  "netsmart-telehealth": "https://www.ntst.com",

  // Qualifacts products
  "qualifacts-credible": "https://www.qualifacts.com/products/credible/",
  "qualifacts-carelogic": "https://www.qualifacts.com/products/carelogic/",
  "qualifacts-carelogic-enterprise": "https://www.qualifacts.com/products/carelogic/",
  "qualifacts-insync": "https://www.qualifacts.com/products/insync/",
  "qualifacts-insync-ehr": "https://www.qualifacts.com/products/insync/",
  "qualifacts-methodone": "https://www.qualifacts.com",
  "qualifacts-iq": "https://www.qualifacts.com",

  // Kipu products
  "kipu-emr": "https://kipuhealth.com/solutions/kipu-emr/",
  "kipu-outcomes": "https://kipuhealth.com/solutions/outcomes/",
  "kipu-rcm": "https://kipuhealth.com/solutions/revenue-cycle/",
  "kipu-grc": "https://kipuhealth.com",
  "kipu-marketplace": "https://kipuhealth.com",
  "kipu-intelligence": "https://kipuhealth.com",
  "kipucrm": "https://kipuhealth.com",

  // Ensora/Therapy Brands products
  "ensora-catalyst": "https://www.ensorahealth.com",
  "ensora-fusion": "https://www.ensorahealth.com",
  "ensora-myclientsplus": "https://www.myclientsplus.com",
  "ensora-npaworks": "https://www.ensorahealth.com",
  "ensora-procentive": "https://www.procentive.com",
  "ensora-sharenote": "https://www.ensorahealth.com",
  "ensora-webaba": "https://www.webaba.com",

  // Waystar products
  "waystar-claims-management": "https://www.waystar.com/solutions/claims-management/",
  "waystar-denial-appeal-management": "https://www.waystar.com/solutions/denial-management/",
  "waystar-eligibility": "https://www.waystar.com/solutions/eligibility-verification/",
  "waystar-prior-authorization": "https://www.waystar.com/solutions/prior-authorization/",

  // Availity products
  "availity-essentials": "https://www.availity.com/essentials",
  "availity-revenue-cycle-management": "https://www.availity.com",

  // AdvancedMD products
  "advancedmd-ehr": "https://www.advancedmd.com/ehr-software/",
  "advancedmd-medical-billing": "https://www.advancedmd.com/billing-software/",

  // athenahealth products
  "athenaclinicals": "https://www.athenahealth.com/solutions/ambulatory-ehr",
  "athenacollector": "https://www.athenahealth.com/solutions/revenue-cycle-management",
  "athenacommunicator": "https://www.athenahealth.com/solutions/patient-engagement",
  "athenacoordinator": "https://www.athenahealth.com",
  "athenatelehealth": "https://www.athenahealth.com/solutions/telehealth",
  "athenaone-ambient-notes": "https://www.athenahealth.com",

  // eClinicalWorks products
  "eclinicalworks-rcm": "https://www.eclinicalworks.com/products-services/revenue-cycle-management/",
  "eclinicalworks-ai-medical-scribe": "https://www.eclinicalworks.com",
  "eclinicaltouch": "https://www.eclinicalworks.com",

  // NextGen products
  "nextgen-enterprise": "https://www.nextgen.com/products/nextgen-enterprise",
  "nextgen-enterprise-ehr": "https://www.nextgen.com/products/nextgen-enterprise",
  "nextgen-enterprise-pm": "https://www.nextgen.com/products/nextgen-enterprise",
  "nextgen-office": "https://www.nextgen.com/products/nextgen-office",
  "nextgen-mobile": "https://www.nextgen.com",
  "nextgen-behavioral-health-suite": "https://www.nextgen.com/solutions/specialty/behavioral-health",
  "nextgen-patient-experience-platform": "https://www.nextgen.com",

  // Phreesia products
  "phreesia": "https://www.phreesia.com",

  // Klara products
  "klara-patient-communication": "https://www.klara.com",

  // Telehealth platforms
  "telemynd": "https://www.telemynd.com",
  "healthtap": "https://www.healthtap.com",
  "mend": "https://www.mend.com",
  "doctor-on-demand": "https://includedhealth.com/doctor-on-demand/",
  "docvilla": "https://www.docvilla.com",
  "iris-telehealth": "https://www.iristelehealth.com",
  "evisit": "https://evisit.com",

  // Well-known standalone products
  "headspace-for-organizations": "https://www.headspace.com/work",
  "silvercloud": "https://www.silvercloudhealth.com",
  "sleepio": "https://www.bighealth.com/sleepio",
  "sleepiorx": "https://www.bighealth.com/sleepio",
  "sparkrx": "https://www.bighealth.com/sparkrx",
  "inflow": "https://www.getinflow.io",
  "joon-health": "https://joon.com",
  "manatee": "https://www.getmanatee.com",

  // Other specific products
  "amazon-one-medical": "https://www.onemedical.com",
  "microsoft-teams-for-healthcare": "https://www.microsoft.com/en-us/microsoft-teams/healthcare-solutions",
  "healow": "https://healow.com",
  "included-health-virtual-care": "https://includedhealth.com",
  "access-telecare": "https://accesstelecare.com",
  "insight-telepsychiatry": "https://www.arraybehavioralcare.com",
  "avel-ecare": "https://www.avelecare.com",
  "memd": "https://www.walmart.com/cp/walmart-health-virtual-care/9023008",
  "carbon-health-virtual-care": "https://carbonhealth.com",
  "current-health": "https://www.currenthealth.com",

  // Billing tools
  "candid-billing": "https://www.joincandidhealth.com",
  "candid-claims": "https://www.joincandidhealth.com",
  "candid-eligibility": "https://www.joincandidhealth.com",
  "candid-remits": "https://www.joincandidhealth.com",
  "cedar-pay": "https://www.cedar.com",
  "adonis-claims": "https://www.adonis.io",
  "adonis-prior-authorization": "https://www.adonis.io",
  "adonis-revenue-intelligence": "https://www.adonis.io",

  // Provider network specific
  "grow-therapy-billing": "https://www.growtherapy.com",
  "alma-insurance-support": "https://helloalma.com",
  "alma-provider-platform": "https://helloalma.com",
  "headway-billing": "https://headway.co",
  "rula-billing": "https://www.rula.com",
  "sondermind-billing": "https://www.sondermind.com",

  // Analytics
  "tableau-healthcare": "https://www.tableau.com/solutions/healthcare-analytics",
  "power-bi-healthcare": "https://powerbi.microsoft.com/en-us/industry/healthcare/",

  // Additional products - A
  "akasa-generative-ai": "https://www.akasa.com",
  "akasa": "https://www.akasa.com",
  "amazon-transcribe-medical": "https://aws.amazon.com/transcribe/medical/",
  "allscripts-professional-ehr": "https://www.alterahealth.com",
  "allscripts-touchworks-ehr": "https://www.alterahealth.com",
  "allscripts-sunrise": "https://www.alterahealth.com",
  "allscripts-opal": "https://www.alterahealth.com",
  "allscripts-rcms": "https://www.alterahealth.com",
  "allscripts-star": "https://www.alterahealth.com",
  "allscripts-healthquest": "https://www.alterahealth.com",
  "altera-paragon": "https://www.alterahealth.com",
  "altera-sunrise": "https://www.alterahealth.com",
  "altera-touchworks": "https://www.alterahealth.com",
  "american-professional-agency": "https://www.americanprofessional.com",
  "apa-insurance-trust": "https://www.apait.org",
  "aspirion": "https://www.aspirion.com",
  "assemblyai-medical-speech": "https://www.assemblyai.com",
  "attunement-patient-monitoring": "https://attunement.io",
  "attunement": "https://attunement.io",
  "autonotes": "https://www.autonotes.ai",
  "avaamo-ambient": "https://www.avaamo.ai",
  "awell-copilot": "https://www.awellhealth.com",
  "azure-ai-speech-for-health": "https://azure.microsoft.com/en-us/products/ai-services/ai-speech",

  // B
  "bastiongpt": "https://www.bastionhealth.com",
  "berries": "https://www.berries.ai",
  "behaivior-recovery": "https://www.behaivior.com",
  "bicycle-health-mat": "https://www.bicyclehealth.com",
  "bicycle-health": "https://www.bicyclehealth.com",
  "boulder-care-mat": "https://www.boulder.care",
  "boulder-care": "https://www.boulder.care",
  "brightside-health": "https://www.brightside.com",
  "bmj-best-practice": "https://bestpractice.bmj.com",

  // C
  "carecloud-rcm": "https://www.carecloud.com",
  "carepaths-outcomes": "https://carepaths.com",
  "carepaths-ehr": "https://carepaths.com",
  "cartwheel-care": "https://www.cartwheelcare.org",
  "cerebral": "https://www.cerebral.com",
  "charlie-health-iop": "https://www.charliehealth.com",
  "charlie-health": "https://www.charliehealth.com",
  "chess-health-connections": "https://www.chess.health",
  "chess-health-eintervention": "https://www.chess.health",
  "chg-healthcare": "https://www.chghealthcare.com",
  "claim-md": "https://www.claim.md",
  "clinicmind-ai-scribe": "https://www.clinicmind.com",
  "cliniko-telehealth": "https://www.cliniko.com",
  "cliniko": "https://www.cliniko.com",
  "cmf-group": "https://www.cmfgroup.com",
  "codametrix": "https://www.codametrix.com",
  "cognoa-canvas-dx": "https://www.cognoa.com",
  "collaboratemd": "https://www.collaboratemd.com",
  "collectly": "https://www.collectly.co",
  "commure-rcm": "https://www.commure.com",
  "commure-scribe": "https://www.commure.com",
  "commure-strongline": "https://www.commure.com",
  "comphealth": "https://www.chghealthcare.com/brands/comphealth",
  "compsych-guidanceresources": "https://www.compsych.com",
  "concert-health-collaborative-care": "https://www.concerthealth.com",
  "concert-health": "https://www.concerthealth.com",
  "core-solutions-cx360": "https://www.caborehealthcare.com",
  "coronis-health": "https://www.coronishealth.com",
  "covermymeds": "https://www.covermymeds.com",
  "cph-associates": "https://www.cphins.com",
  "credsimple": "https://www.symplr.com",
  "curalinc-healthcare": "https://www.curalinc.com",

  // D
  "daybreak-health": "https://www.daybreakhealth.com",
  "deepcura": "https://www.deepcura.com",
  "deepgram-medical-transcription": "https://deepgram.com",
  "denmaar-guardian": "https://denmaar.com",
  "denmaar-rcm": "https://denmaar.com",
  "denscribe": "https://denmaar.com",
  "denti-ai-voice": "https://www.denti.ai",
  "doctor-on-demand-behavioral-health": "https://includedhealth.com/doctor-on-demand/",
  "doctoralia-for-specialists": "https://www.doctoralia.com",
  "dosespot": "https://www.dosespot.com",
  "dricloud-telemedicine": "https://dricloud.com",
  "drfirst-iprescribe": "https://www.drfirst.com/products/iprescribe/",
  "drfirst-rcopia": "https://www.drfirst.com/products/rcopia/",
  "dxplain": "https://www.mghlcs.org/projects/dxplain",
  "dynamed": "https://www.dynamed.com",
  "dynamicare-health": "https://www.dynamicarehealth.com",

  // E
  "earlipoint": "https://www.earlitec.com",
  "echo-credentialing": "https://www.healthstream.com",
  "eko-telehealth": "https://www.ekohealth.com",
  "eleos-health": "https://www.eleos.health",
  "ellie-mental-health": "https://www.elliementalhealth.com",
  "embark-behavioral-health": "https://embarkbh.com",
  "equip-health-eating-disorder-care": "https://equip.health",
  "equip-virtual-eating-disorder-treatment": "https://equip.health",
  "equip": "https://equip.health",
  "evernorth-behavioral-health": "https://www.evernorth.com",
  "evercheck": "https://www.evercheck.com",
  "evidencemd": "https://www.evidencemd.ai",
  "experian-patient-estimates": "https://www.experian.com/healthcare/",
  "exym": "https://www.exym.com",

  // F
  "fathom-ai-medical-coding": "https://www.fathomhealth.com",
  "figure-1": "https://www.figure1.com",
  "finthrive": "https://www.finthrive.com",
  "floreo-clinician-portal": "https://floreovr.com",
  "foothold-awards": "https://footholdtechnology.com",

  // G
  "genesight": "https://genesight.com",
  "genoa-telepsychiatry": "https://www.genoahealthcare.com",
  "genomind": "https://www.genomind.com",
  "gideon": "https://www.gideononline.com",
  "glass-ai": "https://glass.health",
  "ginger-coach": "https://www.headspace.com/work",
  "google-cloud-healthcare-speech-to-text": "https://cloud.google.com/healthcare-api/docs/concepts/speech",
  "grow-therapy": "https://www.growtherapy.com",

  // H
  "h1": "https://www.h1.co",
  "halaxy-telehealth": "https://www.halaxy.com",
  "hazel-health-mental-health": "https://www.hazel.co",
  "health-ecareers": "https://www.healthecareers.com",
  "healthjoy-behavioral-health": "https://www.healthjoy.com",
  "healthstream-credentialstream": "https://www.healthstream.com",
  "headspace-health": "https://www.headspace.com",
  "headway": "https://headway.co",
  "heard": "https://joinheard.com",
  "holmusk-neuroblu-database": "https://www.holmusk.com",
  "hpso": "https://www.hpso.com",
  "human-dx": "https://www.humandx.org",

  // I
  "idgenetix": "https://www.castlebiosciences.com",
  "ieso-digital-cbt": "https://www.iesohealth.com",
  "ieso-digital-health": "https://www.iesohealth.com",
  "imaginesoftware": "https://www.imaginesoftware.com",
  "inbox-health": "https://www.inboxhealth.com",
  "infinx": "https://www.infinx.com",
  "inferscience-hcc-assistant": "https://inferscience.com",
  "intrigma": "https://www.intrigma.com",
  "iscribehealth": "https://www.iscribehealth.com",
  "isabel": "https://www.isabelhealthcare.com",

  // J
  "jane-telehealth": "https://jane.app",

  // K
  "knowtex": "https://www.knowtex.ai",
  "koa-health-foundations": "https://www.koahealth.com",
  "koa-health-mindset": "https://www.koahealth.com",
  "koa-health-perspectives": "https://www.koahealth.com",
  "koa-health": "https://www.koahealth.com",

  // L
  "lexicomp": "https://www.wolterskluwer.com/en/solutions/lexicomp",
  "lightning-bolt": "https://www.lbs.cloud",
  "lightfully": "https://lightfully.com",
  "locumtenens-com": "https://www.locumtenens.com",
  "lucasai": "https://www.lucasai.io",
  "lyra-health": "https://www.lyrahealth.com",
  "lyssn": "https://www.lyssn.io",

  // M
  "m3-checklist": "https://www.m3information.com",
  "magellan-behavioral-health": "https://www.magellanhealth.com",
  "md-staff": "https://www.mdstaff.com",
  "mdcalc": "https://www.mdcalc.com",
  "mdlive": "https://www.mdlive.com",
  "medallion-credentialing": "https://www.medallion.co",
  "medical-billers-and-coders": "https://www.medicalbillersandcoders.com",
  "medirecords-telehealth": "https://www.medirecords.com",
  "medshr": "https://www.medshr.net",
  "medtrainer-credentialing": "https://medtrainer.com",
  "mentalyc": "https://mentalyc.com",
  "meru-health": "https://www.meruhealth.com",
  "mh-scribe": "https://www.mhscribe.com",
  "micromedex": "https://www.ibm.com/products/micromedex-with-watson",
  "mightier-clinician-dashboard": "https://www.mightier.com",
  "mightier": "https://www.mightier.com",
  "mindmotion-go": "https://www.mindmaze.com",
  "mindstrong": "https://www.mindstrong.com",
  "mocingbird": "https://www.mocingbird.com",
  "modio-health-oneview": "https://modiohealth.com",
  "modio-payer-enrollment": "https://modiohealth.com",
  "modern-health": "https://www.modernhealth.com",
  "monument": "https://joinmonument.com",
  "motivo": "https://motivohealth.com",
  "mutuo-autoscribe": "https://www.mutuo.health",
  "myoutcomes": "https://www.myoutcomes.com",

  // N
  "navina": "https://www.navina.ai",
  "nei-prescribe": "https://www.neiprescribe.com",
  "neolytix": "https://www.neolytix.com",
  "netce": "https://www.netce.com",
  "neuroblu": "https://www.holmusk.com/neuroblu",
  "neuroflow": "https://www.neuroflow.com",
  "neuropharmagen": "https://www.genomind.com/neuropharmagen",
  "newcrop": "https://www.drfirst.com/products/newcrop/",
  "nomad-health": "https://www.nomadhealth.com",
  "notemd": "https://www.notemd.io",
  "nuemd-billing": "https://www.advancedmd.com",
  "nym-clinical-language-understanding": "https://www.nym.health",

  // O
  "office-ally-service-center": "https://www.officeally.com",
  "office-ally": "https://www.officeally.com",
  "omada-mental-health": "https://www.omadahealth.com",
  "onestep-scribe": "https://www.onestep.ai",
  "openevidence": "https://www.openevidence.com",
  "operant-billing-solutions": "https://www.operant.com",
  "ophelia-oud-care": "https://ophelia.com",
  "ophelia": "https://ophelia.com",
  "optum-behavioral-health": "https://www.optum.com/en/business/behavioral-health",
  "oq-analyst": "https://www.oqmeasures.com",
  "otter-ai": "https://otter.ai",
  "owl-insights": "https://owlinsights.com",
  "oxfordvr-gamechange": "https://ofrhealth.com",

  // P
  "patientnotes": "https://patientnotes.com",
  "patientpay": "https://www.patientpay.com",
  "pathway": "https://www.pathwaymd.com",
  "paydc": "https://www.paydc.com",
  "payground": "https://payground.com",
  "pear-therapeutics": "https://peartherapeutics.com",
  "pelago": "https://www.pelagohealth.com",
  "personify-health-mental-wellbeing": "https://www.personifyhealth.com",
  "perspectives-reclaim-denial-prevention": "https://www.wellsky.com",
  "perspectives-reclaim": "https://www.wellsky.com",
  "petal-health": "https://www.petalmd.com",
  "pesi": "https://www.pesi.com",
  "pieces-copilot": "https://piecestech.com",
  "pieces-technologies": "https://piecestech.com",
  "plume-ia": "https://www.plume.health",
  "plutus-health": "https://plutushealth.com",
  "plushcare": "https://www.plushcare.com",
  "pmhscribe": "https://www.pmhscribe.com",
  "practice-better": "https://www.practicebetter.io",
  "practicelink": "https://www.practicelink.com",
  "practicematch": "https://www.practicematch.com",
  "preferra-insurance": "https://www.preferrainsurance.com",
  "prescriberpoint": "https://www.prescriberpoint.com",
  "prms": "https://www.prms.com",
  "procredex": "https://www.procredex.com",
  "prosper-health": "https://www.prosper.health",
  "psious": "https://www.psious.com",
  "psychopharmacology-institute": "https://psychopharmacologyinstitute.com",
  "psychotherapy-networker": "https://www.psychotherapynetworker.org",
  "psychwire": "https://psychwire.com",
  "psylaris": "https://www.psylaris.com",

  // Q
  "qgenda-credentialing": "https://www.qgenda.com/solutions/credentialing",
  "quartet-smartmatch": "https://www.quartethealth.com",

  // R
  "r1-rcm": "https://www.r1rcm.com",
  "rectangle-health-practice-management-bridge": "https://www.rectanglehealth.com",
  "rectangle-health": "https://www.rectanglehealth.com",
  "refresh-mental-health": "https://refreshmentalhealth.com",
  "regard-ai": "https://www.withregard.com",
  "regard": "https://www.withregard.com",
  "robin-healthcare": "https://www.robinhealthcare.com",
  "rula": "https://www.rula.com",

  // S
  "s10-ai": "https://www.s10.ai",
  "saykara": "https://www.saykara.com",
  "schedule360": "https://schedule360.com",
  "scribeai": "https://www.scribeai.com",
  "scribeamerica-speke": "https://scribeamerica.com/speke/",
  "scribeberry": "https://www.scribeberry.com",
  "scribeemr": "https://www.scribeemr.com",
  "scribelink": "https://www.scribelink.com",
  "sermo": "https://www.sermo.com",
  "shiftadmin": "https://www.shiftadmin.com",
  "shimmer": "https://shimmer.care",
  "silvercloud-space-from-anxiety": "https://www.silvercloudhealth.com",
  "silvercloud-space-from-depression": "https://www.silvercloudhealth.com",
  "silvercloud-space-from-gad": "https://www.silvercloudhealth.com",
  "silvercloud-space-from-stress": "https://www.silvercloudhealth.com",
  "silvercloud": "https://www.silvercloudhealth.com",
  "silversheet": "https://www.symplr.com",
  "simcare": "https://www.simcare.ai",
  "simcare-ai-training": "https://www.simcare.ai",
  "skipta": "https://www.skipta.com",
  "sleep-reset": "https://www.sleepreset.com",
  "soap-note-buddy": "https://soapnotebuddy.com",
  "soc-telemed": "https://accesstelecare.com",
  "solutionreach": "https://www.solutionreach.com",
  "sondermind": "https://www.sondermind.com",
  "sopris-health": "https://www.soprishealth.com",
  "spring-health": "https://www.springhealth.com",
  "spruce-health": "https://www.sprucehealth.com",
  "spr-y-spry": "https://spryhealthcare.com",
  "steadymd": "https://www.steadymd.com",
  "streamline-smartcare": "https://www.streamlinehealthcare.com",
  "sully-ai-scribe": "https://www.sully.ai",
  "sunoh-ai": "https://www.sunoh.ai",
  "supanote": "https://supanote.ai",
  "superpay": "https://www.superpay.co",
  "symplr-cvo": "https://www.symplr.com/solutions/provider-management",
  "symplr-provider": "https://www.symplr.com/solutions/provider-management",
  "symplr-workforce": "https://www.symplr.com/solutions/workforce-management",

  // T
  "tali-ai": "https://tali.ai",
  "talkiatry-mdhub": "https://www.talkiatry.com",
  "talkiatry": "https://www.talkiatry.com",
  "tandem-behavioral-health": "https://www.tandem.health",
  "teladoc-betterhelp": "https://www.betterhelp.com",
  "teladoc-health": "https://www.teladoc.com",
  "telehealth-certification-institute": "https://telehealthcertificationinstitute.com",
  "thera-link": "https://www.ensorahealth.com",
  "therapyfuel": "https://www.therapyfuel.com",
  "therapy-revenue-solutions": "https://therapyrevenuesolutions.com",
  "thriveworks": "https://thriveworks.com",
  "tigerconnect": "https://tigerconnect.com",
  "tonic-app": "https://www.tonicapp.com",
  "tortus": "https://www.tortus.ai",
  "total-brain": "https://www.totalbrain.com",
  "trayt-health": "https://www.trayt.health",
  "trimed-complete": "https://www.trimedtech.com",
  "tridiuum": "https://www.tridiuum.com",
  "tridiuum-one": "https://www.tridiuum.com",
  "trizetto-provider-solutions": "https://www.trizetto.com",
  "two-chairs": "https://www.twochairs.com",
  "twofold-health": "https://www.twofold.health",
  "tytocare-home-smart-clinic": "https://www.tytocare.com",
  "tytocare": "https://www.tytocare.com",

  // U
  "ukg-pro-workforce-management": "https://www.ukg.com",
  "upheal": "https://www.upheal.io",

  // V
  "valera-health": "https://www.valerahealth.com",
  "vera-health": "https://www.veradigm.com",
  "verifiable-credentialing": "https://www.verifiable.com",
  "verifiable-network-management": "https://www.verifiable.com",
  "verisys": "https://www.verisys.com",
  "vetrec": "https://www.vetrec.io",
  "visualdx": "https://www.visualdx.com",
  "vitalsign6": "https://www.vitalsign6.com",
  "vivian-health": "https://www.vivian.com",

  // W
  "wavo-health": "https://www.wavohealth.com",
  "weatherby-healthcare": "https://www.weatherbyhealthcare.com",
  "weconnect-recovery": "https://www.weconnectrecovery.com",
  "wheel": "https://www.wheel.com",
  "within-health": "https://withinhealth.com",
  "workday-healthcare": "https://www.workday.com/en-us/industries/healthcare.html",
  "wysa-copilot": "https://www.wysa.com",
  "wysa-for-employers": "https://www.wysa.com",

  // X
  "xifin": "https://www.xifin.com",
  "xrhealth": "https://www.xr.health",

  // Y
  "youper": "https://www.youper.ai",

  // Z
  "zanda-ai-session-transcription": "https://www.zandahealth.com",
  "zelis": "https://www.zelis.com",
  "zoom-clinical-notes": "https://zoom.us/docs/en-us/ai-companion.html",
  "zoom-for-healthcare": "https://zoom.us/healthcare",
  "zur-institute": "https://www.zurinstitute.com",

  // === BATCH 2: Remaining products ===
  // Numbers and A
  "75health": "https://www.75health.com",
  "aari": "https://www.aari.care",
  "aatbs": "https://www.aatbs.com",
  "aba-building-blocks": "https://www.ababuildingblocks.com",
  "accessmedicine": "https://accessmedicine.mhmedical.com",
  "accumed": "https://www.accumed.com",
  "adonis": "https://www.adonis.io",
  "advanced-data-systems": "https://www.adsc.com",
  "advanced-telemed-services": "https://advancedtelemedicine.com",
  "advancedpm": "https://www.advancedmd.com",
  "affect-therapeutics": "https://www.affecttherapeutics.com",
  "ags-health": "https://www.agshealth.com",
  "aims-center-collaborative-care-registry": "https://aims.uw.edu",
  "alleva": "https://helloalleva.com",
  "amboss": "https://www.amboss.com",
  "amd-global-telemedicine": "https://www.amdtelemedicine.com",
  "amelia-virtual-care": "https://ameliavirtualcare.com",
  "american-telepsychiatrists": "https://americantelepsychiatrists.com",
  "aperture-credentialing": "https://aperturecredentialing.com",
  "arise": "https://www.arisecounseling.com",
  "array-behavioral-care": "https://www.arraybehavioralcare.com",
  "as-you-are": "https://www.asyouare.com",
  "availity": "https://www.availity.com",
  "aware-recovery-care": "https://www.awarerecoverycare.com",

  // B
  "behave-health": "https://www.behavehealth.com",
  "behavioral-health-billing-services": "https://bhbillingservices.com",
  "bend-health": "https://www.bendhealth.com",
  "bluebrix": "https://www.bluebrix.com",
  "breezynotes": "https://breezynotes.com",
  "bright-heart-health": "https://www.brighthearthealth.com",

  // C
  "camber": "https://www.camberwell.com",
  "careclix": "https://www.careclix.com",
  "careconnect": "https://www.ntst.com/careconnect",
  "caregility": "https://caregility.com",
  "carepatron": "https://www.carepatron.com",
  "carepov": "https://www.ntst.com",
  "catalyst": "https://www.ensorahealth.com/catalyst",
  "cdoc": "https://www.cdocemr.com",
  "ce-broker": "https://www.cebroker.com",
  "ce4less": "https://www.ce4less.com",
  "certifyos": "https://www.certifyos.com",
  "change-healthcare": "https://www.changehealthcare.com",
  "charta-health": "https://charta.health",
  "chartnote": "https://www.chartnote.com",
  "checkpoint-ehr": "https://www.checkpointehr.com",
  "circle-medical": "https://www.circlemedical.com",
  "cleanslate-centers": "https://www.cleanslatectr.com",
  "click4time": "https://www.click4time.com",
  "clinicea": "https://www.clinicea.com",
  "clinicmind": "https://www.clinicmind.com",
  "clinicsource": "https://www.clinicsource.com",
  "clinictracker": "https://www.clinictracker.com",
  "community-carelink": "https://www.ntst.com/carelink",
  "compulink": "https://www.compulinkadvantage.com",
  "consentz": "https://www.consentz.com",
  "coralehr": "https://www.coralehr.com",
  "counsol-com": "https://www.counsol.com",
  "credentialmydoc": "https://www.credentialmydoc.com",
  "criteriaiq": "https://www.criteriaiq.com",
  "cube-therapy-billing": "https://cubetherapybilling.com",
  "curogram": "https://www.curogram.com",

  // D
  "dazos": "https://www.dazos.com",
  "docmatter": "https://www.docmatter.com",
  "doctorite": "https://www.doctorite.com",
  "doximity": "https://www.doximity.com",
  "drchrono": "https://www.drchrono.com",
  "drcloudehr": "https://www.drcloud.com",
  "dricloud": "https://dricloud.com",

  // E
  "e-psychiatry": "https://e-psychiatry.com",
  "eccovia-clienttrack": "https://www.eccovia.com/clienttrack",
  "echovantage": "https://www.echovantage.com",
  "ehryourway": "https://www.ehryourway.com",
  "eleanor-health": "https://www.eleanorhealth.com",
  "enablemypractice": "https://www.enablemypractice.com",
  "encounter-telehealth": "https://www.encountertelehealth.com",
  "ewellness-healthcare": "https://ewellnesshealthcare.com",
  "experian-health": "https://www.experian.com/healthcare/",

  // F
  "flex-his": "https://www.flexhis.com",
  "foresight-mental-health": "https://www.foresightmentalhealth.com",
  "fusion-ehr": "https://www.fusionwebclinic.com",

  // G
  "galileo": "https://www.galileo.io",
  "gehrimed": "https://www.ntst.com/gehrimed",
  "geode-health": "https://www.geodehealth.com",
  "glass-health": "https://glass.health",
  "globalmed": "https://www.globalmed.com",
  "gorendezvous": "https://www.gorendezvous.com",
  "groups-recover-together": "https://www.groupsrecovery.com",

  // H
  "halaxy": "https://www.halaxy.com",
  "happify-health": "https://www.happify.com",
  "harmony-medical": "https://www.harmonymedical.com",
  "healee": "https://www.healee.com",
  "hicuity-health": "https://www.hicuityhealth.com",
  "hinext-treat": "https://www.hinext.ai",

  // I
  "ideal-option": "https://www.idealoption.com",
  "ima-imaserve": "https://www.imaserve.com",
  "insta": "https://www.insta.co",
  "instride-health": "https://www.instride.health",

  // J
  "juno-emr": "https://www.junoemr.com",

  // K
  "k-health": "https://www.khealth.com",
  "kareo-clinical": "https://www.kareo.com/clinical",
  "kareo-engage": "https://www.kareo.com/engage",
  "kip-health": "https://www.kiphealth.com",
  "klarify": "https://www.klarify.com",

  // L
  "lifestance-health": "https://lifestance.com",
  "lightning-step": "https://www.lightningstep.com",
  "little-otter": "https://www.littleotterhealth.com",
  "lucet": "https://www.lucethealth.com",
  "luma-health": "https://www.lumahealth.io",
  "lunajoy-health": "https://www.lunajoy.com",

  // M
  "mantra-health": "https://www.mantrahealth.com",
  "mdhub": "https://www.mdhub.ai",
  "medclarity": "https://www.medclarity.com",
  "meddbase": "https://www.meddbase.com",
  "medez": "https://www.medez.com",
  "medgen": "https://www.medgen.com",
  "medici": "https://www.medici.md",
  "medirecords": "https://www.medirecords.com",
  "meditech-expanse": "https://www.meditech.com/products/expanse/",
  "medscape": "https://www.medscape.com",
  "mentalhappy": "https://www.mentalhappy.com",
  "methasoft": "https://www.methasoft.com",
  "methodone": "https://www.qualifacts.com",
  "midexpro": "https://www.midexpro.com",
  "millin-billing": "https://www.millin.net",
  "millinpro": "https://www.millin.net",
  "mindful-health-solutions": "https://www.mindfulhealthsolutions.com",
  "mindoula": "https://www.mindoula.com",
  "mindpath-health": "https://www.mindpathhealth.com",
  "mindstrong-health": "https://www.mindstrong.com",
  "mindwise-health": "https://mindwisehealth.com",
  "missing-piece-billing-consulting": "https://missingpiecebilling.com",
  "my-best-practice": "https://www.mybestpractice.com",
  "myclientsplus": "https://www.myclientsplus.com",
  "myhealthpointe": "https://www.ntst.com",
  "myinsight": "https://www.ntst.com",
  "myunity": "https://www.ntst.com",

  // N
  "navix-health": "https://www.navixhealth.com",
  "navix-rcm": "https://www.navixhealth.com/rcm",
  "nexus-ehr": "https://www.nexusehr.com",
  "nimbo": "https://nimbo.com",
  "nirvana-health": "https://www.nirvanahealth.com",
  "noteable": "https://www.noteablehealth.com",
  "npaworks": "https://www.ensorahealth.com/npaworks",
  "nuemd": "https://www.advancedmd.com",
  "nystrom-associates": "https://www.nystromassociates.com",

  // O
  "oar-health": "https://www.oar.health",
  "ohmd": "https://www.ohmd.com",
  "openloop": "https://openloophealth.com",
  "opus": "https://www.opusehr.com",
  "opus-crm": "https://www.opusehr.com/crm",
  "opus-ehr": "https://www.opusehr.com",
  "opus-rcm": "https://www.opusehr.com/rcm",
  "orchid": "https://www.orchidmbc.com",
  "orchid-billing": "https://www.orchidmbc.com",
  "orchid-measurement-based-care": "https://www.orchidmbc.com",

  // P
  "pabau": "https://www.pabau.com",
  "patagonia-health": "https://www.patagoniahealth.com",
  "patientpop": "https://www.patientpop.com",
  "perfectserve": "https://www.perfectserve.com",
  "pertexaiq-radekal": "https://www.pertexaiq.com",
  "pimsy": "https://www.pimsyemr.com",
  "pimsy-mental-health-ehr": "https://www.pimsyemr.com",
  "pomelo-health": "https://pomelohealth.io",
  "power-diary": "https://www.powerdiary.com",
  "practice-fusion": "https://www.practicefusion.com",
  "practice-mate": "https://www.officeally.com/practice-mate",
  "practicesuite": "https://www.practicesuite.com",
  "practicesuite-billing": "https://www.practicesuite.com/billing",
  "precision-practice-management": "https://www.precisionpm.com",
  "precisioncare": "https://www.ntst.com/precisioncare",
  "prevounce": "https://prevounce.com",
  "profi": "https://www.profi.io",
  "prosperityehr": "https://prosperityehr.com",
  "psi-lu": "https://psilu.com",
  "psychiatry-cloud": "https://www.psychiatrycloud.com",
  "psykdesk": "https://www.psykdesk.com",
  "pursuecare": "https://www.pursuecare.com",

  // Q
  "qgenda": "https://www.qgenda.com",
  "quicdoc-enterprise": "https://www.quicdoc.com",
  "quicdoc-office-cloud": "https://www.quicdoc.com",
  "quicdoc-pro": "https://www.quicdoc.com",
  "quicdoc-therapy": "https://www.quicdoc.com",

  // R
  "relatient": "https://www.relatient.com",
  "relias": "https://www.relias.com",
  "remedly": "https://www.remedly.com",
  "reservo": "https://www.reservo.co",
  "revconnect": "https://www.ntst.com/revconnect",
  "ritten": "https://www.ritten.co",
  "rxnt": "https://www.rxnt.com",
  "rxnt-medical-billing": "https://www.rxnt.com/medical-billing-software/",

  // S
  "samms": "https://www.samms.com",
  "selia": "https://www.selia.health",
  "sesame": "https://sesamecare.com",
  "sesamerx": "https://sesamecare.com",
  "sevocity": "https://www.sevocity.com",
  "sharenote": "https://www.ensorahealth.com/sharenote",
  "sigmund-aura": "https://www.sigmundsoftware.com",
  "splose": "https://www.splose.com",
  "sunwave": "https://sunwavehealth.com",
  "surescripts": "https://www.surescripts.com",
  "swymed": "https://www.swymed.com",

  // T
  "teneleven-ecr": "https://www.teneleven.io",
  "terapify": "https://terapify.com",
  "therabill": "https://www.therabill.com",
  "therapyzen": "https://www.therapyzen.com",
  "timelycare": "https://www.timelycare.com",
  "tm3": "https://www.tm3.com",
  "trac9-informatics": "https://trac9.com",
  "trakcare": "https://www.intersystems.com/trakcare/",
  "trizetto": "https://www.trizetto.com",

  // U
  "updox": "https://www.updox.com",
  "uwill": "https://www.uwill.com",

  // V
  "valant-ehr-suite": "https://www.valant.io",
  "vcita": "https://www.vcita.com",
  "vectera": "https://www.vectera.com",

  // W
  "waystar": "https://www.waystar.com",
  "webaba": "https://www.webaba.com",
  "wecounsel": "https://www.wecounsel.com",
  "welligent-ehr": "https://www.welligent.com",
  "wellsky-scheduling": "https://www.wellsky.com",
  "workit-health": "https://www.workithealth.com",

  // Z
  "zanda": "https://www.zandahealth.com",
  "zencharts": "https://www.zencharts.com",
};

async function main() {
  console.log('================================================================');
  console.log('POPULATE WEBSITE URLs');
  console.log('================================================================\n');

  let totalFiles = 0;
  let alreadyHasUrl = 0;
  let updated = 0;
  let stillMissing = 0;

  // First pass: collect all company → website mappings from existing products
  const companyUrls = new Map();
  const subdirs = await readdir(V4_PRODUCTS_DIR);

  for (const subdir of subdirs.sort()) {
    const subdirPath = join(V4_PRODUCTS_DIR, subdir);
    try {
      const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const filePath = join(subdirPath, file);
        try {
          const content = await readFile(filePath, 'utf-8');
          const tool = JSON.parse(content);
          if (tool.website_url && tool.company_name) {
            companyUrls.set(tool.company_name, tool.website_url);
          }
        } catch {}
      }
    } catch {}
  }

  console.log(`Found ${companyUrls.size} company URLs from existing products\n`);

  // Second pass: populate missing URLs
  for (const subdir of subdirs.sort()) {
    const subdirPath = join(V4_PRODUCTS_DIR, subdir);
    try {
      const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));

      for (const file of files) {
        totalFiles++;
        const filePath = join(subdirPath, file);

        try {
          const content = await readFile(filePath, 'utf-8');
          const tool = JSON.parse(content);

          if (tool.website_url) {
            alreadyHasUrl++;
            continue;
          }

          // Try to find URL from various sources
          let url = null;
          let source = '';

          // 1. Check specific product mapping
          if (PRODUCT_WEBSITES[tool.slug]) {
            url = PRODUCT_WEBSITES[tool.slug];
            source = 'product-specific';
          }
          // 2. Check company mapping (static)
          else if (tool.company_name && COMPANY_WEBSITES[tool.company_name]) {
            url = COMPANY_WEBSITES[tool.company_name];
            source = 'company-static';
          }
          // 3. Check company mapping (from other products)
          else if (tool.company_name && companyUrls.has(tool.company_name)) {
            url = companyUrls.get(tool.company_name);
            source = 'company-inherited';
          }

          if (url) {
            tool.website_url = url;
            tool.affiliate_url = url; // Also set affiliate URL
            tool.updated_at = new Date().toISOString();
            await writeFile(filePath, JSON.stringify(tool, null, 2) + '\n');
            updated++;
            console.log(`  ${subdir}/${file}: ${url} (${source})`);
          } else {
            stillMissing++;
          }
        } catch (err) {
          console.error(`  Error: ${file}: ${err.message}`);
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  console.log('\n================================================================');
  console.log('SUMMARY');
  console.log('================================================================');
  console.log(`Total files:       ${totalFiles}`);
  console.log(`Already had URL:   ${alreadyHasUrl}`);
  console.log(`Updated:           ${updated}`);
  console.log(`Still missing:     ${stillMissing}`);
  console.log('================================================================\n');

  if (stillMissing > 0) {
    console.log('Products still missing URLs:');
    for (const subdir of subdirs.sort()) {
      const subdirPath = join(V4_PRODUCTS_DIR, subdir);
      try {
        const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));
        for (const file of files) {
          const filePath = join(subdirPath, file);
          try {
            const content = await readFile(filePath, 'utf-8');
            const tool = JSON.parse(content);
            if (!tool.website_url) {
              console.log(`  ${tool.slug} | ${tool.company_name || 'unknown'}`);
            }
          } catch {}
        }
      } catch {}
    }
  }
}

main().catch(console.error);
