"""Rule-based medical triage engine for care routing.
Based on Australian Triage Scale (ATS) categories and healthdirect guidelines.
NOT a diagnostic tool — routes to care settings only."""

import re

# --- Keyword sets ---

_EMERGENCY_KEYWORDS = [
    "seizure", "seizures", "convulsion", "convulsions", "fitting", "fits",
    "unconscious", "unresponsive", "not breathing", "stopped breathing",
    "choking", "anaphylaxis", "anaphylactic", "severe allergic",
    "chest pain", "chest tightness", "heart attack", "cardiac arrest",
    "stroke", "face drooping", "slurred speech",
    "can't breathe", "cant breathe", "cannot breathe", "difficulty breathing",
    "struggling to breathe", "shortness of breath",
    "severe bleeding", "won't stop bleeding", "wont stop bleeding",
    "uncontrolled bleeding", "hemorrhage", "haemorrhage",
    "blue lips", "blue skin", "cyanosis", "turning blue",
    "meningitis", "meningococcal",
    "overdose", "poisoning", "ingested poison",
    "suicidal", "suicide", "self-harm", "self harm", "wants to die",
    "electric shock", "electrocution",
    "drowning", "near drowning",
    "snake bite", "snakebite", "spider bite",
    "severe burn", "large burn", "burns to face", "chemical burn",
]

_URGENT_CLINIC_KEYWORDS = [
    "sprain", "sprained", "twisted ankle", "twisted knee",
    "minor fracture", "possible broken", "possibly broken", "might be broken",
    "deep cut", "laceration", "needs stitches", "gash",
    "dislocated", "dislocation",
    "minor burn", "small burn",
    "abscess", "boil",
    "severe ear pain", "ear pain severe",
    "animal bite", "dog bite", "cat bite",
    "foreign object", "something in my eye", "something in my ear",
    "something in my nose", "object stuck",
]

_GP_KEYWORDS = [
    "fever", "temperature", "cough", "cold", "flu", "influenza",
    "rash", "ear infection", "earache", "ear pain",
    "sore throat", "throat pain", "tonsillitis",
    "vomiting", "throwing up", "nausea",
    "diarrhea", "diarrhoea", "stomach pain", "tummy pain",
    "skin infection", "infected wound", "cellulitis",
    "eye infection", "conjunctivitis", "pink eye",
    "back pain", "lower back", "joint pain", "knee pain", "shoulder pain",
    "headache", "migraine",
    "baby unsettled", "baby crying", "baby not feeding", "baby won't feed",
    "anxiety", "depression", "mental health", "feeling low", "panic attack",
    "chronic", "flare up", "flare-up",
    "follow up", "follow-up", "referral",
    "uti", "urinary", "burning when i pee", "burning urination",
]

_PHARMACY_KEYWORDS = [
    "mild cold", "runny nose", "sniffles", "blocked nose",
    "mild headache", "slight headache",
    "hay fever", "hayfever", "allergies", "seasonal allergy",
    "constipation", "constipated",
    "mild rash", "mild skin rash", "dry skin", "eczema mild",
    "sunburn", "mild sunburn",
    "insect bite", "mosquito bite", "bee sting",
    "vitamins", "supplements", "vitamin",
    "prescription refill", "repeat script", "repeat prescription",
    "over the counter", "otc",
    "panadol", "ibuprofen", "nurofen", "antihistamine",
]

# --- Combination rules (checked before single-keyword matching) ---

_CHILD_TERMS = re.compile(r"\b(child|baby|infant|toddler|newborn|neonate|kid|boy|girl|\d+\s*month|weeks?\s*old|months?\s*old)\b")

