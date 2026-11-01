
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';

import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

import firebaseConfig from './firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Validate Firebase configuration
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'PLACEHOLDER_API_KEY' &&
  !firebaseConfig.apiKey.includes('PLACEHOLDER') &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain &&
  firebaseConfig.storageBucket
);

export const isFirebaseReady = isFirebaseConfigured;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    db = getFirestore(
      app,
      firebaseConfig.firestoreDatabaseId || '(default)'
    );

    auth = getAuth(app);

    storage = getStorage(app);

  } catch (error) {
    console.error('Firebase initialization failed:', error);

    // Do not silently switch to local storage in production.
    throw new Error(
      'Firebase initialization failed. Check your Firebase configuration.'
    );
  }
} else {
  console.error(
    'Firebase is not configured. Check firebase-applet-config.json.'
  );
}

export { app, db, auth, storage };

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentAuth = auth;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),

    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,

      providerInfo: currentAuth?.currentUser?.providerData?.map(
        provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })
      ) || [],
    },

    operationType,
    path,
  };

  console.error('Firestore Error:', errInfo);

  throw new Error(
    `Firestore operation failed: ${operationType} at ${path || 'unknown path'}`
  );
}
