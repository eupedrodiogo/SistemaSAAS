# 👻 Como criar uma URL "Fantasma" (Stealth URL)
Para divulgar a pesquisa sem que a URL seja `trg-nexus.vercel.app`, você deve criar um **NOVO PROJETO** na Vercel conectado ao **MESMO REPOSITÓRIO**, mas com um nome genérico.

## Passo a Passo

### 1. No Painel da Vercel (Dashboard)
1.  Clique em **"Add New..."** -> **"Project"**.
2.  Importe o **mesmo repositório** do Git (`trg-nexus---desenvolvimento` ou similar).
3.  **IMPORTANTE:** Na hora de escolher o "Project Name", coloque algo genérico.
    *   Sugestões: `pesquisa-terapia-dev`, `validator-saas-2024`, `ajuda-psi-beta`.
4.  Clique em **Deploy**.

O resultado será uma URL limpa: `https://pesquisa-terapia-dev.vercel.app`.

### 2. Redirecionamento Automático (Opcional)
Se você quer que a pessoa caia direto na pesquisa ao abrir o site (sem precisar digitar `/ajuda`), podemos adicionar um código no `App.tsx` que detecta essa URL nova e redireciona automaticamente.

Exemplo de lógica (me avise se quiser implementar):
`se o dominio for "pesquisa-terapia-dev.vercel.app" -> vá para "/ajuda"`

### 3. Ocultando a Marca na Página
Já atualizei o código para:
*   Mudar o título da aba para **"Pesquisa: Futuro da Terapia"** (esconde "TRG Nexus").
*   Esconder o botão de Login no rodapé (fica invisível até passar o mouse).

Agora você pode compartilhar seu link "secreto" sem medo! 🕵️‍♂️
