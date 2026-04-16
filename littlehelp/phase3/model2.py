"""Model 2 - Smart Triage Engine with symptom-specific question flows.

Uses clinically-informed question trees based on Australian Triage Scale (ATS)
and healthdirect guidelines. Each symptom category has 4-5 tailored questions.
A scoring engine evaluates answers to route patients to the right care level.

NOT a diagnostic tool — routes to care settings only.
"""

SYMPTOM_QUESTIONS = {
    "fever": [
        {
            "id": "fever_age",
            "text": "Who has the fever?",
            "options": [
                {"id": "infant", "label": "Baby under 3 months", "weight": "emergency"},
                {"id": "child", "label": "Child (3 months – 5 years)", "weight": "urgent"},
                {"id": "adult", "label": "Older child or adult", "weight": "gp"},
            ],
        },
        {
            "id": "fever_red_flags",
            "text": "Do they have any of these?",
            "subtitle": "Rash, stiff neck, or difficulty breathing",
            "options": [
                {"id": "yes", "label": "Yes, one or more", "weight": "emergency"},
                {"id": "no", "label": "None of these", "weight": "gp"},
            ],
        },
        {
            "id": "fever_seizure",
            "text": "Have they had a seizure or become unusually drowsy?",
            "options": [
                {"id": "yes", "label": "Yes", "weight": "emergency"},
                {"id": "no", "label": "No", "weight": "gp"},
            ],
        },
        {
            "id": "fever_duration",
            "text": "How long has the fever lasted?",
            "options": [
                {"id": "high_short", "label": "Under 24h but very high (39°C+)", "weight": "urgent"},
                {"id": "mild_days", "label": "2–3 days, mild symptoms", "weight": "gp"},
                {"id": "long", "label": "More than 5 days", "weight": "urgent"},
            ],
        },
        {
            "id": "fever_fluids",
            "text": "Are they drinking and eating?",
            "options": [
                {"id": "refusing", "label": "Refusing fluids / dry mouth / no tears", "weight": "urgent"},
                {"id": "reduced", "label": "Less than usual but some", "weight": "gp"},
                {"id": "normal", "label": "Normal intake", "weight": "pharmacy"},
            ],
        },
    ],
    "pain": [
        {
            "id": "pain_what",
            "text": "What happened?",
            "options": [
                {"id": "head_chest", "label": "Head injury, chest pain, or can't move a limb", "weight": "emergency"},
                {"id": "major", "label": "Fall from height, car accident, or hard blow", "weight": "emergency"},
                {"id": "minor", "label": "Twisted ankle, bump, or minor fall", "weight": "gp"},
            ],
        },
        {
            "id": "pain_visible",
            "text": "Is there swelling or deformity?",
            "options": [
                {"id": "deformed", "label": "Limb looks bent, severely swollen, or blue", "weight": "emergency"},
                {"id": "moderate_swell", "label": "Moderate swelling or bruising", "weight": "urgent"},
                {"id": "none", "label": "No visible swelling", "weight": "gp"},
            ],
        },
        {
            "id": "pain_move",
            "text": "Can you move the injured area?",
            "options": [
                {"id": "cant", "label": "Cannot move at all / unbearable pain", "weight": "emergency"},
                {"id": "limited", "label": "Limited movement, hurts to move", "weight": "urgent"},
                {"id": "can", "label": "Can move with mild pain", "weight": "gp"},
            ],
        },
        {
            "id": "pain_neuro",
            "text": "Any numbness, tingling, or pins and needles?",
            "options": [
                {"id": "spreading", "label": "Yes, in fingers/toes or spreading", "weight": "emergency"},
                {"id": "local", "label": "Mild tingling at injury site only", "weight": "urgent"},
                {"id": "none", "label": "No numbness or tingling", "weight": "gp"},
            ],
        },
        {
            "id": "pain_severity",
            "text": "How severe is the pain?",
            "options": [
                {"id": "severe", "label": "8–10: Can't function", "weight": "emergency"},
                {"id": "moderate", "label": "5–7: Limiting activity", "weight": "urgent"},
                {"id": "mild", "label": "1–4: Manageable", "weight": "pharmacy"},
            ],
        },
    ],
    "stomach": [
        {
            "id": "stomach_blood",
            "text": "Is there blood in vomit or dark/black stools?",
            "options": [
                {"id": "yes", "label": "Yes", "weight": "emergency"},
                {"id": "no", "label": "No", "weight": "gp"},
            ],
        },
        {
            "id": "stomach_fluids",
            "text": "Can you keep fluids down?",
            "options": [
                {"id": "nothing", "label": "No — vomiting everything including water", "weight": "urgent"},
                {"id": "sips", "label": "Small sips stay down sometimes", "weight": "gp"},
                {"id": "yes", "label": "Yes, most fluids stay down", "weight": "pharmacy"},
            ],
        },
        {
            "id": "stomach_dehydration",
            "text": "Any severe pain, dry mouth, dizziness, or no urine for 8+ hours?",
            "options": [
                {"id": "multiple", "label": "Yes, multiple of these", "weight": "urgent"},
                {"id": "one", "label": "One or two mild symptoms", "weight": "gp"},
                {"id": "none", "label": "None of these", "weight": "pharmacy"},
            ],
        },
        {
            "id": "stomach_location",
            "text": "Where is the pain and do you have fever?",
            "options": [
                {"id": "right_fever", "label": "Lower right belly with fever", "weight": "emergency"},
                {"id": "fever", "label": "Stomach pain with fever", "weight": "urgent"},
                {"id": "cramping", "label": "Mild cramping, no fever", "weight": "pharmacy"},
            ],
        },
        {
            "id": "stomach_duration",
            "text": "How long have symptoms lasted?",
            "options": [
                {"id": "worsening", "label": "Over 24 hours and getting worse", "weight": "urgent"},
                {"id": "stable", "label": "12–24 hours, stable", "weight": "gp"},
                {"id": "short", "label": "Less than 12 hours", "weight": "pharmacy"},
            ],
        },
    ],
    "breathing": [
        {
            "id": "breathing_type",
            "text": "What best describes the problem?",
            "options": [
                {"id": "crushing", "label": "Crushing chest pain or pressure", "weight": "emergency"},
                {"id": "cant_breathe", "label": "Struggling to breathe at rest", "weight": "emergency"},
                {"id": "wheeze", "label": "Wheezing or tight chest", "weight": "urgent"},
                {"id": "cough", "label": "Persistent cough", "weight": "gp"},
            ],
        },
        {
            "id": "breathing_speech",
            "text": "Can you speak in full sentences?",
            "options": [
                {"id": "no", "label": "No — only a few words at a time", "weight": "emergency"},
                {"id": "short", "label": "Short sentences, need to pause", "weight": "urgent"},
                {"id": "yes", "label": "Yes, can talk normally", "weight": "gp"},
            ],
        },
        {
            "id": "breathing_colour",
            "text": "Are lips, fingers, or skin turning blue or grey?",
            "options": [
                {"id": "yes", "label": "Yes", "weight": "emergency"},
                {"id": "no", "label": "No, normal colour", "weight": "gp"},
            ],
        },
        {
            "id": "breathing_onset",
            "text": "When did this start?",
            "options": [
                {"id": "sudden", "label": "Suddenly, in the last hour", "weight": "emergency"},
                {"id": "today", "label": "Gradually today", "weight": "urgent"},
                {"id": "days", "label": "Over a few days", "weight": "gp"},
            ],
        },
        {
            "id": "breathing_history",
            "text": "Do you have asthma or a known lung condition?",
            "subtitle": "And is your usual inhaler/medication not helping?",
            "options": [
                {"id": "not_helping", "label": "Yes, but medication isn't helping", "weight": "urgent"},
                {"id": "managed", "label": "Yes, and medication is helping a bit", "weight": "gp"},
                {"id": "no_history", "label": "No history of lung problems", "weight": "gp"},
            ],
        },
    ],
    "rash": [
        {
            "id": "rash_spreading",
            "text": "How quickly is it spreading?",
            "options": [
                {"id": "fast", "label": "Spreading fast — over minutes to hours", "weight": "emergency"},
                {"id": "slow", "label": "Slowly getting bigger over days", "weight": "gp"},
                {"id": "stable", "label": "Stayed the same size", "weight": "pharmacy"},
            ],
        },
        {
            "id": "rash_fever",
            "text": "Do you also have a fever or feel unwell?",
            "options": [
                {"id": "high_fever", "label": "Yes, high fever and feeling very unwell", "weight": "emergency"},
                {"id": "mild_fever", "label": "Mild fever or slightly unwell", "weight": "urgent"},
                {"id": "no", "label": "No fever, feel fine otherwise", "weight": "pharmacy"},
            ],
        },
        {
            "id": "rash_blanch",
            "text": "Press a glass against the rash — does it fade?",
            "subtitle": "This is the 'glass test' for meningococcal rash",
            "options": [
                {"id": "doesnt_fade", "label": "Does NOT fade under pressure", "weight": "emergency"},
                {"id": "fades", "label": "Fades when pressed", "weight": "gp"},
                {"id": "unsure", "label": "Not sure / can't tell", "weight": "urgent"},
            ],
        },
        {
            "id": "rash_swelling",
            "text": "Is there swelling around the face, lips, or throat?",
            "options": [
                {"id": "yes", "label": "Yes — face, lips, or throat swelling", "weight": "emergency"},
                {"id": "mild", "label": "Mild local swelling only", "weight": "urgent"},
                {"id": "no", "label": "No swelling", "weight": "pharmacy"},
            ],
        },
        {
            "id": "rash_cause",
            "text": "Any idea what caused it?",
            "options": [
                {"id": "new_med", "label": "Started a new medication recently", "weight": "urgent"},
                {"id": "bite", "label": "Insect bite or sting", "weight": "pharmacy"},
                {"id": "unknown", "label": "No idea", "weight": "gp"},
            ],
        },
    ],
    "mental": [
        {
            "id": "mental_safety",
            "text": "Are you having thoughts of hurting yourself or ending your life?",
            "options": [
                {"id": "yes_plan", "label": "Yes, and I have a plan", "weight": "emergency"},
                {"id": "yes_thoughts", "label": "Yes, but no specific plan", "weight": "urgent"},
                {"id": "no", "label": "No", "weight": "gp"},
            ],
        },
        {
            "id": "mental_duration",
            "text": "How long have you been feeling this way?",
            "options": [
                {"id": "hours", "label": "Hours — it's a crisis right now", "weight": "emergency"},
                {"id": "weeks", "label": "Weeks — it's been building up", "weight": "gp"},
                {"id": "months", "label": "Months — it's ongoing", "weight": "gp"},
            ],
        },
        {
            "id": "mental_function",
            "text": "How is it affecting your daily life?",
            "options": [
                {"id": "cant_function", "label": "Can't eat, sleep, work, or leave the house", "weight": "urgent"},
                {"id": "struggling", "label": "Struggling but managing day to day", "weight": "gp"},
                {"id": "mild", "label": "Mildly affecting me", "weight": "gp"},
            ],
        },
        {
            "id": "mental_panic",
            "text": "Are you experiencing a panic attack right now?",
            "subtitle": "Racing heart, can't breathe, feel like you're dying",
            "options": [
                {"id": "yes_now", "label": "Yes, right now", "weight": "urgent"},
                {"id": "sometimes", "label": "I get them sometimes", "weight": "gp"},
                {"id": "no", "label": "No", "weight": "gp"},
            ],
        },
        {
            "id": "mental_support",
            "text": "Do you have existing support or medication?",
            "options": [
                {"id": "none", "label": "No — this is my first time seeking help", "weight": "gp"},
                {"id": "lapsed", "label": "Had support before but stopped", "weight": "gp"},
                {"id": "current", "label": "Currently seeing someone / on medication", "weight": "gp"},
            ],
        },
    ],
}

