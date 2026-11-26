# Trilha Saúde

O Trilha Saúde é um projeto acadêmico demonstrativo para acompanhamento da jornada de cuidado do paciente. Permite registrar consultas, exames, resultados, encaminhamentos e documentos, acompanhar etapas da jornada e receber notificações.

Este guia ensina a instalar e utilizar o sistema localmente no seu computador.

## 1. Pré-requisitos

Antes de começar, instale:

- [Node.js](https://nodejs.org/) — versão 20 ou superior, incluindo o npm.
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) — versão 8 ou superior.
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) — opcional, recomendado para configurar o banco de dados por uma interface gráfica.

Você também precisará de um navegador e de conexão com a internet para instalar as dependências do projeto.

Para conferir a instalação do Node.js e do npm, abra um terminal e execute:

```bash
node -v
npm -v
```

Certifique-se de que o serviço do MySQL esteja em execução e de que você saiba o nome de usuário e a senha configurados durante sua instalação.

## 2. Baixe e extraia o projeto

Baixe o arquivo ZIP do projeto e extraia todo o conteúdo em uma pasta do seu computador.

A pasta principal contém:

```text
Trilha-Saude/
├── frontend/       # Interface do sistema
├── backend/        # Servidor e configurações
├── database/       # Arquivo de criação do banco
└── README.md
```

Não mova os arquivos individualmente: mantenha a estrutura de pastas original.

## 3. Configure o banco de dados

1. Abra o MySQL Workbench e conecte-se ao servidor MySQL local com seu usuário e senha.
2. No menu **File > Open SQL Script**, abra o arquivo `database/schema.sql` da pasta do projeto.
3. Execute todo o script (ícone de raio na barra de ferramentas).

O script cria o banco `trilhasaude` e as tabelas necessárias para o funcionamento do sistema.

Se preferir utilizar o cliente de linha de comando do MySQL, conecte-se com um usuário autorizado a criar o banco e as tabelas e execute o script completo.

## 4. Instale as dependências

Abra um terminal na pasta principal `Trilha-Saude` e execute:

```bash
cd backend
npm install
```

A instalação pode levar alguns minutos. Os demais comandos deste guia devem ser executados dentro da pasta `backend/`.

## 5. Configure a conexão com o MySQL

Na pasta `backend/`, existe um arquivo chamado `.env.example`. Crie uma cópia dele com o nome `.env`.

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Abra o arquivo `backend/.env` em um editor de texto e configure-o conforme o exemplo:

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

Substitua `seu_usuario_mysql` e `sua_senha_mysql` pelas credenciais do seu MySQL. Se o usuário for `root`, informe `DB_USER=root`.

Mantenha `DB_NAME=trilhasaude`. Caso o MySQL tenha sido configurado em outra porta, ajuste `DB_PORT`.

O arquivo deve se chamar exatamente `.env`, sem a extensão `.txt`. Não compartilhe esse arquivo, pois ele contém suas credenciais.

## 6. Inicie o sistema

Com o MySQL em execução, permaneça na pasta `backend/` e execute:

```bash
npm start
```

Quando o servidor iniciar corretamente, aparecerá no terminal uma mensagem semelhante a:

```text
TrilhaSaúde: http://127.0.0.1:3000
```

Abra o navegador e acesse:

**[http://127.0.0.1:3000](http://127.0.0.1:3000)**

Mantenha o terminal aberto enquanto estiver utilizando o sistema. Não abra o arquivo `index.html` diretamente e não utilize o Live Server: o próprio servidor Node.js disponibiliza a interface e a API.

## 7. Primeiro acesso

Na tela inicial, selecione **Ainda não tenho conta. Cadastrar**. Informe seu nome, e-mail e uma senha de pelo menos 8 caracteres. Após criar a conta, você poderá acessar as funcionalidades do sistema.

Utilize dados fictícios para experimentar as consultas, exames, jornada, registros e notificações. O chat é apenas demonstrativo e não conecta você a uma equipe de saúde real.

## 8. Como encerrar e acessar novamente

Para encerrar o servidor, pressione `Ctrl+C` no terminal em que executou `npm start`.

Nos próximos acessos, certifique-se de que o MySQL esteja em execução, abra um terminal na pasta principal do projeto e execute:

```bash
cd backend
npm start
```

Depois, acesse novamente [http://127.0.0.1:3000](http://127.0.0.1:3000). Não é necessário reinstalar as dependências ou recriar o banco a cada acesso.

## 9. Solução de problemas

| Problema | O que verificar |
| --- | --- |
| `node` ou `npm` não reconhecido | Confirme a instalação do Node.js e reabra o terminal. |
| Erro de dependências ou `Cannot find module` | Execute `npm install` dentro da pasta `backend/`. |
| Erro `Access denied` | Confira o usuário e a senha do MySQL no arquivo `.env`. |
| Erro `ECONNREFUSED` ao iniciar | Verifique se o MySQL está em execução e se `DB_HOST` e `DB_PORT` estão corretos. |
| Banco ou tabela não encontrada | Confira se executou todo o arquivo `database/schema.sql` e se `DB_NAME=trilhasaude`. |
| Porta 3000 ocupada (`EADDRINUSE`) | Encerre o outro servidor ou altere `PORT` no `.env` para uma porta livre, como 3001. Nesse caso, acesse o novo endereço correspondente. |
| Navegador não conecta ao sistema | Verifique se `npm start` está em execução e se o endereço corresponde à porta configurada. |

Se necessário, o comando `npm run check`, executado na pasta `backend/`, verifica a sintaxe dos arquivos JavaScript. Ele não substitui o teste de funcionamento com o MySQL.

## 10. Armazenamento e cuidados

Os dados cadastrados são armazenados no banco MySQL local. Documentos e arquivos de resultados são armazenados na pasta `backend/private_uploads/`, criada automaticamente no primeiro envio. São aceitos arquivos PDF, JPEG e PNG de até 3 MB cada.

Para preservar seus registros, mantenha backups do banco de dados e da pasta de arquivos privados.

**Importante:** o Trilha Saúde é um projeto acadêmico demonstrativo, destinado à execução local. Não utilize dados médicos reais nem o considere um serviço de saúde ou atendimento profissional.
