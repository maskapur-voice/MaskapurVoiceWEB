import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface RuntimeConfig {
  noApi: boolean;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {
  private configSubject = new BehaviorSubject<RuntimeConfig>({ noApi: false, timestamp: '' });
  public config$ = this.configSubject.asObservable();

  private _isLoaded = false;

  constructor(private http: HttpClient) {
    this.loadConfig();
  }

  get isNoApiMode(): boolean {
    return this.configSubject.value.noApi;
  }

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  private loadConfig(): void {
    this.http.get<RuntimeConfig>('/assets/runtime-config.json').pipe(
      catchError((error) => {
        console.warn('⚠️ Could not load runtime config, using defaults:', error);
        return of({ noApi: false, timestamp: new Date().toISOString() });
      }),
      tap((config) => {
        this.configSubject.next(config);
        this._isLoaded = true;
        console.log('🔧 Runtime config loaded:', config);
        
        if (config.noApi) {
          console.log('🚫 No-API mode is ACTIVE');
        }
      })
    ).subscribe();
  }

  refreshConfig(): Observable<RuntimeConfig> {
    this._isLoaded = false;
    this.loadConfig();
    return this.config$;
  }
}
