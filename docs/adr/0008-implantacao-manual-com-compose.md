# Implantação manual com Docker Compose

A versão pública roda no homelab, atrás do Cloudflare, a partir da imagem `negronnie/exportazap` do Docker Hub. O repositório tem um `deploy/docker-compose.yml` e um roteiro de implantação. A cada release, quem opera o servidor roda `docker compose pull && docker compose up -d`. O túnel e o proxy do Cloudflare são configurados onde já estão hoje, fora do repositório.

## Considered Options

- **Implantação pelo CI via SSH.** Rejeitada: daria ao GitHub acesso ao servidor do homelab, e um site estático com releases esporádicas não precisa disso.
- **Watchtower atualizando a `latest` sozinho.** Possível mais tarde; por ora a troca de versão fica sob controle de quem opera.
