# MCP Connect

[![Licença: MIT](https://img.shields.io/badge/Licença-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

    ███╗   ███╗ ██████╗██████╗      ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗
    ████╗ ████║██╔════╝██╔══██╗    ██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝
    ██╔████╔██║██║     ██████╔╝    ██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║
    ██║╚██╔╝██║██║     ██╔═══╝     ██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║
    ██║ ╚═╝ ██║╚██████╗██║         ╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║
    ╚═╝     ╚═╝ ╚═════╝╚═╝          ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝

O Model Context Protocol (MCP) introduzido pela Anthropic é interessante. No entanto, a maioria dos servidores MCP são construídos em transporte Stdio, que, embora excelente para acessar recursos locais, limita seu uso em aplicações baseadas em nuvem.

O MCP Connect é uma pequena ferramenta criada para resolver este problema:

- **Integração com Nuvem**: Permite que serviços de IA baseados em nuvem interajam com servidores MCP locais baseados em Stdio
- **Tradução de Protocolo**: Converte requisições HTTP/HTTPS em comunicação Stdio
- **Segurança**: Fornece acesso seguro a recursos locais mantendo o controle
- **Flexibilidade**: Suporta vários servidores MCP sem modificar sua implementação
- **Fácil de usar**: Basta executar o MCP Connect localmente, sem necessidade de modificar o servidor MCP
- **Túnel**: Suporte integrado para túnel Ngrok

Ao preencher esta lacuna, podemos aproveitar todo o potencial das ferramentas MCP locais em aplicações de IA baseadas em nuvem sem comprometer a segurança.

## Como funciona

```
+-----------------+     HTTPS/SSE      +------------------+      stdio      +------------------+
|                 |                    |                  |                 |                  |
|  Ferramentas IA | <--------------->  |  Ponte Node.js   | <------------>  |    Servidor MCP  |
|   (Remoto)      |       Túneis       |    (Local)       |                 |     (Local)      |
|                 |                    |                  |                 |                  |
+-----------------+                    +------------------+                 +------------------+
```

## Pré-requisitos

- Node.js

## Início Rápido

1. Clone o repositório

   ```bash
   git clone https://github.com/EvalsOne/MCP-connect.git
   ```

   e entre no diretório

   ```bash
   cd MCP-connect
   ```

2. Copie `.env.example` para `.env` e configure a porta e o token de autenticação:

   ```bash
   cp .env.example .env
   ```

3. Instale as dependências:

   ```bash
   npm install
   ```

4. Execute o MCP Connect

   ```bash
   # construa o MCP Connect
   npm run build
   # execute o MCP Connect
   npm run start
   # ou, execute em modo de desenvolvimento (suporta recarregamento automático via nodemon)
   npm run dev
   ```

   Agora o MCP Connect deve estar rodando em `http://localhost:3000/bridge`.

Observação:

- A ponte é projetada para ser executada em uma máquina local, então você ainda precisa construir um túnel para o servidor MCP local que seja acessível da nuvem.
- Ngrok, Cloudflare Zero Trust e LocalTunnel são recomendados para construir o túnel.

## Executando com Túnel Ngrok

O MCP Connect tem suporte integrado para túnel Ngrok. Para executar a ponte com uma URL pública usando Ngrok:

1. Obtenha seu token de autenticação Ngrok em https://dashboard.ngrok.com/authtokens
2. Adicione ao seu arquivo .env:

   ```
   NGROK_AUTH_TOKEN=seu_token_ngrok
   ```

3. Execute com túnel:

   ```bash
   # Modo de produção com túnel
   npm run start:tunnel

   # Modo de desenvolvimento com túnel
   npm run dev:tunnel
   ```

   Após o MCP Connect estar em execução, você pode ver a URL da ponte MCP no console.

## Endpoints da API

Após o MCP Connect estar em execução, existem dois endpoints expostos:

- `GET /health`: Endpoint de verificação de saúde
- `POST /bridge`: Endpoint principal da ponte para receber requisições da nuvem

Por exemplo, a seguir está uma configuração do [MCP GitHub oficial](https://github.com/modelcontextprotocol/servers/tree/main/src/github):

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "<seu_token_de_acesso_pessoal_github>"
  }
}
```

Você pode enviar uma requisição para a ponte da seguinte forma para listar as ferramentas do servidor MCP e chamar uma ferramenta específica.

**Listando ferramentas:**

```bash
curl -X POST http://localhost:3004/bridge \
     -d '{
       "method": "tools/list",
       "serverPath": "npx",
       "args": [
         "-y",
         "@modelcontextprotocol/server-github"
       ],
       "params": {},
       "env": {
         "GITHUB_PERSONAL_ACCESS_TOKEN": "<seu_token_de_acesso_pessoal_github>"
       }
     }'
```

**Chamando uma ferramenta:**

Usando a ferramenta search_repositories para procurar repositórios relacionados ao modelcontextprotocol

```bash
curl -X POST http://localhost:3004/bridge \
     -d '{
       "method": "tools/call",
       "serverPath": "npx",
       "args": [
         "-y",
         "@modelcontextprotocol/server-github"
       ],
       "params": {
         "name": "search_repositories",
         "arguments": {
            "query": "modelcontextprotocol"
         },
       },
       "env": {
         "GITHUB_PERSONAL_ACCESS_TOKEN": "<seu_token_de_acesso_pessoal_github>"
       }
     }'
```

## Autenticação

O MCP Connect usa um sistema simples de autenticação baseado em token. O token é armazenado no arquivo `.env`. Se o token estiver definido, o MCP Connect o usará para autenticar a requisição.

Exemplo de requisição com token:

```bash
curl -X POST http://localhost:3004/bridge \
     -H "Authorization: Bearer <seu_token>" \
     -d '{
       "method": "tools/list",
       "serverPath": "npx",
       "args": [
         "-y",
         "@modelcontextprotocol/server-github"
       ],
       "params": {},
       "env": {
         "GITHUB_PERSONAL_ACCESS_TOKEN": "<seu_token_de_acesso_pessoal_github>"
       }
     }'
```

## Configuração

Variáveis de ambiente necessárias:

- `AUTH_TOKEN`: Token de autenticação para a API da ponte (Opcional)
- `PORT`: Porta do servidor HTTP (padrão: 3004, obrigatório)
- `LOG_LEVEL`: Nível de log (padrão: info, obrigatório)
- `NGROK_AUTH_TOKEN`: Token de autenticação Ngrok (Opcional)

## Usando o MCP Connect com ConsoleX AI para acessar o Servidor MCP Local

A seguir está uma demonstração do uso do MCP Connect para acessar um Servidor MCP local no [ConsoleX AI](https://consolex.ai):

[![Demonstração ao Vivo do MCP Connect](readme/thumbnail.png)](https://github-production-user-asset-6210df.s3.amazonaws.com/6077178/400736575-19dec583-7911-4221-bd87-3e6032ea7732.mp4)

## Licença

Licença MIT
