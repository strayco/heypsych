/**
 * Support organisation and hotline model (/resources/<slug>, support-community).
 *
 * Pure. Turns the several shapes these records come in (contacts[].channels,
 * actions, phones[], phone, website/url, labels, cost, regions/coverage) into
 * one "how to reach them" list plus who it is for, hours and cost. Nothing is
 * invented: a channel with no number links to the organisation's own site.
 */

export type ChannelKind = "call" | "text" | "chat" | "tty" | "whatsapp" | "video" | "web";

export interface Channel {
  kind: ChannelKind;
  /** "Call", "Text START to 88788", "Youth line". */
  label: string;
  /** What to dial or text, as shown ("988", "1-800-662-4357"); null when the record has none. */
  value: string | null;
  /** tel:, sms: or https: link; null when there is nothing to link to. */
  href: string | null;
  /** Shown under the label, e.g. "Number on their website". */
  note: string | null;
  region: string | null;
}

export interface SupportView {
  name: string;
  org: string | null;
  summary: string | null;
  channels: Channel[];
  website: string | null;
  availability: string | null;
  is247: boolean;
  cost: string[];
  free: boolean;
  audience: string[];
  focus: string[];
  regions: string[];
  access: string[];
  /** "Good for" / "Not the right place for", when the record lists them. */
  bestFor: string[];
  notFor: string[];
  verified: boolean;
  /** Whether this is a crisis line (a reason to show the 988 line). */
  crisis: boolean;
  sections: { id: string; title: string; text: string; type: string | null }[];
}

type Rec = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const strs = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter((x): x is string => Boolean(x)) : str(v) ? [str(v)!] : [];

function digits(v: string): string {
  return v.replace(/[^\d+]/g, "");
}

/** A dialable value: at least 3 digits and nothing that reads like prose. */
export function isDialable(v: string | null): v is string {
  if (!v) return false;
  const d = v.replace(/\D/g, "");
  return d.length >= 3 && !/[a-z]{4,}/i.test(v);
}

