# Implantação no homelab

Coloca o ExportaZap no ar em https://exportazap.negronnie.com.br, a partir da imagem `negronnie/exportazap` do Docker Hub (ADR 0008). O site é estático: não há banco, segredo nem dado para guardar no servidor. O domínio próprio `exportazap.com.br` fica para depois ([#65](https://github.com/negronnie/exportazap/issues/65)).

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

No servidor do homelab, que já tem o nginx-proxy-manager e o `cloudflared` na rede `homelab_proxy`:

1. Copie a pasta `deploy/` do repositório para o servidor, em `homelab/exportazap/`.
2. Suba:

   ```bash
   docker compose pull
   docker compose up -d
   ```

3. No nginx-proxy-manager (porta 81), crie o proxy host `exportazap.negronnie.com.br` apontando para `http` · `exportazap` · `80`, o nome do serviço na rede `homelab_proxy`. Ligue *Block Common Exploits* e deixe o SSL desligado: o HTTPS termina no Cloudflare, como nos outros sites.
4. No Cloudflare, em *Networking → Tunnels → homelab → Routes → Add route → Published application*, adicione o hostname `exportazap.negronnie.com.br` com o serviço `http://nginx-proxy:80`. O registro DNS (CNAME para o túnel) é criado junto.

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
curl -sI https://exportazap.negronnie.com.br/ | grep -i content-security-policy
```

- A resposta traz a política que só permite a própria origem (`default-src 'self'`).
- O site abre, importa uma exportação e gera as saídas; a aba Rede do navegador não mostra nenhuma requisição para fora.
- `https://exportazap.negronnie.com.br/#privacidade` abre a página de privacidade.

O Cloudflare injeta no HTML um script de detecção de bots, configurado para toda a zona `negronnie.com.br`. A CSP o bloqueia, e o site funciona igual. Na primeira visita, antes do service worker, isso pode aparecer como um aviso de CSP no console; depois a página vem do cache, sem o script.

## 6. Hospedar por conta própria

Qualquer pessoa pode rodar o ExportaZap no próprio computador, sem o homelab:

```bash
docker run -d --name exportazap -p 8080:80 --read-only --tmpfs /var/cache/nginx --tmpfs /var/run --tmpfs /tmp negronnie/exportazap
```

E abrir `http://localhost:8080`.
