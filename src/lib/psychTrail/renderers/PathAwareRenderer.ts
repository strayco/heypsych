/**
 * PsychTrails - Path-Aware Renderer
 *
 * Generates ending text based on the specific path the user took.
 * This is a hardcoded version - later will be replaced by AI generation.
 */

import type { Ending, RunState, Scenario } from "../types";
import { HardcodedRenderer } from "./HardcodedRenderer";

/**
 * Path insight - a reflection on a specific choice the user made
 */
interface PathInsight {
  choiceId: string;
  insight: string;
}

/**
 * Path-aware ending configuration
 */
interface PathAwareEnding {
  endingId: string;
  baseText: string;
  pathInsights: PathInsight[];
  closingByPath: Record<string, string>; // Key patterns to match against path
}

/**
 * Scenario-specific path configurations
 */
const SCENARIO_PATH_CONFIG: Record<string, PathAwareEnding[]> = {
  // ============================================================================
  // College Social Anxiety - Dining Hall
  // ============================================================================
  "college_social_anxiety_dining_hall_v1": [
    {
      endingId: "confident_step",
      baseText: "You did it. You walked into a crowded dining hall, asked a direct question, and stayed present despite the anxiety.",
      pathInsights: [
        {
          choiceId: "try_again_dining",
          insight: "You bailed once—but you came back. That second attempt? That's the real win. Most people don't try again."
        },
        {
          choiceId: "entrance_plan",
          insight: "Making a micro-plan at the entrance gave you structure. The anxiety didn't vanish, but you had a path forward."
        },
        {
          choiceId: "line_ground",
          insight: "Grounding yourself in line—noticing your feet, your breath—kept you present instead of spiraling into 'everyone is watching me.'"
        },
        {
          choiceId: "seat_near_people",
          insight: "Choosing to sit near people instead of isolating was the harder choice. That's exactly why it mattered."
        },
        {
          choiceId: "follow_up_question",
          insight: "Trying small talk after asking 'is this seat taken?' was an extra rep. Brief, real, uncomfortable—and you did it."
        }
      ],
      closingByPath: {
        "try_again_dining,seat_near_people": "You left once, came back, and then sat near people anyway. That's not just progress—that's resilience.",
        "entrance_plan,line_ground": "You combined planning with presence. That's a powerful combo for managing social anxiety.",
        "entrance_phone": "You used your phone as a shield early on, but you still pushed through to the harder moments. Progress isn't always linear.",
        "default": "This is what small reps look like: uncomfortable, brief, real. You're building the skill of showing up even when the spotlight feeling is loud."
      }
    },
    {
      endingId: "mixed_but_moving",
      baseText: "You made it through. You entered the dining hall, got food, and sat down.",
      pathInsights: [
        {
          choiceId: "try_again_dining",
          insight: "You left the first time—but you came back. That counts. Showing up after bailing is still showing up."
        },
        {
          choiceId: "entrance_phone",
          insight: "Pulling out your phone at the entrance was a familiar shield. It dulled the spotlight feeling, but also kept you in hiding mode."
        },
        {
          choiceId: "line_phone_shield",
          insight: "Scrolling in line made the wait easier, but you missed a chance to practice just... being there."
        },
        {
          choiceId: "seat_isolate",
          insight: "Choosing the corner table felt safer. You avoided the interaction, but you also stayed in the space. That's something."
        },
        {
          choiceId: "sit_silent",
          insight: "You asked 'is this seat taken?' and that was enough for today. One question is still a rep."
        },
        {
          choiceId: "interpret_negative",
          insight: "When they said 'go ahead' neutrally, it felt like rejection. That's a common pattern with anxiety—neutral can feel negative, even when it isn't."
        }
      ],
      closingByPath: {
        "seat_isolate": "You sat alone, but you didn't leave. Sometimes just showing up is the rep. Next time, try the table near people.",
        "interpret_negative": "Mind-reading pulled you out of the moment. Next time, try treating neutral responses as... neutral. Not warm, not cold. Just normal.",
        "default": "Progress isn't always a straight line. You didn't bail completely. You stayed in the space, even if it felt uncomfortable."
      }
    },
    {
      endingId: "avoidance_loop",
      baseText: "You left before giving yourself a chance.",
      pathInsights: [
        {
          choiceId: "entrance_bail",
          insight: "The noise, the crowd, the feeling of being watched—it felt like too much. So you left before even trying."
        },
        {
          choiceId: "line_leave",
          insight: "You were in line, almost there, but the discomfort won. You slipped out before getting food."
        },
        {
          choiceId: "seat_bail",
          insight: "You had your tray. You were so close. But finding a seat felt impossible, so you left."
        }
      ],
      closingByPath: {
        "entrance_bail": "You turned back before going in. The relief was real—and so was the missed opportunity. But now you know: you can try again.",
        "line_leave": "You got through the door but not the line. That's still further than not showing up at all. Next time, try staying 30 more seconds.",
        "seat_bail": "You got food but couldn't sit. The final step felt impossible. Next time, have a fallback: a corner table, just in case.",
        "default": "Avoidance teaches your brain that you can't handle it. The truth? You probably could have. But avoidance doesn't let you find out."
      }
    }
  ],

  // ============================================================================
  // College Social Anxiety - Office Hours
  // ============================================================================
  "college_social_anxiety_office_hours_v1": [
    {
      endingId: "confident_step",
      baseText: "You did the hard thing. You went to office hours, asked a clear question, and got a clear next step.",
      pathInsights: [
        {
          choiceId: "try_again_email",
          insight: "You emailed first, but when the professor invited you to come in person, you actually showed up. That's following through."
        },
        {
          choiceId: "try_again_deadline",
          insight: "The deadline pressure pushed you to reach out. Sometimes you need a forcing function. What matters is that you reached out."
        },
        {
          choiceId: "decide_go",
          insight: "Deciding to go despite the fear was the first win. The dread didn't mean you couldn't do it."
        },
        {
          choiceId: "write_question",
          insight: "Writing down your question beforehand turned vague confusion into something specific. Clarity beats confidence."
        },
        {
          choiceId: "ask_clear",
          insight: "You asked your question directly and clearly. That takes practice, especially when anxiety makes you want to soften or hedge."
        },
        {
          choiceId: "close_loop_next_step",
          insight: "Asking 'What should I do before next class?' turned explanation into action. That's the difference between partial help and real progress."
        }
      ],
      closingByPath: {
        "try_again_email,ask_clear": "Email was the first step, showing up was the second. You got there. That's what matters.",
        "try_again_deadline,close_loop_next_step": "Deadline pressure got you moving, but you still asked the right questions. You turned panic into progress.",
        "write_question,ask_clear": "Preparation + directness = clarity. You didn't need to feel confident. You just needed to be clear.",
        "default": "This is what asking for help looks like when you do it well: uncomfortable, brief, effective. Next time will still be hard. But you know the formula now."
      }
    },
    {
      endingId: "mixed_but_moving",
      baseText: "You went. That's more than avoiding.",
      pathInsights: [
        {
          choiceId: "try_again_email",
          insight: "You took the email route first, but when they invited you in person, you showed up. That's progress."
        },
        {
          choiceId: "try_again_deadline",
          insight: "The deadline pushed you to finally reach out. Better late than never—and now you know you can do it."
        },
        {
          choiceId: "go_in_unprepared",
          insight: "Going in without a prepared question made the moment harder. You fumbled for words while anxiety spiked."
        },
        {
          choiceId: "ask_apology_heavy",
          insight: "You started with apologies—a common habit when we feel nervous about asking for help. It's understandable, even if it made the moment feel heavier."
        },
        {
          choiceId: "ask_vague",
          insight: "Saying 'I don't get the whole lecture' was too broad. Without specificity, the conversation went nowhere."
        },
        {
          choiceId: "leave_without_clarity",
          insight: "You left without asking what to do next. You got an explanation, but not a plan."
        },
        {
          choiceId: "interpret_neutral",
          insight: "Their neutral tone felt like judgment. Mind-reading turned a normal interaction into confirmation that you shouldn't have come."
        }
      ],
      closingByPath: {
        "try_again_email": "Email got you started, and you followed through by showing up. That's not a detour—that's a path.",
        "try_again_deadline": "Deadline panic motivated you, but you still reached out and got help. Next time, try not waiting so long.",
        "ask_apology_heavy": "Starting with apologies is a common way we try to make ourselves smaller. You belong there. Next time, try leading with your question—you might feel more grounded.",
        "ask_vague": "Vague questions get vague help. Next time, write down one specific thing you're confused about before you go.",
        "leave_without_clarity": "You got help but didn't close the loop. Next time, ask: 'What's one thing I should do before next class?'",
        "interpret_neutral": "Their tone was neutral—not warm, not cold. Anxiety can make neutral feel negative. Noticing that pattern is the first step to changing it.",
        "default": "You showed up, asked something, and got some help. You're building the skill. It's messy. That's normal."
      }
    },
    {
      endingId: "avoidance_loop",
      baseText: "You chose safety over clarity.",
      pathInsights: [
        {
          choiceId: "decide_email_instead",
          insight: "Emailing felt safer—no eye contact, no real-time judgment. But the question was hard to explain over text, and now you're waiting."
        },
        {
          choiceId: "decide_skip",
          insight: "You convinced yourself you'd figure it out another way. YouTube, a friend, anything but office hours."
        },
        {
          choiceId: "leave_now",
          insight: "You heard another student sounding confident and articulate. Comparison stole the moment. You left before trying."
        }
      ],
      closingByPath: {
        "decide_email_instead": "Email avoidance is still avoidance. You lose the back-and-forth that makes learning click. Next time, show up in person—even for 2 minutes.",
        "decide_skip": "You told yourself you'd figure it out later. But the confusion stayed, and the assignment deadline crept closer. Avoidance bought comfort, not clarity.",
        "leave_now": "Hearing someone else sound confident made you feel worse. But their clarity came from practice—practice you're avoiding.",
        "default": "Office hours aren't about confidence. They're about getting unstuck. And the only way to get unstuck is to ask."
      }
    }
  ],

  // ============================================================================
  // Teen Social Anxiety - School Accommodations
  // ============================================================================
  "teen_social_anxiety_school_accommodations_v1": [
    {
      endingId: "confident_step",
      baseText: "You did the hard thing. You met with the counselor, asked for specific accommodations, and closed the loop with a clear next step.",
      pathInsights: [
        {
          choiceId: "decide_go",
          insight: "Deciding to go to the meeting—despite the fear of seeming 'needy'—was the first step. The anxiety was real, but so was the need."
        },
        {
          choiceId: "try_again_postponed",
          insight: "You postponed once, but when the counselor reached out again, you said yes. That's not failure—that's a second chance taken."
        },
        {
          choiceId: "try_again_skipped",
          insight: "You skipped the first meeting, but bombing that test made you reconsider. Reaching out after avoiding takes courage. You did that."
        },
        {
          choiceId: "prepare_specific_requests",
          insight: "Writing down your requests beforehand made them feel more legitimate. 'Extra time on tests' and 'quiet space for exams' became concrete asks, not vague complaints."
        },
        {
          choiceId: "open_clear",
          insight: "You stated your needs directly and clearly. Two specific supports, two real examples. That's what effective asking looks like."
        },
        {
          choiceId: "ask_next_step",
          insight: "Asking 'What happens next?' turned the conversation into a plan. You left with a roadmap, not just reassurance."
        }
      ],
      closingByPath: {
        "try_again_postponed,open_clear": "You hesitated at first—but you came back. And when you did, you asked clearly. That's growth.",
        "try_again_skipped,open_clear": "You avoided once, but you didn't let that be the end. Coming back after avoidance is harder than going the first time. You did it anyway.",
        "prepare_specific_requests,open_clear": "Preparation + directness = results. You didn't need to feel confident. You needed to be clear.",
        "default": "Clarity beats confidence. You didn't need to feel perfectly sure of yourself. You just needed to show up, ask directly, and get specific. This is what asking for accommodations looks like when you do it well."
      }
    },
    {
      endingId: "mixed_but_moving",
      baseText: "You went. That's more than avoiding.",
      pathInsights: [
        {
          choiceId: "try_again_postponed",
          insight: "You postponed once, but you came back. That counts. Showing up after hesitating is still showing up."
        },
        {
          choiceId: "try_again_skipped",
          insight: "You skipped the first meeting, but the failed test pushed you to reconsider. You reached out. That's progress."
        },
        {
          choiceId: "go_in_unprepared",
          insight: "Walking in without a plan made the conversation harder. You knew you were struggling, but the words wouldn't come together."
        },
        {
          choiceId: "open_apology_heavy",
          insight: "You started with apologies—a common habit when asking for help feels vulnerable. The counselor reassured you, and you still got the support you needed."
        },
        {
          choiceId: "open_vague",
          insight: "Saying 'I've just been really stressed' was too broad. Without specifics, the conversation felt scattered."
        },
        {
          choiceId: "leave_quickly",
          insight: "You left without asking what happens next. You got some help, but not a clear plan."
        },
        {
          choiceId: "interpret_neutral",
          insight: "Their neutral tone felt like judgment. Your mind insisted they thought you were overreacting—even though their words said otherwise."
        }
      ],
      closingByPath: {
        "open_apology_heavy": "Starting with apologies is a common way we try to soften asks. You're not a burden. Next time, try leading with what you need—it might feel more empowering.",
        "open_vague": "Vague requests get vague responses. Next time, write down 1-2 specific accommodations with examples of how they'd help.",
        "leave_quickly": "You got some help but didn't close the loop. Next time, ask: 'What do I need to do next?'",
        "interpret_neutral": "Mind-reading turned neutral into negative. Next time, try taking their words at face value.",
        "default": "You showed up, asked for something, and got some help. You're building the skill. It's messy. That's normal."
      }
    },
    {
      endingId: "avoidance_loop",
      baseText: "You chose comfort over asking for support.",
      pathInsights: [
        {
          choiceId: "decide_postpone",
          insight: "You told yourself you'd reschedule 'when you're more ready.' But 'ready' never comes. The anxiety, the pressure—all still there."
        },
        {
          choiceId: "decide_skip",
          insight: "You told yourself you could push through alone. That instinct makes sense—but sometimes support makes a real difference."
        },
        {
          choiceId: "leave_now",
          insight: "You left before the meeting even started. The counselor's door was right there, but avoidance felt easier."
        }
      ],
      closingByPath: {
        "decide_postpone": "Postponing felt safer. But 'being ready' is a myth. The test anxiety, the presentation dread—none of that waits for you to feel ready.",
        "decide_skip": "You told yourself you'd manage without accommodations. But the struggle continues, and now you've reinforced the idea that asking for help isn't for you.",
        "leave_now": "You left before trying. The relief was instant. But so was the cost: you're still struggling alone.",
        "default": "Avoidance feels like relief—until you're still struggling in tests, still panicking before presentations, still managing alone. Accommodations aren't about being 'needy.' They're about getting support that helps you show what you actually know."
      }
    }
  ],

  // ============================================================================
  // First Psychiatry Appointment
  // ============================================================================
  "first-psych-appointment": [
    {
      endingId: "prepared",
      baseText: "You left your first psychiatry appointment with clarity about next steps.",
      pathInsights: [
        {
          choiceId: "choice_review_notes",
          insight: "Reviewing your notes in the waiting room meant you walked in organized and ready. Having specific examples fresh in your mind made communication clearer."
        },
        {
          choiceId: "choice_sit_quietly",
          insight: "Taking deep breaths in the waiting room helped calm your nerves. You felt more centered going in."
        },
        {
          choiceId: "choice_detailed_history",
          insight: "Sharing specific examples and timeline details helped the psychiatrist build a comprehensive picture of what you're experiencing."
        },
        {
          choiceId: "choice_honest_detailed",
          insight: "Being open about your experiences—even the hard parts—built trust and helped the psychiatrist understand your situation."
        },
        {
          choiceId: "choice_ask_questions",
          insight: "Asking detailed questions about how treatments work gave you the information you needed to make informed decisions."
        },
        {
          choiceId: "choice_express_concerns",
          insight: "Sharing your concerns openly—about side effects, stigma, or effectiveness—helped the psychiatrist address your specific worries."
        },
        {
          choiceId: "choice_combined_approach",
          insight: "Choosing both therapy and medication together gives you a comprehensive treatment plan. Research shows this combination is often highly effective."
        },
        {
          choiceId: "choice_last_question",
          insight: "Asking one more question before leaving ensured you left with complete understanding. That's self-advocacy in action."
        }
      ],
      closingByPath: {
        "choice_review_notes,choice_ask_questions": "Preparation + curiosity = clarity. You came ready and left informed.",
        "choice_detailed_history,choice_honest_detailed": "Clear, honest communication is the foundation of good psychiatric care. You built that foundation today.",
        "default": "First psychiatry appointments are about building a foundation for ongoing care. You experienced how clear communication and asking questions can shape your treatment plan. Every appointment is a collaboration—and you collaborated well."
      }
    },
    {
      endingId: "mixed",
      baseText: "You completed your first psychiatry appointment and left with a treatment plan and follow-up scheduled.",
      pathInsights: [
        {
          choiceId: "choice_scroll_phone",
          insight: "Scrolling your phone in the waiting room helped manage the nerves. Next time, a few minutes of prep might help too."
        },
        {
          choiceId: "choice_brief_overview",
          insight: "Giving a brief overview was a good start, but you could have shared more specific details."
        },
        {
          choiceId: "choice_minimize",
          insight: "Downplaying your symptoms as 'not that bad' made it harder for the psychiatrist to gauge severity. Many people do this—but it can limit the help you receive."
        },
        {
          choiceId: "choice_accept_quietly",
          insight: "Listening quietly felt easier, but you missed opportunities to ask questions and fully understand your options."
        },
        {
          choiceId: "choice_think_about_it",
          insight: "Asking for time to think is valid, but you left without a concrete plan. That's okay—you can decide at your follow-up."
        },
        {
          choiceId: "choice_thank_and_leave",
          insight: "You thanked them and left, but thought of things you wished you'd asked on the way out. That's common for first appointments."
        }
      ],
      closingByPath: {
        "choice_minimize": "Many people downplay symptoms, worried about seeming dramatic. Psychiatrists are trained to listen without judgment. It's okay to share what it's really like.",
        "choice_accept_quietly": "It felt easier to just listen. That's understandable. Next time, try asking one thing you're curious about—questions are always welcome.",
        "choice_scroll_phone": "Your phone was a comfort object. Next time, try reviewing your symptoms or questions instead. Even 2 minutes of prep helps.",
        "default": "You know what to expect now. At your next appointment, you can prepare questions ahead of time, share more specifics, or ask the psychiatrist to slow down when needed. Communication in medical settings is a skill that improves with practice."
      }
    },
    {
      endingId: "uncertain",
      baseText: "You attended your first psychiatry appointment and have a follow-up scheduled. But you're leaving without full clarity.",
      pathInsights: [
        {
          choiceId: "choice_deflect",
          insight: "You gave vague answers and changed the subject. The psychiatrist couldn't get a clear picture of what you're experiencing."
        },
        {
          choiceId: "choice_vague",
          insight: "Keeping answers general—'sometimes,' 'I guess'—made it hard to pin down specifics. That's common when you're nervous."
        },
        {
          choiceId: "choice_leave_uncertain",
          insight: "You left feeling overwhelmed. There was a lot of information, and you're not sure what happens next."
        }
      ],
      closingByPath: {
        "choice_deflect": "Opening up to a stranger about personal struggles takes courage. You held back this time—and that's understandable. Next time, try sharing just one specific example.",
        "choice_vague": "Mental health experiences can be hard to put into words. Try writing down concrete examples before your next visit: 'On Tuesday, I felt X when Y happened.'",
        "choice_leave_uncertain": "First appointments can be overwhelming. Before your next visit, write down your questions. And it's okay to say 'I'm confused—can you explain that again?'",
        "default": "Opening up about mental health to someone new is genuinely difficult. Many people need several appointments before they feel comfortable. The fact that you showed up already demonstrates courage. Each appointment is a new opportunity."
      }
    }
  ]
};

