# Contratos gerados na BSC Testnet (01/07/23):

- Condominium Lib deployed to: 0x408B5Ab0DAa98aE24C10ad45AD601997ccb9b7c5
- Condominium deployed to: 0xE4f02c9Ec935Fdc7EA6490613BDD76A970C5E070
- Condominium Adapter deployed to: 0xf52bde8d987cFd40a1c17B5fcF588267921414dC
    - Condominium Adapter upgraded to contract: 0xE4f02c9Ec935Fdc7EA6490613BDD76A970C5E070

NOVO DEPLOY (Correção de resident duplicado)---------------------------
Condominium deployed to: 0xcfd1FFd642D1cA3FD60A7EcA6b167b50369C106b

NOVO DEPLOY (Correção de exclusão de resident)---------------------------
Condominium deployed to: 0xb84e6e5c883ffb72bdcd9cc9652c59819f39df3e

# My test wallets

- 0x957339c0b3F129B5AF1DF15A2cAb1301f6799f93
- 0xA45f2d678Bc334C8699a9d4B587A70dc1ace983e
- 0xFE54F9d72e53606ce441962ecacbb7732c8f52Ad
- 0x1e7BDEeABaDcD55C3fC22815dE7226444961C634

# Backend Packages

- Dependências do projeto
npm i express dotenv (framework web/api e configurações de ambiente)
npm i nodemon express-async-errors  morgan (tratamento de erros e visualização de logs de requisições)
npm i helmet cors (segurança)
npm i ethers (somente para Web3)

- Dependências de desenvolvimento
npm i -D typescript ts-node @types/express @types/cors @types/morgan

- Confirurar typescript
npx tsc --init

- Configurar tsconfig.json
    - "rootDir": "./src/"
    - "outDir": "./dist/"
    - incluir -> "ts-node": { "transpileOnly" : true } //no final das configurações, após o compilerOptions

- Criar .gitignore
    - node_modules
    - dist
    - .env

- Criar .env
    - PORT=3001
    - CORS_ORIGIN=* | CORS_ORIGIN=http://localhost:3000

- Criar aplicação
    - criar pasta src
    - criar arquivo app.ts
        - importar express, {Request, Response, NextFunction} do express
        - criar constante app = express()
        - app.use("/", (req, res, next) => {res.send(`Hello World`)})
        - exportar app
    - Criar server.ts
        - importar dotenv
        - configurar dotenv
        - importar app (sempre após configurar o dotenv)
        - criar constante e carregar PORT do dotenv
        - ativar escuta de app na porta, logando a porta no console

- Configurar scripts
    - dev: npx nodemon ./src/server.ts --watch './src/' -e ts
    - compile: npx tsc
    - start: node ./dist/server.js

- Ativar ferramentas
    - importar morgan, express-async-errors e cors
    - app.use(morgan("tiny"))
    - app.use(helmet())
    - app.use(cors({origin: process.env.CORS_ORIGIN}))
    - app.use(express.json())

- Criar Middlewares
    - criar pasta middleware
    - criar errorMiddleware.ts
        - importar Request, Response, NextFunction do express
        - exportar função de interceptação de erros com status 500 e log no console
    - importar no app.ts
    - ativar o middleware, na última posição

- Configurar Database
    - Instalar e ativar o serviço MongoDB
    - instalar dependência
        - npm i mongodb
    - criar módulo de conexão
        - arquivo db.ts
        - importar { MongoClient, Db } from mongodb
        - criar singleton : Db
        - exportar Promise de Db
        - export default async() Promise<Db> {
            tem conexão? retorna
            Não tem, cria nova, conecta ao servidor em client (MONGO_HOST)
            conecta ao database (MONGO_DATABASE) via client e atribui ao singleton
            retorna o singleton
        }

- Criar demais rotas e funções

- Arquitetura do Backend
    - Frontend -> Backend -> Database
    - Backend
        Request: Router -> Middleware -> Controller -> Repository -> Model
        Response: Model -> Repository -> Controller -> Middleware -> Router (?)
    - Módulos(Pastas/Arquivos)
        - middlewares
        - models
        - repositories
        - controllers
        - routes

- Autenticação Web 2 + 3
    - Instalar axios (cliente http) no Dapp
        $ npm i axios
    - e os types do axios
        $ npm i -D @types/axios
    - Instalar o JWT no backend
        $ npm i jsonwebtoken
    - e os types do jwt
        $ npm i -D @types/jsonwebtoken
    - No método de login do DApp, criar mensagem com timestamp, assinar com a carteira e enviar para o backend
    - No backend, criar rota e controller para receber, recriar e comparar o secret (msg assinada)
    - Usar JWT para gerar o token de autenticação, com base na SECRET e no EXPIRES

