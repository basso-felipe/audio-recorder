export type AudioRecorderOptions = {};

export class AudioRecorder {
  private _mediaRecorderInstance!: MediaRecorder;
  private _discardResult: boolean = false;

  private _result?: Blob;

  constructor() {}

  static isMediaStreamSupported(): boolean {
    return (
      window != null &&
      window.navigator != null &&
      window.navigator.mediaDevices != null &&
      window.navigator.mediaDevices.getUserMedia != null &&
      typeof window.navigator.mediaDevices.getUserMedia == "function"
    );
  }

  static isStreamMimeTypeSupported(mimeType: string): boolean {
    return MediaRecorder.isTypeSupported(mimeType);
  }

  public get mediaRecorder(): MediaRecorder {
    if (!this._mediaRecorderInstance)
      throw new Error(`Audio Media Recorder not started yet!`);

    return this._mediaRecorderInstance;
  }

  private get _navigator(): Navigator {
    if (!AudioRecorder.isMediaStreamSupported())
      throw new Error(`Audio Media Stream is not supported!`);

    return window.navigator;
  }

  public start(): Promise<void> {
    const audioStreamPromise: Promise<void> = this._navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((mediaStream) => {
        this._mediaRecorderInstance = new MediaRecorder(mediaStream, {
          mimeType: "audio/webm",
        });

        const chunks: Blob[] = [];

        this.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

        this.mediaRecorder.onstop = () => {
          console.log("ended!");
          mediaStream.getTracks().forEach((track) => track.stop());

          if (this._discardResult) return void 0;

          const typeOptions = `audio/webm; codecs=opus`;

          this._result = new Blob(chunks, { type: typeOptions });

          return void 0;
        };

        this.mediaRecorder.start();

        return void 0;
      })
      .catch((err) => {
        console.error("[ORIGINAL_ERROR] =>", err);

        if (err.name == "NotFoundError" || err.name == "DevicesNotFoundError") {
          // Required track is missing
          throw new Error("Audio recorder error");
        }

        if (err.name == "NotReadableError" || err.name == "TrackStartError") {
          // Webcam or mic are already in use
          throw new Error("Audio recorder error");
        }

        if (
          err.name == "OverconstrainedError" ||
          err.name == "ConstraintNotSatisfiedError"
        ) {
          // Constraints can not be satisfied by available devices
          throw new Error("Audio recorder error");
        }

        if (
          err.name == "NotAllowedError" ||
          err.name == "PermissionDeniedError"
        ) {
          // Permission denied in browser
          throw new Error("Audio recorder error");
        }

        if (err.name == "TypeError" || err.name == "TypeError") {
          // Empty constraints object
          throw new Error("Audio recorder error");
        }

        throw new Error("Audio recorder error");
      });

    return audioStreamPromise;
  }

  public pause(): void {
    if (this.mediaRecorder.state != "recording")
      throw new Error("No audio recording!");

    this.mediaRecorder.pause();
  }

  public resume(): void {
    if (this.mediaRecorder.state != "paused")
      throw new Error("No audio paused!");

    this.mediaRecorder.resume();
  }

  public stop(): Promise<Blob> {
    if (this.mediaRecorder.state == "inactive")
      return Promise.reject("No audio recording!");

    this._discardResult = false;

    this.mediaRecorder.stop();
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (this._discardResult) {
          reject("The result was discarded!");
          clearInterval(interval);
          return void 0;
        }

        const result = this._result;

        if (result) {
          resolve(result!);
          clearInterval(interval);
        }
      }, 100);
    });
  }

  public discard(): void {
    if (
      this.mediaRecorder.state != "recording" &&
      this.mediaRecorder.state != "paused"
    )
      throw new Error("No audio opened!");
    this._discardResult = true;
    this.mediaRecorder.stop();
  }
}