export class PathAwareRenderer extends HardcodedRenderer {
  private scenario: Scenario;

  constructor(scenario: Scenario) {
    super();
    this.scenario = scenario;
  }

  /**
   * Generate path-aware ending text based on the user's journey
   */
  renderEndingText(ending: Ending, state: RunState): string {
    const config = SCENARIO_PATH_CONFIG[this.scenario.id];
    
    // Fall back to base ending text if no path config
    if (!config) {
      return ending.text;
    }

    const endingConfig = config.find(e => e.endingId === ending.id);
    if (!endingConfig) {
      return ending.text;
    }

    // Get the choices made by the user
    const choicesMade = state.history
      .map(h => h.choiceId)
      .filter((c): c is string => c !== undefined);

    // Build the path-aware text
    const parts: string[] = [];

    // 1. Base text
    parts.push(endingConfig.baseText);

    // 2. Add relevant path insights (only for choices the user made)
    const relevantInsights = endingConfig.pathInsights
      .filter(pi => choicesMade.includes(pi.choiceId))
      .slice(0, 3); // Limit to 3 insights to keep it concise

    if (relevantInsights.length > 0) {
      parts.push("\n\n**Your path:**");
      for (const insight of relevantInsights) {
        parts.push(`\n• ${insight.insight}`);
      }
    }

    // 3. Find the best matching closing
    let closing = endingConfig.closingByPath["default"] || "";
    const choicesKey = choicesMade.join(",");
    
    for (const [pattern, text] of Object.entries(endingConfig.closingByPath)) {
      if (pattern === "default") continue;
      
      // Check if all choices in the pattern were made
      const patternChoices = pattern.split(",");
      if (patternChoices.every(pc => choicesMade.includes(pc))) {
        closing = text;
        break;
      }
      
      // Check for single choice matches
      if (patternChoices.length === 1 && choicesMade.includes(patternChoices[0])) {
        closing = text;
        // Don't break - keep looking for better matches
      }
    }

    if (closing) {
      parts.push(`\n\n${closing}`);
    }

    // 4. Add the next step hint for non-positive endings
    if (!ending.isPositive) {
      parts.push("\n\n**Next time:** Try one small thing differently. That's the whole rep.");
    }

    return parts.join("");
  }
}

