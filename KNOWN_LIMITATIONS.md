# QA Release Gate

## Automated gate
- `node --test` must pass.
- The repository must remain on a review branch.
- No real secrets or external credentials may be added.

## Human QA gate
- Test on Android Chrome and desktop Chrome.
- Validate upload, crop and zoom behavior.
- Verify document route selection and warnings.
- Confirm PDF and print layout behavior on real devices.
- Check accessibility and keyboard operation.
- Confirm no third-party processing is enabled.

## Release decision
The current repository is not ready for production deployment or promotion. It remains in review only.
