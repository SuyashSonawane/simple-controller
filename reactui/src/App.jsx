import React, { useRef, useState } from 'react'
import Peer from "peerjs"
import "./App.css"

/*

0 - screen sharing starts
1 - screen sharing stops
2 - video status
3 - audio status

DATA FORMAT
{
  mode:{ALERT | MOUSE-DATA | MOUSE-CLICK-RIGHT | MOUSE-CLICK-LEFT | KEY | SCROLL},
  data:{INT | STRING}
}

*/

const PRE = "SIMPLE"
const SUF = "CONTROLLER"
let room_id;
let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let screenStream;
let peer = null;
let currentPeer = null
let screenSharing = false
let remoteConnection = null
let socket = null
let dataString = null
let lastDataString = null
let sendInterval = null

export default function App() {

  const [localStream, setLocalStream] = useState(null)
  const [showStartScreenShareBtn, setShowStartScreenShareBtn] = useState(true)
  const [showStopScreenShareBtn, setShowStopScreenShareBtn] = useState(false)
  const [showCursorToggleBtn, setShowCursorToggleBtn] = useState(false)
  const [isAudio, setIsAudio] = useState(true)
  const [isCursorHidden, setIsCursorHidden] = useState(false)
  const [isVideo, setIsVideo] = useState(true)
  const [showMeetBar, setShowMeetBar] = useState(false)
  const [roomID, setRoomID] = useState("")
  const [title, setTitle] = useState("Simple Controller")

  const remoteVideo = useRef(null)
  const localVideo = useRef(null)

  function getLocalStream() {
    return localStream
  }

  function createRoom() {
    console.log("Creating Room")
    let room = roomID;
    if (room == " " || room == "") {
      alert("Please enter room number")
      return;
    }
    room_id = PRE + room + SUF;
    peer = new Peer(room_id)
    peer.on('open', (id) => {
      console.log("Peer Connected with ID: ", id)
      hideModal()
      getUserMedia({ video: true, audio: true }, (stream) => {
        setLocalStream(stream)
        setLocalStreamUI(stream)
        peer.on('connection', conn => {
          remoteConnection = conn
          conn.on('data', data => {
            handleRemoteData(data)
          })
        })
        peer.on('call', (call) => {
          let s = getLocalStream()
          call.answer(s);
          call.on('stream', (stream) => {
            setRemoteStream(stream)
          })
          currentPeer = call;
          setShowMeetBar(true)
        })
      }, (err) => {
        console.log(err)
      })
      notify("Waiting for peer to join.")
    })
  }

  function handleMouseMove(e) {
    let offset = document.querySelector('#remote-video').getBoundingClientRect();
    let pos = { x: e.pageX - offset.left, y: e.pageY - offset.top }
    if (pos.x >= 0 && pos.x < offset.width && pos.y >= 0 && pos.y < offset.height) {
      // if (Math.random() > 0.5)
      dataString = `${Math.round(offset.width)}-${Math.round(offset.height)}-${Math.round(pos.x)}-${Math.round(pos.y)}`
    }
  }

  function handleMouseClick(e) {
    let offset = document.querySelector('#remote-video').getBoundingClientRect();
    let pos = { x: e.pageX - offset.left, y: e.pageY - offset.top }
    if (pos.x >= 0 && pos.x < offset.width && pos.y >= 0 && pos.y < offset.height) {
      // if (Math.random() > 0.5)
      remoteConnection.send(JSON.stringify({
        mode: "MOUSE-CLICK-LEFT",
        data: `${Math.round(offset.width)}-${Math.round(offset.height)}-${Math.round(pos.x)}-${Math.round(pos.y)}`
      }))
    }

  }

  function handleKeyPress(event) {
    if (event.key === "Tab" || event.key === "Alt" || event.key === "Shift") {
      event.preventDefault()
    }
    remoteConnection.send(JSON.stringify({
      mode: "KEY",
      data: event.key.split("Arrow").splice(-1)[0]
    }))
  }

  function handleScrollWheel(event) {
    remoteConnection.send(JSON.stringify({
      mode: "SCROLL",
      data: event.wheelDelta
    }))
  }

  function attachHandlers() {
    setShowStartScreenShareBtn(false)
    setShowCursorToggleBtn(true)
    document.getElementById("remote-video").oncontextmenu = (e) => {
      let offset = document.querySelector('#remote-video').getBoundingClientRect();
      let pos = { x: e.pageX - offset.left, y: e.pageY - offset.top }
      if (pos.x >= 0 && pos.x < offset.width && pos.y >= 0 && pos.y < offset.height) {
        // if (Math.random() > 0.5)
        remoteConnection.send(JSON.stringify({
          mode: "MOUSE-CLICK-RIGHT",
          data: `${Math.round(offset.width)}-${Math.round(offset.height)}-${Math.round(pos.x)}-${Math.round(pos.y)}`
        }))
      }
      return false
    }
    document.body.addEventListener("wheel", handleScrollWheel)
    document.body.addEventListener("keydown", handleKeyPress)
    document.getElementById("remote-video").addEventListener("click", handleMouseClick)
    document.addEventListener('mousemove', handleMouseMove)
    sendInterval = setInterval(() => {
      if (dataString !== lastDataString)
        remoteConnection.send(JSON.stringify({
          mode: "MOUSE-DATA",
          data: dataString
        }))
      lastDataString = dataString
    }, 60);
  }
  function removeHandlers() {
    setShowStartScreenShareBtn(true)
    setShowCursorToggleBtn(false)
    clearInterval(sendInterval)
    document.body.removeEventListener("keydown", handleKeyPress)
    document.body.removeEventListener("wheel", handleScrollWheel)
    document.getElementById("remote-video").removeEventListener("click", handleMouseClick)
    document.removeEventListener('mousemove', handleMouseMove)
    document.getElementById("remote-video").oncontextmenu = null
  }

  function handleRemoteData(data) {
    data = JSON.parse(data)
    if (data['mode'] === 'ALERT') {
      if (data['data'] === 0) {
        console.log("staring screen share")
        attachHandlers()
      }
      else
        if (data['data'] === 1) {
          console.log("stoping screen share")
          removeHandlers()
        }
        else if (data['data'] === 2)
          notify(`remote video enabled: ${data['status']}`)
        else if (data['data'] === 3)
          notify(`remote audio enabled: ${data['status']}`)
    }
    else
      if (data['mode'] === 'MOUSE-DATA') {
        socket.send(JSON.stringify({
          mode: 'mouse-data',
          data: data['data']
        }))
      }
      else if (data['mode'] === 'MOUSE-CLICK-LEFT')
        socket.send(JSON.stringify({
          mode: 'mouse-click-left',
          data: data['data']
        }))
      else if (data['mode'] === 'MOUSE-CLICK-RIGHT')
        socket.send(JSON.stringify({
          mode: 'mouse-click-right',
          data: data['data']
        }))
      else if (data['mode'] === 'KEY')
        socket.send(JSON.stringify({
          mode: 'key',
          data: data['data']
        }))
      else if (data['mode'] === 'SCROLL')
        socket.send(JSON.stringify({
          mode: 'scroll',
          data: data['data']
        }))


  }

  function toggleVideo() {
    setIsVideo(!isVideo)
    localStream.getVideoTracks()[0].enabled = isVideo
    remoteConnection.send(JSON.stringify({
      mode: "ALERT",
      data: 2,
      status: isVideo
    }))
  }
  function toggleAudio() {
    setIsAudio(!isAudio)
    localStream.getAudioTracks()[0].enabled = isAudio
    remoteConnection.send(JSON.stringify({
      mode: "ALERT",
      data: 3,
      status: isAudio
    }))
  }
  function cursorToggle() {
    remoteVideo.current.style.cursor = isCursorHidden ? "default" : "none"
    setIsCursorHidden(!isCursorHidden)
  }

  function setLocalStreamUI(stream) {
    let video = localVideo.current
    video.srcObject = stream;
    video.muted = true;
    video.play();
  }
  function setRemoteStream(stream) {
    let video = remoteVideo.current
    video.srcObject = stream;
    video.play();
  }

  function hideModal() {
    document.getElementById("entry-modal").hidden = true
  }

  function notify(msg) {
    let notification = document.getElementById("notification")
    notification.innerHTML = msg
    notification.hidden = false
    setTimeout(() => {
      notification.hidden = true;
    }, 5000)
  }

  function joinRoom() {
    console.log("Joining Room")
    let room = roomID;
    if (room == " " || room == "") {
      alert("Please enter room number")
      return;
    }
    room_id = PRE + room + SUF;
    hideModal()
    peer = new Peer()
    peer.on('open', (id) => {
      console.log("Connected with Id: " + id)
      getUserMedia({ video: true, audio: true }, (stream) => {
        setLocalStream(stream)
        setLocalStreamUI(stream)
        notify("Joining peer")
        let call = peer.call(room_id, stream)
        let connection = peer.connect(room_id)

        connection.on('open', () => {
          connection.on('data', data => {
            handleRemoteData(data)
          })
          remoteConnection = connection
        })

        call.on('stream', (stream) => {
          debugger
          setRemoteStream(stream);
        })
        currentPeer = call;
        setShowMeetBar(true)
      }, (err) => {
        console.log(err)
      })

    })
  }

  function startScreenShare() {
    if (screenSharing) {
      stopScreenSharing()
    }
    try {
      socket = new WebSocket('ws://127.0.0.1:5678');
      // $("#remote-video").hide()
      socket.addEventListener('open', function (event) {
        navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
          screenStream = stream;
          let videoTrack = screenStream.getVideoTracks()[0];
          videoTrack.onended = () => {
            stopScreenSharing()
          }
          if (peer) {
            let sender = currentPeer.peerConnection.getSenders().find(function (s) {
              return s.track.kind == videoTrack.kind;
            })
            sender.replaceTrack(videoTrack)
            screenSharing = true
            remoteConnection.send(JSON.stringify({
              mode: "ALERT",
              data: 0
            }))
          }
          setTitle("Screen is being shared")
          console.log(screenStream)
          setShowStartScreenShareBtn(false)
          setShowStopScreenShareBtn(true)
        })
        console.log("connected with local socket")
      });
      socket.onerror = (event) => {
        notify("Cannot connect to client, ensure client is running")
      }
    } catch (e) {
      notify(e.message)
    }
  }

  function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = localStream.getVideoTracks()[0];
    if (peer) {
      let sender = currentPeer.peerConnection.getSenders().find(function (s) {
        return s.track.kind == videoTrack.kind;
      })
      sender.replaceTrack(videoTrack)
    }
    screenStream.getTracks().forEach(function (track) {
      track.stop();
    });
    // $("#remote-video").show()
    setTitle("Simple Controller")
    socket.close()
    remoteConnection.send(JSON.stringify({
      mode: "ALERT",
      data: 1
    }))
    setShowStartScreenShareBtn(true)
    setShowStopScreenShareBtn(false)
    screenSharing = false
  }

  return (
    <div>
      <h1 className="title" id="title">{title}</h1>
      <p id="notification" hidden></p>
      <div className="entry-modal" id="entry-modal">
        <h2>Create or Join Meeting</h2>
        <input id="room-input" className="room-input" placeholder="Enter Room ID" value={roomID} onChange={e => { setRoomID(e.target.value) }} />
        <div>
          <button onClick={createRoom}>Create Room</button>
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
      <div className="meet-area">
        <video id="remote-video" ref={remoteVideo}></video>
        <video id="local-video" ref={localVideo}></video>
        {showMeetBar &&
          <div className="meet-controls-bar">
            <button id="videoToggle" onClick={toggleVideo} className={`${isVideo ? "active" : ""}`}>Video</button>
            <button id="audioToggle" onClick={toggleAudio} className={`${isAudio ? "active" : ""}`}>Audio</button>
            {showStartScreenShareBtn && <button id="startScreenShareBtn" onClick={startScreenShare}>Screen Share</button>}
            {showStopScreenShareBtn && <button id="stopScreenShareBtn" onClick={stopScreenSharing}>Stop Share</button>}
            {showCursorToggleBtn && <button onClick={cursorToggle} className={`${isCursorHidden ? "active" : ""}`} >Hide Cursor</button>}
          </div>
        }
      </div>
      <div id="downloadClient">
        <img src="images/download.png" />
        Download Client
      </div>
    </div>
  )
}
