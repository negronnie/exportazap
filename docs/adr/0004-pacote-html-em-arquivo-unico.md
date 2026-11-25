# Pacote HTML com o visualizador num arquivo único

Quem recebe o pacote HTML descompacta e abre o `index.html` direto do disco (`file://`). Nesse modo o Chrome bloqueia scripts em módulo e a leitura de JSON por `fetch`, então o `index.html` leva o visualizador e os dados da conversa embutidos num arquivo só, e os anexos ficam numa pasta `media/` ao lado, referenciados por caminho relativo. O visualizador do pacote é só de leitura (conversa, anexos, dados dos participantes e busca), sem edição nem exportação. Os anexos vão como estão na exportação do WhatsApp, sem recompressão.
