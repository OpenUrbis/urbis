# Resumo de Implementação: Legis.Urbis

Este documento detalha as ações técnicas realizadas para implementar os requisitos do sistema Legis.Urbis no repositório `apps/legis`.

## 1. Visão Geral

O objetivo principal foi transformar o sistema existente (baseado em "Páginas" genéricas) em um sistema robusto capaz de gerenciar **Originais Normativos** (estrutura hierárquica complexa, versionamento, situações especiais) e **Coletâneas Temáticas** (agregadores de conteúdo).

## 2. Mapeamento de Requisitos e Implementações

### 2.1. Estrutura de Dados e Tipos
**Requisito**: Diferenciação entre "Original Normativo" e "Coletânea Temática", com metadados específicos para cada um (Autoridade, Tipo Normativo, Datas vs Categoria, Tema).

**Ações Tomadas**:
*   **Arquivo**: `apps/legis/src/domain/entities.ts`
    *   Criação das interfaces `OriginalNormativo` e `ColetaneaTematica`.
    *   Definição de tipos literais para `NORMATIVE_TYPES` (Leis, Decretos, etc.) e `AUTHORITIES_MOCK` (Brasil, Prefeitura SP, etc.).
    *   Definição da estrutura `NormativeElementEntity` para suportar hierarquia e situações especiais.
*   **Arquivo**: `apps/legis/src/types/page.ts`
    *   Atualização do tipo `Page` para atuar como um adaptador híbrido, permitindo que o sistema suporte tanto o formato legado quanto as novas entidades estruturadas.

### 2.2. Cadastro de Originais Normativos
**Requisito**: Tela de cadastro com campos específicos (Tipo, Número, Autoridade, Ementa) e validações.

**Ações Tomadas**:
*   **Arquivo**: `apps/legis/src/components/page/NormativeMetadataForm.tsx`
    *   Criação de um formulário dedicado para metadados normativos.
    *   Integração com calendários para "Data do Ato" e "Data de Publicação".
    *   Selects populados com os tipos e autoridades definidos no domínio.
*   **Arquivo**: `apps/legis/src/components/page/PageForm.tsx`
    *   Refatoração do formulário principal para alternar dinamicamente entre o modo "Original Normativo" (exibindo o novo formulário de metadados) e "Coletânea Temática" (exibindo campos de autor/categoria).

### 2.3. Estruturação e Hierarquia
**Requisito**: Ferramenta para estruturação básica (parsing de texto) e definição de filiação (Pai/Filho) dos dispositivos.

**Ações Tomadas**:
*   **Arquivo**: `apps/legis/src/domain/rules-engine.ts`
    *   Expansão das regras de regex para suportar todos os tipos de elementos (Parte, Livro, Título, Capítulo, Seção, Artigo, Parágrafo, Inciso, Alínea, Item).
    *   Normalização de índices.
*   **Arquivo**: `apps/legis/src/components/page/NormativeHierarchyTool.tsx`
    *   Criação de uma ferramenta visual para revisar a hierarquia.
    *   Implementação de algoritmo "Auto-Estruturar" que infere a paternidade com base na ordem e tipo dos elementos.
    *   Interface para re-parenting manual de elementos.

### 2.4. Situações Especiais e Versionamento
**Requisito**: Gestão de alterações na norma (Vetos, Nova Redação, Revogações) com controle de vigência e exibição diferenciada.

**Ações Tomadas**:
*   **Arquivo**: `apps/legis/src/components/page/SpecialSituationsPanel.tsx`
    *   Painel lateral ("Painel Auxiliar") para adicionar e gerenciar situações especiais em cada dispositivo.
    *   Suporte a tipos como Veto, Revogação, Nova Redação, Renumeração.
    *   Design limpo e discreto para referência de texto, preservando formatação.
*   **Arquivo**: `apps/legis/src/domain/display-logic.ts`
    *   Implementação da função `getValidityStatus` que determina se um dispositivo está ativo, revogado ou com vigência futura, considerando datas e situações especiais cadastradas.
    *   Lógica para formatação de chaves (ex: "Art. 1º", "§ 2º").

### 2.5. Visualização (Design System Normativo)
**Requisito**: Exibição rigorosa da norma, com estilos específicos para cada parte (Epígrafe, Ementa, Articulação) e feedback visual de situações (tachado, azul).

**Ações Tomadas**:
*   **Arquivo**: `apps/legis/src/components/page/NormativeRenderer.tsx`
    *   Componente de renderização que substitui o editor de texto rico no modo de visualização.
    *   Aplica indentação progressiva baseada no tipo do elemento.
    *   **Indicadores Laterais Interativos**: Coluna à direita com ícones coloridos indicando situações especiais (Veto, Revogação, Nova Redação). Ao clicar, um Popover exibe os detalhes.
    *   **Formatação Rica**: Suporte a HTML no texto para manter negrito/itálico.
    *   Renderiza estilos condicionais:
        *   **Tachado**: Para textos revogados ou vetados.
        *   **Azul**: Para textos de "Nova Redação" inseridos dinamicamente.
        *   **Centralizado/Negrito**: Para títulos e capítulos.
    *   Suporte básico para renderização de Tabelas e Mapas estruturados.
*   **Arquivo**: `apps/legis/src/pages/PageView.tsx`
    *   Integração condicional: se o conteúdo for um Original Normativo, usa o `NormativeRenderer`; caso contrário, usa o visualizador padrão.

## 3. Resumo de Arquivos Criados/Modificados

| Arquivo | Status | Responsabilidade |
|---------|--------|------------------|
| `domain/entities.ts` | **Novo** | Definição dos modelos de dados canônicos. |
| `domain/rules-engine.ts` | **Modificado** | Regras de parsing de texto para estrutura normativa. |
| `domain/display-logic.ts` | **Modificado** | Lógica de vigência e formatação de texto. |
| `domain/text-utils.ts` | **Novo** | Utilitários para indexação de palavras. |
| `domain/mocks.ts` | **Modificado** | Dados de teste atualizados com novas estruturas. |
| `services/page-service.ts` | **Refatorado** | Camada de serviço adaptada para salvar/carregar novas entidades. |
| `components/page/NormativeMetadataForm.tsx` | **Novo** | Formulário de metadados normativos. |
| `components/page/NormativeHierarchyTool.tsx` | **Novo** | Ferramenta de gestão de hierarquia. |
| `components/page/SpecialSituationsPanel.tsx` | **Novo** | Painel de gestão de vetos/alterações. |
| `components/page/NormativeRenderer.tsx` | **Novo** | Motor de renderização visual da norma com indicadores interativos. |
| `components/page/PageForm.tsx` | **Modificado** | Integração de todas as ferramentas de edição. |
| `pages/PageView.tsx` | **Modificado** | Integração da visualização especializada. |
