import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  computed,
  DestroyRef,
  inject,
  Injector,
  signal,
  Signal,
} from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

export interface Sort {
  active: string;
  direction: 'asc' | 'desc' | '';
}

// --- TIPAGENS NECESSÁRIAS ---

/** * Interface de resposta padrão da API para listagens paginadas.
 * T: Tipo de Item na Lista (ex: TUser)
 */
export interface ApiResponse<T> {
  data: T[];
  total: number;
}

/**
 * Parâmetros básicos de controle que toda lista deve ter.
 */
export interface BaseParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Interface de opções para o construtor do AbstractDataSource.
 * TFilter: O tipo inferido do valor do FormGroup.
 */
export interface DataSourceOptions<TFilter = any> {
  /**
   * O FormGroup que contém os controles de filtro. Seu valueChanges será
   * usado como fonte reativa dos filtros.
   */
  filterFormGroup?: FormGroup<any>;
  /**
   * Estado inicial opcional para os parâmetros básicos (page, pageSize, etc.).
   */
  initialParams?: Partial<BaseParams>;
  /**
   * Função opcional para construir a URL da API dinamicamente (além da baseUrl).
   */
  urlBuilder?: (params: BaseParams & TFilter) => string;
}

// --- CLASSE ABSTRATA ---

/**
 * Data Source genérico e reativo que utiliza Signals e rxResource para buscar dados.
 *
 * T: O tipo da entidade na lista (ex: TUser).
 * F: O tipo do objeto de filtro (o valor do FormGroup).
 */
export abstract class AbstractDataSource<
  T = any,
  F extends { [K in keyof F]: AbstractControl<any, any, any> } = any,
> implements DataSource<T> {
  protected http = inject(HttpClient);
  protected injector = inject(Injector);
  protected destroyRef = inject(DestroyRef);

  // URL base para a API (DEVE SER DEFINIDA pela classe filha)
  protected abstract baseUrl: string;

  // ESTADO MUTÁVEL (SIGNALS)
  private readonly _baseParams = signal<BaseParams>({ page: 1, limit: 10 });

  // O FormGroup que foi injetado pelo construtor
  public readonly filterFormGroup: FormGroup<F>;

  // Novo Signal de fallback para quando não houver FormGroup
  private readonly _emptyFilterSignal = signal({} as F);

  // O Signal de Filtros será o toSignal do FormGroup, OU o Signal vazio
  private readonly _filters: Signal<F>;

  // Signals Computed para unir o estado (este é o gatilho do rxResource)
  private readonly _allParams = computed(() => ({
    ...this._baseParams(),
    ...this._filters(), // Acesso síncrono ao valor do formulário
  }));

  // O NÚCLEO REATIVO (rxResource)
  private readonly _resource = rxResource({
    params: this._allParams, // Reage a qualquer mudança em _allParams
    stream: ({ params }) => this.fetchData(params as unknown as BaseParams & F),
    defaultValue: { data: [], total: 0 } as ApiResponse<T>,
  });

  // ESTADO DE SAÍDA (Signals Públicos)
  public readonly data = computed(() => this._resource.value().data);
  public readonly totalCount = computed(() => this._resource.value().total);
  public readonly loading = computed(() => this._resource.isLoading());
  public readonly error = computed(() => this._resource.error());
  public readonly currentParams = computed(() => this._allParams());

  protected options: DataSourceOptions<F>;

  // --- CONSTRUTOR ---
  constructor(options: DataSourceOptions<F>) {
    this.options = options;

    // Se um FormGroup foi fornecido:
    if (options.filterFormGroup) {
      this.filterFormGroup = options.filterFormGroup;

      // Usa toSignal para ligar o formulário à reatividade
      this._filters = toSignal(this.filterFormGroup.valueChanges, {
        initialValue: this.filterFormGroup.value,
        injector: this.injector,
      }) as unknown as Signal<F>;

      // A filter changes the result set. Always restart at the first page;
      // otherwise a valid match can appear empty when the previous page no
      // longer exists for the filtered result.
      this.filterFormGroup.valueChanges.subscribe(() => this.resetAndReload());
    } else {
      // Se NÃO foi fornecido:
      // Inicializa o filterFormGroup como undefined (ou null)
      this.filterFormGroup = undefined as any;

      // Usa o Signal vazio, garantindo que _filters seja sempre um Signal
      this._filters = this._emptyFilterSignal as Signal<F>;
    }

    if (options.initialParams) {
      this._baseParams.set({ ...this._baseParams(), ...options.initialParams });
    }
  }
  // --- MÉTODOS PÚBLICOS PARA MUTAÇÃO ---

  /**
   * Reseta a paginação para 1 e dispara uma nova busca.
   * Útil quando o formulário de filtro é submetido ou mudado.
   */
  public resetAndReload() {
    // Mudar a página para 1 dispara a reatividade em _allParams, que re-executa o rxResource.
    this._baseParams.update((current) => ({ ...current, page: 1 }));
  }

  /** Vai para uma página específica. */
  public goToPage(page: number) {
    this._baseParams.update((current) => ({ ...current, page }));
  }

  /** Atualiza o tamanho da página e volta para a página 1. */
  public updatePageSize(limit: number) {
    this._baseParams.update((current) => ({ ...current, limit, page: 1 }));
  }

  /** Atualiza a ordenação e volta para a página 1. */
  public updateSort(sort: Sort) {
    this._baseParams.update((current) => ({
      ...current,
      sortBy: sort.active,
      sortDirection: sort.direction as 'asc' | 'desc',
      page: 1,
    }));
  }

  // --- IMPLEMENTAÇÃO DO DATASOURCE (CDK) ---

  /**
   * Implementação obrigatória do método connect() do DataSource do CDK.
   * Converte o Signal 'data' em um Observable para a MatTable.
   */
  connect(collectionViewer: CollectionViewer): Observable<T[]> {
    // toObservable usa o DestroyRef injetado para desinscrever automaticamente.
    return toObservable(this.data, { injector: this.injector });
  }

  /** Método de limpeza obrigatório. Não requer implementação. */
  disconnect(collectionViewer: CollectionViewer): void {}

  // --- MÉTODOS DE BUSCA (Core) ---

  /** * Método central para fazer a chamada HTTP.
   * Pode ser sobrescrito em classes filhas para lógica customizada.
   */
  protected fetchData(params: BaseParams & F): Observable<ApiResponse<T>> {
    const url = this.options.urlBuilder
      ? this.options.urlBuilder(params)
      : this.baseUrl;

    // Converte todos os parâmetros em HttpParams, ignorando valores vazios/nulos
    let httpParams = new HttpParams();

    // Itera sobre todas as chaves (paginação, ordenação e filtros)
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const value = (params as any)[key];

        // Adiciona apenas se o valor não for null, undefined ou string vazia
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    }

    return this.http.get<ApiResponse<T>>(url, { params: httpParams });
  }
}
