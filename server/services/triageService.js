/**
 * Emergency Triage Scoring Engine (Day 7)
 * Evaluates symptoms and patient age to generate a clinical severity score (1-10).
 */

const TRIAGE_RULE_TABLE = [
  // Score 10: Immediate Life Threat / Resuscitation Needed
  {
    score: 10,
    tier: 'Resuscitation / Immediate',
    keywords: [
      'cardiac arrest',
      'unconscious',
      'unresponsiveness',
      'asphyxiation',
      'massive hemorrhage',
    ],
  },
  // Score 9: Emergency / Critical
  {
    score: 9,
    tier: 'Critical Emergency',
    keywords: [
      'chest pain',
      'severe bleeding',
      'stroke symptoms',
      'altered mental status',
      'anaphylaxis',
      'severe head injury',
    ],
  },
  // Score 8: Highly Urgent / Airway or Neuro Threat
  {
    score: 8,
    tier: 'Highly Urgent',
    keywords: [
      'breathing difficulty',
      'respiratory distress',
      'shortness of breath',
      'dyspnea',
      'high fever with seizure',
      'status epilepticus',
    ],
  },
  // Score 7: Urgent
  {
    score: 7,
    tier: 'Urgent',
    keywords: [
      'severe burns',
      'seizure',
      'convulsion',
      'uncontrolled bleeding',
      'severe asthma',
    ],
  },
  // Score 6: Semi-Urgent / High Pain
  {
    score: 6,
    tier: 'Semi-Urgent (Severe)',
    keywords: [
      'severe abdominal pain',
      'acute abdomen',
      'compound fracture',
      'open fracture',
    ],
  },
  // Score 5: Semi-Urgent
  {
    score: 5,
    tier: 'Semi-Urgent',
    keywords: [
      'fracture',
      'moderate injury',
      'moderate burn',
      'dislocation',
    ],
  },
  // Score 4: Less Urgent
  {
    score: 4,
    tier: 'Less Urgent',
    keywords: [
      'persistent vomiting',
      'deep cut',
      'laceration requiring sutures',
      'high fever',
    ],
  },
  // Score 3: Low Urgency
  {
    score: 3,
    tier: 'Low Urgency',
    keywords: [
      'minor fracture',
      'moderate dehydration',
      'migraine',
    ],
  },
  // Score 2: Non-Urgent
  {
    score: 2,
    tier: 'Non-Urgent',
    keywords: [
      'sprain',
      'mild fever',
      'minor burn',
      'abrasion',
    ],
  },
  // Score 1: Minimal / Minor
  {
    score: 1,
    tier: 'Minimal',
    keywords: [
      'minor injury',
      'bruise',
      'rash',
      'sore throat',
    ],
  },
];

/**
 * Calculates triage severity score from symptom tags and patient age.
 * @param {string[]|string} symptomTags - Array or string of symptoms
 * @param {number} age - Patient age in years
 * @returns {object} { severityScore, baseScore, ageAdjustment, matchedSymptoms, tier }
 */
function calculateTriageScore(symptomTags = [], age = 30) {
  const parsedTags = Array.isArray(symptomTags)
    ? symptomTags.map((s) => String(s).toLowerCase().trim())
    : String(symptomTags)
        .toLowerCase()
        .split(',')
        .map((s) => s.trim());

  let highestBaseScore = 3; // Default baseline score
  let highestTier = 'Standard Evaluation';
  const matchedSymptoms = [];

  // Evaluate tags against rule table
  for (const rule of TRIAGE_RULE_TABLE) {
    for (const tag of parsedTags) {
      if (!tag) continue;
      for (const keyword of rule.keywords) {
        if (tag.includes(keyword) || keyword.includes(tag)) {
          matchedSymptoms.push({ symptom: tag, matchedRule: keyword, score: rule.score });
          if (rule.score > highestBaseScore || highestBaseScore === 3) {
            highestBaseScore = rule.score;
            highestTier = rule.tier;
          }
        }
      }
    }
  }

  // Age adjustment: +1 for vulnerable age groups (< 5 or > 65)
  const numericAge = Number(age);
  const isVulnerableAge = !isNaN(numericAge) && (numericAge < 5 || numericAge > 65);
  const ageAdjustment = isVulnerableAge ? 1 : 0;

  // Calculate final score, capped at 10 and min 1
  const finalScore = Math.min(10, Math.max(1, highestBaseScore + ageAdjustment));

  return {
    severityScore: finalScore,
    baseScore: highestBaseScore,
    ageAdjustment,
    isVulnerableAge,
    tier: highestTier,
    matchedSymptoms,
  };
}

module.exports = {
  calculateTriageScore,
  TRIAGE_RULE_TABLE,
};
