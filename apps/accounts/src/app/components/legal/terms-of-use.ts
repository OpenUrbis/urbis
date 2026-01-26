import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="prose prose-sm max-w-none dark:prose-invert h-full overflow-y-auto px-4 py-2 bg-background">
      <h1 class="text-lg font-bold mb-2">Termos e Condições de Uso</h1>
      <p class="mb-2 text-[10px] text-muted-foreground">Última atualização: 22 de Janeiro de 2026</p>
      
      <p class="mb-3 text-xs leading-relaxed text-foreground/80">Estes termos e condições aplicam-se à aplicação Urbis Map, criada pela Urbis.</p>

      <p class="mb-3 text-xs font-medium leading-relaxed">Ao baixar ou utilizar a Aplicação, você concorda automaticamente com os seguintes termos.</p>

      <section class="mb-4">
        <h2 class="text-sm font-semibold mb-1">1. Propriedade Intelectual</h2>
        <p class="text-xs leading-relaxed text-foreground/80">A cópia não autorizada, modificação da Aplicação ou de nossas marcas registradas é proibida. Não são permitidas tentativas de extrair o código-fonte ou criar versões derivadas.</p>
      </section>

      <section class="mb-4">
        <h2 class="text-sm font-semibold mb-1">2. Dados e Segurança</h2>
        <p class="text-xs leading-relaxed text-foreground/80">A Aplicação processa dados pessoais para a prestação do Serviço. É sua responsabilidade manter a segurança do seu dispositivo e o acesso à Aplicação.</p>
      </section>

      <section class="mb-4">
        <h2 class="text-sm font-semibold mb-1">3. Conectividade</h2>
        <p class="text-xs leading-relaxed text-foreground/80">Algumas funções requerem conexão ativa com a internet. Não nos responsabilizamos por limitações decorrentes da falta de acesso ou fim da cota de dados.</p>
      </section>

      <section class="mb-4">
        <h2 class="text-sm font-semibold mb-1">4. Atualizações e Rescisão</h2>
        <p class="text-xs leading-relaxed text-foreground/80">Podemos atualizar ou interromper a aplicação a qualquer momento sem aviso prévio. Você concorda em aceitar as atualizações oferecidas.</p>
      </section>

      <section class="mb-4">
        <h2 class="text-sm font-semibold mb-1">5. Alterações</h2>
        <p class="text-xs leading-relaxed text-foreground/80">Estes termos podem ser atualizados periodicamente. Recomendamos a revisão regular desta página.</p>
      </section>

      <section class="mb-2">
        <h2 class="text-sm font-semibold mb-1">6. Contato</h2>
        <p class="text-xs leading-relaxed text-foreground/80">Dúvidas? suporte&#64;urbis.com.br.</p>
      </section>
    </div>
  `
})
export class TermsOfUseComponent {}
