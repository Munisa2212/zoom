"use client";
import { useEffect } from "react";
import { ZoomMtg } from "@zoom/meetingsdk";
import { id } from "date-fns/locale/id";

export default function JoinMeeting() {
  const sdkKey = process.env.SDK_KEY!; 
  const meetingNumber = "YOUR_MEETING_NUMBER";
  const passWord = "YOUR_MEETING_PASSWORD";
  const userName = "Munisa";
  const role = 0; // 0 = participant, 1 = host

  useEffect(() => {
    async function startMeeting() {
      const res = await fetch(
        `http://localhost:3001/zoom/signature?meetingNumber=${meetingNumber}&role=${role}`
      );
      const { signature } = await res.json();

      ZoomMtg.setZoomJSLib("https://source.zoom.us/3.9.0/lib", "/av"); 
      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareWebSDK();

      ZoomMtg.init({
        leaveUrl: window.location.origin,
        success: (success) => {
          console.log("Init success", success);
          ZoomMtg.join({
            signature,
            sdkKey,
            meetingNumber,
            userName,
            passWord,
            success: (res) => console.log("Join success", res),
            error: (err) => console.error("Join error", err),
          });
        },
        error: (error) => console.error("Init error", error),
      });
    }

    startMeeting();
  }, []);

  return (
    <div>
      <h1>Joining Zoom Meeting...</h1>
      <div id="zmmtg-root"></div>
    </div>
  );
}
