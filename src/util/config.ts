import axios from 'axios';
import { Util } from './Util';

export class YoutubeConfig extends null {
    static INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
    static INNERTUBE_API_VERSION = 'v1';
    static INNERTUBE_CLIENT_NAME = 'WEB';
    static INNERTUBE_CLIENT_VERSION = '2.20211104.02.00';
    static INNERTUBE_CONTEXT = {
        client: {
            hl: 'en',
            gl: 'US',
            clientName: 'WEB',
            clientVersion: '2.20211104.02.00',
            utcOffsetMinutes: 0
        },
        user: {},
        request: {}
    };
    static INNERTUBE_ANDROID_CONTEXT = {
        client: {
            hl: 'en',
            gl: 'US',
            clientName: 'ANDROID',
            clientVersion: '16.43.34',
            utcOffsetMinutes: 0
        },
        user: {},
        request: {}
    };
    static PLAYER_JS_URL = '';

    static async fetchConfig(): Promise<void> {
        try {
            const { data } = await axios.get<string>(`${Util.getYTBaseURL()}?hl=en`);

            const json = JSON.parse((/ytcfg.set\(({.+?})\)/s.exec(data) as RegExpExecArray)[1]);

            YoutubeConfig.INNERTUBE_API_KEY = json.INNERTUBE_API_KEY;
            YoutubeConfig.INNERTUBE_API_VERSION = json.INNERTUBE_API_VERSION;
            YoutubeConfig.INNERTUBE_CONTEXT.client.clientName = YoutubeConfig.INNERTUBE_CLIENT_NAME =
                json.INNERTUBE_CLIENT_NAME;
            YoutubeConfig.INNERTUBE_CONTEXT.client.clientVersion = YoutubeConfig.INNERTUBE_CLIENT_VERSION =
                json.INNERTUBE_CLIENT_VERSION;
            YoutubeConfig.PLAYER_JS_URL = json.PLAYER_JS_URL;

            setTimeout(YoutubeConfig.fetchConfig, 120 * 60 * 1000);
        } catch {}
    }
}

YoutubeConfig.fetchConfig();
