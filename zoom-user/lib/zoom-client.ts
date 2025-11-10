"use client"

export async function joinZoomMeeting(
  meetingNumber: string,
  userName: string,
  passWord: string,
  signature: string
) {
  if (typeof window === "undefined") {
    console.error("Zoom SDK can only run in the browser")
    return
  }

  const { ZoomMtg } = await import("@zoom/meetingsdk")

  ZoomMtg.setZoomJSLib("https://source.zoom.us/3.9.0/lib", "/av")
  ZoomMtg.preLoadWasm()
  ZoomMtg.prepareWebSDK()

  ZoomMtg.init({
    leaveUrl: window.location.origin,
    success: () => {
      ZoomMtg.join({
        signature,
        sdkKey: process.env.NEXT_PUBLIC_SDK_KEY!,
        meetingNumber,
        userName,
        passWord,
        success: (res: any) => console.log("Joined meeting", res),
        error: (err: any) => console.error("Join failed", err),
      })
    },
    error: (err: any) => console.error("Init error", err),
  })
}
