# QA and Release Gate

A deployment or public release must not be considered ready until every applicable gate below has evidence tied to the exact commit.

## Automated

- Run `node --test`.
- Record exact commit SHA and real pass/fail/skip totals.
- Add CI and confirm its run is for that same SHA.
- Add tests for exact route IDs, blocked export routes and stale output invalidation.

## Manual browser/device QA

- Android Chrome and desktop Chrome.
- Upload, invalid file, large file, decode failure and network failure.
- Crop, zoom, positioning, reset and export.
- Country/document switching and warning consistency.
- JPG/PNG output dimensions and file sizes.
- Print sheet physical dimensions using a ruler.
- Keyboard navigation, screen-reader labels, contrast and focus states.

## Security and privacy

- Verify all network requests, including third-party scripts and model downloads.
- Confirm no image bytes or personal data enter logs.
- Review CSP, dependency integrity, XSS exposure and file handling.
- Do not enable authentication, storage or provider processing without separate review and approval.

## Release decision

Current status: **NOT READY / NOT VERIFIED**. No production deployment or release is authorized by this document.
