import { db } from '../../assets/firebase-config';
import { ref, push, set } from 'firebase/database';


export default async function addScanForUser(
  userId: string,
  location: string,
  base64Image: string
): Promise<void> {
    console.log("STARTED DB WRITE");
  // Reference to the user's Scans node
  const scansRef = ref(db, `USERS/${userId}/Scans`);

  // Create a new scan with a unique ID
  const newScanRef = push(scansRef);

  // Set the scan data
  return set(newScanRef, {
    Location: location,
    Base64: base64Image,
  });
}
