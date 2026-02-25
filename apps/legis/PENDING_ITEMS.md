# Relatório de Itens Pendentes - Legis.Urbis

Este documento lista os requisitos da documentação que ainda não foram totalmente implementados ou que precisam de refinamento no projeto `apps/legis`.

## 1. Originais Normativos - Cadastro e Ferramentas

### Biblioteca local de normativas
- [ ] Implementar repositório para biblioteca local de normativas em variados formatos (.pdf, .doc, .docx, .xls, .xlsx, .jpg, .gif, .txt, .html).
- [ ] Endereçamento por URL interna.

### Validações de Índice
- [ ] Implementar alerta: "Artigos e parágrafos em geral iniciam por número" (se Tipo Parágrafo com Índice != “único”, ou Tipo Artigo não inicia por número).
- [ ] Implementar alerta: "Artigos e parágrafos de 1 a 9 em geral são seguidos por sinal ordinal (“º”)" (se não houver símbolo ordinal).
- [ ] Implementar alerta: "Partes, Livros, Títulos, Capítulos, Seções, Subseções ou Incisos em geral iniciam com número romano".
- [ ] Implementar alerta: "Alíneas em geral iniciam com letras minúsculas".
- [ ] Implementar alerta: "Não é necessário incluir o fechamento de parêntesis (“)”) no final da alínea".
- [ ] Implementar alerta: "Não é necessário incluir espaços ou pontuação ao final do item" (exceto Alínea).

### Estruturação Básica (Parser)
- [ ] Implementar ferramenta para gerar automaticamente Elementos normativos a partir de texto simples.
- [ ] Normalização de ordinais (“º”, “°”, “ᵒ”, “∘”, “o”) para “º”.

### Vigência em 
- [ ] Implementar mensagem de confirmação sobre preenchimento automático de vigência antes de salvar.

### Tabelas
- [ ] Identificação automática de índices de tabelas. e poder controlar isso e transformar uma linha em um elemento normativo individualmente no editor e na visuzacao 

Mapas

- verificar validacoes do mapa se quando coloca um texto e imagem de mapa ele já vincula automaticamente esse fluxo 

## 2. Visualização de Originais

### Tabelas - Mesclagem Dinâmica
- [ ] Destaque visual para cabeçalhos.

### Mapas - Renderização
- [ ] Renderização da Tela (imagem) com resolução configurável.

### Notas - Posicionamento
- [ ] Implementar exibição de índices de notas sobrescritos <sup>(1)</sup> após o texto do elemento ou célula.

## 3. Situações Especiais

### Trechos de Texto Normativo (Índice de Palavras)
- [ ] Implementar parser de texto por espaços/quebras de linha para criar índice de palavras. (já deve existir algo so revisar e ver os requisitos)
- [ ] Implementar função de extração baseada em índices de palavras (estável contra correções de caracteres). (já deve existir algo so revisar e ver os requisitos)
- [ ] Adicionar "[...]" automaticamente ao omitir trechos. (já deve existir algo no maximo revisar)
- [ ] Implementar ferramenta visual de seleção de trechos para preenchimento de índices.

### Dispositivo com Estrutura Completa
- [ ] Implementar função recursiva que retorna a estrutura completa (ex: "Art. 179 [...] § 3º [...] II").
- [ ] Implementar versões "com quebra de linha" e "em linha".
- [ ] Incluir identificação da norma para contextos externos (Autoridade, Tipo, Número/Ano).

### Lógica de Estilização por Situação
- [ ] **Tachado**: Texto extinto, sem vigor ou eficácia.
- [ ] **Sublinhado**: Texto com interpretação específica.
- [ ] **Azul**: Texto novo em vigor.
- [ ] **Laranja**: Texto em vigor mas objeto de disputa (Derrubada de veto ou Repristinação).
- [ ] **Vermelho**: Texto sem vigor (não iniciado, futuro extinto ou futuro sem vigor).

### Casos Específicos de Situações
- [ ] **Derrubada de Veto**: Exibição em laranja das partes onde o veto foi derrubado.
- [ ] **Renumeração**: Exibição da chave anterior (tachada) seguida da nova (azul negrito).
- [ ] **Nova Redação**: Desconsiderar aspas (", «, etc.) ao extrair trechos de novas redações.
- [ ] **Acréscimo**: Inserção de novos elementos na sequência original com marcação azul.
- [ ] **Repristinação**: Destachar texto anteriormente revogado e exibir em laranja.

## 4. Coletâneas Temáticas

### Omissão e Suplementação de Texto
- [ ] Ferramenta para inserir trechos entre colchetes e em itálico (ex: _[15,4m]_).