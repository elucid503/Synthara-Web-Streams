import { GetVideo } from './functions';

async function Main() {
    let url = 'https://www.youtube.com/watch?v=XDMg06hw97U';

    console.time('Time taken to fetch video info');

    const info = await GetVideo(url, true);

    console.timeEnd('Time taken to fetch video info');

    const format = info.formats.filter((f) => !f.hasVideo && f.hasAudio && f.isHLS);

    console.log(format);
}

Main();
