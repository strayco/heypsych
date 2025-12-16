const fs = require('fs');
const path = require('path');

// Load current JSON
const jsonPath = path.join(__dirname, '..', 'data', 'treatments', 'medications', 'alprazolam-Xanax.json');
const currentData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Keep everything except sections, then rebuild sections in correct order
const restructured = {
  ...currentData,
  sections: [
    // 1. What It's Used For (with linked conditions)
    {
      type: "indications",
      heading: "What It's Used For",
      text: "Xanax is FDA-approved for severe anxiety and panic disorders when you need fast relief. Because of dependence risk, doctors typically prescribe it short-term (2-4 weeks) or as-needed—often as a bridge while SSRIs or therapy start working.",
      items: [
        "{link:generalized-anxiety-disorder|Generalized Anxiety Disorder (GAD)}: Persistent, excessive worry that's hard to control",
        "{link:panic-disorder|Panic Disorder}: Sudden panic attacks with physical symptoms (racing heart, sweating, difficulty breathing)",
        "Short-term anxiety relief: Stressful events, medical procedures, or situational anxiety",
        "Bridge therapy: Temporary relief during the 4-6 weeks while SSRIs take effect"
      ],
      off_label: [
        "Social anxiety (performance situations)",
        "Severe insomnia with anxiety",
        "Acute agitation in psychiatric emergencies"
      ],
      ux_display: "fully_visible",
      collapsible: false,
      ui_hints: {
        layout: "badge_list",
        icon: "checkmark.seal.fill",
        color: "#34C759",
        visual_priority: "high",
        card_style: "subtle",
        animation: "fade_in"
      }
    },

    // 2. What People Feel
    {
      type: "patient_experience",
      heading: "What People Feel",
      intro: "Everyone responds differently, but these are the most common experiences:",
      items: [
        {
          category: "Relief (30-60 min)",
          quotes: [
            "My panic melted away within 30 minutes.",
            "Racing thoughts just... stopped. I could finally breathe.",
            "Like someone turned down the volume on my anxiety."
          ]
        },
        {
          category: "Calm & Sedation",
          quotes: [
            "I felt calm but also pretty drowsy, especially the first week.",
            "My body felt heavy and relaxed—almost too relaxed to do much.",
            "Everything felt softer, less sharp. Nice but also kind of foggy."
          ]
        },
        {
          category: "Memory & Focus",
          quotes: [
            "Hard to focus at work. Brain felt slower.",
            "I'd forget what I was saying mid-sentence.",
            "Couldn't remember conversations from earlier in the day."
          ],
          note: "Memory gaps are common, especially at higher doses."
        },
        {
          category: "Tolerance & Dependence",
          quotes: [
            "After a few weeks, I needed more to feel the same relief.",
            "When I tried to stop, my anxiety came back 10x worse.",
            "I didn't realize I was dependent until I missed a dose."
          ],
          note: "Physical dependence can develop in 2-4 weeks of daily use."
        }
      ],
      ux_display: "fully_visible",
      collapsible: false,
      ui_hints: {
        layout: "quote_carousel",
        icon: "quote.bubble.fill",
        color: "#007AFF",
        visual_priority: "hero",
        card_style: "filled",
        animation: "fade_slide_up"
      }
    },

    // 3. How Fast It Works
    {
      type: "onset_duration",
      heading: "How Fast It Works",
      text: "Xanax is one of the fastest anxiety medications available, but the effects don't last very long.",
      key_points: [
        "30-60 minutes: You start feeling relief (faster on empty stomach)",
        "1-2 hours: Maximum effect",
        "4-6 hours: Regular tablets wear off (need to take 2-4 times daily)",
        "10-12 hours: Extended-release (XR) lasts longer (once-daily dosing)",
        "11 hours: Average time for half the dose to leave your body"
      ],
      ux_display: "fully_visible",
      collapsible: false,
      ui_hints: {
        layout: "timeline",
        icon: "clock.fill",
        color: "#007AFF",
        visual_priority: "high",
        card_style: "outlined",
        animation: "fade_in"
      }
    },

    // 4. How Well It Works
    {
      type: "efficacy",
      heading: "How Well It Works",
      metric: "Panic-Free Rate at 4 Weeks",
      value: "50%",
      comparison: "28%",
      text: "In clinical trials, about half of people with panic disorder became panic-free after 4 weeks on Xanax, compared with about 1 in 4 taking placebo. This means for every 5 people treated, 1 additional person achieves complete relief.",
      ux_display: "fully_visible",
      collapsible: false,
      ui_hints: {
        layout: "stat_card",
        icon: "chart.bar.fill",
        color: "#34C759",
        visual_priority: "high",
        card_style: "elevated",
        animation: "number_count_up"
      }
    },

    // 5. Critical Safety Information (NO PULSE)
    {
      type: "warnings",
      heading: "Critical Safety Information",
      highlight: "Never combine with alcohol or opioids. Risk of respiratory failure and death.",
      black_box: "Combining benzodiazepines with opioids may cause severe sedation, breathing problems, coma, and death. Only use together when absolutely necessary, at lowest doses, and with close monitoring.",
      other: [
        "Physical dependence develops quickly (2-4 weeks of daily use)",
        "Never stop suddenly after regular use—can cause life-threatening seizures",
        "Avoid in pregnancy (birth defects, newborn withdrawal)",
        "High risk of misuse, abuse, and addiction—especially with substance use history",
        "Driving and operating machinery: Impaired reaction time and judgment"
      ],
      patient_counseling: [
        "Zero alcohol while taking Xanax. This combination can be fatal.",
        "Never stop cold turkey after regular use. Work with your doctor to taper slowly.",
        "Tell your doctor about substance use history, depression, or suicidal thoughts.",
        "Don't drive or operate machinery until you know your response.",
        "Store securely—high street value and diversion risk.",
        "Report memory problems, severe sedation, or mood changes immediately."
      ],
      ux_display: "fully_visible",
      collapsible: false,
      ui_hints: {
        layout: "alert_banner",
        icon: "exclamationmark.octagon.fill",
        color: "#FF3B30",
        visual_priority: "critical",
        card_style: "filled_critical",
        animation: "fade_in",  // CHANGED FROM attention_pulse
        sticky: true
      }
    },

    // Keep remaining sections from original...
    ...currentData.sections.filter(s =>
      !['indications', 'patient_experience', 'onset_duration', 'efficacy', 'warnings'].includes(s.type)
    ).map(section => {
      // Remove patient_text fields, keep only main text in patient-friendly language
      const { patient_text, ...rest } = section;
      return {
        ...rest,
        text: patient_text || rest.text || '',
        collapsible: true
      };
    })
  ]
};

// Write restructured JSON
fs.writeFileSync(jsonPath, JSON.stringify(restructured, null, 2), 'utf-8');
console.log('✅ Restructured alprazolam-Xanax.json');
console.log('   - Reordered sections: indications → patient_experience → onset_duration → efficacy → warnings → rest');
console.log('   - Removed pulsing animation from critical safety');
console.log('   - Simplified to patient-friendly language throughout');
