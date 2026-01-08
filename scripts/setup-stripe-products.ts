import dotenv from 'dotenv';
import Stripe from 'stripe';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Error: STRIPE_SECRET_KEY not found in .env');
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as any,
});

async function main() {
    try {
        console.log('Starting Stripe Product Setup...');

        // 1. Create "Estágio" Product - R$ 0.01 (One-time)
        // Note: Stripe minimum for BRL is usually roughly R$ 0.50. R$ 0.01 might fail.
        // If it fails, we catch the error.
        let estagioPriceId = '';
        try {
            console.log('Creating "Estágio" Product...');
            const estagioProduct = await stripe.products.create({
                name: 'Plano Estágio',
                description: 'Plano para estudantes (Taxa única)',
            });

            const estagioPrice = await stripe.prices.create({
                product: estagioProduct.id,
                unit_amount: 50, // 50 centavos
                currency: 'brl',
                // 'one_time' is default if recurring is not specified, but explicit is better? 
                // actually default is one_time if no recurring.
            });
            estagioPriceId = estagioPrice.id;
            console.log(`✅ "Estágio" Created! Product ID: ${estagioProduct.id}, Price ID: ${estagioPrice.id}`);
        } catch (error: any) {
            console.error('❌ Failed to create "Estágio" (likely due to minimum amount):', error.message);
            console.log('⚠️  Skipping "Estágio" creation. Please create manually or increase amount.');
        }

        // 2. Create "Iniciante" Product - R$ 47.00/month
        console.log('\nCreating "Iniciante" Product...');
        const inicianteProduct = await stripe.products.create({
            name: 'Plano Iniciante',
            description: 'Plano para quem está começando',
        });

        const iniciantePrice = await stripe.prices.create({
            product: inicianteProduct.id,
            unit_amount: 4700, // R$ 47,00
            currency: 'brl',
            recurring: {
                interval: 'month',
            },
        });
        console.log(`✅ "Iniciante" Created! Product ID: ${inicianteProduct.id}, Price ID: ${iniciantePrice.id}`);

        // 3. Create Coupon for "Iniciante" (First month R$ 19.99)
        // Regular: 47.00. First month: 19.99. Discount needed: 47.00 - 19.99 = 27.01
        console.log('\nCreating Coupon for "Iniciante" (First month discount)...');

        // Check if coupon already exists to avoid duplicates if re-run? No, simple script.
        const coupon = await stripe.coupons.create({
            name: 'Desconto 1º Mês Iniciante',
            amount_off: 2701, // R$ 27,01 discount
            currency: 'brl',
            duration: 'once',
        });
        console.log(`✅ Coupon Created! ID: ${coupon.id}, Code: ${coupon.name} (Hidden ID used for API)`);

        console.log('\n--- SUMMARY ---');
        console.log(`Estágio Price ID: ${estagioPriceId || '(Failed)'}`);
        console.log(`Iniciante Price ID: ${iniciantePrice.id}`);
        console.log(`Iniciante Coupon ID: ${coupon.id}`);
        console.log('----------------');

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

main();