# Scoring weights for each care level
CARE_WEIGHTS = {
    "emergency": 100,
    "urgent": 50,
    "gp": 20,
    "pharmacy": 5,
}

# Thresholds for routing
# If ANY answer is emergency → ED
# If total urgent score >= 100 → clinic
# If total gp score dominates → GP
# Else → pharmacy

def get_questions(symptom_id: str) -> dict:
    """Return the question flow for a given symptom category."""
    questions = SYMPTOM_QUESTIONS.get(symptom_id)
    if not questions:
        return {"error": f"Unknown symptom: {symptom_id}", "questions": []}
    return {
        "symptom_id": symptom_id,
        "total_questions": len(questions),
        "questions": questions,
    }


def evaluate(symptom_id: str, answers: dict[str, str]) -> dict:
    """
    Evaluate answers and return care routing decision.

    answers: dict mapping question_id → selected option_id
    e.g. {"fever_age": "infant", "fever_red_flags": "yes", ...}

    Returns: {care_type, urgency, message, confidence, reasoning}
    """
    questions = SYMPTOM_QUESTIONS.get(symptom_id, [])
    if not questions:
        return {
            "care_type": "gp",
            "urgency": "routine",
            "message": "See a GP for assessment.",
            "confidence": 0.5,
            "reasoning": "Unknown symptom category — defaulting to GP.",
        }

    # Collect weights from answers
    scores = {"emergency": 0, "urgent": 0, "gp": 0, "pharmacy": 0}
    has_emergency = False
    reasoning_parts = []

    for q in questions:
        answer_id = answers.get(q["id"])
        if not answer_id:
            continue

        # Find the selected option
        selected = None
        for opt in q["options"]:
            if opt["id"] == answer_id:
                selected = opt
                break

        if not selected:
            continue

        weight = selected.get("weight", "gp")
        scores[weight] = scores.get(weight, 0) + CARE_WEIGHTS.get(weight, 0)

        if weight == "emergency":
            has_emergency = True
            reasoning_parts.append(f"{q['text']} → {selected['label']} (critical)")
        elif weight == "urgent":
            reasoning_parts.append(f"{q['text']} → {selected['label']} (concerning)")

    # Decision logic
    total = sum(scores.values())

    # Rule 1: Any emergency answer → ED
    if has_emergency:
        return {
            "care_type": "ed",
            "urgency": "emergency",
            "message": "Call 000 or go to your nearest emergency department now.",
            "confidence": min(0.95, 0.7 + scores["emergency"] / 300),
            "reasoning": "; ".join(reasoning_parts) if reasoning_parts else "Emergency indicators detected.",
        }

    # Rule 2: High urgent score → urgent clinic
    if scores["urgent"] >= 100:
        return {
            "care_type": "clinic",
            "urgency": "urgent",
            "message": "Visit an urgent care clinic today — don't wait.",
            "confidence": min(0.9, 0.6 + scores["urgent"] / 200),
            "reasoning": "; ".join(reasoning_parts) if reasoning_parts else "Multiple concerning signs.",
        }

    # Rule 3: Some urgent signs → GP urgently
    if scores["urgent"] >= 50:
        return {
            "care_type": "gp",
            "urgency": "routine",
            "message": "See a GP today. Book the earliest available appointment.",
            "confidence": 0.75,
            "reasoning": "; ".join(reasoning_parts) if reasoning_parts else "Some concerning signs — GP should assess.",
        }

    # Rule 4: Mostly GP-level
    if scores["gp"] > scores["pharmacy"]:
        return {
            "care_type": "gp",
            "urgency": "routine",
            "message": "See a GP when convenient. Not an emergency but worth checking.",
            "confidence": 0.8,
            "reasoning": "Symptoms suggest GP-level care.",
        }

    # Rule 5: Pharmacy-level
    return {
        "care_type": "pharmacy",
        "urgency": "low",
        "message": "A pharmacist can help with this — no appointment needed.",
        "confidence": 0.85,
        "reasoning": "Mild symptoms — pharmacy advice should be sufficient.",
    }
