# Privacidade verificável

A promessa de que nada sai do aparelho é garantida pelo próprio navegador, não só pelo código: o nginx envia uma política de segurança de conteúdo (CSP) que proíbe conexões a qualquer origem externa. O app é um PWA que funciona offline, tem uma página "Privacidade" explicando como conferir na aba de rede do navegador que nada é enviado, e não tem cookie nem métrica de uso.

## Consequences

- Recursos que precisarem falar com outro serviço, como mapas (#5), Google Drive e métricas, exigem uma exceção explícita na CSP e consentimento de quem usa, e ficam para a v2.
