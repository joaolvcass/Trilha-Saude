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
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js
├── schema.sql
├── migration_01_modelagem.sql
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

A pasta `private_uploads/` é criada automaticamente quando um documento ou resultado com arquivo é enviado. Ela não deve ser publicada no Git.

## Instalação nova

### 1. Pré-requisitos

Instale:

- Node.js 20 ou superior
- npm
- MySQL Server 8 ou superior

### 2. Baixe o projeto e instale as dependências

```bash
git clone https://github.com/joaolvcass/Trilha-Saude.git
cd Trilha-Saude
npm install
```

### 3. Crie o banco

Abra o MySQL Workbench, o cliente `mysql` ou outra ferramenta compatível e execute todo o arquivo:

```text
schema.sql
```

O arquivo cria o banco `trilhasaude` e todas as tabelas necessárias. Para uma instalação nova não é necessário executar a migração.

### 4. Configure o ambiente

Copie `.env.example` para `.env`.

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

Não abra `public/index.html` diretamente e não utilize Live Server. O frontend depende da API Express disponível no mesmo servidor.

## Atualizando uma instalação antiga

Se você já possui uma versão anterior do banco `trilhasaude`, faça backup e execute:

```text
migration_01_modelagem.sql
```

A migração adiciona somente as estruturas que podem estar ausentes, incluindo:

- data de nascimento e tipo de usuário;
- profissionais;
- associação opcional de profissionais às consultas;
- local de consulta;
- resultados de exames;
- encaminhamentos;
- documentos.

Depois atualize os arquivos do projeto e execute normalmente:

```bash
npm install
npm start
```

Para uma instalação nova, use `schema.sql`, e não a migração.


## Atualizando este repositório no GitHub

Se o seu repositório antigo já rastreava o arquivo `.env`, execute uma única vez, na pasta do projeto:

```bash
git rm --cached .env
```

O comando retira o `.env` do Git sem apagar a cópia local. Depois confirme que `.env.example` existe e publique as alterações normalmente:

```bash
git add .
git commit -m "corrige instalacao e configuracao do projeto"
git push origin main
```

Antes do commit, use `git status` para confirmar que `.env` e `private_uploads/` não aparecem entre os arquivos que serão enviados.

## Comandos disponíveis

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

Verifica a sintaxe do backend e do JavaScript do frontend.

## Dados e segurança

- As senhas são armazenadas com `scrypt` e sal individual.
- A sessão usa cookie `HttpOnly` e somente o hash do token fica no MySQL.
- As consultas SQL usam parâmetros.
- Os dados das rotas autenticadas são filtrados pelo usuário logado.
- Documentos e arquivos de resultados ficam em `private_uploads/`, fora da pasta pública, e são entregues por rotas autenticadas.
- Os formatos de arquivo atualmente aceitos são PDF, JPEG e PNG, com limite de 3 MB por arquivo.

## Importante

Este é um projeto acadêmico demonstrativo. Não utilize dados médicos reais nem publique a aplicação como serviço de saúde sem uma revisão formal de segurança, privacidade, LGPD, HTTPS, gestão de segredos, auditoria, backups, controle de acesso e políticas de retenção de dados.
