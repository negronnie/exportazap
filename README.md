# ExportaZap

<a href="https://github.com/negronnie/exportazap/releases/latest"><img alt="Versão" src="https://img.shields.io/badge/vers%C3%A3o-v0.1.0-6366f1"></a>
<a href="https://github.com/negronnie/exportazap/actions/workflows/release.yml"><img alt="Gerar Release e Tag" src="https://github.com/negronnie/exportazap/actions/workflows/release.yml/badge.svg"></a>
<a href="https://github.com/negronnie/exportazap/actions/workflows/images.yml"><img alt="Publicar Imagens" src="https://github.com/negronnie/exportazap/actions/workflows/images.yml/badge.svg"></a>

ExportaZap transforma uma conversa exportada do WhatsApp (o `.zip` ou o `.txt`) em uma conversa visual, navegável e pronta para compartilhar. Ler uma exportação crua é uma experiência ruim: um arquivo de texto, mídias nomeadas como código e a busca manual por cada anexo. Com o ExportaZap, você importa a conversa, escolhe o intervalo de data e hora que quer compartilhar e salva o resultado como PDF, como uma página HTML baixável (zipada) ou como prints, em várias imagens ou em uma só, comprida.

Tudo acontece no navegador de quem usa: a conversa não é enviada para nenhum servidor, o site funciona offline depois da primeira visita e uma política de segurança impede o navegador de conectar a qualquer outro endereço. Antes de compartilhar, dá para recortar o trecho, dar apelidos aos participantes, mascarar os números de telefone e ocultar mensagens.

Roda hospedado, em https://exportazap.negronnie.com.br, e também pode ser hospedado localmente: o código é aberto, sob a [licença MIT](./LICENSE).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `frontend/` | O app: React 19, TypeScript, Vite 8, Tailwind CSS 4, Zustand; PDF com `@react-pdf/renderer`, prints com `modern-screenshot`, PWA com `vite-plugin-pwa`. Servido por nginx na imagem Docker |
| `frontend/src/viewer/` | O visualizador só de leitura do pacote HTML, construído num arquivo único |
| `fixtures/` | Exportações sintéticas para os testes (e as reais, só na máquina de quem desenvolve) |
| `deploy/` | Compose da versão pública no homelab |
| `.github/workflows/` | CI, release com git-cliff e publicação das imagens no Docker Hub |
| `docs/` | Decisões de arquitetura (ADRs) e roteiros |

## Documentação

- [CONTEXT.md](./CONTEXT.md) — glossário do domínio
- [docs/adr](./docs/adr) — decisões de arquitetura
- [docs/runbooks/implantacao.md](./docs/runbooks/implantacao.md) — versões, imagens e implantação no homelab

## Desenvolvimento

Requisitos: Node 24+ e Docker (só para a imagem).

**Frontend** — porta 5173:
```bash
cd frontend
npm ci
npm run dev
```

### Testes

```bash
cd frontend && npm run lint && npm test && npm run build
cd frontend && npx playwright install --only-shell chromium && npm run test:e2e  # fluxos principais no build
```

Os testes ponta a ponta importam uma exportação sintética, ajustam o recorte, ocultam uma mensagem e geram todas as saídas, e falham se a página fizer qualquer requisição para fora do site.

Os testes da importação usam as exportações sintéticas de `fixtures/sinteticas/`, geradas por `node fixtures/sinteticas/gerar.mjs`. Exportações reais, anonimizadas, ficam em `fixtures/privadas/`, que o git ignora: quando a pasta existe, os testes também conferem essas exportações, olhando só contagens e a ordem das datas, sem mostrar o conteúdo.

### Imagem Docker

```bash
docker build -t exportazap frontend
docker run --rm -p 8080:80 exportazap  # http://localhost:8080
```

## Versões e imagens

As versões seguem o [Conventional Commits](https://www.conventionalcommits.org): o workflow **Gerar Release e Tag** (disparado à mão em Actions) roda o CI, calcula a próxima versão a partir dos commits, atualiza o `CHANGELOG.md`, cria a tag e a release e publica as imagens. A primeira versão é a `v0.1.0`; as versões ficam em `0.x` enquanto a v1 é construída, e a `1.0.0` sai quando o milestone v1 fechar.

As imagens ficam no Docker Hub, para amd64 e arm64, com as tags `latest` e a da versão:

```bash
docker pull negronnie/exportazap:latest
```

## Hospedar por conta própria

```bash
docker run -d --name exportazap -p 8080:80 --read-only --tmpfs /var/cache/nginx --tmpfs /var/run --tmpfs /tmp negronnie/exportazap
```

E abra `http://localhost:8080`. A imagem é só o site estático: não guarda dado nenhum. A implantação da versão pública está em [docs/runbooks/implantacao.md](./docs/runbooks/implantacao.md).

## Créditos

Os emoji são do [Noto Emoji](https://github.com/googlefonts/noto-emoji), do Google, sob a licença Apache 2.0. O papel de parede é próprio, gerado por `frontend/scripts/fundo.mjs`.

## Status

- Fase 0 — definição do produto e estrutura do repositório: concluída.
- v1 — a conversa no navegador, com as três saídas e a versão pública: no ar desde a `v0.1.0` ([milestone v1](https://github.com/negronnie/exportazap/milestone/2)).
- v2 — versão hospedada, com link compartilhável, e o que ficou de fora da v1 ([milestone v2](https://github.com/negronnie/exportazap/milestone/1)).

O roadmap completo está nas issues de épico do repositório.
