// The privacy page (ADR 0007): what happens to the chat, and how anyone can check it.

import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="space-y-2 text-[15px] leading-relaxed">{children}</div>
    </section>
  )
}

export function PrivacyScreen() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <a href="#" className="inline-flex items-center gap-2 text-accent-strong">
        <ArrowLeft size={18} /> Voltar
      </a>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Privacidade</h1>
        <p className="text-muted">Em resumo: a conversa que você importa nunca sai do seu aparelho.</p>
      </header>

      <Section title="O que acontece com a conversa">
        <p>
          O ExportaZap lê a exportação do WhatsApp dentro do seu navegador. A conversa, as fotos, os áudios e os documentos não são enviados para
          nenhum servidor, nem para o nosso: o site é só um conjunto de arquivos que o navegador baixa uma vez e roda no seu aparelho.
        </p>
        <p>
          Nada é guardado. A conversa fica na memória da aba e some quando você a fecha ou recarrega. Os PDFs, prints e pacotes HTML são gerados no
          aparelho e salvos onde você escolher.
        </p>
      </Section>

      <Section title="Sem cookies e sem métricas">
        <p>O ExportaZap não usa cookies, não conta visitas e não tem nenhum serviço de terceiros. A única coisa que ele guarda no navegador é o tema, claro ou escuro, que você escolheu.</p>
      </Section>

      <Section title="Como conferir">
        <p>Você não precisa acreditar só nesta página:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            O site envia uma política de segurança (<span className="font-mono text-sm">Content-Security-Policy</span>) que proíbe o navegador de
            conectar a qualquer outro endereço. Mesmo que algum código tentasse enviar a conversa, o navegador bloquearia.
          </li>
          <li>
            Abra as ferramentas do desenvolvedor do navegador (F12), vá na aba <strong>Rede</strong> e importe uma conversa: nenhuma requisição leva
            a conversa para fora.
          </li>
          <li>Depois da primeira visita, o ExportaZap funciona sem internet. Desligue a rede e use normalmente.</li>
          <li>
            O código é aberto:{' '}
            <a href="https://github.com/negronnie/exportazap" target="_blank" rel="noopener noreferrer" className="text-link underline">
              github.com/negronnie/exportazap
            </a>
            . Quem preferir pode rodar o ExportaZap no próprio computador.
          </li>
        </ul>
      </Section>

      <Section title="Quando você compartilha">
        <p>
          O que você exporta passa a ser responsabilidade sua: a conversa tem dados de outras pessoas. Use o recorte e a ocultação (apelidos, máscara
          de números e mensagens ocultas) para compartilhar só o necessário. Documentos anexados vão como estão, sem ocultação.
        </p>
      </Section>
    </main>
  )
}
