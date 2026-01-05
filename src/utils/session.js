import { collection, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  ).toUpperCase();
}

export async function createSession({ title = "", organizerId = "guest", meetLink = "" }) {
  try {
    const sessionId = genId();
    const session = {
      sessionId,
      title,
      organizerId,
      meetLink,
      createdAt: new Date(),
      isActive: true,
      endedAt: null,
      attendanceCount: 0
    };

    // Save to Firestore
    await setDoc(doc(db, 'sessions', sessionId), session);
    
    // Update organizer stats (optional, don't fail if this fails)
    try {
      const organizerRef = doc(db, 'organizers', organizerId);
      await updateDoc(organizerRef, {
        totalSessionsCreated: increment(1)
      });
    } catch (orgError) {
      console.warn('Could not update organizer stats:', orgError);
    }

    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSession(sessionId) {
  const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
  return sessionDoc.exists() ? sessionDoc.data() : null;
}

export async function endSession(sessionId) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    isActive: false,
    endedAt: new Date()
  });
}

export async function validateSessionObject(obj) {
  if (!obj || typeof obj !== "object") return { valid: false, reason: "invalid_payload" };
  const { sessionId } = obj;
  if (!sessionId) return { valid: false, reason: "missing_session_id" };

  const session = await getSession(sessionId);
  if (!session) return { valid: false, reason: "session_not_found" };
  if (!session.isActive) return { valid: false, reason: "session_ended" };

  return { valid: true, session };
}
