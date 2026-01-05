import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function usePermissions(userId) {
  const [permissions, setPermissions] = useState({
    canCreateSession: true,
    canGenerateQR: true,
    canUseLiveness: false,
    canViewAnalytics: false,
    canUseAIInsights: false,
    canExportData: false,
    maxSessionsPerDay: 10
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const permissionsDoc = await getDoc(doc(db, 'organizer_permissions', userId));
        if (permissionsDoc.exists()) {
          setPermissions(prev => ({ ...prev, ...permissionsDoc.data() }));
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userId]);

  return { permissions, loading };
}