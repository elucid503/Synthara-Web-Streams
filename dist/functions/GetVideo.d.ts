import { YoutubeVideo } from '../classes';
export declare function GetVideo(URLorID: string, GetHLSFormats?: boolean, Proxy?: {
    Host: string;
    Port: number;
    UserPass?: string;
}): Promise<YoutubeVideo>;
