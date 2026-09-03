import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="prose prose-sm max-w-none dark:prose-invert h-full overflow-y-auto px-4 py-2 bg-background"
    >
      <h1 class="text-lg font-bold mb-2">Política de Privacidade</h1>
      <p class="mb-2 text-[10px] text-muted-foreground">
        Última atualização: 22 de Janeiro de 2026
      </p>

      <section class="mb-4">
        <h2 class="text-sm font-semibold mb-1">1. Coleta de Informações</h2>
        <p class="text-xs leading-relaxed text-foreground/80 mb-1">
          A Aplicação coleta informações técnicas do dispositivo (IP, sistema
          operacional) e dados de uso (páginas visitadas, data/hora).
        </p>
      </section>

      <section class="mb-4">
        <h2 class="text-sm font-semibold mb-1">2. Dados de Localização</h2>
        <p class="text-xs leading-relaxed text-foreground/80 mb-1">
          Coletamos sua localização para fornecer serviços de geolocalização e
          melhorias na funcionalidade da Aplicação.
        </p>
      </section>

      <section class="mb-4">
        <h2 class="text-sm font-semibold mb-1">3. Dados Pessoais</h2>
        <p class="text-xs leading-relaxed text-foreground/80 mb-1">
          Solicitamos e-mail, nome social, telefone e endereço para
          personalização e suporte.
        </p>
      </section>

      <section class="mb-4">
        <h2 class="text-sm font-semibold mb-1">4. Segurança</h2>
        <p class="text-xs leading-relaxed text-foreground/80 mb-1">
          Implementamos salvaguardas para proteger seus dados contra acesso não
          autorizado.
        </p>
      </section>

      <section class="mb-2">
        <h2 class="text-sm font-semibold mb-1">5. Contato</h2>
        <p class="text-xs leading-relaxed text-foreground/80">
          suporte&#64;urbis.com.br.
        </p>
      </section>
    </div>
  `,
})
export class PrivacyPolicyComponent {}
