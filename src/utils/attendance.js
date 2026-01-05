import { collection, addDoc, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export async function addAttendance({ sessionId, userId }) {
  try {
    // Check if user already marked attendance for this session
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('sessionId', '==', sessionId),
      where('userId', '==', userId)
    );
    
    const existingAttendance = await getDocs(attendanceQuery);
    if (!existingAttendance.empty) {
      return { ok: false, reason: "already_checked_in" };
    }

    // Add attendance record
    const attendanceData = {
      userId,
      sessionId,
      joinedAt: new Date(),
      present: true,
      livenessPassed: true
    };
    
    const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
    
    // Update session attendance count
    await updateDoc(doc(db, 'sessions', sessionId), {
      attendanceCount: increment(1)
    });
    
    // Update organizer total attendances
    // First get the session to find organizerId
    const sessionDoc = await getDocs(query(
      collection(db, 'sessions'),
      where('sessionId', '==', sessionId)
    ));
    
    if (!sessionDoc.empty) {
      const sessionData = sessionDoc.docs[0].data();
      await updateDoc(doc(db, 'organizers', sessionData.organizerId), {
        totalAttendances: increment(1)
      });
    }
    
    return { ok: true, record: { id: docRef.id, ...attendanceData } };
  } catch (error) {
    console.error('Error adding attendance:', error);
    return { ok: false, reason: "database_error" };
  }
}

export async function getAttendanceForSession(sessionId) {
  try {
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('sessionId', '==', sessionId)
    );
    
    const snapshot = await getDocs(attendanceQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
}

export async function hasAttended(sessionId, userId) {
  try {
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('sessionId', '==', sessionId),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(attendanceQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking attendance:', error);
    return false;
  }
}
