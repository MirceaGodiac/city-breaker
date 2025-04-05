import { db, auth } from '../../assets/firebase-config';
import { ref, set, get } from 'firebase/database';

const USERS = 'USERS'; // Changed to match Firebase path convention

export interface UserProfile {
  email: string;
  scans: Array<{
    scanID: string;
    location: string;
    LandmarkNAME: string;
  }>;
}

export async function createUserProfile() {
  if (!auth.currentUser) {
    throw new Error('No authenticated user found');
  }

  const userRef = ref(db, `${USERS}/${auth.currentUser.uid}`);
  
  const newUser: UserProfile = {
    email: auth.currentUser.email || '',
    scans: []
  };

  try {
    await set(userRef, newUser);
    return newUser;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  const userRef = ref(db, `${USERS}/${userId}`);
  try {
    const snapshot = await get(userRef);
    return snapshot.val() as UserProfile | null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}