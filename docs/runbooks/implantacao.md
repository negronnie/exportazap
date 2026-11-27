# Implantação no homelab

Coloca o ExportaZap no ar em `exportazap.com.br`, a partir da imagem `negronnie/exportazap` do Docker Hub (ADR 0008). O site é estático: não há banco, segredo nem dado para guardar no servidor.

## 1. Versões e imagens

1. **Gerar Release e Tag** (Actions → *Gerar Release e Tag* → *Run workflow*, na `main`). Roda o CI (testes, build e ponta a ponta), calcula a versão pelos commits desde a última tag `v*`, atualiza o `CHANGELOG.md`, a versão do frontend e o selo do README num commit `chore(release): vX.Y.Z`, cria a tag e a release no GitHub e chama o *Publicar Imagens*. A primeira release sai como `v0.1.0`.
2. **Publicar Imagens** publica `negronnie/exportazap` no Docker Hub, para amd64 e arm64, com as tags `latest` e `vX.Y.Z`. Também roda quando alguém empurra uma tag `v*.*.*`; disparado à mão, a imagem sai como `build-N`.

O incremento, na primeira regra que se aplicar:

| Condição | Incremento | A partir de `v0.1.0` |
|---|---|---|
| Checkbox **Nova versão major (X.0.0)** marcado ao disparar | major | `v1.0.0` |
| Algum commit de quebra: `!` antes dos dois-pontos (`feat!:`) ou rodapé `BREAKING CHANGE:` | minor | `v0.2.0` |
| Qualquer outro caso (`feat`, `fix`, `chore`…) | patch | `v0.1.1` |

O que o repositório precisa (Settings → Secrets and variables → Actions):

- Segredos `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` (access token do Docker Hub com leitura e escrita).
- Segredo `CLAUDE_CODE_OAUTH_TOKEN`, para a revisão automática dos PRs.
- Opcional: segredo `GH_PAT`, usado no lugar do `GITHUB_TOKEN` para empurrar o commit da versão na `main`.

## 2. Primeira subida

No servidor do homelab, que já tem o nginx-proxy-manager na rede `homelab_proxy`:

1. Copie a pasta `deploy/` do repositório para o servidor, por exemplo `homelab/exportazap/`.
2. Suba:

   ```bash
   docker compose pull
   docker compose up -d
   ```

3. No nginx-proxy-manager, crie o proxy host `exportazap.com.br` (e `www.exportazap.com.br`) apontando para `http://exportazap:80`, o nome do serviço na rede `homelab_proxy`.
4. No Cloudflare, adicione os mesmos nomes ao túnel do homelab, apontando para o nginx-proxy-manager, como nos outros sites.

O container roda com o sistema de arquivos só de leitura e sem novos privilégios; ele só escreve no espaço temporário do nginx.

## 3. Atualizar a cada release

```bash
docker compose pull
docker compose up -d
```

O compose usa sempre a última release (`latest`). Quem já instalou o app recebe a versão nova na próxima visita: o service worker e o manifesto são sempre revalidados.

## 4. Voltar para a versão anterior

```bash
IMAGE_TAG=v0.1.0 docker compose up -d
```

A variável na linha de comando vale mais que o padrão do compose; o próximo `pull` + `up -d` sem ela volta para a última release.

## 5. Conferir

```bash
curl -sI https://exportazap.com.br/ | grep -i content-security-policy
```

- A resposta traz a política que só permite a própria origem (`default-src 'self'`).
- O site abre, importa uma exportação e gera as saídas; a aba Rede do navegador não mostra nenhuma requisição para fora.
- `https://exportazap.com.br/#privacidade` abre a página de privacidade.

## 6. Hospedar por conta própria

Qualquer pessoa pode rodar o ExportaZap no próprio computador, sem o homelab:

```bash
docker run -d --name exportazap -p 8080:80 --read-only --tmpfs /var/cache/nginx --tmpfs /var/run --tmpfs /tmp negronnie/exportazap
```

E abrir `http://localhost:8080`.
