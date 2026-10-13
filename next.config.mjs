import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@articles-media/articles-dev-box"],
    reactCompiler: true,
    poweredByHeader: false,
    // Only needed when using Turbopack when using linked packages like '@articles-media/articles-dev-box' as opposed to installed from npm, basically when developing the package locally.
    turbopack: {
        // Common parent containing both current project and articles-dev-box
        // root: path.resolve(configDirectory, "..", ".."),
    },
    images: {
        // domains: ['cdn.articles.media', 'articles-website.s3.amazonaws.com', 'd3bzp9rk94ifwy.cloudfront.net'],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.articles.media",
                port: "",
                // pathname: '',
            },
            {
                protocol: "https",
                hostname: "articles-website.s3.amazonaws.com",
                port: "",
                // pathname: '',
            },
        ],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
