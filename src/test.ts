import { GetVideo } from './functions';

async function Main() {

    let url = "https://youtu.be/RmlQA3kEUGQ";

    console.time("Time taken to fetch video info")

    const info = await GetVideo(url);

    console.timeEnd("Time taken to fetch video info")

    console.log(info);

    console.time("Time taken to init audio stream")

    const stream = info.Download(f => f.hasAudio && !f.hasVideo);

    stream.on("data", (chunk) => {
        console.timeEnd("Time taken to init audio stream")
        console.log(chunk);
    });

    stream.on("end", () => {
        console.log("Stream ended");
    });



}

Main();