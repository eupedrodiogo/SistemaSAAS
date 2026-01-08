
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

console.log(`${colors.bright}${colors.blue}=== TRG Nexus: Diagnóstico de Produção ===${colors.reset}\n`);

// 1. Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}✖ Erro: Arquivo .env.local não encontrado!${colors.reset}`);
    process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

function checkKey(keyName, value) {
    if (!value) {
        console.log(`${colors.red}✖ ${keyName}: AUSENTE${colors.reset}`);
        return;
    }

    let status = "";
    let isProd = false;

    // STRIPE
    if (keyName.includes('STRIPE')) {
        if (value.startsWith('sk_live') || value.startsWith('pk_live')) {
            status = `${colors.green}LIVE (Produção)${colors.reset}`;
            isProd = true;
        } else {
            status = `${colors.yellow}TEST (Teste)${colors.reset}`;
        }
    }
    // SUPABASE
    else if (keyName.includes('SUPABASE')) {
        // Supabase keys don't have a prefix, but we can check the URL
        status = `${colors.cyan}Configurada${colors.reset}`;
    }
    // PICPAY
    else if (keyName.includes('PICPAY')) {
        status = `${colors.cyan}Configurada${colors.reset}`;
    }

    console.log(`${colors.bright}${keyName}:${colors.reset} ${status}`);
    if (keyName.includes('STRIPE') && !isProd) {
        console.log(`   ${colors.yellow}⚠ Atenção: Stripe ainda em modo de teste!${colors.reset}`);
    }
}

console.log(`${colors.bright}Verificando chaves no .env.local...${colors.reset}`);
checkKey('STRIPE_PUBLISHABLE_KEY', envConfig.VITE_STRIPE_PUBLISHABLE_KEY || envConfig.STRIPE_PUBLISHABLE_KEY);
checkKey('STRIPE_SECRET_KEY', envConfig.STRIPE_SECRET_KEY);
checkKey('SUPABASE_URL', envConfig.VITE_SUPABASE_URL || envConfig.SUPABASE_URL);
checkKey('PICPAY_TOKEN', envConfig.PICPAY_TOKEN);

console.log(`\n${colors.blue}--- Dica para Vercel ---${colors.reset}`);
console.log(`Para garantir que as chaves de produção estão ativas na nuvem, rode:`);
console.log(`${colors.cyan}vercel env pull .env.production.local${colors.reset}`);
console.log(`Isso baixará as variáveis configuradas no painel da Vercel.`);
