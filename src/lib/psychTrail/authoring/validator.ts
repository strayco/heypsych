/**
 * PsychTrails Scenario Source Validator
 * Validates modular source before compilation with clinical requirements
 */

import type {
  ScenarioSource,
  ValidationResult,
  ValidationError,
  ChoiceSource,
  NodeSource,
  ObjectiveSource,
  RouteSource,
  ChallengeSource,
  EndingSource,
  ObjectiveConditionSource,
  RouteIdentifierSource,
  ChallengeModifierSource,
} from "./types";
import { SCORE_CATEGORIES } from "../constants";
import { 
  MECHANISMS, 
  PATTERNS, 
  STUCK_MOMENT_DOMAINS, 
  CLINICAL_REQUIREMENTS,
  isMechanismId,
  isPatternId,
  isStuckMomentDomain,
} from "../clinical-constants";

export function validateScenarioSource(source: ScenarioSource): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const nodeIds = new Set(source.nodes.nodes.map((n) => n.id));
  const choiceIds = new Set(source.choices.choices.map((c) => c.id));
  const endingIds = new Set(source.endings.endings.map((e) => e.id));
  const objectiveIds = new Set(source.objectives.objectives.map((o) => o.id));
  const routeIds = new Set(source.routes.routes.map((r) => r.id));
  const challengeIds = new Set(source.challenges.challenges.map((c) => c.id));
  const metricKeys = new Set(source.state.uiConfig.metrics.map((m) => m.key));
  const flagKeys = new Set(Object.keys(source.state.initialFlags));

  // Track used IDs for orphan detection
  const referencedNodeIds = new Set<string>();
  const referencedChoiceIds = new Set<string>();
  const referencedEndingIds = new Set<string>();
  const referencedObjectiveIds = new Set<string>();
  const referencedRouteIds = new Set<string>();

  // ============================================================================
  // METADATA VALIDATION
  // ============================================================================
  if (!source.metadata.id || source.metadata.id.length === 0) {
    errors.push({ module: "metadata", path: "id", message: "Scenario ID is required", severity: "error" });
  }
  if (!source.metadata.title || source.metadata.title.length === 0) {
    errors.push({ module: "metadata", path: "title", message: "Scenario title is required", severity: "error" });
  }

  // ============================================================================
  // CLINICAL METADATA VALIDATION
  // ============================================================================
  
  // Stuck moment validation
  if (!source.metadata.stuckMoment) {
    errors.push({ module: "metadata", path: "stuckMoment", message: "Stuck moment is required for clinical usefulness", severity: "error" });
  } else {
    if (!source.metadata.stuckMoment.description) {
      errors.push({ module: "metadata", path: "stuckMoment.description", message: "Stuck moment description is required", severity: "error" });
    }
    if (!source.metadata.stuckMoment.domain || !isStuckMomentDomain(source.metadata.stuckMoment.domain)) {
      errors.push({ module: "metadata", path: "stuckMoment.domain", message: `Stuck moment domain must be one of: ${STUCK_MOMENT_DOMAINS.join(", ")}`, severity: "error" });
    }
    if (!source.metadata.stuckMoment.trigger) {
      errors.push({ module: "metadata", path: "stuckMoment.trigger", message: "Stuck moment trigger is required", severity: "error" });
    }
    if (!source.metadata.stuckMoment.internalExperience) {
      errors.push({ module: "metadata", path: "stuckMoment.internalExperience", message: "Stuck moment internal experience is required", severity: "error" });
    }
  }

  // Primary mechanisms validation
  if (!source.metadata.primaryMechanisms || source.metadata.primaryMechanisms.length === 0) {
    errors.push({ module: "metadata", path: "primaryMechanisms", message: "At least 1 primary mechanism is required", severity: "error" });
  } else {
    if (source.metadata.primaryMechanisms.length > CLINICAL_REQUIREMENTS.maxPrimaryMechanisms) {
      errors.push({ module: "metadata", path: "primaryMechanisms", message: `Maximum ${CLINICAL_REQUIREMENTS.maxPrimaryMechanisms} primary mechanisms allowed`, severity: "error" });
    }
    for (const mech of source.metadata.primaryMechanisms) {
      if (!isMechanismId(mech)) {
        errors.push({ module: "metadata", path: "primaryMechanisms", message: `Invalid mechanism "${mech}". Must be one of: ${MECHANISMS.join(", ")}`, severity: "error" });
      }
    }
  }

  // Secondary mechanisms validation
  if (source.metadata.secondaryMechanisms) {
    if (source.metadata.secondaryMechanisms.length > CLINICAL_REQUIREMENTS.maxSecondaryMechanisms) {
      warnings.push({ module: "metadata", path: "secondaryMechanisms", message: `More than ${CLINICAL_REQUIREMENTS.maxSecondaryMechanisms} secondary mechanisms may dilute focus`, severity: "warning" });
    }
    for (const mech of source.metadata.secondaryMechanisms) {
      if (!isMechanismId(mech)) {
        errors.push({ module: "metadata", path: "secondaryMechanisms", message: `Invalid mechanism "${mech}". Must be one of: ${MECHANISMS.join(", ")}`, severity: "error" });
      }
    }
  }

  // Real-world analogs validation
  if (!source.metadata.realWorldAnalogs || source.metadata.realWorldAnalogs.length === 0) {
    errors.push({ module: "metadata", path: "realWorldAnalogs", message: "At least 1 real-world analog is required for transfer", severity: "error" });
  }

  // ============================================================================
  // STATE VALIDATION
  // ============================================================================
  if (!nodeIds.has(source.state.startNodeId)) {
    errors.push({
      module: "state",
      path: "startNodeId",
      message: `Start node "${source.state.startNodeId}" does not exist`,
      severity: "error",
    });
  }
  referencedNodeIds.add(source.state.startNodeId);

  // Validate initial metrics match declared metrics
  for (const key of Object.keys(source.state.initialMetrics)) {
    if (!metricKeys.has(key)) {
      errors.push({
        module: "state",
        path: `initialMetrics.${key}`,
        message: `Initial metric "${key}" not declared in uiConfig.metrics`,
        severity: "error",
      });
    }
  }

  // ============================================================================
  // NODE VALIDATION
  // ============================================================================
  const seenNodeIds = new Set<string>();
  for (const node of source.nodes.nodes) {
    if (seenNodeIds.has(node.id)) {
      errors.push({
        module: "nodes",
        path: `nodes[${node.id}]`,
        message: `Duplicate node ID "${node.id}"`,
        severity: "error",
      });
    }
    seenNodeIds.add(node.id);

    // Validate choice references
    for (const choiceId of node.choiceIds) {
      if (!choiceIds.has(choiceId)) {
        errors.push({
          module: "nodes",
          path: `nodes[${node.id}].choiceIds`,
          message: `Node "${node.id}" references non-existent choice "${choiceId}"`,
          severity: "error",
        });
      }
      referencedChoiceIds.add(choiceId);
    }

    // Validate route markers
    for (const routeId of node.routeMarkers || []) {
      if (!routeIds.has(routeId)) {
        warnings.push({
          module: "nodes",
          path: `nodes[${node.id}].routeMarkers`,
          message: `Node "${node.id}" has route marker for non-existent route "${routeId}"`,
          severity: "warning",
        });
      }
    }

    // Validate objective triggers
    for (const trigger of node.objectiveTriggers || []) {
      if (!objectiveIds.has(trigger.objectiveId)) {
        errors.push({
          module: "nodes",
          path: `nodes[${node.id}].objectiveTriggers`,
          message: `Node "${node.id}" triggers non-existent objective "${trigger.objectiveId}"`,
          severity: "error",
        });
      }
      referencedObjectiveIds.add(trigger.objectiveId);
    }
  }

  // ============================================================================
  // CHOICE VALIDATION
  // ============================================================================
  const seenChoiceIds = new Set<string>();
  for (const choice of source.choices.choices) {
    if (seenChoiceIds.has(choice.id)) {
      errors.push({
        module: "choices",
        path: `choices[${choice.id}]`,
        message: `Duplicate choice ID "${choice.id}"`,
        severity: "error",
      });
    }
    seenChoiceIds.add(choice.id);

    // Validate nextNodeId
    if (choice.nextNodeId) {
      if (!nodeIds.has(choice.nextNodeId)) {
        errors.push({
          module: "choices",
          path: `choices[${choice.id}].nextNodeId`,
          message: `Choice "${choice.id}" leads to non-existent node "${choice.nextNodeId}"`,
          severity: "error",
        });
      }
      referencedNodeIds.add(choice.nextNodeId);
    }

    // Validate effects
    const hasEndEffect = choice.effects.some((e) => e.type === "end");
    if (!choice.nextNodeId && !hasEndEffect) {
      errors.push({
        module: "choices",
        path: `choices[${choice.id}]`,
        message: `Choice "${choice.id}" has no destination (no nextNodeId or end effect)`,
        severity: "error",
      });
    }

    for (const effect of choice.effects) {
      if (effect.type === "end" && effect.endingId) {
        if (!endingIds.has(effect.endingId)) {
          errors.push({
            module: "choices",
            path: `choices[${choice.id}].effects`,
            message: `Choice "${choice.id}" references non-existent ending "${effect.endingId}"`,
            severity: "error",
          });
        }
        referencedEndingIds.add(effect.endingId);
      }
      if (effect.type === "metric" || effect.type === "metric-set") {
        if (effect.metric && !metricKeys.has(effect.metric)) {
          errors.push({
            module: "choices",
            path: `choices[${choice.id}].effects`,
            message: `Choice "${choice.id}" modifies non-existent metric "${effect.metric}"`,
            severity: "error",
          });
        }
      }
      if (effect.type === "flag" && effect.flag) {
        flagKeys.add(effect.flag);
      }
    }

    // Validate score effects
    for (const scoreEffect of choice.scoreEffects || []) {
      if (!SCORE_CATEGORIES.includes(scoreEffect.category)) {
        errors.push({
          module: "choices",
          path: `choices[${choice.id}].scoreEffects`,
          message: `Choice "${choice.id}" uses invalid score category "${scoreEffect.category}"`,
          severity: "error",
        });
      }
    }

    // Validate objective effects
    for (const objEffect of choice.objectiveEffects || []) {
      if (!objectiveIds.has(objEffect.objectiveId)) {
        errors.push({
          module: "choices",
          path: `choices[${choice.id}].objectiveEffects`,
          message: `Choice "${choice.id}" affects non-existent objective "${objEffect.objectiveId}"`,
          severity: "error",
        });
      }
      referencedObjectiveIds.add(objEffect.objectiveId);
    }
  }

  // ============================================================================
  // ENDING VALIDATION
  // ============================================================================
  const seenEndingIds = new Set<string>();
  for (const ending of source.endings.endings) {
    if (seenEndingIds.has(ending.id)) {
      errors.push({
        module: "endings",
        path: `endings[${ending.id}]`,
        message: `Duplicate ending ID "${ending.id}"`,
        severity: "error",
      });
    }
    seenEndingIds.add(ending.id);

    // Validate required objectives
    for (const objId of ending.starContribution.requiresObjectives || []) {
      if (!objectiveIds.has(objId)) {
        errors.push({
          module: "endings",
          path: `endings[${ending.id}].starContribution.requiresObjectives`,
          message: `Ending "${ending.id}" requires non-existent objective "${objId}"`,
          severity: "error",
        });
      }
    }
  }

  // ============================================================================
  // OBJECTIVE VALIDATION
  // ============================================================================
  const seenObjectiveIds = new Set<string>();
  for (const objective of source.objectives.objectives) {
    if (seenObjectiveIds.has(objective.id)) {
      errors.push({
        module: "objectives",
        path: `objectives[${objective.id}]`,
        message: `Duplicate objective ID "${objective.id}"`,
        severity: "error",
      });
    }
    seenObjectiveIds.add(objective.id);

    validateObjectiveCondition(objective.condition, objective.id, errors, {
      endingIds,
      nodeIds,
      choiceIds,
      routeIds,
      flagKeys,
    });
  }

  // ============================================================================
  // ROUTE VALIDATION
  // ============================================================================
  const seenRouteIds = new Set<string>();
  for (const route of source.routes.routes) {
    if (seenRouteIds.has(route.id)) {
      errors.push({
        module: "routes",
        path: `routes[${route.id}]`,
        message: `Duplicate route ID "${route.id}"`,
        severity: "error",
      });
    }
    seenRouteIds.add(route.id);

    validateRouteIdentifier(route.identifiedBy, route.id, errors, {
      endingIds,
      nodeIds,
      choiceIds,
      flagKeys,
    });
  }

  // ============================================================================
  // CHALLENGE VALIDATION
  // ============================================================================
  const seenChallengeIds = new Set<string>();
  for (const challenge of source.challenges.challenges) {
    if (seenChallengeIds.has(challenge.id)) {
      errors.push({
        module: "challenges",
        path: `challenges[${challenge.id}]`,
        message: `Duplicate challenge ID "${challenge.id}"`,
        severity: "error",
      });
    }
    seenChallengeIds.add(challenge.id);

    for (const modifier of challenge.modifiers) {
      validateChallengeModifier(modifier, challenge.id, errors, {
        choiceIds,
        routeIds,
        objectiveIds,
      });
    }
  }

  // ============================================================================
  // SCORING VALIDATION
  // ============================================================================
  for (const cat of SCORE_CATEGORIES) {
    if (source.scoring.categoryWeights[cat] === undefined) {
      errors.push({
        module: "scoring",
        path: `categoryWeights.${cat}`,
        message: `Missing weight for score category "${cat}"`,
        severity: "error",
      });
    }
  }

  // ============================================================================
  // CLINICAL REQUIREMENTS VALIDATION
  // ============================================================================
  
  // Route count validation
  const routeCount = source.routes.routes.length;
  if (routeCount < CLINICAL_REQUIREMENTS.minRoutes) {
    errors.push({
      module: "routes",
      path: "routes",
      message: `Minimum ${CLINICAL_REQUIREMENTS.minRoutes} routes required for replay value. Found ${routeCount}.`,
      severity: "error",
    });
  }

  // Hidden route validation
  const hiddenRoutes = source.routes.routes.filter(r => r.isHidden);
  if (hiddenRoutes.length < CLINICAL_REQUIREMENTS.minHiddenRoutes) {
    errors.push({
      module: "routes",
      path: "routes",
      message: `At least ${CLINICAL_REQUIREMENTS.minHiddenRoutes} hidden route required. Found ${hiddenRoutes.length}.`,
      severity: "error",
    });
  }

  // Recovery route validation
  const recoveryRoutes = source.routes.routes.filter(r => r.isRecovery);
  if (recoveryRoutes.length < CLINICAL_REQUIREMENTS.minRecoveryRoutes) {
    errors.push({
      module: "routes",
      path: "routes",
      message: `At least ${CLINICAL_REQUIREMENTS.minRecoveryRoutes} recovery route required for setback practice. Found ${recoveryRoutes.length}.`,
      severity: "error",
    });
  }

  // Primary objectives count validation
  const primaryObjectives = source.objectives.objectives.filter(o => o.type === "primary");
  if (primaryObjectives.length < CLINICAL_REQUIREMENTS.minPrimaryObjectives) {
    errors.push({
      module: "objectives",
      path: "objectives",
      message: `Minimum ${CLINICAL_REQUIREMENTS.minPrimaryObjectives} primary objectives required. Found ${primaryObjectives.length}.`,
      severity: "error",
    });
  }

  // Hidden objectives validation
  const hiddenObjectives = source.objectives.objectives.filter(o => o.type === "hidden");
  if (hiddenObjectives.length < CLINICAL_REQUIREMENTS.minHiddenObjectives) {
    errors.push({
      module: "objectives",
      path: "objectives",
      message: `At least ${CLINICAL_REQUIREMENTS.minHiddenObjectives} hidden objective required. Found ${hiddenObjectives.length}.`,
      severity: "error",
    });
  }

  // Challenge count validation
  if (source.challenges.challenges.length < CLINICAL_REQUIREMENTS.minChallenges) {
    errors.push({
      module: "challenges",
      path: "challenges",
      message: `Minimum ${CLINICAL_REQUIREMENTS.minChallenges} challenges required. Found ${source.challenges.challenges.length}.`,
      severity: "error",
    });
  }

  // Ending transfer prompt validation
  for (const ending of source.endings.endings) {
    if (!ending.transferPrompts || !ending.transferPrompts.default) {
      errors.push({
        module: "endings",
        path: `endings[${ending.id}].transferPrompts`,
        message: `Ending "${ending.id}" requires a default transfer prompt for real-world action`,
        severity: "error",
      });
    }
  }

  // Choice mechanism effects validation (at least some choices should have mechanism effects)
  const choicesWithMechanisms = source.choices.choices.filter(c => c.mechanismEffects && c.mechanismEffects.length > 0);
  if (choicesWithMechanisms.length === 0) {
    warnings.push({
      module: "choices",
      path: "choices",
      message: "No choices have mechanism effects. Consider adding mechanism effects to key choices.",
      severity: "warning",
    });
  }

  // Validate mechanism effects reference valid mechanisms
  for (const choice of source.choices.choices) {
    if (choice.mechanismEffects) {
      for (const effect of choice.mechanismEffects) {
        if (!isMechanismId(effect.mechanism)) {
          errors.push({
            module: "choices",
            path: `choices[${choice.id}].mechanismEffects`,
            message: `Invalid mechanism "${effect.mechanism}". Must be one of: ${MECHANISMS.join(", ")}`,
            severity: "error",
          });
        }
      }
    }
    if (choice.patternTags) {
      for (const tag of choice.patternTags) {
        if (!isPatternId(tag)) {
          errors.push({
            module: "choices",
            path: `choices[${choice.id}].patternTags`,
            message: `Invalid pattern tag "${tag}". Must be one of: ${PATTERNS.join(", ")}`,
            severity: "error",
          });
        }
      }
    }
  }

  // Route mechanism signature validation
  for (const route of source.routes.routes) {
    if (route.mechanismSignature) {
      for (const mech of route.mechanismSignature.positive || []) {
        if (!isMechanismId(mech)) {
          errors.push({
            module: "routes",
            path: `routes[${route.id}].mechanismSignature.positive`,
            message: `Invalid mechanism "${mech}"`,
            severity: "error",
          });
        }
      }
      for (const mech of route.mechanismSignature.negative || []) {
        if (!isMechanismId(mech)) {
          errors.push({
            module: "routes",
            path: `routes[${route.id}].mechanismSignature.negative`,
            message: `Invalid mechanism "${mech}"`,
            severity: "error",
          });
        }
      }
    }
    if (route.associatedPatterns) {
      for (const pat of route.associatedPatterns.positive || []) {
        if (!isPatternId(pat)) {
          errors.push({
            module: "routes",
            path: `routes[${route.id}].associatedPatterns.positive`,
            message: `Invalid pattern "${pat}"`,
            severity: "error",
          });
        }
      }
      for (const pat of route.associatedPatterns.negative || []) {
        if (!isPatternId(pat)) {
          errors.push({
            module: "routes",
            path: `routes[${route.id}].associatedPatterns.negative`,
            message: `Invalid pattern "${pat}"`,
            severity: "error",
          });
        }
      }
    }
  }

  // Challenge target mechanism validation
  for (const challenge of source.challenges.challenges) {
    if (challenge.targetMechanisms) {
      for (const mech of challenge.targetMechanisms) {
        if (!isMechanismId(mech)) {
          errors.push({
            module: "challenges",
            path: `challenges[${challenge.id}].targetMechanisms`,
            message: `Invalid mechanism "${mech}"`,
            severity: "error",
          });
        }
      }
    }
    if (challenge.targetPatterns) {
      for (const pat of challenge.targetPatterns.trains || []) {
        if (!isPatternId(pat)) {
          errors.push({
            module: "challenges",
            path: `challenges[${challenge.id}].targetPatterns.trains`,
            message: `Invalid pattern "${pat}"`,
            severity: "error",
          });
        }
      }
      for (const pat of challenge.targetPatterns.prevents || []) {
        if (!isPatternId(pat)) {
          errors.push({
            module: "challenges",
            path: `challenges[${challenge.id}].targetPatterns.prevents`,
            message: `Invalid pattern "${pat}"`,
            severity: "error",
          });
        }
      }
    }
  }

  // ============================================================================
  // ORPHAN DETECTION
  // ============================================================================
  for (const nodeId of nodeIds) {
    if (nodeId !== source.state.startNodeId && !referencedNodeIds.has(nodeId)) {
      warnings.push({
        module: "nodes",
        path: `nodes[${nodeId}]`,
        message: `Node "${nodeId}" is orphaned (unreachable)`,
        severity: "warning",
      });
    }
  }

  for (const choiceId of choiceIds) {
    if (!referencedChoiceIds.has(choiceId)) {
      warnings.push({
        module: "choices",
        path: `choices[${choiceId}]`,
        message: `Choice "${choiceId}" is orphaned (not referenced by any node)`,
        severity: "warning",
      });
    }
  }

  for (const endingId of endingIds) {
    if (!referencedEndingIds.has(endingId)) {
      warnings.push({
        module: "endings",
        path: `endings[${endingId}]`,
        message: `Ending "${endingId}" is orphaned (never triggered)`,
        severity: "warning",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      nodeCount: nodeIds.size,
      choiceCount: choiceIds.size,
      endingCount: endingIds.size,
      objectiveCount: objectiveIds.size,
      routeCount: routeIds.size,
      challengeCount: challengeIds.size,
    },
  };
}

function validateObjectiveCondition(
  condition: ObjectiveConditionSource,
  objectiveId: string,
  errors: ValidationError[],
  refs: { endingIds: Set<string>; nodeIds: Set<string>; choiceIds: Set<string>; routeIds: Set<string>; flagKeys: Set<string> }
): void {
  switch (condition.type) {
    case "reach-ending":
      if (condition.endingId && !refs.endingIds.has(condition.endingId)) {
        errors.push({
          module: "objectives",
          path: `objectives[${objectiveId}].condition`,
          message: `Objective "${objectiveId}" references non-existent ending "${condition.endingId}"`,
          severity: "error",
        });
      }
      break;
    case "reach-node":
      if (condition.nodeId && !refs.nodeIds.has(condition.nodeId)) {
        errors.push({
          module: "objectives",
          path: `objectives[${objectiveId}].condition`,
          message: `Objective "${objectiveId}" references non-existent node "${condition.nodeId}"`,
          severity: "error",
        });
      }
      break;
    case "choice-made":
    case "choice-avoided":
      if (condition.choiceId && !refs.choiceIds.has(condition.choiceId)) {
        errors.push({
          module: "objectives",
          path: `objectives[${objectiveId}].condition`,
          message: `Objective "${objectiveId}" references non-existent choice "${condition.choiceId}"`,
          severity: "error",
        });
      }
      break;
    case "route-taken":
      if (condition.routeId && !refs.routeIds.has(condition.routeId)) {
        errors.push({
          module: "objectives",
          path: `objectives[${objectiveId}].condition`,
          message: `Objective "${objectiveId}" references non-existent route "${condition.routeId}"`,
          severity: "error",
        });
      }
      break;
    case "all-of":
    case "any-of":
    case "none-of":
      for (const sub of condition.conditions || []) {
        validateObjectiveCondition(sub, objectiveId, errors, refs);
      }
      break;
  }
}

function validateRouteIdentifier(
  identifier: RouteIdentifierSource,
  routeId: string,
  errors: ValidationError[],
  refs: { endingIds: Set<string>; nodeIds: Set<string>; choiceIds: Set<string>; flagKeys: Set<string> }
): void {
  switch (identifier.type) {
    case "ending":
      if (identifier.endingId && !refs.endingIds.has(identifier.endingId)) {
        errors.push({
          module: "routes",
          path: `routes[${routeId}].identifiedBy`,
          message: `Route "${routeId}" references non-existent ending "${identifier.endingId}"`,
          severity: "error",
        });
      }
      break;
    case "choice-sequence":
      for (const cid of identifier.choiceIds || []) {
        if (!refs.choiceIds.has(cid)) {
          errors.push({
            module: "routes",
            path: `routes[${routeId}].identifiedBy`,
            message: `Route "${routeId}" references non-existent choice "${cid}"`,
            severity: "error",
          });
        }
      }
      break;
    case "choice-includes":
      if (identifier.choiceId && !refs.choiceIds.has(identifier.choiceId)) {
        errors.push({
          module: "routes",
          path: `routes[${routeId}].identifiedBy`,
          message: `Route "${routeId}" references non-existent choice "${identifier.choiceId}"`,
          severity: "error",
        });
      }
      break;
    case "node-sequence":
      for (const nid of identifier.nodeIds || []) {
        if (!refs.nodeIds.has(nid)) {
          errors.push({
            module: "routes",
            path: `routes[${routeId}].identifiedBy`,
            message: `Route "${routeId}" references non-existent node "${nid}"`,
            severity: "error",
          });
        }
      }
      break;
  }
}

function validateChallengeModifier(
  modifier: ChallengeModifierSource,
  challengeId: string,
  errors: ValidationError[],
  refs: { choiceIds: Set<string>; routeIds: Set<string>; objectiveIds: Set<string> }
): void {
  switch (modifier.type) {
    case "forbid-choices":
      for (const cid of modifier.choiceIds || []) {
        if (!refs.choiceIds.has(cid)) {
          errors.push({
            module: "challenges",
            path: `challenges[${challengeId}].modifiers`,
            message: `Challenge "${challengeId}" forbids non-existent choice "${cid}"`,
            severity: "error",
          });
        }
      }
      break;
    case "require-route":
      if (modifier.routeId && !refs.routeIds.has(modifier.routeId)) {
        errors.push({
          module: "challenges",
          path: `challenges[${challengeId}].modifiers`,
          message: `Challenge "${challengeId}" requires non-existent route "${modifier.routeId}"`,
          severity: "error",
        });
      }
      break;
    case "require-objectives":
      for (const oid of modifier.objectiveIds || []) {
        if (!refs.objectiveIds.has(oid)) {
          errors.push({
            module: "challenges",
            path: `challenges[${challengeId}].modifiers`,
            message: `Challenge "${challengeId}" requires non-existent objective "${oid}"`,
            severity: "error",
          });
        }
      }
      break;
  }
}
