import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentService } from './environment.service';

interface SendOtpResponse { success: boolean; message?: string; error?: string; }
interface VerifyResponse { success: boolean; token?: string; error?: string; attemptsLeft?: number; }
interface ResendResponse { success: boolean; message?: string; error?: string; reused?: boolean; expiresInSec?: number; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:5000';

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService
  ) {
    this.envService.log('AuthService initialized');
    if (this.envService.isNoApiMode) {
      this.envService.log('Running in No-API mode - using mock responses');
    } else {
      this.envService.log('API base URL:', this.baseUrl);
    }
  }

  sendOtp(mobile: string): Observable<SendOtpResponse> {
    if (this.envService.isNoApiMode) {
      this.envService.warnNoApi('Send OTP');
      // Return mock response for noApi mode
      const mockResponse: SendOtpResponse = {
        success: true,
        message: 'Mock OTP sent successfully (No-API mode)'
      };
      return this.envService.getMockResponse(mockResponse);
    }

    this.envService.debug('Sending OTP request to:', `${this.baseUrl}/auth/send-otp`);
    return this.http.post<SendOtpResponse>(`${this.baseUrl}/auth/send-otp`, { mobile });
  }

  verifyOtp(mobile: string, code: string): Observable<VerifyResponse> {
    if (this.envService.isNoApiMode) {
      this.envService.warnNoApi('Verify OTP');
      // In noApi mode, any OTP is valid
      const mockResponse: VerifyResponse = {
        success: true,
        token: 'mock-jwt-token-noapi-mode-' + Date.now(),
      };
      return this.envService.getMockResponse(mockResponse);
    }

    this.envService.debug('Verifying OTP at:', `${this.baseUrl}/auth/verify`);
    return this.http.post<VerifyResponse>(`${this.baseUrl}/auth/verify`, { mobile, code });
  }

  resendOtp(mobile: string): Observable<ResendResponse> {
    if (this.envService.isNoApiMode) {
      this.envService.warnNoApi('Resend OTP');
      // Return mock response for noApi mode
      const mockResponse: ResendResponse = {
        success: true,
        message: 'Mock OTP resent (No-API mode)',
        reused: false,
        expiresInSec: 300
      };
      return this.envService.getMockResponse(mockResponse);
    }

    this.envService.debug('Resending OTP at:', `${this.baseUrl}/auth/resend`);
    return this.http.post<ResendResponse>(`${this.baseUrl}/auth/resend`, { mobile });
  }
}
