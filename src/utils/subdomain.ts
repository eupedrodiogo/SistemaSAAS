export const getSubdomain = (): string | null => {
    const hostname = window.location.hostname;

    // Localhost support (e.g., client.localhost or custom.localhost)
    if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        // If we have distinct parts and it's not just "localhost" (1 part)
        // and typically "sub.localhost" has 2 parts.
        // However, usually developers map defaults like "app.localhost".
        if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app') {
            return parts[0];
        }
        return null;
    }

    // Vercel deployment URLs (project.vercel.app) or Preview URLs (project-git-branch.vercel.app)
    // We treat ALL vercel.app domains as the "Root" application, never as a tenant subdomain.
    // Tenant subdomains are only supported on the custom domain (e.g. name.teranexus.com.br).
    if (hostname.endsWith('.vercel.app')) {
        return null;
    }

    // Production Custom Domain (e.g. sub.teranexus.com.br)
    // Check if we are on the main domain or a subdomain
    if (hostname.includes('teranexus.com.br')) {
        const parts = hostname.split('.');
        // teranexus.com.br -> [teranexus, com, br] (3 parts) -> parts[0] is 'teranexus' (but checking length is safer)

        // If we have more parts than the root domain
        // sub.teranexus.com.br -> 4 parts
        if (parts.length > 3) {
            const subdomain = parts[0];
            if (subdomain !== 'www' && subdomain !== 'app') {
                return subdomain;
            }
        }
    }

    return null;
};
