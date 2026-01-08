import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProduct() {
    try {
        console.log("Creating product...");
        const product = await stripe.products.create({
            name: 'Plano Profissional - TRG Nexus',
            description: 'Assinatura mensal com pacientes ilimitados e relatórios IA.',
            images: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'],
        });
        console.log('Product created ID:', product.id);

        console.log("Creating price...");
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: 9700, // R$ 97.00
            currency: 'brl',
            recurring: {
                interval: 'month',
            },
        });

        console.log('Price created ID:', price.id);
    } catch (error) {
        console.error('Error:', error);
    }
}

createProduct();
