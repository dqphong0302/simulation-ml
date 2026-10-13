# Local Teachable Machine runtime

This project uses the official `@teachablemachine/image` 0.8.5 browser distribution with its documented TensorFlow.js 1.3.1 peer version. They are vendored, not reimplemented. These are legacy pinned versions; review upstream compatibility and security before changing versions. No package-manager migration was performed.

`scripts/fetch-teachable-assets.mjs` downloads distributions, Apache-2.0 licenses and MobileNet v1 alpha 0.25 (224px) assets from official upstream sources. `provenance.json` records URLs, sizes and SHA-256 hashes. Bundles retain embedded license notices.

The runtime loads only when training starts. MobileNet's `conv_pw_13_relu` features are frozen; the official `createTeachable`, `setLabels`, `addExample`, `train` and `predict` APIs perform transfer learning locally. Runtime scripts and weights are served from this static website, not third-party CDNs. Training images are never uploaded by this implementation.

Sources:
- https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image
- https://github.com/tensorflow/tfjs
- https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json

The classroom UI is independently implemented; it is not the full Google Teachable Machine site. This version supports image upload and webcam snapshots, not audio or pose training.
