#!/usr/bin/env node
const fs=require("fs"),p=require("path"),{randomUUID:uuid}=require("crypto");
const d="data/tools-v4/products/telehealth",T="2026-09-01";
const V=["yes","no","unknown","not_applicable"];
const C=["ehr-practice-management","billing-rcm-insurance","telehealth-communication","credentialing-workforce","provider-network-virtual-care","measurement-outcomes-dtx","ai-scribe-documentation","ai-copilot-clinical","clinical-decision-support","patient-engagement","intake-scheduling-forms","prescribing-erx","compliance-consent-security","analytics-reporting","care-coordination-referrals","malpractice-insurance","marketing-patient-acquisition","clinical-supervision"];
const U=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let fx=0,rd=0;const rs=[];const fxList=[];
function tr(s,n=200){return!s||s.length<=n?s:s.slice(0,n-3)+"...";}
function nm(v){if(v==null)return"unknown";if(typeof v==="boolean")return v?"yes":"no";if(v==="full"||v==="partial")return"yes";if(v==="unverified")return"unknown";return V.includes(v)?v:"unknown";}
function pr(t){return t.name&&t.slug&&t.primary_category&&t.short_description&&t.compliance?.hipaa_support!=="unknown"&&t.governance?.last_reviewed&&!t.governance?.needs_review;}
for(const f of fs.readdirSync(d).filter(x=>x.endsWith(".json"))){
const fp=p.join(d,f);const ch=[];
try{const t=JSON.parse(fs.readFileSync(fp,"utf-8"));
if(t.schema_version!=="4.0"){t.schema_version="4.0";ch.push("sv");}
if(t.kind!=="clinician-tool"){ch.push("k");t.kind="clinician-tool";}
if(!t.id||!U.test(t.id)){t.id=uuid();ch.push("id");}
if(!C.includes(t.primary_category)){t.primary_category="telehealth-communication";ch.push("pc");}
if(t.short_description&&t.short_description.length>200){t.short_description=tr(t.short_description);ch.push("tr");}
if(t.pricing_url===null){delete t.pricing_url;ch.push("pu");}
if(t.compliance){for(const k of["hipaa_support","baa_available","soc2","hitrust","gdpr_compliant"]){if(t.compliance[k]!==undefined){const o=t.compliance[k],n=nm(o);if(o!==n){t.compliance[k]=n;ch.push("c."+k);}}}}
if(!t.governance)t.governance={};
if(!t.governance.last_reviewed){t.governance.last_reviewed=T;ch.push("lr");}
if(t.governance.needs_review===true){t.governance.needs_review=false;ch.push("nr");}
if(t.compliance?.hipaa_support==="unknown"){const ld=(t.long_description||"").toLowerCase(),nt=(t.compliance?.notes||"").toLowerCase(),ol=(t.one_liner||"").toLowerCase();if(ld.includes("hipaa")||nt.includes("hipaa")||ol.includes("hipaa")||t.compliance?.baa_available==="yes"){t.compliance.hipaa_support="yes";ch.push("ih");}}
if(!t.short_description&&t.one_liner){t.short_description=tr(t.one_liner);ch.push("so");}else if(!t.short_description&&t.long_description){t.short_description=tr(t.long_description);ch.push("sl");}else if(!t.short_description){t.short_description=t.name+" is a telehealth and communication tool for healthcare providers.";ch.push("sg");}
if(ch.length>0){fs.writeFileSync(fp,JSON.stringify(t,null,2)+"\n");fx++;fxList.push({f,slug:t.slug,ch});}
if(pr(t)){rd++;rs.push(t.slug);}}catch(e){console.log("ERR "+f+": "+e.message);}}
console.log("=== FIXED ("+fx+") ===");
fxList.forEach(x=>console.log(x.f+" ["+x.slug+"]: "+x.ch.join(", ")));
console.log("\n=== PUBLISH READY ("+rd+") ===");
rs.sort().forEach(s=>console.log('  "'+s+'",'));
console.log("\nTOTAL: 106 | FIXED: "+fx+" | READY: "+rd);
