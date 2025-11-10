"use client";

import { useEffect, useState, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface EmbeddedZoomMeetingProps {
  meetingNumber: string;
  userName: string;
  password?: string;
  onLeave: () => void;
  authToken: string;
}

export default function EmbeddedZoomMeeting({
  meetingNumber,
  userName,
  password = "",
  onLeave,
  authToken,
}: EmbeddedZoomMeetingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const zoomMtgRef = useRef<any>(null);
  const sdkKey = process.env.NEXT_PUBLIC_SDK_KEY;

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!sdkKey) {
      setError("SDK Key is not configured. Please set NEXT_PUBLIC_SDK_KEY in your environment variables.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function initializeMeeting() {
      try {
        // Dynamically import Zoom SDK only on client side
        const { ZoomMtg } = await import("@zoom/meetingsdk");
        zoomMtgRef.current = ZoomMtg;

        // Get signature from backend
        const signatureRes = await fetch(
          `http://localhost:3000/zoom/signature?meetingNumber=${meetingNumber}&role=0`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!signatureRes.ok) {
          throw new Error("Failed to get meeting signature");
        }

        const { signature } = await signatureRes.json();

        // Initialize Zoom SDK
        ZoomMtg.setZoomJSLib("https://source.zoom.us/3.9.0/lib", "/av");
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        ZoomMtg.init({
          leaveUrl: window.location.origin,
          patchJsMedia: true,
          success: (success: any) => {
            console.log("Zoom SDK initialized", success);

            // Join the meeting
            ZoomMtg.join({
              signature,
              sdkKey,
              meetingNumber,
              userName,
              passWord: password,
              success: (joinSuccess: any) => {
                console.log("Joined meeting successfully", joinSuccess);
                if (isMounted) {
                  setIsLoading(false);
                }
              },
              error: (joinError: any) => {
                console.error("Failed to join meeting", joinError);
                if (isMounted) {
                  setError(joinError.reason || "Failed to join meeting");
                  setIsLoading(false);
                }
              },
            });
          },
          error: (initError: any) => {
            console.error("Failed to initialize Zoom SDK", initError);
            if (isMounted) {
              setError(initError.reason || "Failed to initialize Zoom SDK");
              setIsLoading(false);
            }
          },
        });
      } catch (err) {
        console.error("Error initializing meeting", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize meeting");
          setIsLoading(false);
        }
      }
    }

    initializeMeeting();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [meetingNumber, userName, password, authToken, sdkKey]);

  const handleLeave = async () => {
    try {
      if (!zoomMtgRef.current) {
        // If SDK not loaded, just leave
        onLeave();
        return;
      }

      const ZoomMtg = zoomMtgRef.current as any;
      if (ZoomMtg && typeof ZoomMtg.leave === 'function') {
        ZoomMtg.leave({
          success: () => {
            console.log("Left meeting");
            onLeave();
          },
          error: (err: any) => {
            console.error("Error leaving meeting", err);
            onLeave();
          },
        });
      } else {
        onLeave();
      }
    } catch (err) {
      console.error("Error in leave function", err);
      onLeave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" ref={meetingContainerRef}>
      <div id="zmmtg-root"></div>
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={handleLeave}
          variant="destructive"
          size="sm"
          className="bg-red-600 hover:bg-red-700"
        >
          Leave Meeting
        </Button>
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-8 w-8 text-white" />
            <p className="text-white text-sm">Joining meeting...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="bg-red-500 text-white p-6 rounded-lg max-w-md">
            <h3 className="font-semibold mb-2">Error</h3>
            <p className="text-sm mb-4">{error}</p>
            <Button
              onClick={onLeave}
              variant="secondary"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

