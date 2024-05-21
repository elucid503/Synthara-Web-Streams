import { extractTokens } from './Decipher';

// IMPORTANT: INNERTUBE_CONTEXT client must be set to IOS in order to get HLS live formats

export class YoutubeConfig extends null {
    static INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
    static INNERTUBE_API_VERSION = 'v1';
    static INNERTUBE_CLIENT_NAME = 'WEB';
    static INNERTUBE_CLIENT_VERSION = '2.20231012.01.03';
    static INNERTUBE_CONTEXT = {
        'client': {
            'clientName': 'IOS_MUSIC',
            'clientVersion': '6.33.3',
            'deviceModel': 'iPhone14,3',
            'userAgent': 'com.google.ios.youtubemusic/6.33.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)'
        },
    };
    static STS = 0;
    static PLAYER_JS_URL = '';
    static PLAYER_TOKENS: string[] | null = null;

    static async fetchConfig(): Promise<void> {
        try {
            const response = await fetch('https://www.youtube.com/?hl=en');

            const json = JSON.parse((/ytcfg.set\(({.+?})\);/s.exec(await response.text()) as RegExpExecArray)[1]);

            YoutubeConfig.INNERTUBE_API_KEY = json.INNERTUBE_API_KEY;
            YoutubeConfig.INNERTUBE_API_VERSION = json.INNERTUBE_API_VERSION;
            YoutubeConfig.INNERTUBE_CONTEXT.client.clientName = YoutubeConfig.INNERTUBE_CLIENT_NAME =
                json.INNERTUBE_CLIENT_NAME;
            YoutubeConfig.INNERTUBE_CONTEXT.client.clientVersion = YoutubeConfig.INNERTUBE_CLIENT_VERSION =
                json.INNERTUBE_CLIENT_VERSION;
            YoutubeConfig.STS = json.STS;

            if (YoutubeConfig.PLAYER_JS_URL !== json.PLAYER_JS_URL) {
                const response = await fetch(`https://www.youtube.com${json.PLAYER_JS_URL}`);
                const player = await response.text();
                YoutubeConfig.PLAYER_JS_URL = json.PLAYER_JS_URL;
                YoutubeConfig.PLAYER_TOKENS = extractTokens(player);
            }

            setTimeout(YoutubeConfig.fetchConfig, 120 * 60 * 1000);
        } catch {}
    }
}

YoutubeConfig.fetchConfig();
