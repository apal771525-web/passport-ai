# Route-specific output presets

This layer is deliberately conservative: a preset exists only when the linked official route publishes digital pixel and file-format limits.

## Current automatic preset

- United States — digital visa photo: square JPEG, 600–1,200 pixels per side, maximum 240 KB. The UI starts at 600 × 600 pixels and validates the square/range constraint. Download compression steps JPEG quality down only as needed; if the result still exceeds 240 KB, the download is refused rather than silently violating the limit.
- The exact visa category and application workflow may add requirements. This preset is not an acceptance guarantee.

## Routes without automatic pixel presets

- India child-under-4, United Kingdom printed passport, Canada printed passport, Australia printed passport: published dimensions are physical millimetres. The app does not convert these to pixels without a selected DPI.
- United States paper passport, United States online passport renewal, United Kingdom digital passport, Canada online renewal, and India PSK/POPSK adult route: edited official export remains blocked by the document-rules safety policy.
- Other and unknown routes receive no inferred preset.

## Validation

`getOutputPreset(country, route)` returns a preset only for an exact supported route. `validateOutputDimensions(width, height, preset)` checks integer dimensions, allowed ranges and aspect ratio. A null preset does not claim official compliance; it preserves user-defined custom sizing.

The browser performs JPEG encoding locally. No image is sent to the PassportAI backend by this feature. This layer does not add DPI metadata, print-sheet generation, image retouching, background replacement, or official acceptance checks.