import { YoutubeVideoFormat } from '../classes';
export declare class Util extends null {
    static getVideoURL(id: string): string;
    static getApiURL(param: string): string;
    static getVideoId(urlOrId: string, checkUrl?: boolean): string | null;
    static getMetadataFormat(format: YoutubeVideoFormat): YoutubeVideoFormat;
    static GetHLSFormats(URL: string): Promise<YoutubeVideoFormat[]>;
}
