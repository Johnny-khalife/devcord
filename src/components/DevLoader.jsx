import React, { useEffect, useState } from "react";
import "./DevLoader.css";

const DEV_TEXT = "</>";

const DevLoader = () => {
  const [displayed, setDisplayed] = useState(DEV_TEXT);
  const [phase, setPhase] = useState("idle"); // idle, deleting, typing
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let timeout;
    if (phase === "idle") {
      timeout = setTimeout(() => setPhase("deleting"), 1000);
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 120);
      } else {
        timeout = setTimeout(() => setPhase("typing"), 300);
      }
    } else if (phase === "typing") {
      if (displayed.length < DEV_TEXT.length) {
        timeout = setTimeout(() => setDisplayed(DEV_TEXT.slice(0, displayed.length + 1)), 120);
      } else {
        timeout = setTimeout(() => setPhase("idle"), 1000);
      }
    }
    return () => clearTimeout(timeout);
  }, [phase, displayed]);

  // Blinking cursor
  useEffect(() => {
    const blink = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    if (phase === "deleting" && displayed.length === 0) {
      setTimeout(() => setPhase("typing"), 300);
    }
  }, [phase, displayed]);

  return (
    <div className="dev-loader-bg">
      <div className="dev-loader dev-loader-anim">
        <span>{displayed}</span>
        <span className={`cursor${cursorVisible ? "" : " hidden"}`}></span>
      </div>
      <div className="dev-loader-text">
        Building bridges between developers...
      </div>
    </div>
  );
};

export default DevLoader; 