- Upload de Arquivos
    - Instalar o multer (pacote de manipulação de arquivos)
        $ npm i multer
    - e seus types
        $ npm i -D @types/multer
    - Criar a pasta "files" na raiz do backend
        - Incluir no gitignore os arquivos da pasta
            files/*
    - No app.ts:
        - Importar o multer
            import multer from 'multer'
        - Inicializar o middleware de arquivos
            const uploadMiddleware = multer({ dest: "files"})
            app.use('rotaprincipal',authmid, uploadMiddleware.single("key"), rotaespecífica)
    - Criar arquivo com rotas específicas para cada uploader
    - Criar um controller com funções para cada uploader
    - Ajustar authentication middleware para aceitar token na query string, para download via browser
    - No controller:
        - importar "fs" e "path" para trabalhar com arquivos e caminhos
        - importar "keccak256" e "toUtf8Bytes" de "ethers" para trabalhar com hash de strings

        
            



    











# Status HTTP

1xx (Informativo) – o servidor recebeu a solicitação e a está processando.
    100 - Continue
    101 - Switching Protocols
    102 - Processing
2xx (Confirmação) ‒ o servidor recebeu a solicitação e enviou de volta a resposta esperada.
    200 - OK
    201 - Created
    202 - Accepted
    203 - Non-authoritative Information
    204 - No Content
    205 - Reset Content
    206 - Partial Content
    207 - Multi-Status
    208 - Already Reported
    226 - IM Used
3xx (Redirecionamento) ‒ indica que algo mais precisa ser feito ou precisou ser feito para completar a solicitação.
    300 - Multiple Choices
    301 - Moved Permanently
    302 - Found
    303 - See Other
    304 - Not Modified
    305 - Use Proxy
    307 - Temporary Redirect
    308 - Permanent Redirect
4xx (Erro do cliente) ‒ indica que a solicitação não pode ser concluída ou contém a sintaxe incorreta.
    400 - Bad Request
    401 - Unauthorized
    402 - Payment Required
    403 - Forbidden
    404 - Not Found
    405 - Method Not Allowed
    406 - Not Acceptable
    407 - Proxy Authentication Required
    408 - Request Timeout
    409 - Conflict
    410 - Gone
    411 - Length Required
    412 - Precondition Failed
    413 - Payload Too Large
    414 - Request-URI Too Large
    415 - Unsupported Media Type
    416 - Requested Range Not Satisfiable
    417 - Expectation Failed
    418 - I-m a teapot
    421 - Misdirected Request
    422 - Unprocessable Entity
    423 - Locked
    424 - Failed Dependency
    426 - Upgrade Required
    428 - Precondition Required
    429 - Too Many Requests
    431 - Request Header Fields Too Large
    444 - Connection Closed Without Response
    451 - Unavailable For Legal Reasons
    499 - Client Closed Request    
5xx (Erro no servidor) ‒ o servidor falhou ao concluir a solicitação.
    500 - Internal Server Error
    501 - Not Implemented
    502 - Bad Gateway
    503 - Service Unavailable
    504 - Gateway Timeout
    505 - HTTP Version Not Supported
    506 - Variant Also Negotiates
    507 - Insuficient Storage
    508 - Loop Detected
    510 - Not Extended
    511 - Network Authentication Required
    599 - Network Connect Timeout Error


# MARKDOWN EXAMPLES

## 1 - Formatação Básica

# heading 1
## heading 2
### heading 3

**bold**
__bold__
*italic*
_italic_
~~tachado~~
***bold & italic***

<sub>subscrito</sub>

<sup>sobrescrito</sup>

## 2 - Links e Imagens

[Google Link](http://google.com)

![Markdown Logo](https://plugins.jetbrains.com/files/18897/166369/icon/pluginIcon.png)

## 3 - Citação e Códigos

> Citação

`code`

```
code
```

## 4 - Listas e Tabelas

1. ol item
2. ol item

- ul item
- ul item

* ul item
* ul item

- [x] Marked list item
- [ ] Unmarked list item

|head1|head2|
|-----|-----|
|cel1 |cel2 |
|cel3 |cel4 |

## 5 - Emojis

:+1: Joinha

:smiley: Sorriso

:thinking: Pensando

## 6 - Notas e Referências

Nota de rodapé 1[^1]

[^1]: Referência 1

