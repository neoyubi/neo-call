/*
Copyright 2022-2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { ClientEvent, Preset, Visibility } from "matrix-js-sdk";
import { logger } from "matrix-js-sdk/lib/logger";

import type { MatrixClient, Room } from "matrix-js-sdk";
import { generateUrlSearchParams } from "../UrlParams";
import { Config } from "../config/Config";
import { E2eeType } from "../e2ee/e2eeType";
import {
  type EncryptionSystem,
  saveKeyForRoom,
  saveKeyMaterialForAlias,
} from "../e2ee/sharedKeyManagement";
import {
  ROOM_CODE_CHARS,
  generateKeyMaterial,
  deriveSharedKey,
  formatRotatingCode,
} from "../e2ee/deriveKeyFromCode";

// Shared with the component, which reaches this module for the room URLs. So
// nothing in here may import the client store worker: the bundler emits the
// worker file on loading the import, used or not. The one function that needs
// it, `initClient`, lives in `./initClient` for that reason.

export const fallbackICEServerAllowed =
  import.meta.env.VITE_FALLBACK_STUN_ALLOWED === "true";

export function roomAliasLocalpartFromRoomName(roomName: string): string {
  return roomName
    .trim()
    .replace(/\s/g, "-")
    .replace(/[^\w-]/g, "")
    .toLowerCase();
}

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

/**
 * Applies some basic sanitisation to a room name that the user
 * has given us
 * @param input The room name from the user
 */
export function sanitiseRoomNameInput(input: string): string {
  // check to see if the user has entered a fully qualified room
  // alias. If so, turn it into just the localpart because that's what
  // we use
  const parts = input.split(":", 2);
  if (parts.length === 2 && parts[0][0] === "#") {
    // looks like a room alias
    if (parts[1] === Config.defaultServerName()) {
      // it's local to our own homeserver
      return parts[0];
    } else {
      throw new Error("Unsupported remote room alias");
    }
  }

  // that's all we do here right now
  return input;
}

interface CreateRoomResult {
  roomId: string;
  alias?: string;
  password?: string;
  roomCode: string;
  extendedCode?: string;
  keyMaterial?: string;
}

/**
 * Create a new room ready for calls
 *
 * @param client Matrix client to use
 * @param name The name of the room
 * @param e2ee The type of e2ee call to create. Note that we would currently never
 *             create a room for per-participant e2ee calls: since it's used in
 *             embedded mode, we use the existing room.
 * @returns Object holding information about the new room
 */
export async function createRoom(
  client: MatrixClient,
  name: string,
  e2ee: E2eeType,
): Promise<CreateRoomResult> {
  logger.log(`Creating room for group call`);

  let roomCode = "";
  let createResult: { room_id: string } | undefined;

  for (let attempt = 0; attempt < 5; attempt++) {
    roomCode = generateRoomCode();
    try {
      createResult = await client.createRoom({
        visibility: Visibility.Private,
        preset: Preset.PublicChat,
        name,
        room_alias_name: roomCode,
        initial_state: [
          {
            type: "m.room.join_rules",
            state_key: "",
            content: { join_rule: "knock" },
          },
        ],
        power_level_content_override: {
          invite: 100,
          kick: 100,
          ban: 100,
          redact: 50,
          state_default: 0,
          events_default: 0,
          users_default: 0,
          events: {
            "m.room.power_levels": 100,
            "m.room.history_visibility": 100,
            "m.room.tombstone": 100,
            "m.room.encryption": 100,
            "m.room.join_rules": 100,
            "m.room.name": 50,
            "m.room.message": 0,
            "m.room.encrypted": 50,
            "m.sticker": 50,
            "org.matrix.msc3401.call.member": 0,
          },
        },
      });
      break;
    } catch (e: unknown) {
      const matrixErr = e as { errcode?: string };
      if (matrixErr.errcode === "M_ROOM_IN_USE" && attempt < 4) continue;
      throw e;
    }
  }

  // Wait for the room to arrive via sync
  const targetRoomId = createResult!.room_id;
  const roomId = await new Promise<string>((resolve) => {
    // Check if the room is already known
    const existingRoom = client.getRoom(targetRoomId);
    if (existingRoom) {
      resolve(targetRoomId);
      return;
    }

    const onRoom = (room: Room): void => {
      if (room.roomId === targetRoomId) {
        client.off(ClientEvent.Room, onRoom);
        resolve(targetRoomId);
      }
    };
    client.on(ClientEvent.Room, onRoom);
  });

  const alias = `#${roomCode}:${client.getDomain()}`;

  let password: string | undefined;
  let extendedCode: string | undefined;
  let keyMat: string | undefined;
  if (e2ee == E2eeType.SHARED_KEY) {
    keyMat = generateKeyMaterial();
    password = await deriveSharedKey(keyMat, alias);
    saveKeyForRoom(roomId, password);
    saveKeyMaterialForAlias(alias, keyMat);
    extendedCode = formatRotatingCode(roomCode, keyMat);
  }

  return {
    roomId,
    alias,
    password,
    roomCode,
    extendedCode,
    keyMaterial: keyMat,
  };
}

/**
 * Returns an absolute URL to that will load Element Call with the given room
 * @param roomId ID of the room
 * @param encryptionSystem what encryption (or EncryptionSystem.Unencrypted) the room uses
 * @param roomNameOrCode Room name (kebab-cased) or 4-letter room code
 * @param viaServers Optional list of servers to include as 'via' parameters in the URL
 */
export function getAbsoluteRoomUrl(
  roomId: string,
  encryptionSystem: EncryptionSystem,
  roomNameOrCode?: string,
  viaServers?: string[],
): string {
  return `${window.location.protocol}//${
    window.location.host
  }${getRelativeRoomUrl(roomId, encryptionSystem, roomNameOrCode, viaServers)}`;
}

/**
 * Returns a relative URL to that will load Element Call with the given room
 * @param roomId ID of the room
 * @param encryptionSystem what encryption (or EncryptionSystem.Unencrypted) the room uses
 * @param roomNameOrCode Room name (kebab-cased) or 4-letter room code
 * @param viaServers Optional list of servers to include as 'via' parameters in the URL
 */
export function getRelativeRoomUrl(
  roomId: string,
  encryptionSystem: EncryptionSystem,
  roomNameOrCode?: string,
  viaServers?: string[],
): string {
  // If it looks like a 4-letter room code (all uppercase letters), use it directly
  const isRoomCode = roomNameOrCode && /^[A-Z]{4,16}$/.test(roomNameOrCode);
  // For room codes, use only the first 4 chars (alias portion) in the URL path
  const roomPart = roomNameOrCode
    ? "/" +
      (isRoomCode
        ? roomNameOrCode.slice(0, 4)
        : roomAliasLocalpartFromRoomName(roomNameOrCode))
    : "";
  return `/room/#${roomPart}?${generateUrlSearchParams(roomId, encryptionSystem, viaServers).toString()}`;
}
