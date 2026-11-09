/**
 * Advisory-only document-photo quality policy.
 * Consumes normalized metrics from a trusted local analyzer; never identifies a person.
 */
const finite = (n) => typeof n === "number" && Number.isFinite(n);
const inUnit = (n) => finite(n) && n >= 0 && n <= 1;

export function evaluateFacePhotoQuality(analysis, options = {}) {
  const thresholds = {
    minFaceWidth: 0.20,
    maxFaceWidth: 0.70,
    maxCenterOffset: 0.12,
    minSharpness: 0.45,
    minBrightness: 0.30,
    maxBrightness: 0.82,
    maxClippingRatio: 0.08,
    minBackgroundUniformity: 0.75,
    ...options.thresholds,
  };
  const invalid = (reason) => ({
    status: "invalid_input",
    advisoryOnly: true,
    canCertifyOfficialCompliance: false,
    issues: [reason],
    suggestions: [],
  });
  if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) {
    return invalid("Analyzer result must be an object.");
  }
  if (!Number.isInteger(analysis.faceCount) || analysis.faceCount < 0 || analysis.faceCount > 20) {
    return invalid("faceCount must be an integer from 0 to 20.");
  }

  const metricKeys = ["sharpnessScore", "brightnessScore", "clippingRatio", "backgroundUniformityScore"];
  for (const key of metricKeys) {
    if (analysis[key] !== undefined && !inUnit(analysis[key])) {
      return invalid(key + " must be a number between 0 and 1.");
    }
  }

  const issues = [];
  const suggestions = [];
  if (analysis.faceCount === 0) {
    issues.push("no_face_detected");
    suggestions.push("Retake the photo with the full face clearly visible.");
  } else if (analysis.faceCount > 1) {
    issues.push("multiple_faces_detected");
    suggestions.push("Use a photo containing only the applicant, if the document rules require one person.");
  } else {
    const b = analysis.faceBox;
    if (!b || !["x", "y", "width", "height"].every((k) => finite(b[k])) ||
        b.x < 0 || b.y < 0 || b.width <= 0 || b.height <= 0 ||
        b.x + b.width > 1 || b.y + b.height > 1) {
      return invalid("A single detected face requires a valid normalized faceBox.");
    }
    const centerX = b.x + b.width / 2;
    const centerY = b.y + b.height / 2;
    const offset = Math.max(Math.abs(centerX - 0.5), Math.abs(centerY - 0.5));
    if (b.width < thresholds.minFaceWidth) {
      issues.push("face_may_be_too_small");
      suggestions.push("Move the camera closer while keeping the head and shoulders comfortably in frame.");
    }
    if (b.width > thresholds.maxFaceWidth) {
      issues.push("face_may_be_too_large");
      suggestions.push("Move the camera slightly farther away and leave more space around the head.");
    }
    if (offset > thresholds.maxCenterOffset) {
      issues.push("face_may_be_off_center");
      suggestions.push("Reposition the camera or applicant so the face is more centrally framed.");
    }
  }

  if (analysis.sharpnessScore === undefined) {
    issues.push("sharpness_not_assessed");
  } else if (analysis.sharpnessScore < thresholds.minSharpness) {
    issues.push("possible_blur");
    suggestions.push("Use steady lighting and hold the camera still; retake if the eyes are not crisp.");
  }
  if (analysis.brightnessScore === undefined) {
    issues.push("exposure_not_assessed");
  } else if (analysis.brightnessScore < thresholds.minBrightness) {
    issues.push("possibly_too_dark");
    suggestions.push("Use even, brighter lighting without harsh shadows.");
  } else if (analysis.brightnessScore > thresholds.maxBrightness) {
    issues.push("possibly_overexposed");
    suggestions.push("Reduce direct light and avoid washed-out facial details.");
  }
  if (analysis.clippingRatio !== undefined && analysis.clippingRatio > thresholds.maxClippingRatio) {
    issues.push("highlight_or_shadow_clipping");
    suggestions.push("Retake with more even exposure so facial details are not lost.");
  }
  if (analysis.backgroundUniformityScore === undefined) {
    issues.push("background_not_assessed");
  } else if (analysis.backgroundUniformityScore < thresholds.minBackgroundUniformity) {
    issues.push("background_may_be_uneven");
    suggestions.push("Use a plain, evenly lit background and avoid visible objects or shadows.");
  }

  return {
    status: issues.length ? "review_recommended" : "advisory_checks_passed",
    advisoryOnly: true,
    canCertifyOfficialCompliance: false,
    issues,
    suggestions,
  };
}
