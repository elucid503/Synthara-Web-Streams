const { GetVideo, YoutubeVideo } = require('../dist/index.js');

async function Main() {

    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    const info = await GetVideo(url, true, { Host: "181.177.65.138", Port: 3199 });
    
    const NewVideo = new YoutubeVideo(info.json, info.liveFormats);

    const format = (NewVideo.formats).concat(NewVideo.liveFormats).filter((f) => !f.hasVideo && f.hasAudio && f.isHLS);

    console.log(format);

}

setTimeout(Main, 1000);
