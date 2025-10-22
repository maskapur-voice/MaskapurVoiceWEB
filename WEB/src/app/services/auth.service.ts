import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

interface SendOtpResponse { success: boolean; message?: string; error?: string; }
interface VerifyResponse { success: boolean; token?: string; error?: string; attemptsLeft?: number; }
interface ResendResponse { success: boolean; message?: string; error?: string; reused?: boolean; expiresInSec?: number; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiBaseUrl || 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  sendOtp(mobile: string): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(`${this.baseUrl}/auth/send-otp`, { mobile });
  }

  verifyOtp(mobile: string, code: string): Observable<VerifyResponse> {
    return this.http.post<VerifyResponse>(`${this.baseUrl}/auth/verify`, { mobile, code });
  }

  resendOtp(mobile: string): Observable<ResendResponse> {
    return this.http.post<ResendResponse>(`${this.baseUrl}/auth/resend`, { mobile });
  }
}
