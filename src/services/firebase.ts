import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  runTransaction,
  push,
  serverTimestamp,
} from 'firebase/database';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';

// IMPORTANT:
// We use your existing Realtime Database:
//   https://silagan-crud-default-rtdb.firebaseio.com/parking-management
// The `databaseURL` should be the root of the RTDB (without the /parking-management suffix).
// Under that, we will store everything under the top-level node "parking-management".
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  databaseURL: 'https://silagan-crud-default-rtdb.firebaseio.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Make sure we only initialize the app once (important for web/Expo web).
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Root of the RTDB
const db = getDatabase(app);
// Firebase Storage
const storage = getStorage(app);

export type ParkingAction = 'park' | 'leave';

export type ParkingPayload = {
  slotId: string;
  category: 'Motorcycle' | 'Car';
  vehicleId: string;
  plate: string;
  contact: string;
  // Optionally, you can plug your real authenticated user id here
  userId?: string;
  // User's full name from mobile app profile
  userName?: string;
  // User's profile image URL from Firebase Storage
  userImageUrl?: string;
};

/**
 * Single entry point used by the mobile app when a QR code is scanned.
 * Data model in your Realtime Database (RTDB):
 *
 * parking-management/
 *   slots/
 *     {slotId} : {
 *       slotId,
 *       category,
 *       occupied,
 *       vehicleId,
 *       plate,
 *       contact,
 *       userId,
 *       timeIn
 *     }
 *   logs/
 *     {autoId} : {
 *       slotId,
 *       category,
 *       vehicleId,
 *       plate,
 *       contact,
 *       userId,
 *       status: "PARKED" | "EXITED",
 *       timeIn,
 *       timeOut,
 *       createdAt
 *     }
 */
export async function performParkingAction(
  action: ParkingAction,
  payload: ParkingPayload,
) {
  const { slotId, category, vehicleId, plate, contact, userId, userName, userImageUrl } = payload;

  const slotRef = ref(db, `parking-management/slots/${slotId}`);
  const logsRef = ref(db, 'parking-management/logs');

  await runTransaction(slotRef, (current) => {
    const now = serverTimestamp();
    const existing =
      (current as {
        occupied?: boolean;
        vehicleId?: string;
        plate?: string;
        contact?: string;
        userId?: string;
        userName?: string;
        userImageUrl?: string;
        timeIn?: any;
      }) || {};

    if (action === 'park') {
      if (existing.occupied) {
        throw new Error(`Slot ${slotId} is already occupied.`);
      }

      // Write the new slot state
      const next = {
        slotId,
        category,
        occupied: true,
        vehicleId,
        plate,
        contact,
        userId: userId ?? null,
        userName: userName ?? null,
        userImageUrl: userImageUrl ?? null,
        timeIn: now,
      };

      // Also append a log entry
      push(logsRef, {
        slotId,
        category,
        vehicleId,
        plate,
        contact,
        userId: userId ?? null,
        userName: userName ?? null,
        userImageUrl: userImageUrl ?? null,
        status: 'PARKED',
        timeIn: now,
        timeOut: null,
        createdAt: now,
      });

      return next;
    }

    // action === 'leave'
    const next = {
      slotId,
      category,
      occupied: false,
      vehicleId: null,
      plate: null,
      contact: null,
      userId: null,
      timeIn: null,
    };

    // Add EXIT log, reusing existing details if present
    push(logsRef, {
      slotId,
      category,
      vehicleId: existing.vehicleId ?? vehicleId,
      plate: existing.plate ?? plate,
      contact: existing.contact ?? contact,
      userId: existing.userId ?? userId ?? null,
      userName: existing.userName ?? userName ?? null,
      userImageUrl: existing.userImageUrl ?? userImageUrl ?? null,
      status: 'EXITED',
      timeIn: existing.timeIn ?? null,
      timeOut: now,
      createdAt: now,
    });

    return next;
  });
}

/**
 * Uploads a profile image to Firebase Storage and returns the download URL
 */
export async function uploadProfileImage(
  localUri: string,
  userId: string,
): Promise<string> {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64' as any,
    });

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `profile-images/${userId}_${timestamp}.jpg`;
    const imageRef = storageRef(storage, filename);

    // Convert base64 to data URL format
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    // Upload the image
    await uploadString(imageRef, dataUrl, 'data_url');

    // Get the download URL
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
}