_COMBO_EMERGENCY = [
    # (all terms must be present, any from each sub-list)
    (["fever", "temperature"], ["seizure", "seizures", "convulsion", "fitting", "fits"]),
    (["fever", "temperature"], ["rash"], ["stiff neck", "neck stiffness", "neck is stiff"]),
    (["headache"], ["worst ever", "worst of my life", "thunderclap", "sudden severe"]),
    (["head injury", "hit head", "hit his head", "hit her head", "fell on head"],
     ["vomiting", "throwing up", "drowsy", "confused", "sleepy", "won't wake"]),
    (["baby", "infant", "newborn", "child", "toddler"],
     ["not breathing", "stopped breathing", "limp", "floppy", "blue", "turning blue", "unresponsive"]),
]

_COMBO_URGENT = [
    (["burning urination", "burning when i pee", "uti", "urinary"], ["fever", "temperature"]),
]


def _has_any(text: str, words: list[str]) -> bool:
    return any(w in text for w in words)


def _check_combos(text: str, combos: list[tuple]) -> bool:
    for combo in combos:
        if all(_has_any(text, group) for group in combo):
            return True
    return False


def triage(symptoms: str) -> dict:
    """Determine care type from symptom description.

    Returns a dict with keys: care_type, urgency, message.
    Always errs on the side of caution — if in doubt, escalates.
    """
    text = symptoms.lower().strip()

    if not text:
        return {
            "care_type": "gp",
            "urgency": "routine",
            "message": "See a GP for assessment.",
        }

    is_child = bool(_CHILD_TERMS.search(text))

    # --- EMERGENCY: combination rules first ---
    if _check_combos(text, _COMBO_EMERGENCY):
        return {
            "care_type": "ed",
            "urgency": "emergency",
            "message": "Call 000 or go to your nearest emergency department immediately.",
        }

    # --- EMERGENCY: single keywords ---
    if _has_any(text, _EMERGENCY_KEYWORDS):
        return {
            "care_type": "ed",
            "urgency": "emergency",
            "message": "Call 000 or go to your nearest emergency department immediately.",
        }

    # --- Child escalation: lower threshold ---
    if is_child:
        child_escalate = [
            "fever", "temperature", "high temp",
            "vomiting", "throwing up", "won't eat", "not eating", "not drinking",
            "limp", "floppy", "lethargic", "won't wake",
            "rash", "breathing fast", "wheezing", "croup",
        ]
        if _has_any(text, child_escalate):
            # Check if it's clearly minor — if not, escalate to at least urgent
            mild_child = ["mild", "slight", "little bit"]
            if not _has_any(text, mild_child):
                return {
                    "care_type": "ed",
                    "urgency": "emergency",
                    "message": "Call 000 or go to your nearest emergency department immediately.",
                }

    # --- URGENT CLINIC: combination rules ---
    if _check_combos(text, _COMBO_URGENT):
        return {
            "care_type": "clinic",
            "urgency": "urgent",
            "message": "Visit an urgent care clinic today.",
        }

    # --- URGENT CLINIC: single keywords ---
    if _has_any(text, _URGENT_CLINIC_KEYWORDS):
        return {
            "care_type": "clinic",
            "urgency": "urgent",
            "message": "Visit an urgent care clinic today.",
        }

    # --- PHARMACY: check before GP so specific mild terms match ---
    # But only if no GP-level keywords also present
    has_pharmacy = _has_any(text, _PHARMACY_KEYWORDS)
    has_gp = _has_any(text, _GP_KEYWORDS)

    if has_pharmacy and not has_gp:
        return {
            "care_type": "pharmacy",
            "urgency": "low",
            "message": "Visit a pharmacy — they can help with this.",
        }

    # --- GP ---
    if has_gp:
        return {
            "care_type": "gp",
            "urgency": "routine",
            "message": "See a GP today.",
        }

    if has_pharmacy:
        return {
            "care_type": "pharmacy",
            "urgency": "low",
            "message": "Visit a pharmacy — they can help with this.",
        }

    # --- Default: GP (safest non-emergency default) ---
    return {
        "care_type": "gp",
        "urgency": "routine",
        "message": "See a GP for assessment.",
    }
