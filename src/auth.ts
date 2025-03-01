/**
 * auth.ts - Provides auth related methods for the Bluebutton class
 */
import axios from "axios";
import crypto from "crypto";
import FormData from "form-data";

import { BlueButton } from ".";
import { AuthorizationToken } from "./entities/AuthorizationToken";
import { SDK_HEADERS } from "./enums/environments";
import { Errors } from "./enums/errors";

type PkceData = {
  codeChallenge: string;
  verifier: string;
};

function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function sha256(str: string): Buffer {
  return crypto.createHash("sha256").update(str).digest();
}

function generatePkceData(): PkceData {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  return {
    codeChallenge: base64URLEncode(sha256(verifier)),
    verifier: verifier,
  };
}

function generateRandomState(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

/**
 * Complex type holding PKCE verifier, code challenge, and state
 */
export type AuthData = {
  codeChallenge: string;
  verifier: string;
  state: string;
};

export type TokenPostData = {
  client_id: string;
  client_secret: string;
  code?: string;
  grant_type: string;
  redirect_uri: string;
  code_verifier: string;
  code_challenge: string;
};

export function generateAuthData(): AuthData {
  const PkceData = generatePkceData();
  return {
    codeChallenge: PkceData.codeChallenge,
    verifier: PkceData.verifier,
    state: generateRandomState(),
  };
}

function getAuthorizationUrl(bb: BlueButton): string {
  return `${bb.baseUrl}/v${bb.version}/o/authorize`;
}

export function generateAuthorizeUrl(
  bb: BlueButton,
  AuthData: AuthData
): string {
  const pkceParams = `code_challenge_method=S256&code_challenge=${AuthData.codeChallenge}`;

  return `${getAuthorizationUrl(bb)}?client_id=${bb.clientId}&redirect_uri=${
    bb.callbackUrl
  }&state=${AuthData.state}&response_type=code&${pkceParams}`;
}

//  Generates post data for call to access token URL
export function generateTokenPostData(
  bb: BlueButton,
  authData: AuthData,
  callbackCode?: string
): TokenPostData {
  return {
    client_id: bb.clientId,
    client_secret: bb.clientSecret,
    code: callbackCode,
    grant_type: "authorization_code",
    redirect_uri: bb.callbackUrl,
    code_verifier: authData.verifier,
    code_challenge: authData.codeChallenge,
  };
}

function validateCallbackRequestQueryParams(
  authData: AuthData,
  callbackCode?: string,
  callbackState?: string,
  callbackError?: string
) {
  // Check state from callback here?
  if (callbackError === "access_denied") {
    throw new Error(Errors.CALLBACK_ACCESS_DENIED);
  }

  if (!callbackCode) {
    throw new Error(Errors.CALLBACK_ACCESS_CODE_MISSING);
  }

  if (!callbackState) {
    throw new Error(Errors.CALLBACK_STATE_MISSING);
  }

  if (callbackState != authData.state) {
    throw new Error(Errors.CALLBACK_STATE_DOES_NOT_MATCH);
  }
}

export function getAccessTokenUrl(bb: BlueButton): string {
  return `${bb.baseUrl}/v${bb.version}/o/token/`;
}

// Get an access token from callback code & state
export async function getAuthorizationToken(
  bb: BlueButton,
  authData: AuthData,
  callbackRequestCode?: string,
  callbackRequestState?: string,
  callbackRequestError?: string
) {
  validateCallbackRequestQueryParams(
    authData,
    callbackRequestCode,
    callbackRequestState,
    callbackRequestError
  );

  const postData = generateTokenPostData(bb, authData, callbackRequestCode);

  const body = new URLSearchParams(postData);
  const resp = await axios.post(getAccessTokenUrl(bb), body, {
    headers: SDK_HEADERS,
  });

  if (resp.data) {
    const authToken = new AuthorizationToken(resp.data);
    return authToken;
  } else {
    throw Error(Errors.AUTH_TOKEN_URL_RESPONSE_DATA_MISSING);
  }
}

/**
 * Refresh the access token in the given AuthorizationToken instance
 *
 * @param authToken auth token instance to be refreshed
 * @param bb - instance of the SDK facade class
 * @returns new auth token instance with refreshed access token
 */
export async function refreshAuthToken(
  authToken: AuthorizationToken,
  bb: BlueButton
) {
  const tokenUrl = getAccessTokenUrl(bb);
  // const formData = new FormData();
  // formData.append("username", bb.clientId);
  // formData.append("passowrd", bb.clientSecret);
  // formData.append("grant_type", "refresh_token");
  // formData.append("client_id", bb.clientId);
  // formData.append("refresh_token", authToken.refreshToken);
  // const resp = await axios({
  //     method: 'post',
  //     url: tokenUrl,
  //     data: formData,
  //     headers: SDK_HEADERS,
  // });

  const resp = await axios.post(
    tokenUrl,
    {},
    {
      headers: SDK_HEADERS,
      auth: {
        username: bb.clientId,
        password: bb.clientSecret,
      },
      params: {
        grant_type: "refresh_token",
        client_id: bb.clientId,
        refresh_token: authToken.refreshToken,
      },
    }
  );

  return new AuthorizationToken(resp.data);
}
