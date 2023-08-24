/**
 * ### Audio recorder
 * This class is a wrapper to browser `MediaRecorder` API
 * @class
 */
export class AudioRecorder {
  private _mediaRecorderInstance!: MediaRecorder;

  private _result?: Blob;

  /**
   * Audio recorder constructor
   * @constructor
   */
  constructor() {}

  /**
   * Checks if the `getUserMedia` function is supported in the browser
   * @returns {boolean}
   * @static
   */
  static isMediaStreamSupported(): boolean;
  static isMediaStreamSupported(): boolean {
    return (
      window != null &&
      window.navigator != null &&
      window.navigator.mediaDevices != null &&
      window.navigator.mediaDevices.getUserMedia != null &&
      typeof window.navigator.mediaDevices.getUserMedia == "function"
    );
  }

  /**
   * Checks if a mime type is supported by the browser
   * @param {string} mimeType Mime type to check
   * @returns {boolean}
   * @static
   */
  static isStreamMimeTypeSupported(mimeType: string): boolean;
  static isStreamMimeTypeSupported(mimeType: string): boolean {
    return MediaRecorder.isTypeSupported(mimeType);
  }

  /**
   * Getter - Media recorder instance accessor
   * @throws Error
   */
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

  /**
   * Requests the user permission to use the mic and, then, starts the record.
   * Pay attention to:
   * - If the permission is denied, an error will be thrown.
   * - If a audio
   * @method start
   * @returns {Promise<void>}
   * @throws
   */
  public start(): Promise<void>;
  public start(): Promise<void> {
    const audioStreamPromise: Promise<void> = this._navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((mediaStream) => {
        if (this._mediaRecorderInstance)
          throw new Error("Media stream already started!");

        this._mediaRecorderInstance = new MediaRecorder(mediaStream, {
          mimeType: "audio/webm",
        });

        const chunks: Blob[] = [];

        this.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

        this.mediaRecorder.onstop = () => {
          mediaStream.getTracks().forEach((track) => track.stop());
          this._result = new Blob(chunks, { type: `audio/webm; codecs=opus` });
        };

        this.mediaRecorder.start();
      })
      .catch((err) => {
        if (err.name == "NotFoundError" || err.name == "DevicesNotFoundError") {
          throw new Error("Audio recorder error - Required track is missing");
        }

        if (err.name == "NotReadableError" || err.name == "TrackStartError") {
          throw new Error("Audio recorder error - Mic is already in use");
        }

        if (
          err.name == "OverconstrainedError" ||
          err.name == "ConstraintNotSatisfiedError"
        ) {
          throw new Error(
            "Audio recorder error - Constraints can not be satisfied by available devices"
          );
        }

        if (
          err.name == "NotAllowedError" ||
          err.name == "PermissionDeniedError"
        ) {
          throw new Error(
            "Audio recorder error - Permission denied in browser"
          );
        }

        if (err.name == "TypeError" || err.name == "TypeError") {
          throw new Error("Audio recorder error - Empty constraints object");
        }

        throw err;
      });

    return audioStreamPromise;
  }

  /**
   * Pauses the audio recording.
   * If no audio is recording, an error will be thrown.
   * @method pause
   * @returns {void}
   * @throws
   */
  public pause(): void;
  public pause(): void {
    if (this.mediaRecorder.state != "recording")
      throw new Error("No audio recording!");

    this.mediaRecorder.pause();
  }

  /**
   * Resumes the audio recording.
   * If no audio recording its paused, an error will be thrown.
   * @method resume
   * @returns {void}
   * @throws
   */
  public resume(): void;
  public resume(): void {
    if (this.mediaRecorder.state != "paused")
      throw new Error("No audio paused!");

    this.mediaRecorder.resume();
  }

  /**
   * Stops the audio recording.
   * If there is no audio recording in progress or paused, an error will be generated.
   * @method stop
   * @returns {void}
   * @throws
   */
  public stop(): Promise<Blob>;
  public stop(): Promise<Blob> {
    if (
      this.mediaRecorder.state != "recording" &&
      this.mediaRecorder.state != "paused"
    )
      return Promise.reject("No audio recording!");

    this.mediaRecorder.stop();
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const result = this._result;

        if (result) {
          resolve(result!);
          clearInterval(interval);
        }
      }, 100);
    });
  }

  /**
   * Stops the recording and discards the result `Blob`.
   * @deprecated This method was replaced by the `stop` method. Please, use the `stop` method, and, then, ignores the result
   * @returns {void}
   * @throws
   */
  public discard(): void;
  public discard(): void {
    if (
      this.mediaRecorder.state != "recording" &&
      this.mediaRecorder.state != "paused"
    )
      throw new Error("No audio opened!");

    this.mediaRecorder.stop();
  }
}
