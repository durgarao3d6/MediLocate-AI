/** Browser BarcodeDetector support varies; Android native scanner is a later integration. */
type Detection = { rawValue: string };
type Detector = { detect(source: HTMLVideoElement): Promise<Detection[]> };
type DetectorCtor = new (options: {formats: string[]}) => Detector;

export async function scanQrWithCamera(video: HTMLVideoElement, timeoutMs = 20000): Promise<string> {
  const Ctor = (globalThis as typeof globalThis & {BarcodeDetector?: DetectorCtor}).BarcodeDetector;
  if (!Ctor) throw new Error("Camera QR scanning is not supported in this browser. Paste the QR payload instead.");
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access unavailable");
  const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
  video.srcObject = stream;
  const detector = new Ctor({formats:["qr_code"]});
  try {
    await video.play();
    const started = Date.now();
    while (Date.now()-started < timeoutMs) {
      const matches = await detector.detect(video);
      if(matches[0]?.rawValue)return matches[0].rawValue;
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    throw new Error("No QR code detected. Try better lighting or paste the QR payload.");
  } finally {
    stream.getTracks().forEach(track=>track.stop());
    video.pause();
    video.srcObject=null;
  }
}
