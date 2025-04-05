import { db, auth } from '../../assets/firebase-config';

const USERS = 'users';
import { ref, set, get } from 'firebase/database';

export interface UserProfile {
  email: string;
  created: string;
  lastLogin: string;
  scans: {
    [key: string]: {
      location: string;
      base64: string;
      timestamp: string;
    }
  };
}

export async function createUserProfile(userId: string, email: string) {
  const userRef = ref(db, `${USERS}/${userId}`);
  const timestamp = new Date().toISOString();
  
  const newUser: UserProfile = {
    email: email,
    created: timestamp,
    lastLogin: timestamp,
    scans: {}
  };

  await set(userRef, newUser);
  return newUser;
}

export async function getUserProfile(userId: string) {
  const userRef = ref(db, `${USERS}/${userId}`);
  const snapshot = await get(userRef);
  return snapshot.val() as UserProfile | null;
}