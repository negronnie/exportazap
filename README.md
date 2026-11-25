# ZapPrint

<a href="https://github.com/negronnie/zapprint/releases/latest"><img alt="Versão" src="https://img.shields.io/badge/vers%C3%A3o-v0.1.0-6366f1"></a>
<a href="https://github.com/negronnie/zapprint/actions/workflows/release.yml"><img alt="Gerar Release e Tag" src="https://github.com/negronnie/zapprint/actions/workflows/release.yml/badge.svg"></a>
<a href="https://github.com/negronnie/zapprint/actions/workflows/images.yml"><img alt="Publicar Imagens" src="https://github.com/negronnie/zapprint/actions/workflows/images.yml/badge.svg"></a>

ZapPrint transforma uma conversa exportada do WhatsApp (o `.zip` ou o `.txt`) em uma conversa visual, navegável e pronta para compartilhar. Ler uma exportação crua é uma experiência ruim: um arquivo de texto, mídias nomeadas como código e a busca manual por cada anexo. Com o ZapPrint, você importa a conversa, escolhe o intervalo de data e hora que quer compartilhar e salva o resultado como PDF, como uma página HTML baixável (zipada) ou como prints, em várias imagens ou em uma só, comprida.

Roda hospedado, para acessar pelo navegador, e também pode ser hospedado localmente: o código é aberto, sob a [licença MIT](./LICENSE).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `frontend/` | Interface — React 19, TypeScript, Vite 8, Vitest; servida por nginx na imagem Docker |
| `.github/workflows/` | CI, release com git-cliff e publicação das imagens no Docker Hub |

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
```

### Imagem Docker

```bash
docker build -t zapprint frontend
docker run --rm -p 8080:80 zapprint   # http://localhost:8080
```

## Versões e imagens

As versões seguem o [Conventional Commits](https://www.conventionalcommits.org): o workflow **Gerar Release e Tag** (disparado à mão em Actions) roda o CI, calcula a próxima versão a partir dos commits, atualiza o `CHANGELOG.md`, cria a tag e a release e publica as imagens. A primeira versão é a `v0.1.0`.

As imagens ficam no Docker Hub, para amd64 e arm64, com as tags `latest` e a da versão:

```bash
docker pull negronnie/zapprint:latest
```

## Status

- Fase 0 — definição do produto e estrutura do repositório (CI, release e imagens): em andamento.
