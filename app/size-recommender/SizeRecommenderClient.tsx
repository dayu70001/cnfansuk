"use client";

import { useState, type FormEvent } from "react";
import {
  SIZE_REFERENCE,
  isValidSizeInput,
  recommendSize,
  type PreferredFit,
  type SizeRecommendation,
} from "@/lib/sizeRecommender";

type FormValues = {
  height: string;
  weight: string;
  bodyChest: string;
  fit: PreferredFit | "";
};

const INITIAL_VALUES: FormValues = { height: "", weight: "", bodyChest: "", fit: "" };

function displayNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export function SizeRecommenderClient() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [result, setResult] = useState<SizeRecommendation | null>(null);
  const [error, setError] = useState("");

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setResult(null);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = {
      height: Number(values.height),
      weight: Number(values.weight),
      bodyChest: Number(values.bodyChest),
    };

    if (
      !values.height || !values.weight || !values.bodyChest || !values.fit ||
      !isValidSizeInput(parsed)
    ) {
      setResult(null);
      setError("Please check your measurement.");
      return;
    }

    setError("");
    setResult(recommendSize({ ...parsed, fit: values.fit }));
  }

  function handleReset() {
    setValues(INITIAL_VALUES);
    setResult(null);
    setError("");
  }

  function referenceFor(size: SizeRecommendation["size"]) {
    return SIZE_REFERENCE.find((row) => row.size === size)!;
  }

  return (
    <div className="size-recommender-tool">
      <form className="size-recommender-card" onSubmit={handleSubmit} noValidate>
        <div className="size-recommender-fields">
          <div className="size-recommender-field">
            <label htmlFor="size-height">Height <span>(cm)</span></label>
            <input
              id="size-height"
              name="height"
              type="number"
              min="140"
              max="210"
              step="any"
              inputMode="decimal"
              value={values.height}
              onChange={(event) => update("height", event.currentTarget.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="size-recommender-field">
            <label htmlFor="size-weight">Weight <span>(kg)</span></label>
            <input
              id="size-weight"
              name="weight"
              type="number"
              min="40"
              max="160"
              step="any"
              inputMode="decimal"
              value={values.weight}
              onChange={(event) => update("weight", event.currentTarget.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="size-recommender-field size-recommender-field-wide">
            <label htmlFor="size-body-chest">Body chest circumference <span>(cm)</span></label>
            <input
              id="size-body-chest"
              name="bodyChest"
              type="number"
              min="70"
              max="150"
              step="any"
              inputMode="decimal"
              value={values.bodyChest}
              onChange={(event) => update("bodyChest", event.currentTarget.value)}
              aria-describedby="size-chest-help"
              autoComplete="off"
              required
            />
            <p id="size-chest-help" className="size-recommender-help">
              Measure around the fullest part of your chest, keeping the tape level.
            </p>
            <details className="size-recommender-measure-help">
              <summary>How to measure</summary>
              <p>Keep the tape level around the fullest part of your chest without pulling it tight.</p>
            </details>
          </div>

          <fieldset className="size-recommender-fit size-recommender-field-wide">
            <legend>Preferred fit <span>(required)</span></legend>
            <div className="size-recommender-fit-options">
              {(["slim", "regular", "relaxed"] as const).map((fit) => (
                <label className="size-recommender-fit-option" key={fit}>
                  <input
                    type="radio"
                    name="preferredFit"
                    value={fit}
                    checked={values.fit === fit}
                    onChange={() => update("fit", fit)}
                    required
                  />
                  <span>{fit[0].toUpperCase() + fit.slice(1)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {error ? <p className="size-recommender-error" role="alert">{error}</p> : null}

        <div className="size-recommender-actions">
          <button className="btn btn-solid" type="submit">Get my size recommendation</button>
          <button className="size-recommender-reset" type="button" onClick={handleReset}>Reset</button>
        </div>
      </form>

      <section className="size-recommender-result" aria-live="polite" aria-atomic="true">
        {result ? (
          <div className="size-recommender-result-card">
            <div className="size-recommender-result-heading">
              <div>
                <p className="eyebrow">Suggested size</p>
                <p className="size-recommender-size">{result.size}</p>
              </div>
              <p className={`size-recommender-confidence ${result.confidence === "LOW" ? "is-low" : ""}`}>
                Fit confidence: <strong>{result.confidence}</strong>
              </p>
            </div>
            <p>{result.reason}</p>
            <dl className="size-recommender-measurements">
              <div><dt>Height</dt><dd>{displayNumber(Number(values.height))} cm</dd></div>
              <div><dt>Weight</dt><dd>{displayNumber(Number(values.weight))} kg</dd></div>
              <div><dt>Body chest</dt><dd>{displayNumber(Number(values.bodyChest))} cm</dd></div>
              <div><dt>Fit</dt><dd>{values.fit[0].toUpperCase() + values.fit.slice(1)}</dd></div>
              <div><dt>Target garment chest</dt><dd>{displayNumber(result.targetGarmentChest)} cm</dd></div>
              <div><dt>Reference size</dt><dd>{result.size}</dd></div>
              <div><dt>Chest-based size</dt><dd>{result.chestSize}</dd></div>
              <div><dt>Height reference</dt><dd>{result.heightReferenceSize}</dd></div>
              <div><dt>Weight reference</dt><dd>{result.weightReferenceSize}</dd></div>
            </dl>
            <div className="size-recommender-general-reference">
              <h3>General {result.size} reference</h3>
              <ul>
                <li>Garment chest: about {referenceFor(result.size).garmentChest} cm</li>
                <li>Flat chest: about {referenceFor(result.size).flatChest} cm</li>
                <li>Height: about {referenceFor(result.size).heightRange}</li>
                <li>Weight: about {referenceFor(result.size).weightRange}</li>
              </ul>
            </div>
            {result.warnings.map((warning) => <p className="size-recommender-warning" key={warning}>{warning}</p>)}
            <p className="size-recommender-style-note">
              <strong>Style can change the fit.</strong> Puffer jackets, down jackets, oversized styles and drop-shoulder pieces may measure larger than this general reference. Always check the individual product measurements when they are available.
            </p>
          </div>
        ) : (
          <p className="size-recommender-result-placeholder">
            Your measurements stay in this page while you use the tool. No recommendation is shown until all fields are complete.
          </p>
        )}
      </section>
    </div>
  );
}
