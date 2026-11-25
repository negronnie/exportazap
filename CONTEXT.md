# ExportaZap

O ExportaZap transforma a exportação de uma conversa do WhatsApp em uma conversa visual e navegável, e em saídas prontas para compartilhar: PDF, prints e pacote HTML. Tudo acontece no aparelho de quem usa, e nenhum dado da conversa sai dele.

Cada termo tem o nome canônico em inglês, usado no código, e o termo usado na interface.

## Entrada

**Source Export** (Exportação do WhatsApp):
O arquivo que o WhatsApp gera em "Exportar conversa", no celular ou no WhatsApp Web: um `.txt` com as mensagens, sozinho ou num `.zip`, junto com os arquivos dos anexos quando a exportação inclui mídia (a do WhatsApp Web nunca inclui). É a única entrada do ExportaZap, e o ExportaZap nunca a altera.
_Avoid_: "exportação" sem qualificação (confunde com Output), backup, histórico

**Export Format** (Formato da exportação):
O jeito como as linhas do `.txt` estão escritas. Depende da plataforma de origem (Android, iOS ou WhatsApp Web) e do idioma e da região do aparelho, que mudam a ordem da data, o relógio de 12 ou 24 horas, a presença de segundos e os textos fixos como "arquivo anexado".
_Avoid_: versão, layout

**Fingerprint** (Hash da exportação):
O SHA-256 do arquivo da exportação do WhatsApp, como foi recebido. Permite a quem recebe uma saída conferir que ela veio daquele arquivo.
_Avoid_: assinatura (não é assinatura digital), checksum

## Conversa

**Chat** (Conversa):
A conversa reconstruída a partir de uma exportação do WhatsApp: individual, entre duas pessoas, ou de grupo.
_Avoid_: chat na interface, histórico, thread

**Message** (Mensagem):
Uma entrada da conversa com data e hora, autor e conteúdo: texto, anexo ou os dois.
_Avoid_: linha (uma mensagem pode ocupar várias linhas do `.txt`), post

**System Notice** (Aviso do sistema):
Uma entrada sem autor, escrita pelo próprio WhatsApp: alguém entrou ou saiu do grupo, o nome do grupo mudou, o aviso de criptografia.
_Avoid_: evento, notificação, mensagem do sistema

**Deleted Message** (Mensagem apagada):
Uma mensagem que o autor apagou no WhatsApp e que chega na exportação só como "Mensagem apagada". O conteúdo não existe mais.
_Avoid_: mensagem ocultada (essa é escolha de quem usa o ExportaZap)

**Attachment** (Anexo):
O arquivo citado por uma mensagem, pelo nome que ele tem na exportação: imagem, vídeo, áudio, nota de voz, figurinha, documento ou contato. O nome do arquivo acompanha o anexo em todas as saídas.
_Avoid_: mídia (palavra só da galeria), arquivo anexado

**Missing Attachment** (Anexo ausente):
Um anexo citado na conversa cujo arquivo não está disponível, porque a exportação foi feita sem mídia ou porque o arquivo não foi enviado junto.
_Avoid_: mídia oculta (é o texto que o WhatsApp escreve), anexo quebrado

**Location** (Localização):
Uma mensagem com coordenadas e link de mapa, sem arquivo anexo.

## Pessoas

**Participant** (Participante):
Alguém que escreveu na conversa ou aparece num aviso do sistema. É identificado pelo nome salvo no celular de quem exportou ou, sem esse nome, pelo número.
_Avoid_: contato, usuário, membro, remetente

**Self** (Você):
O participante que fez a exportação do WhatsApp. As mensagens dele ficam à direita. A exportação não informa quem é: o ExportaZap dá um palpite e quem usa confirma.
_Avoid_: eu, dono, exportador, usuário

**Alias** (Apelido):
O nome que quem usa o ExportaZap dá a um participante. Substitui o nome original na tela e nas saídas.
_Avoid_: nome de exibição, pseudônimo

## Recorte e ocultação

**Range** (Recorte):
O trecho da conversa que vai para as saídas, entre uma mensagem inicial e uma final. Começa cobrindo a conversa inteira.
_Avoid_: intervalo, período, seleção, filtro

**Redaction** (Ocultação):
O conjunto de mudanças de privacidade que quem usa aplica antes de compartilhar: apelidos, máscaras de número e mensagens ocultadas. Toda ocultação aparece na saída como tal, nunca some sem rastro.
_Avoid_: censura, edição (o conteúdo das mensagens nunca é editado)

**Hidden Message** (Mensagem ocultada):
Uma mensagem que quem usa tirou das saídas. No lugar dela aparece um aviso de "mensagem ocultada".
_Avoid_: mensagem apagada (essa foi apagada no WhatsApp), mensagem removida

**Number Mask** (Máscara de número):
A troca de parte dos dígitos de um número de telefone, na tela e nas saídas.
_Avoid_: anonimização (a máscara é só uma parte da ocultação)

## Saídas

**Output** (Exportação):
O arquivo que o ExportaZap gera a partir do recorte: PDF, prints ou pacote HTML.
_Avoid_: "exportação do WhatsApp" (é a entrada), relatório, download

**Screenshot** (Print):
Uma imagem no formato de tela de celular, com a barra de topo da conversa. Nenhuma mensagem é cortada entre dois prints.
_Avoid_: captura, screenshot na interface

**Strip** (Tripa):
Uma imagem só, comprida, com o recorte inteiro. Quando passa do tamanho que os navegadores aguentam, é dividida em partes.
_Avoid_: print longo, rolagem

**HTML Package** (Pacote HTML):
Um `.zip` com a conversa em página só de leitura e os anexos, que abre sem internet depois de descompactado.
_Avoid_: site, página, HTML zipado

**Cover Page** (Página de rosto):
A primeira página do PDF: identifica a exportação do WhatsApp pelo hash, o recorte, as ocultações aplicadas e a data em que a saída foi gerada.
_Avoid_: capa, resumo

**Mark** (Marca ExportaZap):
A identificação discreta no rodapé de cada print e de cada página do PDF, mostrando que a imagem foi gerada pelo ExportaZap e não é uma captura de tela do WhatsApp.
_Avoid_: marca d'água, assinatura

## Versão hospedada (v2)

**Share Link** (Link compartilhável):
Um endereço que dá acesso a uma saída sem enviar o arquivo. Só existe na versão hospedada.
_Avoid_: link público, URL de compartilhamento
