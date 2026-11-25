// The contact or group info screen, as in WhatsApp: the numbers of the chat, the media, links and
// documents, and each participant with the alias and the picture set by hand.

import { ArrowLeft, ChevronRight, FileText, Link2, Play, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { participantColor } from '../colors.ts'
import { useMedia } from '../media.ts'
import type { Message } from '../model.ts'
import { chatStats, gallery, type ActivityStats } from '../stats.ts'
import { useChat, useDisplayName } from '../store.ts'
import { formatDate, formatTime, summarize } from '../summary.ts'
import { ActivityChart } from './ActivityChart.tsx'
import { Avatar } from './Avatar.tsx'

type View = { kind: 'chat' } | { kind: 'participant'; name: string } | { kind: 'gallery'; tab: 'media' | 'links' | 'docs' }

const count = (value: number, one: string, many: string) => `${value.toLocaleString('pt-BR')} ${value === 1 ? one : many}`

function Section({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="space-y-3 bg-panel px-5 py-4">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-muted">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function StatsGrid({ stats }: { stats: ActivityStats }) {
  const items = [
    [count(stats.messages, 'mensagem', 'mensagens'), 'escritas'],
    [count(stats.attachments, 'anexo', 'anexos'), 'enviados'],
    [stats.first ? formatDate(stats.first) : '—', 'primeira mensagem'],
    [stats.last ? formatDate(stats.last) : '—', 'última mensagem'],
  ]
  return (
    <dl className="grid grid-cols-2 gap-3">
      {items.map(([value, label]) => (
        <div key={label}>
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Thumbnail({ message, onOpen }: { message: Message; onOpen: () => void }) {
  const source = useChat((state) => state.imported?.source)
  const media = useMedia(source, message.attachment!.fileName)
  const video = message.attachment!.kind !== 'image'
  return (
    <button type="button" onClick={onOpen} className="relative aspect-square overflow-hidden rounded-md bg-chip">
      {media.status === 'ready' &&
        (video ? (
          <video src={`${media.url}#t=0.1`} preload="metadata" muted className="size-full object-cover" />
        ) : (
          <img src={media.url} alt="" className="size-full object-cover" />
        ))}
      {video && <Play size={18} className="absolute right-1 bottom-1 text-white drop-shadow" />}
    </button>
  )
}

function GalleryView({ tab, onTab, onJump }: { tab: 'media' | 'links' | 'docs'; onTab: (tab: 'media' | 'links' | 'docs') => void; onJump: (message: Message) => void }) {
  const imported = useChat((state) => state.imported)!
  const items = useMemo(() => gallery(imported.parsed.entries, (name) => imported.source.files.has(name)), [imported])
  const tabs = [
    ['media', 'Mídia', items.media.length],
    ['links', 'Links', items.links.length],
    ['docs', 'Docs', items.documents.length],
  ] as const
  return (
    <>
      <div className="flex border-b border-line bg-panel">
        {tabs.map(([key, label, total]) => (
          <button
            key={key}
            type="button"
            onClick={() => onTab(key)}
            className={`flex-1 py-3 text-sm ${tab === key ? 'border-b-2 border-accent font-medium text-accent-strong' : 'text-muted'}`}
          >
            {label} ({total})
          </button>
        ))}
      </div>
      <div className="p-3">
        {tab === 'media' && (
          <div className="grid grid-cols-3 gap-1.5">
            {items.media.map((message) => (
              <Thumbnail key={message.index} message={message} onOpen={() => onJump(message)} />
            ))}
          </div>
        )}
        {tab === 'links' &&
          items.links.map(({ message, url }, i) => (
            <button key={i} type="button" onClick={() => onJump(message)} className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left hover:bg-chip">
              <Link2 size={20} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-link">{url}</span>
                <span className="block text-xs text-muted">
                  {formatDate(message.at)}, {formatTime(message.at)}
                </span>
              </span>
            </button>
          ))}
        {tab === 'docs' &&
          items.documents.map((message) => (
            <button key={message.index} type="button" onClick={() => onJump(message)} className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left hover:bg-chip">
              <FileText size={20} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{message.attachment!.displayName ?? message.attachment!.fileName}</span>
                <span className="block text-xs text-muted">{formatDate(message.at)}</span>
              </span>
            </button>
          ))}
        {((tab === 'media' && items.media.length === 0) ||
          (tab === 'links' && items.links.length === 0) ||
          (tab === 'docs' && items.documents.length === 0)) && <p className="py-8 text-center text-sm text-muted">Nada por aqui.</p>}
      </div>
    </>
  )
}

function ParticipantView({ name, stats }: { name: string; stats: ActivityStats }) {
  const { imported, self, aliases, avatars, setAlias, setAvatar } = useChat()
  const display = useDisplayName()
  const participants = imported!.parsed.participants
  return (
    <>
      <Section>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <Avatar name={display(name)} color={participantColor(participants, name)} picture={avatars[name]} size={96} />
          <div>
            <p className="text-xl font-medium break-words">{display(name)}</p>
            {aliases[name] && <p className="text-sm text-muted">Na exportação: {name}</p>}
            {name === self && <p className="text-sm text-muted">Você</p>}
          </div>
          <div className="flex gap-4 text-sm">
            <label className="cursor-pointer text-accent-strong">
              {avatars[name] ? 'Trocar foto' : 'Escolher foto'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const picture = event.target.files?.[0]
                  if (picture) setAvatar(name, picture)
                }}
              />
            </label>
            {avatars[name] && (
              <button type="button" onClick={() => setAvatar(name, null)} className="text-danger">
                Remover foto
              </button>
            )}
          </div>
        </div>
      </Section>
      <Section title="Apelido">
        <input
          value={aliases[name] ?? ''}
          onChange={(event) => setAlias(name, event.target.value)}
          placeholder={name}
          aria-label={`Apelido de ${name}`}
          className="w-full rounded-md border border-line bg-app px-3 py-2 outline-none focus:border-accent"
        />
        <p className="text-xs text-muted">O apelido substitui o nome na tela e nas exportações.</p>
      </Section>
      <Section title="Atividade">
        <StatsGrid stats={stats} />
        <ActivityChart hours={stats.hours} />
      </Section>
    </>
  )
}

export function InfoPanel({ onClose }: { onClose: () => void }) {
  const { imported, self, avatars, jumpTo } = useChat()
  const display = useDisplayName()
  const [view, setView] = useState<View>({ kind: 'chat' })
  const stats = useMemo(() => (imported ? chatStats(imported.parsed.entries) : null), [imported])
  const media = useMemo(
    () => (imported ? gallery(imported.parsed.entries, (name) => imported.source.files.has(name)) : null),
    [imported],
  )
  if (!imported || !stats || !media) return null

  const summary = summarize(imported)
  const { participants } = imported.parsed
  const partner = summary.isGroup ? null : participants.find((participant) => participant !== self) ?? null
  const title = partner ? display(partner) : summary.title
  const jump = (message: Message) => {
    jumpTo(message.index)
    onClose()
  }

  const heading =
    view.kind === 'participant' ? 'Dados do participante' : view.kind === 'gallery' ? 'Mídia, links e docs' : summary.isGroup ? 'Dados do grupo' : 'Dados do contato'

  return (
    <aside className="fixed inset-0 z-40 flex flex-col bg-app shadow-xl md:left-auto md:w-[420px]" aria-label={heading}>
      <header className="flex items-center gap-3 bg-bar px-3 py-3">
        {view.kind === 'chat' ? (
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-2 text-muted hover:bg-chip">
            <X size={20} />
          </button>
        ) : (
          <button type="button" onClick={() => setView({ kind: 'chat' })} aria-label="Voltar" className="rounded-full p-2 text-muted hover:bg-chip">
            <ArrowLeft size={20} />
          </button>
        )}
        <h2 className="font-medium">{heading}</h2>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-6">
        {view.kind === 'participant' && <ParticipantView name={view.name} stats={stats.byAuthor.get(view.name)!} />}
        {view.kind === 'gallery' && <GalleryView tab={view.tab} onTab={(tab) => setView({ kind: 'gallery', tab })} onJump={jump} />}
        {view.kind === 'chat' && (
          <>
            <Section>
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <Avatar
                  name={title}
                  color={partner ? participantColor(participants, partner) : '#8696a0'}
                  picture={partner ? avatars[partner] : undefined}
                  size={96}
                />
                <p className="text-xl font-medium break-words">{title}</p>
                <p className="text-sm text-muted">
                  {summary.isGroup ? `Grupo · ${count(participants.length, 'participante', 'participantes')}` : partner !== title ? partner : 'Conversa individual'}
                </p>
              </div>
            </Section>
            <Section title="Atividade da conversa">
              <StatsGrid stats={stats.all} />
              <ActivityChart hours={stats.all.hours} />
            </Section>
            <Section
              title="Mídia, links e docs"
              action={
                <button type="button" onClick={() => setView({ kind: 'gallery', tab: 'media' })} className="flex items-center text-sm text-muted">
                  {media.media.length + media.links.length + media.documents.length}
                  <ChevronRight size={18} />
                </button>
              }
            >
              <div className="grid grid-cols-4 gap-1.5">
                {media.media.slice(0, 4).map((message) => (
                  <Thumbnail key={message.index} message={message} onOpen={() => jump(message)} />
                ))}
              </div>
            </Section>
            <Section title={count(participants.length, 'participante', 'participantes')}>
              <ul className="-mx-2">
                {participants.map((participant) => (
                  <li key={participant}>
                    <button
                      type="button"
                      onClick={() => setView({ kind: 'participant', name: participant })}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-chip"
                    >
                      <Avatar name={display(participant)} color={participantColor(participants, participant)} picture={avatars[participant]} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          {display(participant)}
                          {participant === self && <span className="ml-2 text-xs text-muted">Você</span>}
                        </span>
                        <span className="block text-xs text-muted">{count(stats.byAuthor.get(participant)?.messages ?? 0, 'mensagem', 'mensagens')}</span>
                      </span>
                      <ChevronRight size={18} className="text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </div>
    </aside>
  )
}
