# WhatsApp Web Clone - MicroSaaS

Um clone completo do WhatsApp Web usando Next.js, Node.js, whatsapp-web.js e Supabase.

## 🚀 Funcionalidades

- ✅ Autenticação com Supabase
- ✅ Conexão WhatsApp via QR Code
- ✅ Interface idêntica ao WhatsApp Web
- ✅ Envio e recebimento de mensagens em tempo real
- ✅ Lista de conversas
- ✅ Status de mensagem (enviado, entregue, lido)
- ✅ Persistência de sessão
- ✅ Multi-usuário (cada usuário com sua própria conexão)

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Socket.io-client
- **Backend**: Node.js, Express, whatsapp-web.js, Socket.io
- **Banco de Dados**: Supabase (PostgreSQL)
- **Deploy**: Docker, Hetzner VPS

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Conta no Supabase
- VPS com Ubuntu 22.04 (mínimo 2GB RAM)

## 🔧 Configuração Local

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/whatsapp-saas.git
cd whatsapp-saas
```

### 2. Configure o Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie as credenciais:
   - Project URL
   - Service Role Key (Settings → API)
   - Anon Key

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key
SUPABASE_ANON_KEY=sua-anon-key
JWT_SECRET=gere-uma-chave-secreta
```

### 4. Instale as dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Execute localmente

```bash
# Na raiz do projeto
docker compose up
```

Acesse:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 🚀 Deploy no Hetzner

### 1. Configure o VPS

SSH no seu servidor Hetzner:
```bash
ssh root@seu-ip
```

Execute o script de setup:
```bash
curl -s https://raw.githubusercontent.com/seu-repo/setup-vps.sh | bash
```

### 2. Configure o projeto

```bash
cd /opt/whatsapp-saas
nano .env  # Adicione suas credenciais do Supabase
```

### 3. Inicie a aplicação

```bash
docker compose up -d
```

### 4. Configure SSL (opcional)

```bash
certbot --nginx -d seu-dominio.com
```

## 📁 Estrutura do Projeto

```
whatsapp-saas/
├── backend/
│   ├── src/
│   │   ├── services/     # WhatsApp manager
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, error handling
│   │   └── index.ts      # Server principal
│   └── Dockerfile
├── frontend/
│   ├── app/              # Páginas Next.js
│   ├── components/       # Componentes React
│   ├── lib/              # Utilities
│   └── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

## 🔒 Segurança

- Use sempre HTTPS em produção
- Mantenha as Service Keys seguras
- Configure rate limiting
- Use RLS (Row Level Security) no Supabase
- Faça backup regular das sessões

## 📊 Banco de Dados

Tabelas principais:
- `users` - Usuários do sistema
- `whatsapp_sessions` - Sessões do WhatsApp
- `chats` - Lista de conversas
- `messages` - Mensagens
- `contacts` - Contatos

## 🐛 Troubleshooting

### Erro de QR Code
- Verifique se o Puppeteer está instalado corretamente
- Aumente a memória do container se necessário

### Erro de conexão
- Verifique as credenciais do Supabase
- Confirme que as portas estão abertas no firewall

### Performance
- Use Redis para cache
- Configure swap se RAM < 2GB
- Limite o número de mensagens carregadas

## 📝 Comandos Úteis

```bash
# Logs
docker compose logs -f

# Restart
docker compose restart

# Update
git pull && docker compose build && docker compose up -d

# Backup sessões
docker cp whatsapp-saas_backend_1:/app/.wwebjs_auth ./backup

# Restore sessões
docker cp ./backup whatsapp-saas_backend_1:/app/.wwebjs_auth
```

## ⚠️ Avisos Importantes

1. **WhatsApp pode banir** se detectar uso indevido
2. Use apenas **1 instância por número**
3. Não envie spam ou mensagens em massa
4. Respeite os Termos de Uso do WhatsApp
5. Este é um projeto educacional

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes

## 🆘 Suporte

- Issues: [GitHub Issues](https://github.com/seu-usuario/whatsapp-saas/issues)
- Email: seu-email@exemplo.com

## 🙏 Agradecimentos

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [Supabase](https://supabase.com)
- [Next.js](https://nextjs.org)

---

**Desenvolvido com ❤️ usando Claude Code**