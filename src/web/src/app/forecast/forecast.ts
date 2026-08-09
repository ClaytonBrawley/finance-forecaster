import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ForecastDay, ForecastResult, ForecastService, ForecastVault } from './forecast.service';

interface EditingCell {
  date: string;
  vaultId: string;
  baselineBalance: number;
  baselineAllocation: number;
  baselineRemaining: number;
}

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './forecast.html',
  styleUrl: './forecast.css',
})
export class Forecast implements OnInit {
  protected readonly forecast = signal<ForecastResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly editingCell = signal<EditingCell | null>(null);
  protected readonly editValue = signal('');

  private editCancelled = false;

  constructor(private forecastService: ForecastService) {}

  ngOnInit(): void {
    this.loading.set(true);
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

  // Re-fetches in place without touching `loading`, so the table stays mounted
  // instead of flashing back to the loading state on every edit.
  private refresh(): void {
    this.forecastService.getForecast(30).subscribe({
      next: (result) => this.forecast.set(result),
      error: () => this.error.set('Could not load the forecast. Is the API running on http://localhost:4000?'),
    });
  }

  protected vaultBalance(day: ForecastDay, name: string): number {
    return day.vaults[name] ?? 0;
  }

  protected allocationAmount(day: ForecastDay, name: string): number {
    return day.allocations[name] ?? 0;
  }

  protected isEditing(day: ForecastDay, vault: ForecastVault): boolean {
    const cell = this.editingCell();
    return !!cell && cell.date === day.date && cell.vaultId === vault.id;
  }

  protected startEdit(day: ForecastDay, vault: ForecastVault): void {
    const baselineBalance = this.vaultBalance(day, vault.name);
    this.editCancelled = false;
    this.editValue.set(String(baselineBalance));
    this.editingCell.set({
      date: day.date,
      vaultId: vault.id,
      baselineBalance,
      baselineAllocation: this.allocationAmount(day, vault.name),
      baselineRemaining: day.remaining,
    });
  }

  protected cancelEdit(): void {
    this.editCancelled = true;
  }

  // Live preview of Remaining Cash if the in-progress edit were committed as-is.
  protected remainingAfterEdit(day: ForecastDay): number {
    const cell = this.editingCell();
    if (!cell || cell.date !== day.date) return day.remaining;
    const newValue = Number(this.editValue());
    if (!Number.isFinite(newValue)) return day.remaining;
    return cell.baselineRemaining - (newValue - cell.baselineBalance);
  }

  // A vault balance can't go below zero, and you can't allocate more than
  // is actually sitting in Remaining Cash that day.
  protected editInvalidReason(day: ForecastDay): string | null {
    const cell = this.editingCell();
    if (!cell || cell.date !== day.date) return null;
    const newValue = Number(this.editValue());
    if (!Number.isFinite(newValue)) return 'Enter a number';
    if (newValue < 0) return "Can't go below $0";
    if (this.remainingAfterEdit(day) < 0) {
      const max = cell.baselineRemaining + cell.baselineBalance;
      return `Max ${this.formatCurrency(max)}`;
    }
    return null;
  }

  protected isEditInvalid(day: ForecastDay): boolean {
    return this.editInvalidReason(day) !== null;
  }

  protected commitEdit(): void {
    const cell = this.editingCell();
    this.editingCell.set(null);
    if (!cell || this.editCancelled) return;

    const newValue = Number(this.editValue());
    if (!Number.isFinite(newValue) || newValue === cell.baselineBalance) return;

    const newRemaining = cell.baselineRemaining - (newValue - cell.baselineBalance);
    if (newValue < 0 || newRemaining < 0) {
      // Invalid — discard silently, nothing is sent to the API.
      return;
    }

    const newAllocation = cell.baselineAllocation + (newValue - cell.baselineBalance);
    this.forecastService.allocate(cell.date, cell.vaultId, newAllocation).subscribe({
      next: () => this.refresh(),
    });
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
