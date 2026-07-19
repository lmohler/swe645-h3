# Author: Lucas Mohler
# Request/response contracts for the survey API. Kept separate from
# models.py so the CSV-encoded liked_most storage detail never leaks
# into the JSON API, which always speaks in terms of a list of strings.
from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field

LikedMostOption = Literal[
    "students", "location", "campus", "atmosphere", "dorm_rooms", "sports"
]
ReferralSource = Literal["friends", "television", "internet", "other"]
RecommendLikelihood = Literal["very_likely", "likely", "unlikely"]


class SurveyBase(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    street_address: str = Field(min_length=1)
    city: str = Field(min_length=1)
    state: str = Field(min_length=1)
    zip_code: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    email: EmailStr
    survey_date: date
    liked_most: List[LikedMostOption] = Field(default_factory=list)
    referral_source: ReferralSource
    recommend_likelihood: RecommendLikelihood


class SurveyCreate(SurveyBase):
    pass


class SurveyUpdate(SurveyBase):
    pass


class SurveyRead(SurveyBase):
    id: int
    created_at: datetime
