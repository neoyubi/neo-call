/*
Copyright 2022-2024 New Vector Ltd.
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { MatrixRTCMode } from "@element-hq/matrixrtc-sdk";

export { MatrixRTCMode };

export interface DelayedLeaveTimings {
  /**
   * The delay (in milliseconds) with which delayed leave events are sent.
   *
   * If the server receives no keep-alives from the client for any longer than
   * this duration, it will send the leave event, automatically removing the
   * user from the call.
   */
  delay_ms?: number;

  /**
   * How frequently (in milliseconds) the client sends keep-alives to the server
   * to restart the timer for a delayed leave event. Should be less than
   * {@link DelayedLeaveTimings.delay_ms}.
   */
  restart_ms?: number;

  /**
   * The time (in milliseconds) after which we consider a delayed event restart HTTP request to have failed.
   * Setting this to a lower value will result in more frequent retries, but then we will also give up earlier.
   *
   * In the presence of network packet loss (hurting TCP connections), the custom delayedEventRestartLocalTimeoutMs
   * helps by keeping more delayed event reset candidates in flight,
   * improving the chances of a successful reset. (its is equivalent to the js-sdk `localTimeout` configuration,
   * but only applies to calls to the `_unstable_updateDelayedEvent` endpoint with a body of `{action:"restart"}`.)
   */
  restart_timeout_ms?: number;
}
/** Order the day, month and year are typed in. */
export type DateOrder = "dmy" | "mdy" | "ymd";

