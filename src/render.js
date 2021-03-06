// Buttons
const VideoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

const { desktopCapturer, ipcRenderer, dialog } = require('electron');
//const { Menu } = remote;

// Start Button
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

// Stop button
stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
};


// Get available video sources
async function getVideoSources () {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const inputSourcesMapped = inputSources.map(source => {
        return {
            label: source.name,
            id: source.id,
            //click: () => selectSource(source)
        };
    });

    ipcRenderer.send('sendVideoSources', inputSourcesMapped);

}

let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

ipcRenderer.on('selectedSource', (event, source) => selectSource(source));

// Change the videoSource window to record
async function selectSource(source) {
    videoSelectBtn.innerText = source.label;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    // Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Preview the source in a video element
    VideoElement.srcObject = stream;
    VideoElement.play();

    // Create the Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handelers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

// Captures all recorded chunks
function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}

//const { dialog } = ipcRenderer;
const { writeFile } = require('fs');

// Saves the video file on stop
async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    ipcRenderer.send('getVideoPath')
    ipcRenderer.on('getVideoPathReply', (event, filePath) => {

        console.log(filePath);

        writeFile(filePath, buffer, () => console.log('video saved!'));
    })

}