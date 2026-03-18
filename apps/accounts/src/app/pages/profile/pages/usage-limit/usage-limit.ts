import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-usage-limit',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">Limite de Uso (API)</h2>
      
      <div *ngIf="usageResource.isLoading()" class="text-gray-500 italic">
        Carregando informações de uso...
      </div>

      <div *ngIf="usageResource.error()" class="text-red-500">
        Erro ao carregar limite de uso.
      </div>

      <div *ngIf="usageResource.value()" class="bg-gray-100 p-4 rounded-md">
        <pre class="text-sm overflow-auto">{{ usageResource.value() | json }}</pre>
      </div>

      <button 
        (click)="usageResource.reload()" 
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
        Atualizar
      </button>
    </div>
  `,
})
export class UsageLimit {
  private http = inject(HttpClient);

  usageResource = rxResource({
    stream: () => this.http.get(`${environment.api}/user/me/usage`),
  });
}
