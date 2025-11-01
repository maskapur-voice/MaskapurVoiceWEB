import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private _isNoApiMode: boolean = false;

  constructor() {
    // Check if we're running in no-API mode
    this.checkNoApiMode();
  }

  get isNoApiMode(): boolean {
    return this._isNoApiMode;
  }

  private async checkNoApiMode(): Promise<void> {
    try {
      const response = await fetch('/assets/runtime-config.json');
      const config = await response.json();
      this._isNoApiMode = config.noApi || false;
    } catch (error) {
      console.warn('Could not load runtime config, defaulting to API mode', error);
      this._isNoApiMode = false;
    }
  }

  log(message: string, data?: any): void {
    if (this._isNoApiMode) {
      if (data !== undefined) {
        console.log(`🚫 [NO-API MODE] ${message}`, data);
      } else {
        console.log(`� [NO-API MODE] ${message}`);
      }
    } else {
      if (data !== undefined) {
        console.log(`📡 [API MODE] ${message}`, data);
      } else {
        console.log(`�📡 [API MODE] ${message}`);
      }
    }
  }

  debug(message: string, data?: any): void {
    if (this._isNoApiMode) {
      if (data !== undefined) {
        console.debug(`🚫 [NO-API DEBUG] ${message}`, data);
      } else {
        console.debug(`🚫 [NO-API DEBUG] ${message}`);
      }
    } else {
      if (data !== undefined) {
        console.debug(`📡 [API DEBUG] ${message}`, data);
      } else {
        console.debug(`📡 [API DEBUG] ${message}`);
      }
    }
  }

  warnNoApi(operation: string): void {
    if (this._isNoApiMode) {
      console.warn(`🚫 [NO-API MODE] ${operation} - Using mock response`);
    }
  }

  getMockResponse<T>(mockData: T): Observable<T> {
    if (this._isNoApiMode) {
      console.log(`🚫 [NO-API MODE] Returning mock response:`, mockData);
      return of(mockData);
    }
    return of(mockData);
  }
}