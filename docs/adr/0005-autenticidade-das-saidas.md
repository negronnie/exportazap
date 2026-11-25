# Autenticidade das saídas

Uma imagem idêntica a um print do WhatsApp, feita a partir de um `.txt` que qualquer um edita, serve para forjar conversas, e saídas confusas perdem valor como prova. Por isso toda saída é identificável e conferível:

- a marca ExportaZap no rodapé de cada print e de cada página do PDF;
- a página de rosto do PDF, com o hash SHA-256 da exportação do WhatsApp, o recorte, as ocultações aplicadas e a data de geração;
- a mensagem ocultada aparece como "mensagem ocultada", em vez de sumir;
- todo anexo, inclusive figurinha, mostra o nome do arquivo de origem;
- não há ticks de leitura, porque a exportação não traz essa informação e mostrá-los seria inventar.
