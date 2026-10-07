"""Offline tests for the rule-based triage engine and ranker helpers.

The emergency cases are the important ones: a miss sends someone to a GP
when they should call 000.
"""

import pytest

from ranker import haversine_km
from triage import triage


@pytest.mark.parametrize(
    "symptoms",
    [
        "I have chest pain",
        "my baby has a fever and is having a seizure",
        "worst headache of my life",
        "sudden severe headache",
        "toddler turning blue",
        "took an overdose",
        "fever, rash and a stiff neck",
        "hit his head and now he's vomiting",
    ],
)
def test_red_flags_route_to_emergency(symptoms):
    result = triage(symptoms)
    assert result["care_type"] == "ed"
    assert result["urgency"] == "emergency"
    assert "000" in result["message"]


def test_young_infant_with_fever_escalates_to_emergency():
    assert triage("my 3 month old has a fever")["urgency"] == "emergency"


@pytest.mark.parametrize(
    ("symptoms", "care_type"),
    [
        ("sprained my ankle", "clinic"),
        ("burning when i pee and fever", "clinic"),
        ("I have a cough and fever", "gp"),
        ("runny nose", "pharmacy"),
    ],
)
def test_non_emergency_routing(symptoms, care_type):
    assert triage(symptoms)["care_type"] == care_type


def test_empty_input_defaults_to_gp():
    assert triage("   ")["care_type"] == "gp"


def test_haversine_sydney_to_melbourne_is_about_713_km():
    assert haversine_km(-33.8688, 151.2093, -37.8136, 144.9631) == pytest.approx(713, abs=5)
