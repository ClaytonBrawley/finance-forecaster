import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ForecastDay {
  date: string;
  expectedIn: number;
  expectedOut: number;
  total: number;
  vaults: Record<string, number>;
  remaining: number;
}

export interface ForecastResult {
  vaultNames: string[];
  days: ForecastDay[];
}

const API_BASE = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class ForecastService {
  constructor(private http: HttpClient) {}

  getForecast(days = 30): Observable<ForecastResult> {
    return this.http.get<ForecastResult>(`${API_BASE}/forecast`, { params: { days } });
  }
}
