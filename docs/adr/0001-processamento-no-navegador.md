# Processamento 100% no navegador, sem backend na v1

Exportações do WhatsApp são conversas íntimas, de quem exporta e de terceiros, e chegam a ter vários GB. Na v1, o ExportaZap lê, mostra e gera as saídas inteiramente no navegador: nenhum dado da conversa é enviado a um servidor, não há backend e não há banco de dados. A versão pública é um site estático (a imagem Docker com nginx), e quem hospeda por conta própria roda a mesma imagem.

## Considered Options

- **Upload para um servidor**, com o parse e o armazenamento no backend (Postgres na versão hospedada, SQLite para quem hospeda por conta própria). Rejeitada na v1: tornaria o ExportaZap controlador de dados pessoais sensíveis de terceiros (LGPD), com custo de armazenamento e banda proporcional ao tamanho das exportações.

## Consequences

- A v1 é de uso único: recarregar ou fechar a aba perde a conversa, e a tela avisa antes de sair. A persistência local está na issue #4.
- O `.zip` precisa ser lido aos poucos, sem carregar o arquivo inteiro na memória.
- Backend, Postgres e SQLite voltam na v2, junto com o link compartilhável, que precisa de servidor por natureza.
