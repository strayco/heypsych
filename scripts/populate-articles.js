// Script to populate articles-blogs resources
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articles = {
  // Latest & Trending
  "latest/ketamine-therapy-2024": {
    kind: "resource",
    slug: "ketamine-therapy-2024",
    name: "Ketamine Therapy in 2024: What You Need to Know",
    category: "articles-blogs",
    description:
      "An updated look at ketamine therapy for treatment-resistant depression, including new research, costs, and what to expect from treatment.",
    metadata: {
      category: "articles-blogs",
      article_type: "latest",
      topics: ["ketamine", "depression", "treatment", "psychedelic therapy"],
      read_time: "8 min read",
      published_date: "2024-01-15",
    },
    author: "Dr. Sarah Chen, MD",
    image_url: "/images/articles/ketamine-therapy.jpg",
    content: "Ketamine therapy has emerged as a breakthrough treatment for depression...",
    sections: [
      {
        type: "intro",
        title: "Introduction",
        text: "Ketamine therapy has rapidly evolved from an experimental treatment to a mainstream option for people with treatment-resistant depression.",
      },
      {
        type: "body",
        title: "How It Works",
        text: "Unlike traditional antidepressants that work on serotonin, ketamine acts on glutamate receptors in the brain...",
      },
    ],
  },

  "latest/adhd-medication-shortage": {
    kind: "resource",
    slug: "adhd-medication-shortage",
    name: "Navigating the ADHD Medication Shortage: Strategies and Alternatives",
    category: "articles-blogs",
    description:
      "Practical advice for managing ADHD when your usual medication is unavailable, including alternative treatments and coping strategies.",
    metadata: {
      category: "articles-blogs",
      article_type: "latest",
      topics: ["adhd", "medication", "shortage", "alternatives"],
      read_time: "10 min read",
      published_date: "2024-02-01",
    },
    author: "Emma Rodriguez, LMFT",
    content: "The ongoing stimulant shortage has left many people with ADHD struggling...",
  },

  "latest/ai-therapy-apps": {
    kind: "resource",
    slug: "ai-therapy-apps",
    name: "Can AI Chatbots Replace Your Therapist? The Promise and Limits of Mental Health AI",
    category: "articles-blogs",
    description:
      "Exploring the rise of AI-powered mental health apps, their benefits, limitations, and what they mean for the future of therapy.",
    metadata: {
      category: "articles-blogs",
      article_type: "latest",
      topics: ["ai", "therapy", "technology", "digital health"],
      read_time: "12 min read",
      published_date: "2024-01-28",
    },
    author: "Marcus Johnson, PhD",
    content: "AI chatbots are increasingly being marketed as mental health solutions...",
  },

  // Lived Experience
  "lived-experience/bipolar-diagnosis-journey": {
    kind: "resource",
    slug: "bipolar-diagnosis-journey",
    name: "My Bipolar Diagnosis at 28: What I Wish I Knew Sooner",
    category: "articles-blogs",
    description:
      "A personal account of receiving a bipolar disorder diagnosis in your late twenties, the relief and grief that followed, and finding stability.",
    metadata: {
      category: "articles-blogs",
      article_type: "lived-experience",
      topics: ["bipolar disorder", "diagnosis", "personal story", "mental health journey"],
      read_time: "7 min read",
      published_date: "2024-01-20",
    },
    author: "Anonymous",
    content: 'For years, I thought I was just "moody" or "dramatic"...',
  },

  "lived-experience/adhd-women-thirties": {
    kind: "resource",
    slug: "adhd-women-thirties",
    name: "Diagnosed with ADHD at 34: Why So Many Women Are Getting Answers Late",
    category: "articles-blogs",
    description:
      "One woman's story of finally understanding her lifelong struggles through an ADHD diagnosis, and why this is so common among women.",
    metadata: {
      category: "articles-blogs",
      article_type: "lived-experience",
      topics: ["adhd", "women", "late diagnosis", "personal story"],
      read_time: "9 min read",
      published_date: "2024-01-18",
    },
    author: "Jessica Martinez",
    content: "I spent three decades thinking I was just bad at being an adult...",
  },

  "lived-experience/ocd-intrusive-thoughts": {
    kind: "resource",
    slug: "ocd-intrusive-thoughts",
    name: 'Living with "Pure O" OCD: The Thoughts That Haunted Me',
    category: "articles-blogs",
    description:
      "A raw and honest look at purely obsessional OCD, the shame around intrusive thoughts, and how ERP therapy changed everything.",
    metadata: {
      category: "articles-blogs",
      article_type: "lived-experience",
      topics: ["ocd", "intrusive thoughts", "pure-o", "erp therapy"],
      read_time: "11 min read",
      published_date: "2024-01-10",
    },
    author: "Taylor K.",
    content: "For years, I couldn't tell anyone about the thoughts that tormented me...",
  },

  // Research & Science
  "research/psychedelics-depression-study": {
    kind: "resource",
    slug: "psychedelics-depression-study",
    name: "Psilocybin Shows Promise for Treatment-Resistant Depression: New Research",
    category: "articles-blogs",
    description:
      "Breaking down the latest clinical trials on psilocybin-assisted therapy for depression, what the results mean, and current limitations.",
    metadata: {
      category: "articles-blogs",
      article_type: "research",
      topics: ["psilocybin", "depression", "research", "clinical trials"],
      read_time: "10 min read",
      published_date: "2024-01-25",
    },
    author: "Dr. Michael Brennan",
    content: "Recent clinical trials have shown remarkable results for psilocybin therapy...",
  },

  "research/sleep-mental-health-link": {
    kind: "resource",
    slug: "sleep-mental-health-link",
    name: "The Bidirectional Relationship Between Sleep and Mental Health",
    category: "articles-blogs",
    description:
      "New research reveals how sleep problems both cause and result from mental health conditions, and what this means for treatment.",
    metadata: {
      category: "articles-blogs",
      article_type: "research",
      topics: ["sleep", "insomnia", "mental health", "research"],
      read_time: "8 min read",
      published_date: "2024-01-12",
    },
    author: "Dr. Lisa Park, PhD",
    content: "For decades, insomnia was seen as just a symptom of depression and anxiety...",
  },

  "research/exercise-antidepressant-study": {
    kind: "resource",
    slug: "exercise-antidepressant-study",
    name: "Exercise as Effective as Antidepressants: What the Study Really Says",
    category: "articles-blogs",
    description:
      "A nuanced look at viral research comparing exercise to medication for depression, including what the headlines got wrong.",
    metadata: {
      category: "articles-blogs",
      article_type: "research",
      topics: ["exercise", "depression", "antidepressants", "research"],
      read_time: "9 min read",
      published_date: "2024-02-02",
    },
    author: "Dr. James Wong, MD",
    content: "A recent study made headlines claiming exercise works as well as antidepressants...",
  },

  // How-To & Guides
  "how-to/find-adhd-therapist": {
    kind: "resource",
    slug: "find-adhd-therapist",
    name: "How to Find a Therapist Who Actually Gets ADHD",
    category: "articles-blogs",
    description:
      "A practical guide to finding and vetting ADHD-specialized therapists, including what questions to ask and red flags to watch for.",
    metadata: {
      category: "articles-blogs",
      article_type: "how-to",
      topics: ["adhd", "therapy", "finding help", "guide"],
      read_time: "12 min read",
      published_date: "2024-01-22",
    },
    author: "Rachel Stevens, LCSW",
    content:
      "Finding a therapist is hard enough. Finding one who truly understands ADHD? Even harder...",
  },

  "how-to/talk-to-doctor-antidepressants": {
    kind: "resource",
    slug: "talk-to-doctor-antidepressants",
    name: "How to Talk to Your Doctor About Starting (or Stopping) Antidepressants",
    category: "articles-blogs",
    description:
      "Scripts, questions to ask, and how to advocate for yourself when discussing antidepressant medication with your doctor.",
    metadata: {
      category: "articles-blogs",
      article_type: "how-to",
      topics: ["antidepressants", "medication", "doctor communication", "advocacy"],
      read_time: "10 min read",
      published_date: "2024-01-16",
    },
    author: "Dr. Amanda Foster, MD",
    content: "Talking to your doctor about antidepressants can feel intimidating...",
  },

  "how-to/manage-anxiety-attacks": {
    kind: "resource",
    slug: "manage-anxiety-attacks",
    name: "Panic Attack Survival Guide: 10 Techniques That Actually Work",
    category: "articles-blogs",
    description:
      "Evidence-based strategies for managing panic attacks in the moment, plus long-term techniques to reduce their frequency.",
    metadata: {
      category: "articles-blogs",
      article_type: "how-to",
      topics: ["anxiety", "panic attacks", "coping skills", "techniques"],
      read_time: "8 min read",
      published_date: "2024-01-08",
    },
    author: "Nina Patel, PhD",
    content: "When a panic attack strikes, your brain is convinced you're dying...",
  },

  "how-to/therapy-insurance": {
    kind: "resource",
    slug: "therapy-insurance",
    name: "Navigating Therapy with Insurance: A Complete Guide",
    category: "articles-blogs",
    description:
      "Understanding insurance coverage for therapy, how to maximize benefits, and alternatives when insurance won't cover what you need.",
    metadata: {
      category: "articles-blogs",
      article_type: "how-to",
      topics: ["therapy", "insurance", "healthcare", "cost"],
      read_time: "15 min read",
      published_date: "2024-01-05",
    },
    author: "David Miller, MBA",
    content:
      "The American healthcare system makes accessing mental health care unnecessarily complicated...",
  },
};

// Create all the JSON files
const baseDir = path.join(__dirname, "..", "data", "resources", "articles-blogs");

Object.entries(articles).forEach(([filePath, content]) => {
  const fullPath = path.join(baseDir, `${filePath}.json`);
  const dir = path.dirname(fullPath);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the JSON file
  fs.writeFileSync(fullPath, JSON.stringify(content, null, 2));
  console.log(`✅ Created: ${filePath}.json`);
});

console.log(`\n🎉 Successfully populated ${Object.keys(articles).length} articles!`);