/** Day a week starts on; "auto" follows the runtime's locale data. */
export type FirstDayOfWeek =
  | "auto"
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface ConfigOptions {
  /**
   * The Posthog endpoint to which analytics data will be sent.
   * This is only used in the full package of Element Call.
   */
  posthog?: {
    api_key: string;
    api_host: string;
  };

  /**
   * The Sentry endpoint to which crash data will be sent.
   * This is only used in the full package of Element Call.
   */
  sentry?: {
    DSN: string;
    environment: string;
  };

  /**
   * The rageshake server to which feedback and debug logs will be sent.
   * This is only used in the full package of Element Call.
   */
  rageshake?: {
    submit_url: string;
  };

  /**
   * Sets the URL to send opentelemetry data to. If unset, opentelemetry will
   * be disabled. This is only used in the full package of Element Call.
   */
  opentelemetry?: {
    collector_url: string;
  };

  // Describes the default homeserver to use. The same format as Element Web
  // (without identity servers as we don't use them).
  default_server_config?: {
    ["m.homeserver"]: {
      base_url: string;
      server_name: string;
    };
  };

  /**
   * Describes the LiveKit configuration to be used.
   */
  livekit?: {
    /**
     * The link to the service that returns a livekit url and token to use it.
     * This is a fallback link in case the homeserver in use does not advertise
     * a livekit service url over the transports endpoint.
     *
     * @deprecated Homeservers should advertise available transports over the
     *   /_matrix/client/unstable/org.matrix.msc4143/rtc/transports endpoint
     *   instead.
     */
    livekit_service_url: string;
  };

  /**
   * TEMPORARY experimental features.
   */
  features?: {
    /**
     * Allow to join group calls without audio and video.
     */
    feature_group_calls_without_video_and_audio?: boolean;
  };

  /**
   * A link to the software and services license agreement (SSLA)
   */
  ssla?: string;

  /**
   * Media quality settings for video and screen sharing.
   * These override the hardcoded LiveKit defaults.
   */
  media_quality?: {
    /**
     * Video codec preference. The server must also have the codec enabled.
     * @default "vp8"
     */
    video_codec?: "vp8" | "vp9" | "h264" | "av1";

    /**
     * Camera video settings.
     */
    video?: {
      /** Max resolution height in pixels (e.g. 720, 1080, 1440). @default 720 */
      max_resolution?: number;
      /** Max bitrate in bits per second. @default 1700000 */
      max_bitrate?: number;
      /** Max framerate. @default 30 */
      max_framerate?: number;
      /**
       * Simulcast layers as an array of {height, bitrate} objects,
       * ordered from lowest to highest quality.
       * @default [{height: 180, bitrate: 160000}, {height: 360, bitrate: 450000}]
       */
      simulcast_layers?: Array<{
        height: number;
        bitrate: number;
      }>;
    };

    /**
     * Screen share settings.
     */
    screen_share?: {
      /** Max resolution height in pixels. @default 1080 */
      max_resolution?: number;
      /** Max bitrate in bits per second. @default 5000000 */
      max_bitrate?: number;
      /** Max framerate. @default 30 */
      max_framerate?: number;
      /**
       * Simulcast layers for screen sharing as an array of {height, bitrate, framerate} objects,
       * ordered from lowest to highest quality. If omitted, LiveKit SDK defaults apply (1 extra
       * layer at half resolution).
       */
      simulcast_layers?: Array<{
        height: number;
        bitrate: number;
        framerate?: number;
      }>;
    };
  };

  media_devices?: {
    /**
     * Defines whether participants should start with audio enabled by default.
     */
    enable_audio?: boolean;

    /**
     * Defines whether participants should start with video enabled by default.
     */
    enable_video?: boolean;
  };

  /**
   * Grace period in milliseconds to wait before reporting the sync loop as disconnected.
   * This allows brief sync interruptions without triggering a reconnection message.
   * Default is 10000ms (10 seconds). Set to 0 to disable the grace period.
   */
  sync_disconnect_grace_period_ms?: number;

  /**
   * Pins the {@link MatrixRTCMode} for all clients on this deployment,
   * overriding any per-user choice from the Developer Settings. If unset,
   * the user's Developer Settings choice (or its default of `Compatibility`)
   * wins.
   */
  matrix_rtc_mode?: MatrixRTCMode;

  /**
   * URL of the registration proxy service for guest account creation.
   * When set, guest registration bypasses UIA and uses the server-side
   * proxy instead, which signs requests with a shared secret that never
   * leaves the server.
   */
  guest_registration_url?: string;

  /**
   * Base URL of the scheduling admin API. When set together with
   * schedulers_room_id, authorized users can schedule meetings from the
   * home page. The browser authorizes with the user's own access token;
   * no service credential is ever shipped to the client.
   */
  admin_api_url?: string;

  /**
   * Matrix room id whose joined members are allowed to schedule meetings.
   * The scheduling form is only shown to users who are joined to this room.
   */
  schedulers_room_id?: string;

  /**
   * Defaults for the scheduling form and the calendar views. The block and
   * each field in it are optional; anything left out falls back to
   * CALENDAR_DEFAULTS.
   */
  calendar?: {
    /**
     * IANA time zone recorded with a meeting when the browser does not report
     * one of its own.
     */
    default_timezone?: string;
    /** Meeting lengths offered, in minutes. */
    duration_options?: number[];
    /** Meeting length preselected in the scheduling form, in minutes. */
    default_duration_minutes?: number;
    /** Reminder lead times offered, in minutes. */
    reminder_options?: number[];
    /** Reminder lead time preselected in the scheduling form, in minutes. */
    default_reminder_minutes?: number;
    /** Day the week starts on in the calendar grids. */
    first_day_of_week?: FirstDayOfWeek;
    /**
     * Hours the time grid highlights as working time and scrolls to on
     * opening. The grid still renders the whole day, so a meeting outside
     * them is never hidden.
     */
    day_start_hour?: number;
    day_end_hour?: number;
    /**
     * Order the day, month and year are typed in, and the character written
     * between them. Native date inputs follow the browser's own locale and
     * ignore the page's, so a mixed fleet of workstations would otherwise ask
     * staff to type a different order on each machine.
     */
    date_input_order?: DateOrder;
    date_input_separator?: string;
    /**
     * Show times on a 24-hour clock. Entry is 24-hour either way, so turning
     * this off makes the app display a clock it does not accept.
     */
    time_display_24h?: boolean;
  };

  /**
   * Branding and identity configuration. All fields are optional so the
   * source ships with neutral defaults that fall back to upstream Element
   * Call's branding. Deployments override these values at runtime via
   * config.json without modifying source.
   */
  branding?: {
    /** Product name shown in titles, aria-labels, and log lines. */
    product_name?: string;
    /** URL of a logo asset to render on branded screens. */
    logo_url?: string;
    /** URL of the square logo mark shown in the in-call footer. */
    logo_mark_url?: string;
    /** URL of the wordmark shown next to the mark in the in-call footer. */
    logo_type_url?: string;
    /** Link target for the home-page CTA. */
    website_url?: string;
    /** URL to a privacy policy. The consent line is hidden when unset. */
    privacy_policy_url?: string;
    /** Anchor text for the license footer (e.g. operator name). */
    footer_text?: string;
    /** Anchor href for the license footer. */
    footer_url?: string;
    /** Public source code URL (AGPL §13 source offer). */
    source_code_url?: string;
    /** Matrix state event type for scheduled meeting metadata. */
    meeting_event_type?: string;
    /** Localpart prefix for the admin-api bot user. */
    bot_user_prefix?: string;
    /** Minutes before scheduled start to allow joining. Defaults to 5. */
    early_join_minutes?: number;
  };

  /**
   * These are low level options that are used to configure the MatrixRTC session.
   * Take care when changing these options.
   */
  matrix_rtc_session?: {
    /**
     * How long we wait before retrying after a network error on any of the requests.
     */
    network_error_retry_ms?: number;

    /**
     * The timeout (in milliseconds) after we joined the call, that our membership should expire
     * unless we have explicitly updated it.
     *
     * This is what goes into the m.rtc.member event expiry field and is typically set to a number of hours.
     */
    membership_event_expiry_ms?: number;

    /**
     * The number of participants in the session at which the media encryption key will no longer
     * be rotated.
     *
     * Rotating a key requires sending it to every participant device, so in large sessions the
     * cost of rotating on every join/leave becomes prohibitive. At this limit the current key is
     * kept and distributed to new joiners; no new keys are generated for joiners/leavers.
     *
     * Defaults to the js-sdk default (undefined). Which means that rotation will always happen.
     */
    key_rotation_participant_limit?: number;

    /**
     * Timing options for delayed leave events, which are used to remove a user
     * from a call when they lose connection.
     */
    delayed_leave?: DelayedLeaveTimings;

    /**
     * Timing options for delayed leave events, in cases where the ability to
     * send the event can be delegated to the SFU.
     *
     * We recommend setting {@link DelayedLeaveTimings.delay_ms} >>
     * {@link sync_disconnect_grace_period_ms} here.
     */
    delegated_delayed_leave?: DelayedLeaveTimings;
  };
}

