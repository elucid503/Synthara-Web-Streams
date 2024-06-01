import { YoutubeVideo } from "./classes";
import { GetVideo } from "./functions";

async function Main() {

    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    const info = await GetVideo(url, true);
    
    const NewVideo = new YoutubeVideo(info.json, info.liveFormats);

    const format = NewVideo.formats.filter((f) => !f.hasVideo && f.hasAudio && f.isHLS);

    console.log(format);

}

setTimeout(Main, 1000);
