"use client";

import Link from "next/link";
import { useState } from "react";

const validateForm = ({ mode, values }) => {
  const errors = {};

  if (mode === "signup" && !values.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  if (mode === "signup") {
    if (!values.confirmPassword) {
      errors.confirmPassword = "Confirm your password.";
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
};

export default function AuthForm({
  mode,
  title,
  subtitle,
  submitLabel,
  alternateText,
  alternateHref,
  alternateLabel,
  onSubmit,
}) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
    setApiError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");

    const nextErrors = validateForm({ mode, values });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      const payload =
        mode === "signup"
          ? {
              name: values.name.trim(),
              email: values.email.trim(),
              password: values.password,
            }
          : {
              email: values.email.trim(),
              password: values.password,
            };

      const response = await onSubmit(payload);
      setApiError("");
      setSuccessMessage(response.message);
    } catch (error) {
      setApiError(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-copy">
        <Link className="auth-home-link" href="/">
          Back to landing page
        </Link>
        <p className="eyebrow">{mode === "signup" ? "Create account" : "Welcome back"}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label>
            <span>Name</span>
            <input name="name" type="text" value={values.name} onChange={handleChange} />
            {errors.name ? <small className="field-error">{errors.name}</small> : null}
          </label>
        ) : null}

        <label>
          <span>Email</span>
          <input name="email" type="email" value={values.email} onChange={handleChange} />
          {errors.email ? <small className="field-error">{errors.email}</small> : null}
        </label>

        <label>
          <span>Password</span>
          <input name="password" type="password" value={values.password} onChange={handleChange} />
          {errors.password ? <small className="field-error">{errors.password}</small> : null}
        </label>

        {mode === "signup" ? (
          <label>
            <span>Confirm password</span>
            <input
              name="confirmPassword"
              type="password"
              value={values.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword ? (
              <small className="field-error">{errors.confirmPassword}</small>
            ) : null}
          </label>
        ) : null}

        {apiError ? <div className="banner error-banner">{apiError}</div> : null}
        {successMessage ? <div className="banner success-banner">{successMessage}</div> : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : submitLabel}
        </button>
      </form>

      <p className="auth-switch">
        {alternateText} <Link href={alternateHref}>{alternateLabel}</Link>
      </p>
    </div>
  );
}
