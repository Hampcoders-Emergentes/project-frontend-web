import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  type HttpParameterCodec,
  type HttpResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, throwError } from 'rxjs';
import type { DownloadedFile } from '@shared/application/file-saver.port';
import { API_BASE_URL } from '@shared/infrastructure/api/api-url';
import { normalizeHttpError } from '@shared/infrastructure/http/problem-details';
import { publicRequestContext } from '@shared/infrastructure/http/session-token-bridge';

/** Query parameter values; `null`/`undefined` are omitted. */
export type QueryValue = string | number | boolean | null | undefined;
export type Query = Readonly<Record<string, QueryValue>>;

/** Encodes keys and values strictly, so `+` in offsets becomes `%2B` (the default codec keeps `+`). */
class StrictQueryCodec implements HttpParameterCodec {
  encodeKey(key: string): string {
    return encodeURIComponent(key);
  }
  encodeValue(value: string): string {
    return encodeURIComponent(value);
  }
  decodeKey(key: string): string {
    return decodeURIComponent(key);
  }
  decodeValue(value: string): string {
    return decodeURIComponent(value);
  }
}

const CODEC = new StrictQueryCodec();

function toParams(query: Query | undefined): HttpParams {
  let params = new HttpParams({ encoder: CODEC });
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}

function fileNameOf(response: HttpResponse<Blob>, fallback: string): string {
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8?.[1]) {
    return decodeURIComponent(utf8[1]);
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1] ?? fallback;
}

/** Options of a mutation. */
export interface MutationOptions {
  /** `Idempotency-Key` of the user action (only on endpoints that support it). */
  readonly idempotencyKey?: string;
  /** True for public routes (sign-in, refresh, password recovery): no bearer token, no refresh. */
  readonly anonymous?: boolean;
}

/**
 * ApiClient is the generic JSON/HTTP gateway of every context adapter: it prefixes the configured base
 * URL, serialises query parameters strictly and normalises every failure into the RFC 7807 application
 * error. Context adapters own paths, resources and mapping.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  get<T>(path: string, query?: Query): Observable<T> {
    return defer(() =>
      this.http.get<T>(`${API_BASE_URL}${path}`, { params: toParams(query) }),
    ).pipe(catchError((error: unknown) => throwError(() => normalizeHttpError(error))));
  }

  post<T>(path: string, body: unknown, options?: MutationOptions): Observable<T> {
    return this.http
      .post<T>(`${API_BASE_URL}${path}`, body ?? {}, {
        headers: this.headers(options),
        context: options?.anonymous ? publicRequestContext() : undefined,
      })
      .pipe(catchError((error: unknown) => throwError(() => normalizeHttpError(error))));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(`${API_BASE_URL}${path}`, body)
      .pipe(catchError((error: unknown) => throwError(() => normalizeHttpError(error))));
  }

  delete(path: string): Observable<void> {
    return this.http.delete(`${API_BASE_URL}${path}`, { observe: 'response' }).pipe(
      map(() => undefined),
      catchError((error: unknown) => throwError(() => normalizeHttpError(error))),
    );
  }

  /**
   * Downloads a binary file (read as a Blob, never as JSON).
   * @param path - The API path.
   * @param fallbackName - The file name when the response has no `Content-Disposition`.
   * @param query - Query parameters.
   */
  getFile(path: string, fallbackName: string, query?: Query): Observable<DownloadedFile> {
    return defer(() =>
      this.http.get(`${API_BASE_URL}${path}`, {
        params: toParams(query),
        responseType: 'blob',
        observe: 'response',
      }),
    ).pipe(
      map((response: HttpResponse<Blob>) => ({
        blob: response.body ?? new Blob(),
        fileName: fileNameOf(response, fallbackName),
        contentType: response.headers.get('Content-Type') ?? 'application/octet-stream',
      })),
      catchError((error: unknown) => throwError(() => normalizeHttpError(error))),
    );
  }

  private headers(options: MutationOptions | undefined): HttpHeaders {
    let headers = new HttpHeaders();
    if (options?.idempotencyKey) {
      headers = headers.set('Idempotency-Key', options.idempotencyKey);
    }
    return headers;
  }
}
