import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './msalConfig';

export const msalInstance = new PublicClientApplication(msalConfig);

export async function ensureLogin(): Promise<AccountInfo> {
  await msalInstance.initialize();
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) return accounts[0];

  // Popup login (more reliable in SPA)
  const res = await msalInstance.loginPopup(loginRequest);
  return res.account!;
}

export async function getAccessToken(): Promise<string> {
  const account = (await ensureLogin());
  const silent = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
  return silent.accessToken;
}