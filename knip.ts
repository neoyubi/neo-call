/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { type KnipConfig } from "knip";

export default {
  vite: {
    config: [
      "vite.config.ts",
      "vite-embedded.config.ts",
      "vite-sdk.config.ts",
      "vite-sdk-dev.config.ts",
      "vite-sdk-target-based-on-call-view-model.config.ts",
      "vite-component.config.ts",
      "vite-component-dev.config.ts",
    ],
  },
  entry: [
    "src/main.tsx",
    "eslint/index.js",
    "i18next.config.ts",
    // Upstream screens this fork does not route to (accounts are provisioned,
    // feedback does not go to a rageshake server). Kept as they are so that
    // upstream changes to them still merge cleanly.
    "src/auth/RegisterPage.tsx",
    "src/settings/FeedbackSettingsTab.tsx",
  ],
  // The backend services are standalone Node programs with their own entry
  // points and their own images; they are not part of this package.
  ignore: ["services/**"],
  ignoreBinaries: [
    // This is deprecated, so Knip doesn't actually recognize it as a globally
    // installed binary. TODO We should switch to Compose v2:
    // https://docs.docker.com/compose/migrate/
    "docker-compose",
    // This is a shell built-in.
    "printf",
  ],
  ignoreFiles: [
    "scripts/.pnpmfile.cjs",
    // Deliberately added prior to any component or business logic
    // implementation
    "src/state/ServiceInterruptionsViewModel.ts",
  ],
  ignoreDependencies: [
    // Used in CSS
    "normalize.css",
    // Used for its global type declarations
    "@types/grecaptcha",
    "@types/sdp-transform",
    // We obviously use this, but if the package has been linked with pnpm link,
    // then Knip will flag it as a false positive
    // https://github.com/webpro-nl/knip/issues/766
    "@vector-im/compound-web",
    "matrix-widget-api",
    // Used by oxlint
    "eslint-plugin-element-call",
    "eslint-plugin-storybook",
  ],
  ignoreExportsUsedInFile: true,
} satisfies KnipConfig;
