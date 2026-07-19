# Author: Lucas Mohler
# REST API routes implementing CRUD operations over student survey
# records, backed by the Survey SQLModel table via a per-request session.
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Survey
from ..schemas import SurveyCreate, SurveyRead, SurveyUpdate

router = APIRouter(prefix="/api/surveys", tags=["surveys"])


def _to_read(survey: Survey) -> SurveyRead:
    data = survey.model_dump()
    data["liked_most"] = [v for v in survey.liked_most.split(",") if v]
    return SurveyRead(**data)


def _payload_to_row_fields(payload: SurveyCreate | SurveyUpdate) -> dict:
    data = payload.model_dump()
    data["liked_most"] = ",".join(payload.liked_most)
    return data


@router.post("", response_model=SurveyRead, status_code=status.HTTP_201_CREATED)
def create_survey(payload: SurveyCreate, session: Session = Depends(get_session)) -> SurveyRead:
    survey = Survey(**_payload_to_row_fields(payload))
    session.add(survey)
    session.commit()
    session.refresh(survey)
    return _to_read(survey)


@router.get("", response_model=List[SurveyRead])
def list_surveys(session: Session = Depends(get_session)) -> List[SurveyRead]:
    surveys = session.exec(select(Survey).order_by(Survey.id)).all()
    return [_to_read(s) for s in surveys]


@router.get("/{survey_id}", response_model=SurveyRead)
def get_survey(survey_id: int, session: Session = Depends(get_session)) -> SurveyRead:
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return _to_read(survey)


@router.put("/{survey_id}", response_model=SurveyRead)
def update_survey(
    survey_id: int, payload: SurveyUpdate, session: Session = Depends(get_session)
) -> SurveyRead:
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    for key, value in _payload_to_row_fields(payload).items():
        setattr(survey, key, value)

    session.add(survey)
    session.commit()
    session.refresh(survey)
    return _to_read(survey)


@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_survey(survey_id: int, session: Session = Depends(get_session)) -> None:
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    session.delete(survey)
    session.commit()
