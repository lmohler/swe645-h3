# Author: Lucas Mohler
# Defines the Survey SQLModel table used as both the ORM entity and the
# database schema for the student survey persistence layer.
from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Survey(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    first_name: str
    last_name: str
    street_address: str
    city: str
    state: str
    zip_code: str
    phone: str
    email: str
    survey_date: date

    # Comma-separated list of selected checkbox values, e.g. "students,sports".
    liked_most: str
    referral_source: str
    recommend_likelihood: str

    created_at: datetime = Field(default_factory=datetime.utcnow)
