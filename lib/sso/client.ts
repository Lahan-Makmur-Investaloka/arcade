export interface SsoConfig {
  SSO_API_BASE_URL?: string;
  SSO_APP_NAME?: string;
  SSO_APP_KEY?: string;
  SSO_APP_CODE?: string;
}

export interface Tokens {
  token: string;
  tokenExpires: number;
  refreshToken: string;
  refreshExpires: number;
}

export interface SsoUser {
  guid: string;
  employeeGuid: string;
  fullname: string;
}

export class SsoError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Envelope = { message?: { en?: string }; data?: Record<string, unknown> };

function expiry(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/i.test(value)) {
    throw new SsoError(502, 'Format masa berlaku token SSO tidak valid.');
  }
  const date = value.replace(' ', 'T');
  const time = Date.parse(/[zZ]|[+-]\d{2}:\d{2}$/.test(date) ? date : date + 'Z');
  if (!Number.isFinite(time) || time <= Date.now()) throw new SsoError(502, 'Masa berlaku token SSO tidak valid.');
  return time;
}

function readTokens(data: Record<string, unknown> | undefined, previous?: Tokens): Tokens {
  if (!data || typeof data.token !== 'string' || !data.token) throw new SsoError(502, 'Respons token SSO tidak lengkap.');
  const rotated = data.refresh_token !== undefined;
  const refreshToken = rotated ? data.refresh_token : previous?.refreshToken;
  if (typeof refreshToken !== 'string' || !refreshToken) throw new SsoError(502, 'Refresh token SSO tidak tersedia.');
  return {
    token: data.token,
    tokenExpires: expiry(data.token_expired),
    refreshToken,
    refreshExpires: rotated || data.refresh_token_expired !== undefined ? expiry(data.refresh_token_expired) : previous!.refreshExpires,
  };
}

export class LahansClient {
  private baseUrl: string;
  private appName: string;
  private appKey: string;
  private appCode: string;
  private fetcher: typeof fetch;

  constructor(config: SsoConfig, fetcher: typeof fetch = fetch) {
    try {
      const url = new URL(config.SSO_API_BASE_URL ?? '');
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw Error();
      this.baseUrl = url.href.replace(/\/$/, '');
    } catch {
      throw new SsoError(503, 'URL layanan SSO belum dikonfigurasi dengan benar.');
    }
    if (!config.SSO_APP_NAME?.trim() || !config.SSO_APP_KEY?.trim() || !config.SSO_APP_CODE?.trim()) throw new SsoError(503, 'Identitas aplikasi SSO belum dikonfigurasi.');
    this.appName = config.SSO_APP_NAME;
    this.appKey = config.SSO_APP_KEY;
    this.appCode = config.SSO_APP_CODE.trim();
    this.fetcher = fetcher;
  }

  private async request(path: string, method: string, headers: Record<string, string> = {}, body?: unknown): Promise<Envelope> {
    let response: Response;
    let result: Envelope;
    try {
      const fetcher = this.fetcher; // Worker-native fetch must not receive the client as `this`.
      response = await fetcher(this.baseUrl + path, {
        method, headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(8000), redirect: 'manual', cache: 'no-store',
      });
      result = await response.json() as Envelope;
    } catch {
      throw new SsoError(502, 'Layanan SSO tidak dapat dihubungi. Silakan coba lagi.');
    }
    if (!response.ok || result?.message?.en !== 'Success') {
      const message = result?.message?.en;
      if (response.status === 403) throw new SsoError(403, 'Akses akun ini ditolak oleh layanan SSO.');
      if (message === 'Password Not Match') throw new SsoError(401, 'Username atau password tidak sesuai.');
      if (message === 'Please login first') throw new SsoError(401, 'Sesi berakhir. Silakan masuk kembali.');
      if (response.status === 401) throw new SsoError(401, 'Token SSO tidak berlaku.');
      if (response.status === 429) throw new SsoError(429, 'Terlalu banyak percobaan. Silakan tunggu sebelum mencoba lagi.');
      throw new SsoError(response.ok && path === '/sso/auth/login' ? 401 : 502, 'Permintaan SSO belum berhasil. Silakan coba lagi.');
    }
    return result;
  }

  async bootstrap(deviceId: string): Promise<Tokens> {
    const result = await this.request('/token/auth', 'POST', {}, {
      app_name: this.appName, app_key: this.appKey, device_id: deviceId, device_type: 'Web', fcm_token: '', ip_address: '0.0.0.0',
    });
    return readTokens(result.data);
  }

  async refresh(tokens: Tokens): Promise<Tokens> {
    if (tokens.refreshExpires <= Date.now()) throw new SsoError(401, 'Sesi berakhir. Silakan masuk kembali.');
    const result = await this.request('/token/refresh', 'GET', { 'refresh-token': tokens.refreshToken });
    return readTokens(result.data, tokens);
  }

  private async authenticated(path: string, tokens: Tokens, body?: unknown): Promise<Envelope> {
    if (tokens.tokenExpires <= Date.now()) Object.assign(tokens, await this.refresh(tokens));
    const headers = () => ({ token: tokens.token, 'X-SSO-App-Code': this.appCode });
    try {
      return await this.request(path, 'POST', headers(), body);
    } catch (error) {
      // One refresh and one retry. A fresh app token cannot establish user identity.
      if (!(error instanceof SsoError) || error.status !== 401 || error.message !== 'Token SSO tidak berlaku.') throw error;
      Object.assign(tokens, await this.refresh(tokens));
      return this.request(path, 'POST', headers(), body);
    }
  }

  /** Validates credentials and authorization in one call; the response carries the profile. */
  async login(tokens: Tokens, username: string, password: string): Promise<SsoUser> {
    const { data } = await this.authenticated('/sso/auth/login', tokens, { username, password });
    const fullname = [data?.employee_fullname, data?.full_name].find((name): name is string => typeof name === 'string' && !!name.trim());
    if (typeof data?.guid !== 'string' || !data.guid || typeof data.employee_guid !== 'string' || !data.employee_guid || !fullname) {
      throw new SsoError(502, 'Identitas dari layanan SSO tidak lengkap.');
    }
    const access = data.access as { has_access?: unknown } | undefined;
    if (data.status !== 'active' || access?.has_access !== true) {
      throw new SsoError(403, 'Akun ini tidak memiliki akses ke TEKAD Arcade.');
    }
    return { guid: data.guid, employeeGuid: data.employee_guid, fullname };
  }

  /** Keeps the session token usable; the SSO API has no profile endpoint to re-check the account. */
  async renew(tokens: Tokens): Promise<void> {
    if (tokens.tokenExpires <= Date.now()) Object.assign(tokens, await this.refresh(tokens));
  }

  async logout(tokens: Tokens): Promise<void> {
    // Never refresh or retry logout; local revocation must finish regardless.
    await this.request('/sso/auth/logout', 'POST', { token: tokens.token, 'X-SSO-App-Code': this.appCode });
  }
}
