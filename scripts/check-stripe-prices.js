
import dotenv from 'dotenv';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

// Carregar .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const stripeKey = envConfig.STRIPE_SECRET_KEY;

if (!stripeKey) {
    console.log("\x1b[31m✖ Erro: STRIPE_SECRET_KEY não encontrada no .env.local\x1b[0m");
    process.exit(1);
}

const stripe = new Stripe(stripeKey);

async function listLivePrices() {
    console.log("\x1b[36m=== Consultando Produtos e Preços REAIS no Stripe ===\x1b[0m\n");

    try {
        const prices = await stripe.prices.list({
            active: true,
            expand: ['data.product']
        });

        if (prices.data.length === 0) {
            console.log("\x1b[33m⚠ Nenhum preço ativo encontrado. Você precisa criar os produtos no modo LIVE do Stripe.\x1b[0m");
            return;
        }

        prices.data.forEach(price => {
            const product = price.product;
            console.log(`\x1b[1mProduto:\x1b[0m ${product.name}`);
            console.log(`\x1b[32mID do Preço:\x1b[0m ${price.id}`);
            console.log(`\x1b[1mValor:\x1b[0m ${(price.unit_amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: price.currency })}`);
            console.log('------------------------------');
        });

        console.log("\n\x1b[34mDICA:\x1b[0m Copie os IDs acima e substitua-os no arquivo LandingPage.tsx");

    } catch (error) {
        console.error("\x1b[31m✖ Erro ao conectar com Stripe:\x1b[0m", error.message);
    }
}

listLivePrices();
