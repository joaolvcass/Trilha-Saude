# Trilha Saúde — funcionalidades ampliadas segundo a modelagem

Projeto acadêmico, com frontend HTML/CSS/JavaScript responsivo, API Express e MySQL. Mantém o banco **trilhasaude** e as tabelas originais (`users`, `appointments`, `exams`, `notifications`, `messages`, `sessions`) para não perder o histórico. A modelagem de referência usa nomes em português e sugere React; esta implementação **não migra o frontend para React** e cria as tabelas novas equivalentes (`professionals`, `results`, `referrals`, `documents`).

## Novas funções
- **Resultados:** cadastrar data, descrição, exame vinculado e arquivo opcional; visualizar histórico e baixar arquivo protegido.
- **Encaminhamentos:** cadastrar destino, motivo, profissional opcional, data e atualizar o status.
- **Documentos:** enviar PDF, JPG ou PNG (até 3 MB), listar, baixar e excluir.
- **Profissionais:** diretório demonstrativo compartilhado para associação a consultas e encaminhamentos; **não há verificação de credenciais profissionais**.
- **Consultas:** local e profissional vinculado opcionais, mantendo os campos existentes.
- **Perfil:** data de nascimento opcional; tipo de usuário persiste como `paciente`, sem gerenciamento de permissões profissionais.
- **Interface:** página Registros na navegação existente, com quatro categorias, no desktop e no mobile.

## Instalação em banco NOVO
1. Crie o banco e tabelas executando `schema.sql` **uma única vez** no MySQL Workbench.
2. Copie `.env.example` como `.env` e configure as credenciais localmente. **Nunca publique o `.env`.**
3. `npm install` e `npm start`. Acesse http://127.0.0.1:3000.

## Atualização de um banco JÁ EXISTENTE
1. **Faça backup** completo do banco `trilhasaude` no MySQL Workbench.
2. Execute **uma vez** `migration_01_modelagem.sql` (não execute novamente o `schema.sql`).
3. Confirme no Workbench as tabelas novas e as colunas adicionadas. Os dados atuais permanecem.
4. Atualize os arquivos do projeto, mantenha seu `.env` local e reinicie o servidor.

> A migração não é idempotente porque as instruções `ALTER TABLE ADD COLUMN` devem ser executadas apenas uma vez. Não rode a migração em banco que já recebeu essas alterações.

## Fluxo de dados
Frontend → `/api/...` (cookie de sessão HttpOnly) → Node.js/Express → consultas SQL parametrizadas → MySQL. Consultas a resultados fazem JOIN com exames do usuário autenticado. Documentos e arquivos ficam em `private_uploads/` (fora de `public/`), e os downloads exigem autenticação. Metadados e nomes aleatórios são gravados no banco.

Novas rotas: `POST /api/professionals`, `POST /api/referrals`, `PATCH/DELETE /api/referrals/:id`, `POST /api/results`, `DELETE /api/results/:id`, `GET /api/results/:id/file`, `POST /api/documents`, `DELETE /api/documents/:id`, `GET /api/documents/:id/file`. `GET /api/me` inclui os novos registros.

## Limitações importantes
**Use somente dados fictícios.** O sistema não está pronto para armazenar dados médicos reais nem para publicação como plataforma de saúde. Produção exige auditoria de segurança, HTTPS, antivírus/varredura dos anexos, controle granular de papéis, consentimento/base legal LGPD, criptografia e backups, políticas de retenção, recuperação e gestão de credenciais. O cadastro de profissionais é demonstrativo e visível a todos os usuários autenticados. Não há integrações externas reais.

### Testes
`npm run check` faz a verificação de sintaxe de Node.js. Teste manualmente todas as rotas com um MySQL local antes de uso. Verifique cadastro/login, criação de exame/consulta, vinculação de profissional, registros de resultados, encaminhamentos, documentos, download autorizado e negação de acesso a arquivos de outro usuário.
