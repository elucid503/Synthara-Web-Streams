import { request } from 'undici';
import { extractTokens } from './decipher';

export class YoutubeConfig extends null {
    static INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
    static INNERTUBE_API_VERSION = 'v1';
    static INNERTUBE_CLIENT_NAME = 'WEB';
    static INNERTUBE_CLIENT_VERSION = '2.20220502.01.00';
    static INNERTUBE_CONTEXT = {
        client: {
            hl: 'en',
            gl: 'US',
            clientName: 'WEB',
            clientVersion: '2.20220502.01.00'
        },
        user: {},
        request: {}
    };
    static INNERTUBE_ANDROID_CONTEXT = {
        client: {
            hl: 'en',
            gl: 'US',
            clientName: 'ANDROID',
            clientVersion: '17.17.34'
        },
        user: {},
        request: {}
    };
    static PLAYER_JS_URL = '';
    static PLAYER_TOKENS: string[] | null = null;

    static async fetchConfig(): Promise<void> {
        try {
            const { body } = await request('https://www.youtube.com/?hl=en');

            const json = JSON.parse((/ytcfg.set\(({.+?})\);/s.exec(await body.text()) as RegExpExecArray)[1]);

            YoutubeConfig.INNERTUBE_API_KEY = json.INNERTUBE_API_KEY;
            YoutubeConfig.INNERTUBE_API_VERSION = json.INNERTUBE_API_VERSION;
            YoutubeConfig.INNERTUBE_CONTEXT.client.clientName = YoutubeConfig.INNERTUBE_CLIENT_NAME =
                json.INNERTUBE_CLIENT_NAME;
            YoutubeConfig.INNERTUBE_CONTEXT.client.clientVersion = YoutubeConfig.INNERTUBE_CLIENT_VERSION =
                json.INNERTUBE_CLIENT_VERSION;

            if (YoutubeConfig.PLAYER_JS_URL !== json.PLAYER_JS_URL) {
                const { body: player } = await request(`https://www.youtube.com${json.PLAYER_JS_URL}`);
                YoutubeConfig.PLAYER_JS_URL = json.PLAYER_JS_URL;
                YoutubeConfig.PLAYER_TOKENS = extractTokens(await player.text());
            }

            setTimeout(YoutubeConfig.fetchConfig, 120 * 60 * 1000);
        } catch {}
    }
}

YoutubeConfig.fetchConfig();
