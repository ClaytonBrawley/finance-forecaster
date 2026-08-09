import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ForecastDay {
  date: string;
  expectedIn: number;
  expectedOut: number;
  total: number;
  vaults: Record<string, number>;
  allocations: Record<string, number>;
  remaining: number;
}

export interface ForecastVault {
  id: string;
  name: string;
}

export interface ForecastResult {
  vaults: ForecastVault[];
  days: ForecastDay[];
}

const API_BASE = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class ForecastService {
  constructor(private http: HttpClient) {}

  getForecast(days = 30): Observable<ForecastResult> {
    return this.http.get<ForecastResult>(`${API_BASE}/forecast`, { params: { days } });
  }

  allocate(date: string, vaultId: string, amount: number): Observable<unknown> {
    return this.http.put(`${API_BASE}/allocations`, { date, vaultId, amount });
  }
}
