"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import EmbeddedZoomMeeting from "./embedded-zoom-meeting";

interface Meeting {
  _id: string;
  meetingId: string;
  topic: string;
  startTime: string;
  duration: number; // in minutes
  joinUrl: string;
}

export default function MeetingCard({ meeting }: { meeting: Meeting }) {
  const [isJoining, setIsJoining] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showEmbeddedMeeting, setShowEmbeddedMeeting] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [meetingPassword, setMeetingPassword] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [tempUserName, setTempUserName] = useState<string>("");

  const startTime = new Date(meeting.startTime);
  const endTime = startTime.getTime() + meeting.duration * 60000;
  const hasStarted = Date.now() >= startTime.getTime();
  const canJoin = hasStarted && Date.now() < endTime;

  const getToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];
  };

  // Show name dialog first, then join meeting
  const handleJoin = () => {
    // Get saved name from localStorage or use email from token if available
    const savedName = localStorage.getItem("zoom_user_name") || "";
    if (savedName) {
      setTempUserName(savedName);
    }
    setShowNameDialog(true);
  };

  // Actually join the meeting after user enters name
  const handleJoinWithName = async () => {
    if (!tempUserName.trim()) {
      setStatusMessage("Please enter your name");
      return;
    }

    setIsJoining(true);
    setStatusMessage("Loading meeting...");
    setShowNameDialog(false);

    // Save name for future use
    localStorage.setItem("zoom_user_name", tempUserName.trim());
    setUserName(tempUserName.trim());

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Fetch meeting details to get password
      const meetingRes = await fetch(
        `http://localhost:3000/zoom/join-meeting/${meeting.meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!meetingRes.ok) {
        throw new Error("Failed to get meeting details");
      }

      const meetingData = await meetingRes.json();
      const password = meetingData.password || "";

      setMeetingPassword(password);
      setShowEmbeddedMeeting(true);
      setIsJoining(false);
      setStatusMessage(null);
    } catch (err) {
      console.error("Error joining meeting:", err);
      setStatusMessage(err instanceof Error ? err.message : "Failed to join meeting");
      setIsJoining(false);
    }
  };

  // Load saved name on mount
  useEffect(() => {
    const savedName = localStorage.getItem("zoom_user_name");
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  const token = getToken();

  return (
    <>
      {showEmbeddedMeeting && token && userName && (
        <EmbeddedZoomMeeting
          meetingNumber={meeting.meetingId}
          userName={userName}
          password={meetingPassword}
          authToken={token}
          onLeave={() => {
            setShowEmbeddedMeeting(false);
            setMeetingPassword("");
          }}
        />
      )}

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Name</DialogTitle>
            <DialogDescription>
              Please enter your name to join the meeting
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Your name"
              value={tempUserName}
              onChange={(e) => setTempUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tempUserName.trim()) {
                  handleJoinWithName();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinWithName} disabled={!tempUserName.trim()}>
              Join Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="flex flex-col h-full overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold mb-3 text-card-foreground">{meeting.topic}</h3>
          <p className="text-sm text-muted-foreground mb-1">
            {hasStarted
              ? `Started ${formatDistanceToNow(startTime, { addSuffix: true })}`
              : `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {startTime.toLocaleString()} • {meeting.duration} min
          </p>

          {statusMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
              {statusMessage}
            </div>
          )}

          <div className="w-full h-48 mt-auto rounded border border-border bg-muted overflow-hidden flex items-center justify-center">
            <div className="text-center p-6">
              <div className="text-muted-foreground text-sm mb-2">
                {canJoin ? (
                  <>
                    <p className="font-medium mb-1">Ready to join</p>
                    <p className="text-xs">Click the button below to join the meeting</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium mb-1">Meeting not available</p>
                    <p className="text-xs">
                      {hasStarted 
                        ? "Meeting has ended" 
                        : `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 border-t border-border">
          <Button 
            onClick={handleJoin} 
            disabled={isJoining || !canJoin} 
            className="w-full"
          >
            {isJoining ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Loading...
              </>
            ) : (
              "Join Meeting"
            )}
          </Button>
        </div>
      </Card>
    </>
  );
}




