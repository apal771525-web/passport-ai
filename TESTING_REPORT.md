# Automated Testing Report

## Status: NOT RUN / NOT VERIFIED

The `node --test` command was not executed by the agent against the current review-branch head. The GitHub Actions query returned no runs for `phase-1-review` and no verified test result is available for SHA `3e68b57f3c88598ae3007b20a5b83f92b0ebd41c`.

Therefore, total tests, passed tests, failures, and skipped tests are **unknown**. Any existing documentation claim that five tests passed is unverified and should not be relied on.

## Test source currently present
- `tests/phase1-review.test.js`
- Tests target the image-validation helper, route lookup/export policy, and backend-disabled status metadata.
- The helpers are not integrated into the HTML application.

## Required command
Run from the repository root with Node.js available:

```sh
node --test
```

Record the exact branch SHA and actual totals from the command output. Verify the CI run is for that same SHA before treating it as passing.

## Coverage gaps
- Browser application flows and route enforcement
- Actual photo signature/decode validation
- Stale export invalidation after file/route/control changes
- Export and print behavior
- PDF structure (the base UI has a print-window flow, not a verified PDF feature)
- Browser, device, accessibility, network, printer and government-acceptance validation

This report intentionally makes no claim that automated tests passed.
