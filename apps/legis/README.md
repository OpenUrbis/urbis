# Urbis Legis (`@open-urbis/legis`)

Aplicação web para editoração, formatação, inspeção e controle de versões de legislação territorial municipal, desenvolvida com **React 18**, **Vite**, **Tiptap** e **Tailwind CSS**.

---

## 🚀 Execução em Desenvolvimento

```bash
pnpm --filter @open-urbis/legis dev
```

A aplicação estará acessível em: `http://localhost:5175`

---

## ⚙️ Principais Funcionalidades

- **Editor Normativo Rico**: Editor de texto baseado em Tiptap com suporte a artigos, parágrafos, incisos, alíneas e tabelas.
- **Auto-Estruturação**: Formatação e estruturação automática de minutas e textos legais.
- **Visualizador de Diffs**: Comparação visual lado a lado entre versões de leis e atos normativos.
- **Integração Territorial**: Vinculação entre dispositivos legais e perímetros/zonas territoriais mapeadas.

---

## 🏗️ Build de Produção

```bash
pnpm --filter @open-urbis/legis build
```

---

## 🧪 Testes

```bash
pnpm --filter @open-urbis/legis test
```

---

## Vigência condicionada e situações especiais

### Cadastro de vigência condicionada

Quando a entrada em vigor de um documento ou Elemento depender de uma
condição, não informe uma data fictícia. Nos campos de vigência, use o botão
**Condicionada**. O valor persistido é `vigência condicionada` e é exibido ao
leitor como **Vigência condicionada**.

### Acréscimo normativo

Um `Acréscimo` não deve ser digitado como texto livre nem receber uma origem
informada manualmente. O fluxo correto é:

1. selecionar o comando **Acréscimo Normativo**;
2. vincular o Elemento normativo que acrescenta o conteúdo;
3. selecionar o trecho do Elemento de origem — ou confirmar o Elemento inteiro;
4. concluir para inserir o novo Elemento com o vínculo e o trecho persistidos.

O texto do novo Elemento é derivado do vínculo (`sourceDocumentId`,
`relatedDeviceId` e `sourceTrechos`).

A mesma opção pode ser usada em:

- vigência original inicial e final;
- vigência inicial alterada;
- vigência final alterada.

A data exibida para um Elemento deve seguir esta precedência:

1. última vigência inicial/final alterada configurada para o Elemento;
2. vigência original do Elemento;
3. vigência configurada para o Original normativo.

A data do ato modificador não substitui a vigência efetiva do Elemento.

### Agrupamentos da visualização pública

As situações são agrupadas no leitor em **Vetos e Derrubadas de Veto**,
**Renumerações e Novas redações**, **Retiradas e restaurações de
vigor/eficácia**, **Interpretações constitucionais**, **Acréscimos, Extinções
e Repristinações** e **Vigência não iniciada ou finalizada**.

O seletor do Admin mantém os nomes de cadastro, incluindo **Vigência inicial
alterada** e **Vigência final alterada**. Essa diferença é apenas de
apresentação; os registros persistidos continuam usando os tipos canônicos do
modelo.
