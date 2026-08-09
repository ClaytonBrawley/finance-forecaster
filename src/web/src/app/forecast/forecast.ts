import { Component, OnInit, signal } from '@angular/core';
import { ForecastDay, ForecastResult, ForecastService } from './forecast.service';

@Component({
  selector: 'app-forecast',
  standalone: true,
  templateUrl: './forecast.html',
  styleUrl: './forecast.css',
})
export class Forecast implements OnInit {
  protected readonly forecast = signal<ForecastResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor(private forecastService: ForecastService) {}

  ngOnInit(): void {
    this.forecastService.getForecast(30).subscribe({
      next: (result) => {
        this.forecast.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the forecast. Is the API running on http://localhost:4000?');
        this.loading.set(false);
      },
    });
  }

  protected vaultBalance(day: ForecastDay, name: string): number {
    return day.vaults[name] ?? 0;
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  protected formatDate(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}
