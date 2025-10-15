import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  // Local Storage Methods
  setLocalStorageItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getLocalStorageItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeLocalStorageItem(key: string): void {
    localStorage.removeItem(key);
  }

  clearLocalStorage(): void {
    localStorage.clear();
  }

  // Session Storage Methods
  setSessionStorageItem(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }

  getSessionStorageItem(key: string): string | null {
    return sessionStorage.getItem(key);
  }

  removeSessionStorageItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  clearSessionStorage(): void {
    sessionStorage.clear();
  }
}