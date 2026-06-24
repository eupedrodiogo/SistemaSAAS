---
description: Fazer deploy automático na Vercel via GitHub
---

Use este workflow sempre que o usuário solicitar o comando de deploy. O fluxo consiste em fazer o commit e push para o GitHub, o que acionará o deploy automático na Vercel.

1. Adicione todas as alterações (verifique antes o status):
`git add .`

2. Faça o commit com uma mensagem apropriada (se não for fornecida, gere um resumo das alterações):
`git commit -m "chore: deploy updates"`

3. Faça o push para o GitHub:
`git push`
