// Author: Lucas Mohler
// Controlled form for creating a new survey or editing an existing one
// (the same component is reused for both, switched via the `initialValue`
// and `submitLabel` props). Validation errors surface in a dialog modal
// and invalid fields get a red border, mirroring the HW2 static form's UX.
import { useEffect, useRef, useState } from "react";

import { LIKED_MOST_OPTIONS, LIKELIHOOD_OPTIONS, REFERRAL_OPTIONS } from "../options.js";

const EMPTY_SURVEY = {
  first_name: "",
  last_name: "",
  street_address: "",
  city: "",
  state: "",
  zip_code: "",
  phone: "",
  email: "",
  survey_date: new Date().toISOString().split("T")[0],
  liked_most: [],
  referral_source: "",
  recommend_likelihood: "",
};

const REQUIRED_FIELDS = [
  ["first_name", "First Name"],
  ["last_name", "Last Name"],
  ["street_address", "Street Address"],
  ["city", "City"],
  ["state", "State"],
  ["zip_code", "ZIP Code"],
  ["phone", "Telephone Number"],
  ["email", "Email Address"],
  ["survey_date", "Date of Survey"],
];

const FIELD_LABELS = {
  ...Object.fromEntries(REQUIRED_FIELDS),
  referral_source: "How did you hear about us",
  recommend_likelihood: "Recommendation Likelihood",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SurveyForm({ initialValue, submitLabel, submitIcon, onSubmit, onCancel }) {
  const [survey, setSurvey] = useState(initialValue ?? EMPTY_SURVEY);
  const [invalidFields, setInvalidFields] = useState(new Set());
  const errorDialogRef = useRef(null);

  useEffect(() => {
    if (invalidFields.size > 0) {
      errorDialogRef.current?.showModal();
    }
  }, [invalidFields]);

  function updateField(field, value) {
    setSurvey((prev) => ({ ...prev, [field]: value }));
  }

  function toggleLikedMost(value) {
    setSurvey((prev) => {
      const has = prev.liked_most.includes(value);
      const liked_most = has
        ? prev.liked_most.filter((v) => v !== value)
        : [...prev.liked_most, value];
      return { ...prev, liked_most };
    });
  }

  function validate() {
    const invalid = new Set();
    REQUIRED_FIELDS.forEach(([field]) => {
      if (!survey[field]?.trim()) invalid.add(field);
    });
    if (survey.email && !EMAIL_PATTERN.test(survey.email)) invalid.add("email");
    if (!survey.referral_source) invalid.add("referral_source");
    if (!survey.recommend_likelihood) invalid.add("recommend_likelihood");
    return invalid;
  }

  function errorLabels() {
    return [...invalidFields].map((field) => {
      if (field === "email" && survey.email) return "Email Address (invalid format)";
      return FIELD_LABELS[field] ?? field;
    });
  }

  function fieldClass(field) {
    return invalidFields.has(field) ? "invalid" : undefined;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const invalid = validate();
    setInvalidFields(invalid);
    if (invalid.size > 0) return;

    onSubmit(survey);
    if (!initialValue) {
      setSurvey(EMPTY_SURVEY);
    }
  }

  return (
    <>
      <form className="survey-form" onSubmit={handleSubmit}>
        <section className="card">
          <h2>
            <i className="fa-solid fa-user icon-gap" aria-hidden="true"></i>
            Personal Information
          </h2>
          <div className="grid">
            <label>
              First Name <span className="req">*</span>
              <input
                className={fieldClass("first_name")}
                value={survey.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
              />
            </label>
            <label>
              Last Name <span className="req">*</span>
              <input
                className={fieldClass("last_name")}
                value={survey.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
              />
            </label>
            <label className="full-width">
              Street Address <span className="req">*</span>
              <input
                className={fieldClass("street_address")}
                value={survey.street_address}
                onChange={(e) => updateField("street_address", e.target.value)}
              />
            </label>
            <label>
              City <span className="req">*</span>
              <input
                className={fieldClass("city")}
                value={survey.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </label>
            <label>
              State <span className="req">*</span>
              <input
                className={fieldClass("state")}
                value={survey.state}
                onChange={(e) => updateField("state", e.target.value)}
              />
            </label>
            <label>
              ZIP Code <span className="req">*</span>
              <input
                className={fieldClass("zip_code")}
                value={survey.zip_code}
                onChange={(e) => updateField("zip_code", e.target.value)}
              />
            </label>
            <label>
              Telephone Number <span className="req">*</span>
              <input
                className={fieldClass("phone")}
                value={survey.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </label>
            <label>
              Email Address <span className="req">*</span>
              <input
                type="email"
                className={fieldClass("email")}
                value={survey.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </label>
            <label>
              Date of Survey <span className="req">*</span>
              <input
                type="date"
                className={fieldClass("survey_date")}
                value={survey.survey_date}
                onChange={(e) => updateField("survey_date", e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h2>
            <i className="fa-solid fa-building-columns icon-gap" aria-hidden="true"></i>
            Campus Impressions
          </h2>
          <p className="muted">What did you like most about the campus? (Select all that apply)</p>
          <div className="choice-group">
            {LIKED_MOST_OPTIONS.map((opt) => (
              <label key={opt.value}>
                <input
                  type="checkbox"
                  checked={survey.liked_most.includes(opt.value)}
                  onChange={() => toggleLikedMost(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>
            <i className="fa-solid fa-bullhorn icon-gap" aria-hidden="true"></i>
            How Did You Hear About Us?
          </h2>
          <div className="choice-group">
            {REFERRAL_OPTIONS.map((opt) => (
              <label key={opt.value}>
                <input
                  type="radio"
                  name="referral_source"
                  checked={survey.referral_source === opt.value}
                  onChange={() => updateField("referral_source", opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>
            <i className="fa-solid fa-thumbs-up icon-gap" aria-hidden="true"></i>
            Recommendation
          </h2>
          <label>
            How likely are you to recommend this school to other prospective students?
            <select
              className={fieldClass("recommend_likelihood")}
              value={survey.recommend_likelihood}
              onChange={(e) => updateField("recommend_likelihood", e.target.value)}
            >
              <option value="">-- Select an option --</option>
              {LIKELIHOOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div className="btn-row">
          <button type="submit" className="btn btn-primary">
            <i className={`fa-solid ${submitIcon ?? "fa-paper-plane"} icon-gap`} aria-hidden="true"></i>
            {submitLabel}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              <i className="fa-solid fa-xmark icon-gap" aria-hidden="true"></i>
              Cancel
            </button>
          )}
        </div>
      </form>

      <dialog ref={errorDialogRef}>
        <div className="modal-header">
          <h3 className="modal-title-error">
            <i className="fa-solid fa-circle-exclamation icon-gap" aria-hidden="true"></i>
            Please fix the following
          </h3>
          <button
            type="button"
            className="modal-close"
            onClick={() => errorDialogRef.current?.close()}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-lead">
            The fields below are required or contain invalid input. Please correct them and resubmit.
          </p>
          <ul className="error-list">
            {errorLabels().map((label) => (
              <li key={label}>
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => errorDialogRef.current?.close()}
          >
            Go Back &amp; Fix
          </button>
        </div>
      </dialog>
    </>
  );
}
