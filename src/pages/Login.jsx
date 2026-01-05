import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';

export default function Login() {
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  const resolveUserRole = async (user) => {
    try {
      console.log('Resolving role for UID:', user.uid);
      
      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('Admin check - userDoc exists:', userDoc.exists());
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        console.log('User is admin, redirecting to /admin');
        return '/admin';
      }

      // Check if user is organizer
      const organizerDoc = await getDoc(doc(db, 'organizers', user.uid));
      console.log('Organizer check - organizerDoc exists:', organizerDoc.exists());
      if (organizerDoc.exists()) {
        console.log('User is organizer, redirecting to /organizer');
        return '/organizer';
      }

      // Default to participant
      console.log('User is participant, redirecting to /scan');
      return '/scan';
    } catch (error) {
      console.error('Error resolving user role:', error);
      return '/scan'; // fallback to participant
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      console.log('Attempting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign-in successful:', result.user.email);
      console.log('User UID:', result.user.uid);
      
      // Phase E2: Resolve role and redirect
      const redirectPath = await resolveUserRole(result.user);
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath);
    } catch (error) {
      console.error('Sign-in failed:', error.message);
      setSigningIn(false);
    }
  };

  return (
    <div className="page app center">
      <div className="glow"></div>
      
      <div className="card">
        <div className="logo gradient-text">CheckMate</div>
        <div className="subtitle">Presence • Engagement • Trust</div>
        
        <p className="description">
          {signingIn ? 'Signing you in...' : 'Sign in to continue'}
        </p>
        
        <div className="actions">
          <button 
            className="btn organizer"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
          >
            {signingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}