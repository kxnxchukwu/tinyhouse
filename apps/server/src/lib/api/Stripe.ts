import stripe from 'stripe';

const client = new stripe(`${process.env.S_SECRET_KEY}`, {
    apiVersion: '2020-08-27',
});

export const Stripe = {
    connect: async (code: string) => {
        const response = await client.oauth.token({
            grant_type:"authorization_code",
            code
        });

        return response;
    },
    // idempotencyKey makes a retried request return the original charge instead of charging twice.
    charge: async (amount: number, source: string, stripeAccount: string, idempotencyKey: string) => {
        const res = await client.charges.create(
            {
                amount,
                currency: "eur",
                source,
                application_fee_amount: Math.round(amount * 0.10)
            },
            {
                stripeAccount,
                idempotencyKey
            }
        );

        if (res.status !== "succeeded") {
            throw new Error("Failed to create charge with Stripe.");
        }
    },
    disconnect: async (stripeUserId: string) => {
        const response = await client.oauth.deauthorize({
          client_id: `${process.env.S_CLIENT_ID}`,
          stripe_user_id: stripeUserId
        });
    
        return response;
      },
}