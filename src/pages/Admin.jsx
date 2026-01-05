import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function Admin() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    try {
      const organizersSnap = await getDocs(collection(db, 'organizers'));
      const organizersList = [];
      
      for (const docSnap of organizersSnap.docs) {
        const organizerData = docSnap.data();
        
        // Get permissions
        const permissionsDoc = await getDoc(doc(db, 'organizer_permissions', docSnap.id));
        const permissionsData = permissionsDoc.exists() ? permissionsDoc.data() : {};
        
        organizersList.push({
          id: docSnap.id,
          ...organizerData,
          permissions: permissionsData
        });
      }
      
      setOrganizers(organizersList);
    } catch (error) {
      console.error('Error loading organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageAccess = (organizer) => {
    setSelectedOrganizer(organizer);
    setPermissions({
      canCreateSession: organizer.permissions.canCreateSession ?? true,
      canGenerateQR: organizer.permissions.canGenerateQR ?? true,
      canUseLiveness: organizer.permissions.canUseLiveness ?? false,
      canViewAnalytics: organizer.permissions.canViewAnalytics ?? false,
      canUseAIInsights: organizer.permissions.canUseAIInsights ?? false,
      canExportData: organizer.permissions.canExportData ?? false,
      maxSessionsPerDay: organizer.permissions.maxSessionsPerDay ?? 10
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedOrganizer) return;
    
    try {
      setSaving(true);
      
      // Update permissions
      await setDoc(doc(db, 'organizer_permissions', selectedOrganizer.id), permissions);
      
      // Log admin action
      await addDoc(collection(db, 'admin_logs'), {
        action: 'update_permissions',
        organizerId: selectedOrganizer.id,
        organizerEmail: selectedOrganizer.email,
        permissions: permissions,
        timestamp: new Date(),
        adminId: auth.currentUser?.uid || 'unknown'
      });
      
      // Update local state
      setOrganizers(prev => prev.map(org => 
        org.id === selectedOrganizer.id 
          ? { ...org, permissions: permissions }
          : org
      ));
      
      setMessage('Permissions updated successfully');
      setSelectedOrganizer(null);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving permissions:', error);
      setMessage('Error updating permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page app center">
        <div className="card">
          <p>Loading organizers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page app">
      <div className="card" style={{ maxWidth: '800px', margin: '20px auto' }}>
        <div className="logo gradient-text">Admin Control Panel</div>
        
        {message && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '20px', 
            backgroundColor: message.includes('Error') ? '#fee' : '#efe',
            border: `1px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`,
            borderRadius: '4px'
          }}>
            {message}
          </div>
        )}

        <h3>Organizers</h3>
        
        {organizers.length === 0 ? (
          <p>No organizers found.</p>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            {organizers.map(organizer => (
              <div key={organizer.id} style={{ 
                border: '1px solid #ddd', 
                padding: '15px', 
                marginBottom: '10px',
                borderRadius: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{organizer.name || organizer.email}</strong>
                    <br />
                    <small>{organizer.email}</small>
                    <br />
                    <small>Plan: {organizer.plan || 'Basic'}</small>
                  </div>
                  <button 
                    className="btn organizer"
                    onClick={() => handleManageAccess(organizer)}
                    style={{ fontSize: '14px', padding: '8px 16px' }}
                  >
                    Manage Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedOrganizer && (
          <div style={{ 
            border: '2px solid #007bff', 
            padding: '20px', 
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h4>Manage Access: {selectedOrganizer.name || selectedOrganizer.email}</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={permissions.canCreateSession}
                  onChange={(e) => setPermissions(prev => ({ ...prev, canCreateSession: e.target.checked }))}
                />
                Can Create Session
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={permissions.canGenerateQR}
                  onChange={(e) => setPermissions(prev => ({ ...prev, canGenerateQR: e.target.checked }))}
                />
                Can Generate QR
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={permissions.canUseLiveness}
                  onChange={(e) => setPermissions(prev => ({ ...prev, canUseLiveness: e.target.checked }))}
                />
                Can Use Liveness
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={permissions.canViewAnalytics}
                  onChange={(e) => setPermissions(prev => ({ ...prev, canViewAnalytics: e.target.checked }))}
                />
                Can View Analytics
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={permissions.canUseAIInsights}
                  onChange={(e) => setPermissions(prev => ({ ...prev, canUseAIInsights: e.target.checked }))}
                />
                Can Use AI Insights
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={permissions.canExportData}
                  onChange={(e) => setPermissions(prev => ({ ...prev, canExportData: e.target.checked }))}
                />
                Can Export Data
              </label>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Max Sessions Per Day:
              </label>
              <input
                type="number"
                value={permissions.maxSessionsPerDay}
                onChange={(e) => setPermissions(prev => ({ ...prev, maxSessionsPerDay: parseInt(e.target.value) || 0 }))}
                style={{ 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  width: '100px'
                }}
                min="0"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn organizer"
                onClick={handleSavePermissions}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              
              <button 
                className="btn participant"
                onClick={() => setSelectedOrganizer(null)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}