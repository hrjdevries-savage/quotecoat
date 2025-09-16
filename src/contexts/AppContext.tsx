import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AppContextType {
  orgId: string | null;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  useEffect(() => {
    const initializeOrgId = async () => {
      // Check for admin bypass first
      const isAdminBypass = localStorage.getItem('admin-bypass') === 'true';
      
      if (isAdminBypass) {
        console.log('Admin bypass detected, using dummy org_id');
        setOrgId('admin-org-id');
        setLoading(false);
        return;
      }

      if (!user || !session) {
        setOrgId(null);
        setLoading(false);
        return;
      }

      // Try to get org_id from user metadata first
      const userOrgId = user.user_metadata?.org_id;
      
      if (userOrgId) {
        console.log('Found org_id in user metadata:', userOrgId);
        setOrgId(userOrgId);
        setLoading(false);
        return;
      }

      // If no org_id in metadata, create one and update user metadata
      // For now, create a simple org per user approach
      try {
        console.log('Creating new organization for user');
        
        // Create a new organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({ 
            name: `Organisatie van ${user.email}` 
          })
          .select()
          .single();

        if (orgError) {
          console.error('Error creating organization:', orgError);
          setLoading(false);
          return;
        }

        const newOrgId = orgData.id;
        console.log('Created organization with ID:', newOrgId);

        // Update user metadata with org_id
        const { error: updateError } = await supabase.auth.updateUser({
          data: { org_id: newOrgId }
        });

        if (updateError) {
          console.error('Error updating user metadata:', updateError);
        } else {
          console.log('Updated user metadata with org_id');
          setOrgId(newOrgId);
        }
      } catch (error) {
        console.error('Error in org initialization:', error);
      }
      
      setLoading(false);
    };

    initializeOrgId();
  }, [user, session]);

  const value = {
    orgId,
    loading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};