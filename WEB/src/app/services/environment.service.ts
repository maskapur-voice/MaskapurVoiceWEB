import { Injectable } from '@angular/core';
import { RuntimeConfigService } from './runtime-config.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {

  constructor(private runtimeConfig: RuntimeConfigService) {
    console.log('🌍 Environment service initialized');
  }

  get isNoApiMode(): boolean {
    return this.runtimeConfig.isNoApiMode;
  }

  get isProduction(): boolean {
    return false; // For now, always development
  }

  get isDevelopment(): boolean {
    return !this.isProduction;
  }

  /**
   * Get mock data for API responses when in noApi mode
   */
  getMockResponse<T>(mockData: T): Observable<T> {
    if (this.isNoApiMode) {
      console.log('🚫 [NO-API] Returning mock data:', mockData);
      return of(mockData);
    }
    throw new Error('getMockResponse should only be called in noApi mode');
  }

  /**
   * Check if API calls should be made
   */
  shouldMakeApiCall(): boolean {
    return !this.isNoApiMode;
  }

  /**
   * Log message with environment context
   */
  log(message: string, ...optionalParams: any[]): void {
    const prefix = this.isNoApiMode ? '[NO-API]' : '[API]';
    console.log(`${prefix} ${message}`, ...optionalParams);
  }

  /**
   * Debug message with environment context
   */
  debug(message: string, ...optionalParams: any[]): void {
    const prefix = this.isNoApiMode ? '[NO-API-DEBUG]' : '[DEBUG]';
    console.debug(`${prefix} ${message}`, ...optionalParams);
  }

  /**
   * Show warning when in noApi mode
   */
  warnNoApi(action: string): void {
    if (this.isNoApiMode) {
      console.warn(`🚫 ${action} skipped - Running in No-API mode`);
    }
  }
}