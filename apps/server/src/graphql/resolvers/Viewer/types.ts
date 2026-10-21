export interface LogInArgs {
    input: { code: string; state: string } | null;
}

export interface ConnectStripeArgs {
    input: { code: string };
}
