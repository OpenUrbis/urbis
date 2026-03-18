# 📚 README.md: Padrão `AbstractDataSource` Reativo

Este documento descreve o padrão **`AbstractDataSource`**, uma solução de gerenciamento de estado e dados genérica baseada em **Signals**, **`rxResource`** e **Angular Material**. Ele padroniza a busca de dados paginados, ordenados e filtrados via API em toda a aplicação.

---

## 🚀 1. Visão Geral do Padrão

O `AbstractDataSource` combina o que há de mais moderno no Angular para criar uma fonte de dados *declarativa* e *reativa*.

1. **Estado Único (Signals):** O estado de paginação (`page`, `pageSize`) e o estado de filtros (`FormGroup` opcional) são unidos em um único Signal (`_allParams`).
2. **Gatilho Reativo (`rxResource`):** O `rxResource` observa o `_allParams`. Qualquer mudança (mudança de página, ordenação, ou valor de filtro) dispara uma nova requisição.
3. **Saída como Signals:** Os estados de **`loading`**, **`data`** e **`totalCount`** são expostos como Signals `computed` para serem consumidos de forma síncrona e eficiente nos componentes.
4. **Integração Material:** O método `connect()` converte o Signal de dados (`data`) em um Observable usando `toObservable`, permitindo que o `MatTable` e o `MatPaginator` funcionem perfeitamente.

---

## 2. Como Usar

Para implementar uma nova listagem, siga estes passos:

### Passo 2.1: Criar a Classe Filha (DataSource Específico)

Crie um serviço que estenda `AbstractDataSource` e defina sua URL base, a tipagem de filtros e as opções iniciais.

**Exemplo com Filtros:**

```typescript
// products-data-source.service.ts
import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { AbstractDataSource, DataSourceOptions, TItem } from './abstract-data-source'; 

// Tipagem dos Filtros
interface ProductFilters {
  name: string | null;
  category: 'eletronics' | 'books' | 'all' | null;
}

@Injectable({ providedIn: 'root' })
export class ProductDataSource extends AbstractDataSource<TProduct, ProductFilters> {
  protected baseUrl: string = '/api/products'; 
  
  private fb = inject(FormBuilder);
  public readonly filterForm;

  constructor() {
    // 1. Cria o FormGroup
    const form = this.fb.group({
      name: new FormControl<string | null>(null),
      category: new FormControl<'eletronics' | 'books' | 'all' | null>('all'),
    });
    this.filterForm = form;

    // 2. Define as opções
    const options: DataSourceOptions<ProductFilters> = {
      filterFormGroup: this.filterForm, 
      initialParams: { pageSize: 20 }
    };
    
    super(options);
  }
}
