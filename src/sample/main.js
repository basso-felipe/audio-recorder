import { AudioRecorder } from "../index.js";

const start = document.getElementById("start");
const stop = document.getElementById("stop");
const pause = document.getElementById("pause");
const resume = document.getElementById("resume");
const discard = document.getElementById("discard");
const link = document.getElementById("link");

const recorder = new AudioRecorder();

pause.onclick = () => {
  recorder.pause();
  console.log("pausado!");
};

resume.onclick = () => {
  recorder.resume();
  console.log("retomado!");
};

discard.onclick = () => {
  recorder.discard();
  console.log("descartado!");
};

start.onclick = () => {
  console.log("iniciando...");
  recorder.start().then(() => {
    console.log("iniciado!");
  });
};

stop.onclick = () => {
  console.log("finalizando...");
  recorder.stop().then((blob) => {
    console.log("finalizado!");

    const file = new File([blob], "arquivo-de-audio.webm", {
      type: "audio/webm",
    });

    const url = URL.createObjectURL(file);

    const a = document.createElement("a");
    a.href = url;
    a.innerText = url;

    const p = document.createElement("p");
    p.innerText = "Link:";
    p.appendChild(a);

    const source = document.createElement("source");
    source.src = url;
    source.type = "audio/webm";

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.appendChild(source);

    const container = document.createElement("div");
    container.appendChild(audio);
    container.appendChild(p);
    container.appendChild(document.createElement("hr"));

    link.appendChild(container);
  });
};
