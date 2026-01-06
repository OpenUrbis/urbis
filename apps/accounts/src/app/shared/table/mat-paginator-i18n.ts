import { MatPaginatorIntl as MatPaginatorIntlBase } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

export class MatPaginatorI18n extends MatPaginatorIntlBase {
  constructor(private translate: TranslateService) {
    super();

    // Quando o idioma mudar, atualize todos os textos
    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });

    // Inicialize os textos na primeira carga
    this.getAndInitTranslations();
  }

  getAndInitTranslations(): void {
    // Carrega as traduções usando as chaves do seu arquivo JSON em camelCase
    this.translate
      .get([
        'components.shared.table.paginator.itemsPerPage',
        'components.shared.table.paginator.nextPage',
        'components.shared.table.paginator.previousPage',
        'components.shared.table.paginator.firstPage',
        'components.shared.table.paginator.lastPage',
      ])
      .subscribe((translation) => {
        this.itemsPerPageLabel =
          translation['components.shared.table.paginator.itemsPerPage'];
        this.nextPageLabel =
          translation['components.shared.table.paginator.nextPage'];
        this.previousPageLabel =
          translation['components.shared.table.paginator.previousPage'];
        this.firstPageLabel =
          translation['components.shared.table.paginator.firstPage'];
        this.lastPageLabel =
          translation['components.shared.table.paginator.lastPage'];

        this.changes.next();
      });
  }

  // Sobrescreva o método getRangeLabel, usando instantâneo para simplicidade dentro da função
  override getRangeLabel = (
    page: number,
    pageSize: number,
    length: number,
  ): string => {
    if (length === 0 || pageSize === 0) {
      // Usa translate.instant() pois este método pode ser chamado frequentemente
      return this.translate.instant(
        'components.shared.table.paginator.rangeLabelNoItems',
        { length },
      );
    }

    const startIndex = page * pageSize;
    const endIndex =
      startIndex < length
        ? Math.min(startIndex + pageSize, length)
        : startIndex + pageSize;

    return this.translate.instant(
      'components.shared.table.paginator.rangeLabelWithItems',
      {
        startIndex: startIndex + 1,
        endIndex,
        length,
      },
    );
  };
}
