# Trilha Saúde

Projeto acadêmico para acompanhamento da jornada de cuidado do paciente. A aplicação reúne consultas, exames, resultados, encaminhamentos, documentos e notificações em uma interface responsiva para desktop e mobile.

## Tecnologias

- Frontend: HTML, CSS e JavaScript
- Backend: Node.js 20+ e Express
- Banco de dados: MySQL 8+
- Comunicação: API REST na mesma origem do frontend

## Estrutura

```text
Trilha-Saude/
├── frontend/              # HTML, CSS e JavaScript originais
│   ├── index.html
│   ├── style.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   ├── constants/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── scripts/check.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── database/
│   ├── schema.sql
│   └── migration_01_modelagem.sql  # Se disponível no projeto original
├── .gitattributes
├── .gitignore
└── README.md
```

A pasta `backend/private_uploads/` é criada automaticamente quando um documento ou resultado com arquivo é enviado. Ela não deve ser publicada no Git.

## Antes de utilizar esta versão reorganizada

A entrega inclui os três arquivos originais do frontend, mantidos sem alterações. O arquivo `migration_01_modelagem.sql` citado na versão anterior do README não foi enviado; não foi recriado. Ele não é necessário para uma instalação nova ou um banco já atualizado.

Para atualizar o projeto existente, faça backup e use uma branch do Git. Os três arquivos originais de `public/` já estão em `frontend/`. Caso sua cópia local tenha arquivos adicionais, preserve-os nessa pasta. Se existir uma migração original, mova-a para `database/`. Mova seu `.env` local para `backend/.env` e, se houver arquivos enviados por usuários, mova **todo** o conteúdo de `private_uploads/` para `backend/private_uploads/` sem renomear os arquivos. Não execute duas versões simultaneamente. Não apague a versão antiga até testar a nova.

A reorganização não exige alterar o banco existente se ele já estiver atualizado. `schema.sql` e `package-lock.json` foram mantidos sem alterações de conteúdo. Os 28 endpoints e as funções que os atendem foram preservados; a API continua na mesma origem do frontend.

## Instalação nova

### 1. Pré-requisitos

Instale:

- Node.js 20 ou superior
- npm
- MySQL Server 8 ou superior

### 2. Baixe o projeto e instale as dependências

```bash
git clone https://github.com/joaolvcass/Trilha-Saude.git
cd Trilha-Saude/backend
npm install
```

### 3. Crie o banco

Abra o MySQL Workbench, o cliente `mysql` ou outra ferramenta compatível e execute todo o arquivo:

```text
database/schema.sql
```

O arquivo cria o banco `trilhasaude` e todas as tabelas necessárias. Para uma instalação nova não é necessário executar a migração.

### 4. Configure o ambiente

Na pasta `backend/`, copie `.env.example` para `.env`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Depois edite somente o `.env` com as credenciais do seu MySQL:

```dotenv
NODE_ENV=development
HOST=127.0.0.1
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=trilhasaude
```

O `DB_NAME` deve permanecer `trilhasaude` quando o banco for criado pelo `schema.sql` deste repositório.

Nunca publique o arquivo `.env`. Ele está incluído no `.gitignore` e o repositório fornece somente o `.env.example`.

### 5. Inicie o projeto

```bash
npm start
```

Abra no navegador:

```text
http://127.0.0.1:3000
```

Não abra `frontend/index.html` diretamente e não utilize Live Server. O frontend depende da API Express disponível no mesmo servidor.

## Atualizando uma instalação antiga

Se você já possui uma versão anterior do banco `trilhasaude`, faça backup e execute:

```text
database/migration_01_modelagem.sql
```

Este arquivo não acompanha a entrega atual: use a migração original, se necessária. Não execute migrações desnecessárias em um banco já atualizado.

A migração adiciona somente as estruturas que podem estar ausentes, incluindo:

- data de nascimento e tipo de usuário;
- profissionais;
- associação opcional de profissionais às consultas;
- local de consulta;
- resultados de exames;
- encaminhamentos;
- documentos.

Depois atualize os arquivos do projeto e execute normalmente, na pasta `backend/`:

```bash
npm install
npm start
```

Para uma instalação nova, use `schema.sql`, e não a migração.


## Atualizando este repositório no GitHub

Se o seu repositório antigo já rastreava o arquivo `.env`, execute uma única vez, na pasta do projeto:

```bash
git rm --cached .env
# Se o arquivo backend/.env também estiver rastreado:
# git rm --cached backend/.env
```

O comando retira o `.env` do Git sem apagar a cópia local. Depois confirme que `backend/.env.example` existe e publique as alterações normalmente:

```bash
git add .
git commit -m "corrige instalacao e configuracao do projeto"
git push origin main
```

Antes do commit, use `git status` para confirmar que `.env` e `private_uploads/` não aparecem entre os arquivos que serão enviados.

## Comandos disponíveis

Execute os comandos na pasta `backend/`.

```bash
npm start
```

Inicia o servidor.

```bash
npm run dev
```

Inicia o Node.js em modo `--watch`.

```bash
npm run check
```

Verifica a sintaxe de todos os módulos do backend e do JavaScript do frontend.

## Verificações da reorganização

- `npm run check`: aprovado, 35 arquivos JavaScript.
- 28 endpoints: mesmos métodos e caminhos da versão original.
- HTML, CSS, JavaScript do frontend, schema SQL, lockfile e configurações: preservados byte a byte.
- Testes HTTP dos 28 endpoints: aprovados em ambiente simulado, executando os controladores e middlewares do projeto, com adaptadores de Express, rate-limit e MySQL e banco SQLite temporário em memória. Foram testados cadastro, login, sessão, perfil, jornada, consultas, exames, mensagens, notificações, profissionais, encaminhamentos, resultados, documentos, uploads e downloads, exclusões, controle de acesso e rejeição de origem externa e arquivo inválido.
- Frontend: JavaScript executado em VM Node.js com DOM mínimo simulado e acesso HTTP ao servidor de teste; renderização das telas, cadastro, jornada, chat e logout aprovados.

A instalação das dependências npm falhou por indisponibilidade de rede/DNS (`EAI_AGAIN`), e o navegador local bloqueou o acesso por política do ambiente (`ERR_BLOCKED_BY_ADMINISTRATOR`). Não foi possível validar o Express real, o limitador de requisições real, a instância MySQL 8 ou a interface em um navegador real. Os testes simulados não substituem essa validação. Execute `npm install`, `npm run check` e `npm start` em uma máquina com MySQL configurado e teste os fluxos no navegador antes de publicar. Nenhum adaptador de teste, banco temporário ou dado fictício foi incorporado ao projeto.

## Dados e segurança

- As senhas são armazenadas com `scrypt` e sal individual.
- A sessão usa cookie `HttpOnly` e somente o hash do token fica no MySQL.
- As consultas SQL usam parâmetros.
- Os dados das rotas autenticadas são filtrados pelo usuário logado.
- Documentos e arquivos de resultados ficam em `backend/private_uploads/`, fora da pasta pública, e são entregues por rotas autenticadas.
- Os formatos de arquivo atualmente aceitos são PDF, JPEG e PNG, com limite de 3 MB por arquivo.

## Importante

Este é um projeto acadêmico demonstrativo. Não utilize dados médicos reais nem publique a aplicação como serviço de saúde sem uma revisão formal de segurança, privacidade, LGPD, HTTPS, gestão de segredos, auditoria, backups, controle de acesso e políticas de retenção de dados.
