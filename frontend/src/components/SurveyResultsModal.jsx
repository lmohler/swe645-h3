// Author: Lucas Mohler
// Confirmation dialog shown right after a survey is successfully saved to
// the backend, recapping every field that was submitted. Mirrors the
// results modal from the HW2 static survey.html, adapted to the fields
// this assignment actually persists (no raffle/comments sections).
import { useEffect, useRef } from "react";

import { LIKED_MOST_OPTIONS, LIKELIHOOD_OPTIONS, REFERRAL_OPTIONS, labelFor } from "../options.js";

export default function SurveyResultsModal({ survey, onClose, onViewSurveys }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const personalRows = [
    ["First Name", survey.first_name],
    ["Last Name", survey.last_name],
    ["Street Address", survey.street_address],
    ["City", survey.city],
    ["State", survey.state],
    ["ZIP Code", survey.zip_code],
    ["Telephone", survey.phone],
    ["Email", survey.email],
    ["Survey Date", survey.survey_date],
  ];

  return (
    <dialog ref={dialogRef} onClose={onClose}>
      <div className="modal-header">
        <h3 className="modal-title-success">
          <i className="fa-solid fa-circle-check icon-gap" aria-hidden="true"></i>
          Survey Submitted!
        </h3>
        <button
          type="button"
          className="modal-close"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      <div className="modal-body">
        <div className="results-section">
          <h4>Personal Information</h4>
          <table className="results-table">
            <tbody>
              {personalRows.map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="results-section">
          <h4>Campus Impressions</h4>
          {survey.liked_most.length > 0 ? (
            <div className="tag-list">
              {survey.liked_most.map((v) => (
                <span key={v} className="tag">
                  {labelFor(LIKED_MOST_OPTIONS, v)}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">None selected</p>
          )}
        </div>
        <div className="results-section">
          <h4>How They Heard About Us</h4>
          <p className="muted">{labelFor(REFERRAL_OPTIONS, survey.referral_source)}</p>
        </div>
        <div className="results-section">
          <h4>Likelihood to Recommend</h4>
          <p className="muted">{labelFor(LIKELIHOOD_OPTIONS, survey.recommend_likelihood)}</p>
        </div>
      </div>
      <div className="modal-footer">
        {onViewSurveys && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onViewSurveys();
              dialogRef.current?.close();
            }}
          >
            <i className="fa-solid fa-list icon-gap" aria-hidden="true"></i>
            View All Surveys
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={() => dialogRef.current?.close()}>
          Close
        </button>
      </div>
    </dialog>
  );
}
