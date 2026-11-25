# PDF gerado pelo app e PDF pela impressão do navegador

O diálogo de exportação oferece os dois caminhos para PDF. O **PDF gerado pelo app** (`@react-pdf/renderer`, num Web Worker) baixa direto, com texto vetorial, selecionável e pesquisável, o que importa porque muita gente exporta conversas para usar como prova. A **impressão do navegador** usa o mesmo desenho da tela e não depende do segundo renderizador, mas passa pelo diálogo "Imprimir → Salvar como PDF", que muda conforme o navegador e o aparelho.

## Considered Options

- **PDF feito de prints empilhados.** Rejeitada: o texto não é selecionável nem pesquisável, e o arquivo fica pesado.

## Consequences

- As bolhas têm dois desenhos, um em DOM e outro em componentes do react-pdf, que precisam continuar parecidos. A página de rosto e a marca existem nos dois.