/**
 * Fallbacks for the optional `calendar` block, applied at each read site.
 * They deliberately do not live in DEFAULT_CONFIG: that is deep-merged with
 * the deployment's config, which would splice a shorter option array into the
 * default one rather than replacing it.
 */
export const CALENDAR_DEFAULTS = {
  default_timezone: "UTC",
  date_input_order: "dmy" as DateOrder,
  date_input_separator: ".",
  time_display_24h: true,
  duration_options: [15, 30, 45, 60],
  default_duration_minutes: 30,
  reminder_options: [15, 30, 60, 120],
  default_reminder_minutes: 30,
  first_day_of_week: "auto",
  day_start_hour: 8,
  day_end_hour: 18,
} satisfies NonNullable<ConfigOptions["calendar"]>;
export interface ResolvedDelayedLeaveTimings extends DelayedLeaveTimings {
  delay_ms: number; // Required
}

// Overrides members from ConfigOptions that are always provided by the
// default config and are therefore non-optional.
export interface ResolvedConfigOptions extends ConfigOptions {
  sync_disconnect_grace_period_ms: number;
  ssla: string;
  media_quality: Required<
    Pick<NonNullable<ConfigOptions["media_quality"]>, "video_codec">
  > & {
    video: Required<
      Pick<
        NonNullable<NonNullable<ConfigOptions["media_quality"]>["video"]>,
        "max_resolution" | "max_bitrate" | "max_framerate"
      >
    >;
    screen_share: Required<
      Pick<
        NonNullable<
          NonNullable<ConfigOptions["media_quality"]>["screen_share"]
        >,
        "max_resolution" | "max_bitrate" | "max_framerate"
      >
    >;
  };
  matrix_rtc_session: ConfigOptions["matrix_rtc_session"] & {
    network_error_retry_ms: number;
    delayed_leave: ResolvedDelayedLeaveTimings;
    delegated_delayed_leave: ResolvedDelayedLeaveTimings;
  };
}

export const DEFAULT_CONFIG: ResolvedConfigOptions = {
  sync_disconnect_grace_period_ms: 10_000,
  ssla: "https://static.element.io/legal/element-software-and-services-license-agreement-uk-1.pdf",
  media_quality: {
    video_codec: "vp8",
    video: {
      max_resolution: 720,
      max_bitrate: 1_700_000,
      max_framerate: 30,
    },
    screen_share: {
      max_resolution: 1080,
      max_bitrate: 5_000_000,
      max_framerate: 30,
    },
  },
  matrix_rtc_session: {
    network_error_retry_ms: 1_000,
    delayed_leave: { delay_ms: 18_000, restart_ms: 4_000 },
    delegated_delayed_leave: { delay_ms: 3_600_000, restart_ms: 300_000 },
  },
};
