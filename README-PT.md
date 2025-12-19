# DAO CONDOMINIUM

**Idioma:** [English](README.md) | [Português](README-PT.md)

![DAO Condominium Banner](./banner.png)

> **⚠️ REPOSITÓRIO ARQUIVADO**  
> Este repositório foi arquivado e não está mais em manutenção ativa. Serve como implementação de referência para fins educacionais.

Uma solução Web3 completa para gerenciamento de condomínios através de smart contracts, apresentando uma estrutura de organização autônoma descentralizada (DAO).

## :speech_balloon: Descrição

Este projeto é um sistema completo de gerenciamento de condomínios baseado em blockchain que demonstra a integração de três camadas distintas: smart contracts (blockchain), API backend e uma aplicação descentralizada (DApp). O sistema permite o gerenciamento transparente e democrático das operações do condomínio através de mecanismos de votação, pagamento de cotas e gerenciamento de moradores.

## Índice

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
  - [Camada Blockchain](#camada-blockchain)
  - [Camada Backend](#camada-backend)
  - [Camada DApp](#camada-dapp)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Começando](#começando)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
  - [Configuração](#configuração)
  - [Uso](#uso)
- [Contratos Implantados](#contratos-implantados)
- [Informações Adicionais](#informações-adicionais)
  - [Agradecimentos](#agradecimentos)
  - [Veja Também](#veja-também)
  - [Contribuindo](#contribuindo)
  - [Autores e Contribuidores](#autores-e-contribuidores)
  - [Aviso Legal](#aviso-legal)
  - [Licença](#licença)

## Funcionalidades

### Funcionalidades do Smart Contract
- **Gerenciamento de Moradores**: Adicionar, remover e gerenciar moradores do condomínio
- **Sistema de Votação**: Tomada de decisões democráticas através de propostas e votações
- **Gerenciamento de Cotas**: Rastreamento e processamento de pagamentos de cotas mensais
- **Discussão de Tópicos**: Criar e gerenciar tópicos de discussão com anexos de arquivos
- **Controle de Acesso**: Permissões baseadas em funções (Síndico, Conselheiro, Morador)

### Funcionalidades do Backend
- **API RESTful**: API completa para integração com o frontend
- **Integração Web3**: Interação direta com blockchain via Ethers.js v6
- **Autenticação**: Autenticação baseada em JWT com assinatura de carteira Web3
- **Gerenciamento de Arquivos**: Upload e armazenamento de documentos relacionados a tópicos
- **Integração MongoDB**: Persistência de dados off-chain

### Funcionalidades do DApp
- **Login Web3**: Integração com carteira MetaMask
- **Painel de Moradores**: Visualizar e gerenciar informações de moradores
- **Interface de Votação**: Participar de decisões do condomínio
- **Pagamento de Cotas**: Pagar cotas mensais através da interface
- **Gerenciamento de Tópicos**: Criar, visualizar e interagir com tópicos de discussão
- **Configurações**: Configurar parâmetros do condomínio

## Arquitetura

Este projeto segue uma arquitetura de três camadas:

```
┌─────────────────────────────────────────────────────┐
│                  DApp (Frontend)                    │
│              React + TypeScript + Web3              │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                  Backend (API)                      │
│           Express + MongoDB + Ethers.js             │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│            Blockchain (Smart Contracts)             │
│              Hardhat + Solidity + BSC               │
└─────────────────────────────────────────────────────┘
```

### Camada Blockchain

Localizada no diretório `/blockchain`.

**Smart Contracts:**
- `Condominium.sol` - Contrato principal do DAO com lógica central
- `CondominiumAdapter.sol` - Adaptador proxy atualizável
- `CondominiumLib.sol` - Funções de biblioteca compartilhadas
- `ICondominium.sol` - Interface do contrato

**Tecnologias Principais:**
- Hardhat 2.14.1
- Solidity
- Hardhat Toolbox
- Solidity Coverage

**Scripts Disponíveis:**
```bash
npm test          # Executar testes com cobertura
npm run deploy    # Deploy na BSC Testnet
npm run verify    # Verificar contratos no BSCscan
```

### Camada Backend

Localizada no diretório `/backend`.

**Arquitetura:**
```
Request → Router → Middleware → Controller → Repository → Model
Response ← Router ← Middleware ← Controller ← Repository ← Model
```

**Tecnologias Principais:**
- Node.js + Express
- TypeScript 5.1.6
- Ethers.js 6.0.2
- MongoDB 5.7.0
- Autenticação JWT
- Multer (upload de arquivos)

**Scripts Disponíveis:**
```bash
npm run dev       # Desenvolvimento com nodemon
npm run compile   # Compilar TypeScript
npm start         # Servidor de produção
```

### Camada DApp

Localizada no diretório `/dapp`.

**Tecnologias Principais:**
- React 18.2.0
- TypeScript 4.9.5
- React Router DOM 6.14.1
- Ethers.js 6.0.2
- Material Dashboard (Framework UI)
- Axios 1.4.0

**Páginas Principais:**
- `/login` - Autenticação com carteira
- `/residents` - Gerenciamento de moradores
- `/topics` - Tópicos de discussão e votação
- `/quota` - Interface de pagamento de cotas
- `/settings` - Configuração do sistema

**Scripts Disponíveis:**
```bash
npm start     # Servidor de desenvolvimento
npm run build # Build de produção
npm test      # Executar testes
```

## Tecnologias Utilizadas

### Blockchain
- [Hardhat](https://hardhat.org/) - Ambiente de desenvolvimento Ethereum
- [Solidity](https://soliditylang.org/) - Linguagem de smart contracts
- [Ethers.js](https://ethers.org/) - Biblioteca Web3

### Backend
- [Node.js](https://nodejs.org/) - Runtime JavaScript
- [Express](https://expressjs.com/) - Framework web
- [MongoDB](https://www.mongodb.com/) - Banco de dados NoSQL
- [TypeScript](https://www.typescriptlang.org/) - JavaScript tipado
- [JWT](https://jwt.io/) - Tokens de autenticação

### Frontend
- [React](https://react.dev/) - Biblioteca UI
- [TypeScript](https://www.typescriptlang.org/) - JavaScript tipado
- [Material Dashboard](https://www.creative-tim.com/) - Framework UI
- [Axios](https://axios-http.com/) - Cliente HTTP

## Começando

### Pré-requisitos

- Node.js ^16.8.0
- MongoDB (instância em execução)
- Carteira MetaMask
- BNB da BSC Testnet (para testes)

### Instalação

Clone o repositório:

```bash
git clone https://github.com/mabesi/dao-condominium.git
cd dao-condominium
```

Instale as dependências de cada camada:

```bash
# Blockchain
cd blockchain
npm install

# Backend
cd ../backend
npm install

# DApp
cd ../dapp
npm install
```

### Configuração

#### 1. Configuração do Blockchain

Crie o arquivo `.env` em `/blockchain`:

```bash
PRIVATE_KEY=sua_chave_privada_da_carteira
BSCSCAN_API_KEY=sua_chave_api_bscscan
```

#### 2. Configuração do Backend

Crie o arquivo `.env` em `/backend`:

```bash
PORT=3001
CORS_ORIGIN=http://localhost:3000
MONGO_HOST=mongodb://localhost:27017
MONGO_DATABASE=dao_condominium
JWT_SECRET=seu_segredo_jwt
JWT_EXPIRES=1h
CONTRACT_ADDRESS=endereco_do_contrato_implantado
BLOCKCHAIN_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

#### 3. Configuração do DApp

Crie o arquivo `.env` em `/dapp`:

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_CONTRACT_ADDRESS=endereco_do_contrato_implantado
REACT_APP_CHAIN_ID=97
```

### Uso

#### 1. Implantar Smart Contracts

```bash
cd blockchain
npm run compile
npm run deploy
# Copie o endereço do contrato implantado
```

#### 2. Iniciar Servidor Backend

```bash
cd backend
npm run dev
# Servidor executa em http://localhost:3001
```

#### 3. Iniciar DApp

```bash
cd dapp
npm start
# DApp executa em http://localhost:3000
```

#### 4. Acessar a Aplicação

1. Abra http://localhost:3000 no seu navegador
2. Conecte sua carteira MetaMask (BSC Testnet)
3. Assine a mensagem de autenticação
4. Comece a gerenciar seu condomínio!

## Contratos Implantados

**BSC Testnet (20 de julho de 2023):**

- Condominium Lib: `0xd82cd289E5da7A3426F775c722ea3fC639B401C7`
- Condominium: `0xfFbfE2E95Ded161E0b61C710642c613e3303AF3E`
- Condominium Adapter: `0xeb2A957219F561Bac4D898EA448dF397628789FB`

## Informações Adicionais

### Agradecimentos

Agradecimentos a todas essas pessoas e ferramentas incríveis que serviram como fonte de conhecimento ou foram parte integral na construção deste projeto.

- [Hardhat](https://hardhat.org/) - Ambiente de Desenvolvimento Ethereum
- [Solidity](https://soliditylang.org/) - Linguagem de Smart Contracts
- [Ethers.js](https://ethers.org/) - Biblioteca Web3
- [Node.js](https://nodejs.org/) - Runtime JavaScript
- [Express](https://expressjs.com/) - Framework Web
- [React](https://react.dev/) - Biblioteca UI
- [MongoDB](https://www.mongodb.com/) - Banco de Dados NoSQL
- [TypeScript](https://www.typescriptlang.org/) - Linguagem de Programação Tipada
- [Material Dashboard](https://www.creative-tim.com/) - Framework UI
- [LuizTools](https://www.luiztools.com.br/) - Cursos de Web3 e Blockchain

### Veja Também

Explore estes projetos relacionados para aprendizado e referência:

- [Basic Token ERC-20](https://github.com/mabesi/solidity-coin-erc20)
- [Basic Token BEP-20](https://github.com/mabesi/solidity-coin-bep20)
- [Basic NFT ERC-721](https://github.com/mabesi/solidity-nft-erc721)
- [Basic Azuki NFT ERC-721A](https://github.com/mabesi/azuki-nft)
- [Basic Multi Token ERC-1155](https://github.com/mabesi/solidity-multitoken-erc1155)

### Contribuindo

Por favor, primeiro nos pergunte sobre os detalhes do código de conduta. Depois disso, siga estas etapas do processo para enviar pull requests para nós.

1. Faça um fork!
2. Crie sua branch de feature: `git checkout -b minha-nova-feature`
3. Adicione suas mudanças: `git add .`
4. Commit suas mudanças: `git commit -am 'Adiciona alguma feature'`
5. Push para a branch: `git push origin minha-nova-feature`
6. Envie um pull request :sunglasses:

### Autores e Contribuidores

| [<img loading="lazy" src="https://github.com/mabesi/mabesi/blob/master/octocat-mabesi.png" width=115><br><sub>Plinio Mabesi</sub>](https://github.com/mabesi) |
| :---: |

### Aviso Legal

<p align="justify">O uso desta ferramenta, para qualquer finalidade, ocorrerá por sua conta e risco, sendo de sua exclusiva responsabilidade por quaisquer implicações legais decorrentes.</p>
<p align="justify">É também responsabilidade do usuário final conhecer e obedecer todas as leis locais, estaduais e federais aplicáveis. Os desenvolvedores não assumem responsabilidade e não são responsáveis por qualquer uso indevido ou dano causado por este programa.</p>

### Licença

Este projeto está licenciado sob a Licença MIT.
