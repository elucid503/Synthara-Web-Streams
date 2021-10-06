export const Regexes = {
    YOUTUBE_INITIAL_DATA: /var\s+ytInitialData\s*=\s*({.+?});/,
    YOUTUBE_PLAYER_RESPONSE: /var\s+ytInitialPlayerResponse\s*=\s*({.+?});/,
    YOUTUBE_API_KEY: /"(?:INNERTUBE_API_KEY|innertubeApiKey)"\s*:\s*"(.+?)"/,
    INNERTUBE_CLIENT_VERSION: /"(?:INNERTUBE_CONTEXT_CLIENT_VERSION|innertube_context_client_version)"\s*:\s*"(.+?)"/,
    PLAYER_URL: /"(?:PLAYER_JS_URL|jsUrl)"\s*:\s*"(.+?)"/
};
