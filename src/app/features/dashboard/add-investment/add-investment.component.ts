import { Component, EventEmitter, inject, OnDestroy, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, of, Subscription, switchMap } from 'rxjs';
import { InvestmentService } from '../../../core/services/investment.service';
import { AssetNameService } from '../../../core/services/asset-name.service';
import { AssetType } from '../../../core/models/asset-type.enum';
import { CreateInvestmentRequest } from '../../../core/models/investment.models';

@Component({
  selector: 'app-add-investment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-investment.component.html',
})
export class AddInvestmentComponent implements OnDestroy {
    private readonly fb        = inject(FormBuilder);
    private readonly service   = inject(InvestmentService);
    private readonly nameSvc   = inject(AssetNameService);

      // 🆕 El padre escucha estos dos eventos
    @Output() saved  = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    // Expone el enum al template — sin esto el HTML no puede ver AssetType.ETF etc.
    AssetType = AssetType;
    saving = false;
    error  = '';

    form = this.fb.group({
        name:           ['', Validators.required],
        symbol:         ['', Validators.required],
        providerSymbol: [null as string | null],       // opcional — solo EU ETFs
        assetType:      [AssetType.ETF, Validators.required],
        broker:         ['Manual', Validators.required],
        quantity:       [null as number | null, [Validators.required, Validators.min(0.000001)]],
        buyPrice:       [null as number | null, [Validators.required, Validators.min(0.000001)]],
        purchaseDate:   ['', Validators.required]
    });

    // Autocompleta Nombre a partir del Symbol (pedido de Daniel: evita errores de tipeo escribiendo
    // el nombre a mano — ej. "NU" -> "Nu Holdings Ltd."). Debounce para no golpear Yahoo en cada
    // tecla. Crypto queda afuera (Binance no da un nombre descriptivo simple). Sigue siendo
    // editable: si el usuario lo corrige después, esta suscripción solo vuelve a pisarlo si
    // cambia el Symbol de nuevo.
    private readonly symbolSub: Subscription = this.form.get('symbol')!.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(symbol => {
            const trimmed = (symbol ?? '').trim();
            if (!trimmed) return of(null);

            const assetType = Number(this.form.get('assetType')!.value) as AssetType;
            // Crypto no tiene lookup real (Binance no da un nombre descriptivo simple) — usa el
            // propio ticker como nombre, para que el campo (ahora de solo lectura) nunca quede vacío.
            if (assetType === AssetType.Crypto) return of({ name: trimmed.toUpperCase() });

            const providerSymbol = this.form.get('providerSymbol')!.value;
            return this.nameSvc.getName(trimmed.toUpperCase(), assetType, providerSymbol);
        })
    ).subscribe(result => {
        if (result?.name) this.form.get('name')!.setValue(result.name);
    });

    ngOnDestroy(): void {
        this.symbolSub.unsubscribe();
    }

    save(): void {
        if (this.form.invalid) return;

        this.saving = true;
        this.error  = '';

        const v = this.form.value;

        const request: CreateInvestmentRequest = {
            name:           v.name!,
            symbol:         v.symbol!.toUpperCase(),
            providerSymbol: v.providerSymbol || null,   // string vacío → null
            assetType:      Number(v.assetType),         // el select devuelve string, lo convertimos
            broker:         v.broker!,
            quantity:       v.quantity!,
            buyPrice:       v.buyPrice!,
            purchaseDate:   new Date(v.purchaseDate!).toISOString()
        };

        this.service.create(request).subscribe({
        next: () => this.saved.emit(), // 🆕 avisa al padre: "guardé bien"
        error: (err) => {
            this.error  = 'Error al guardar. Verificá los datos.';
            this.saving = false;
            console.error(err);
        }
        });
    }

    onCancel(): void {
        this.cancel.emit();                  // 🆕 avisa al padre: "cancelé"
    }
}