function safeUrl(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const KIND_ORDER: ChannelKind[] = ["call", "text", "chat", "whatsapp", "tty", "video", "web"];

function channel(kind: ChannelKind, rawLabel: string | null, rawValue: string | null, region: string | null, site: string | null, chatUrl: string | null): Channel | null {
  const label = rawLabel ?? { call: "Call", text: "Text", chat: "Chat", tty: "TTY", whatsapp: "WhatsApp", video: "Videophone", web: "Website" }[kind];
  const value = str(rawValue);

  // "Call 988 then press" + "1" → "Call 988, then press 1".
  const press = label.match(/^call\s+([\d-]+)\s+then\s+press$/i);
  if (press && value) {
    return { kind: "call", label: `Call ${press[1]}, then press ${value}`, value: press[1], href: `tel:${digits(press[1])}`, note: null, region };
  }

  // "Text START to" + "88788" → keyword in the message body.
  const keyword = label.match(/^(?:whatsapp\/)?text\s+(\S+)\s+to$/i);

  if (kind === "chat") {
    const href = chatUrl ?? site;
    if (!href) return null;
    return { kind, label, value: null, href, note: chatUrl ? null : "Through their website", region };
  }

  if (value && isDialable(value)) {
    if (kind === "call" || kind === "tty") return { kind, label, value, href: `tel:${digits(value)}`, note: null, region };
    if (kind === "text" || kind === "whatsapp") {
      const body = keyword ? `?body=${encodeURIComponent(keyword[1])}` : "";
      return { kind, label: keyword ? `Text ${keyword[1]}` : label, value, href: `sms:${digits(value)}${body}`, note: null, region };
    }
    return { kind, label, value, href: null, note: null, region };
  }

  // A channel the record names without a number: send people to the site.
  if (!site) return value ? { kind, label, value, href: null, note: null, region } : null;
  return {
    kind,
    label: keyword ? `Text ${keyword[1]}` : label,
    value,
    href: site,
    note: value ? null : kind === "call" ? "Number on their website" : kind === "text" ? "Details on their website" : "Through their website",
    region,
  };
}

export function buildSupport(entity: Rec): SupportView | null {
  const r: Rec = { ...((entity.data as Rec) ?? {}), ...entity };
  const name = str(r.name) ?? str(r.full_name);
  if (!name) return null;

  const actions = (r.actions && typeof r.actions === "object" ? r.actions : {}) as Rec;
  const labels = (r.labels && typeof r.labels === "object" ? r.labels : {}) as Rec;
  const orgRec = r.org && typeof r.org === "object" ? (r.org as Rec) : null;
  const metadata = (r.metadata && typeof r.metadata === "object" ? r.metadata : {}) as Rec;

  const app = (r.app_metadata && typeof r.app_metadata === "object" ? r.app_metadata : {}) as Rec;
  const pricing = (r.pricing && typeof r.pricing === "object" ? r.pricing : {}) as Rec;
  const website =
    safeUrl(actions.site_url) ?? safeUrl(r.website) ?? safeUrl(r.url) ?? safeUrl(orgRec?.url) ?? safeUrl(app.website) ?? safeUrl(r.affiliate_url);
  const chatUrl = safeUrl(actions.chat_url);

  const channels: Channel[] = [];
  const push = (c: Channel | null) => {
    if (!c) return;
    const dup = channels.some((x) => x.kind === c.kind && (x.value ?? "") === (c.value ?? "") && (x.label === c.label || Boolean(c.value)));
    // A valueless channel is redundant once the same kind has a real number.
    const shadowed = !c.value && channels.some((x) => x.kind === c.kind && x.value);
    if (!dup && !shadowed) channels.push(c);
  };

  const contacts = Array.isArray(r.contacts) ? (r.contacts as Rec[]) : [];
  const multiRegion = new Set(contacts.map((c) => str(c?.region))).size > 1;
  for (const contact of contacts) {
    const region = multiRegion ? str(contact?.region) : null;
    const chans = (contact?.channels && typeof contact.channels === "object" ? contact.channels : {}) as Rec;
    for (const [rawKind, list] of Object.entries(chans)) {
      const kind = (rawKind === "other" ? "video" : rawKind) as ChannelKind;
      if (!KIND_ORDER.includes(kind) || !Array.isArray(list)) continue;
      for (const item of list as Rec[]) {
        const label = str(item?.label);
        if (rawKind === "other" && label && !/video/i.test(label)) continue;
        push(channel(kind, label, str(item?.value), region, website, chatUrl));
      }
    }
  }
  if (Array.isArray(r.phones)) {
    for (const p of r.phones as Rec[]) {
      const label = str(p?.label);
      push(channel(label && /^text/i.test(label) ? "text" : "call", label, str(p?.number) ?? str(p?.value), null, website, chatUrl));
    }
  }
  const phone = str(r.phone);
  if (phone && isDialable(phone)) push(channel("call", "Call", phone, null, website, chatUrl));
  const actText = str(actions.text);
  if (actText && isDialable(actText)) push(channel("text", "Text", actText, null, website, chatUrl));
  const actTty = str(actions.tty);
  if (actTty && isDialable(actTty)) push(channel("tty", "TTY", actTty, null, website, chatUrl));
  const actWa = str(actions.whatsapp);
  if (actWa && isDialable(actWa)) push(channel("whatsapp", "WhatsApp", actWa, null, website, chatUrl));
  // Older directory-style records only say it in prose: "Text HOME to 741741".
  if (!channels.some((c) => c.kind === "text")) {
    const prose = [r.long_description, r.description, r.one_liner, pricing.notes].map(str).filter(Boolean).join(" ");
    const m = prose.match(/\btext\s+([A-Z]{2,12})\s+to\s+(\d{5,6})\b/i);
    if (m) push(channel("text", `Text ${m[1].toUpperCase()} to`, m[2], null, website, chatUrl));
  }
  if (chatUrl && !channels.some((c) => c.kind === "chat")) push(channel("chat", "Chat online", null, null, website, chatUrl));
  if (website) channels.push({ kind: "web", label: "Visit their website", value: new URL(website).hostname.replace(/^www\./, ""), href: website, note: null, region: null });

  channels.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));

  const availability = str(labels.availability) ?? str(r.availability) ?? str(r.hours) ?? str(metadata.availability) ?? str(metadata.hours);
  const costRaw = [...strs(r.cost), ...strs(metadata.cost)];
  const cost = [...new Set(costRaw.map((c) => c.toLowerCase()))].map((c) =>
    c === "free" ? "Free" : c === "sliding-scale" ? "Sliding scale" : c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, " ")
  );
  const free = labels.free === true || cost.includes("Free") || pricing.model === "free";

  const regions = [
    ...strs(r.regions),
    ...(Array.isArray(r.coverage) ? (r.coverage as Rec[]).map((c) => str(c?.region)).filter((x): x is string => Boolean(x)) : strs(r.coverage)),
  ];
  const regionNames = [...new Set(regions.map((x) => (x === "US" ? "United States" : x)))].filter((x) => /\w/.test(x));

  const sections = (Array.isArray(r.sections) ? (r.sections as Rec[]) : [])
    .map((s, i) => {
      const title = str(s?.title) ?? str(s?.heading);
      const text = str(s?.text) ?? str(s?.content);
      if (!title || !text) return null;
      const id = (str(s?.type) ?? title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `section-${i + 1}`;
      return { id, title, text, type: str(s?.type) };
    })
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const seen = new Set<string>();
  for (const s of sections) {
    let id = s.id;
    for (let n = 2; seen.has(id); n++) id = `${s.id}-${n}`;
    s.id = id;
    seen.add(id);
  }

  const focus = strs(labels.focus);
  const audience = strs(labels.audience);
  const access = strs(r.access);
  const crisis =
    /crisis|suicide|hotline|helpline|lifeline/i.test([name, str(r.summary) ?? "", ...focus, ...access].join(" ")) || (availability === "24/7" && channels.some((c) => c.kind === "call" && c.value));

  return {
    name,
    org: str(r.organization) ?? str(orgRec?.name) ?? str(r.org),
    summary: str(r.summary) ?? str(r.one_liner) ?? str(r.short_description) ?? str(r.description),
    channels,
    website,
    availability,
    is247: availability === "24/7",
    cost,
    free,
    audience,
    focus,
    regions: regionNames,
    access,
    bestFor: strs(r.best_for),
    notFor: strs(r.not_for),
    verified: labels.verified === true,
    crisis,
    sections,
  };
}
