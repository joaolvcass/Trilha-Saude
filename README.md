# Trilha Saúde — funcionalidades ampliadas segundo a modelagem

Projeto acadêmico, com frontend HTML/CSS/JavaScript responsivo, API Express e MySQL. Mantém o banco **trilhasaude** e as tabelas originais (`users`, `appointments`, `exams`, `notifications`, `messages`, `sessions`) para não perder o histórico. A modelagem de referência usa nomes em português e sugere React; esta implementação **não migra o frontend para React** e cria as tabelas novas equivalentes (`professionals`, `results`, `referrals`, `documents`).

## funções
- **Resultados:** cadastrar data, descrição, exame vinculado e arquivo opcional; visualizar histórico e baixar arquivo protegido.
- **Encaminhamentos:** cadastrar destino, motivo, profissional opcional, data e atualizar o status.
- **Documentos:** enviar PDF, JPG ou PNG (até 3 MB), listar, baixar e excluir.
- **Profissionais:** diretório demonstrativo compartilhado para associação a consultas e encaminhamentos; **não há verificação de credenciais profissionais**.
- **Consultas:** local e profissional vinculado opcionais, mantendo os campos existentes.
- **Perfil:** data de nascimento opcional; tipo de usuário persiste como `paciente`, sem gerenciamento de permissões profissionais.
- **Interface:** página Registros na navegação existente, com quatro categorias, no desktop e no mobile.

## Instalação
1. Crie o banco e tabelas executando `schema.sql` **uma única vez** no MySQL Workbench.
2. Copie `.env.example` como `.env` e configure as credenciais localmente. **Nunca publique o `.env`.**
3. `npm install` e `npm start`. Acesse http://127.0.0.1:3000.
