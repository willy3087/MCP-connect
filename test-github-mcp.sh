#!/bin/bash
# Substitua este token pelo seu token de acesso pessoal do GitHub
GITHUB_TOKEN="seu_token_github_aqui"

curl -X POST http://localhost:3004/bridge \
     -H "Content-Type: application/json" \
     -d "{
       \"method\": \"tools/list\",
       \"serverPath\": \"npx\",
       \"args\": [
         \"-y\",
         \"@modelcontextprotocol/server-github\"
       ],
       \"params\": {},
       \"env\": {
         \"GITHUB_PERSONAL_ACCESS_TOKEN\": \"$GITHUB_TOKEN\"
       }
     }"

./test-github-mcp.sh > resultado.json
cat resultado.json
