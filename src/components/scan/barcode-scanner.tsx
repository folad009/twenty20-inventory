"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type BarcodeScannerProps = {
  onScan: (barcode: string) => void;
  paused?: boolean;
};

export function BarcodeScanner({ onScan, paused = false }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const lastScanRef = useRef<string | null>(null);

  useEffect(() => {
    if (paused || !active) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      return;
    }

    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    async function start() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const cameraId =
          devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ??
          devices[0]?.deviceId;

        if (!cameraId || !videoRef.current) {
          setError("No camera found on this device.");
          return;
        }

        const controls = await reader.decodeFromVideoDevice(
          cameraId,
          videoRef.current,
          (result) => {
            if (cancelled || !result) {
              return;
            }

            const text = result.getText().trim();
            if (!text || lastScanRef.current === text) {
              return;
            }

            lastScanRef.current = text;
            onScan(text);
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Camera access denied or unavailable.");
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [active, onScan, paused]);

  return (
    <div className="flex flex-col gap-3">
      {!active ? (
        <Button type="button" onClick={() => setActive(true)} className="w-full sm:w-auto">
          Start camera
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setActive(false);
            controlsRef.current?.stop();
            controlsRef.current = null;
          }}
          className="w-full sm:w-auto"
        >
          Stop camera
        </Button>
      )}

      <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
        <video
          ref={videoRef}
          className="size-full object-cover"
          muted
          playsInline
        />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Camera off
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Point the camera at a barcode. Scanning works best in good lighting with
        EAN, UPC, Code 128, or QR codes.
      </p>
    </div>
  );
}
