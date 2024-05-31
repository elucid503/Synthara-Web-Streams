export declare class YoutubeConfig extends null {
    static INNERTUBE_API_KEY: string;
    static INNERTUBE_API_VERSION: string;
    static INNERTUBE_CLIENT_NAME: string;
    static INNERTUBE_CLIENT_VERSION: string;
    static INNERTUBE_CONTEXT: {
        client: {
            clientName: string;
            clientVersion: string;
            deviceModel: string;
            userAgent: string;
        };
    };
    static STS: number;
    static PLAYER_JS_URL: string;
    static PLAYER_TOKENS: string[] | null;
    static fetchConfig(): Promise<void>;
}
