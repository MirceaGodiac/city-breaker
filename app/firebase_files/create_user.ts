import { db, auth } from '../../assets/firebase-config';
import { ref, set, get } from 'firebase/database';

const USERS = 'USERS'; // Changed to match Firebase path convention

const defaultPreferences = {
  "ARCHITECTURE": {
    "CLASSICAL": 0,
    "ROMANESQUE": 0,
    "GOTHIC": 0,
    "BAROQUE": 0,
    "VICTORIAN": 0,
    "NEOCLASSICAL": 0,
    "MODERNIST": 0,
    "BRUTALIST": 0,
    "POSTMODERN": 0,
    "FUTURISTIC": 0,
    "VERNACULAR": 0,
    "TRADITIONAL": 0,
    "MINIMALIST": 0,
    "INDUSTRIAL": 0,
    "ISLAMIC": 0,
    "BYZANTINE": 0,
    "MOORISH": 0
  },
  "HISTORICAL ERA": {
    "ANCIENT (BEFORE 500 AD)": 0,
    "MEDIEVAL (500–1500)": 0,
    "RENAISSANCE (1500–1700)": 0,
    "CLASSICAL REVIVAL (1700–1850)": 0,
    "INDUSTRIAL ERA (1850–1900)": 0,
    "MODERN (1900–1970)": 0,
    "CONTEMPORARY (1970–PRESENT)": 0
  },
  "CULTURAL": {
    "EUROPEAN": 0,
    "EASTERN EUROPEAN": 0,
    "MIDDLE EASTERN": 0,
    "NORTH AFRICAN": 0,
    "SUB-SAHARAN AFRICAN": 0,
    "EAST ASIAN": 0,
    "SOUTH ASIAN": 0,
    "SOUTHEAST ASIAN": 0,
    "LATIN AMERICAN": 0,
    "INDIGENOUS": 0,
    "NORDIC": 0,
    "SLAVIC": 0
  },
  "LANDMARK TYPE": {
    "RELIGIOUS (CHURCH, MOSQUE, TEMPLE)": 0,
    "MILITARY": 0,
    "GOVERNMENTAL": 0,
    "RESIDENTIAL": 0,
    "COMMERCIAL": 0,
    "BRIDGES": 0,
    "TOWERS": 0,
    "OBELISKS": 0,
    "RUINS": 0,
    "WALLS": 0,
    "GATES": 0,
    "SCULPTURES": 0,
    "MONUMENTS": 0,
    "FOUNTAINS": 0,
    "MUSEUMS": 0,
    "PLAZAS": 0,
    "TOWN SQUARES": 0
  },
  "VIBE": {
    "COLORFUL": 0,
    "SYMMETRICAL": 0,
    "DETAILED": 0,
    "ORNATE": 0,
    "MINIMALIST": 0,
    "GRAND": 0,
    "RUSTIC": 0,
    "SHARP": 0,
    "SOFT": 0,
    "OVERGROWN": 0,
    "REFLECTIVE (GLASS, WATER)": 0,
    "NIGHT-LIT": 0,
    "STREET ART": 0
  },
  "EXPERIENCE STYLE": {
    "PHOTO SPOT": 0,
    "PANORAMIC VIEW": 0,
    "INSTAGRAMMABLE": 0,
    "PEACEFUL": 0,
    "CROWD FAVORITE": 0,
    "HIDDEN GEM": 0,
    "ROMANTIC": 0,
    "FAMILY-FRIENDLY": 0,
    "ADVENTURE INVOLVED": 0
  }
};


export interface UserProfile {
  email: string;
  scans: Array<{
    scanID: string;
    location: string;
    LandmarkNAME: string;
  }>;
}

async function createUserPreferences(uid: string, email: string): Promise<void> {
  // Build the user preferences with new schema
  const userData = {
    email: email,
    PUBLIC_SCANS: {},
    PRIVATE_SCANS: {},
    ...defaultPreferences
  };
  await set(ref(db, `USERS/${uid}`), userData);
}

export async function createUserProfile() {
  if (!auth.currentUser) {
    throw new Error('No authenticated user found');
  }

  const userRef = ref(db, `${USERS}/${auth.currentUser.uid}`);
  
  const newUser: UserProfile = {
    email: auth.currentUser.email || '',
    scans: [],
    ...defaultPreferences
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