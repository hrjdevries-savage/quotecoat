export const msalConfig = {
  auth: {
    clientId: 'YOUR_AZURE_AD_APP_ID', // This needs to be configured in Azure AD
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'localStorage' as const,
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'Mail.Read', 'offline_access'],
};