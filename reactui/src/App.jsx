import './App.css';

import Peer from "peerjs"
import { useEffect, useRef, useState } from 'react';

function App() {
  const PRE = "SIMPLE"
  const SUF = "CONTROLLER"
  let room_id;
  let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  let local_stream;
  let screenStream;
  let screenSharing = false
  let remoteConnection = null
  let dataString = null
  let lastDataString = null
  let sendInterval = null


  const [showStartStreamingBtn, setShowStartStreamingBtn] = useState(false)
  const [showStartControllingBtn, setShowControllingBtn] = useState(false)
  const [roomID, setRoomID] = useState("")
  const [error, setError] = useState("")
  const [socket, setSocket] = useState(null)
  const remoteVideoElement = useRef(null)
  const localVideoElement = useRef(null)
  const [peer, setPeer] = useState(null)
  const [currentPeer, setCurrentPeer] = useState(null)


  useEffect(() => {
    console.log(peer)
  }, [peer])

  function createRoom() {
    console.log("Creating Room")
    let room = roomID
    if (room == " " || room == "") {
      setError("Please enter room number")
      return;
    }
    room_id = PRE + room + SUF;
    let peer = new Peer(room_id)
    setPeer(peer)
    peer.on('open', (id) => {
      console.log("Peer Connected with ID: ", id)
      getUserMedia({ video: true, audio: true }, (stream) => {
        local_stream = stream;
        setLocalStream(local_stream)
      }, (err) => {
        console.log(err)
      })
      setError("Waiting for peer to join.")
    })
    peer.on('connection', conn => {
      remoteConnection = conn
      conn.on('data', data => {
        handleRemoteData(data)
      })
    })
    peer.on('call', (call) => {
      call.answer(local_stream);
      call.on('stream', (stream) => {
        setRemoteStream(stream)
      })
      setCurrentPeer(call)
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
    local_stream.getTracks().forEach(function (track) {
      track.stop();
    });
    remoteVideoElement.current.oncontextmenu = (e) => {
      let offset = document.querySelector('#remote-video').getBoundingClientRect();
      let pos = { x: e.pageX - offset.left, y: e.pageY - offset.top }
      if (pos.x >= 0 && pos.x < offset.width && pos.y >= 0 && pos.y < offset.height) {
        remoteConnection.send(JSON.stringify({
          mode: "MOUSE-CLICK-RIGHT",
          data: `${Math.round(offset.width)}-${Math.round(offset.height)}-${Math.round(pos.x)}-${Math.round(pos.y)}`
        }))
      }
      return false
    }
    document.body.addEventListener("wheel", handleScrollWheel)
    document.body.addEventListener("keydown", handleKeyPress)
    remoteVideoElement.current.addEventListener("click", handleMouseClick)
    document.addEventListener('mousemove', handleMouseMove)
    sendInterval = setInterval(() => {
      if (dataString !== lastDataString)
        remoteConnection.send(JSON.stringify({
          mode: "MOUSE-DATA",
          data: dataString
        }))
      lastDataString = dataString
    }, 100);
  }
  function removeHandlers() {
    getUserMedia({ video: true, audio: true }, (stream) => {
      local_stream = stream;
      setLocalStream(local_stream)
      let videoTrack = local_stream.getVideoTracks()[0];
      if (peer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack)
      }

    })
    clearInterval(sendInterval)
    document.body.removeEventListener("keydown", handleKeyPress)
    document.body.removeEventListener("wheel", handleScrollWheel)
    remoteVideoElement.current.removeEventListener("click", handleMouseClick)
    document.removeEventListener('mousemove', handleMouseMove)
    remoteVideoElement.current.oncontextmenu = null
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

  function setLocalStream(stream) {

    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
  }
  function setRemoteStream(stream) {
    let video = remoteVideoElement.current;
    video.srcObject = stream;
    video.play();
  }


  function joinRoom() {
    console.log("Joining Room")
    let room = roomID
    if (room == " " || room == "") {
      setError("Please enter room number")
      return;
    }
    room_id = PRE + room + SUF;
    let peer = new Peer()
    setPeer(peer)
    peer.on('open', (id) => {
      console.log("Connected with Id: " + id)
      getUserMedia({ video: true, audio: true }, (stream) => {
        local_stream = stream;
        setLocalStream(local_stream)
        setError("Joining peer")
        let call = peer.call(room_id, stream)
        let connection = peer.connect(room_id)

        connection.on('open', () => {
          connection.on('data', data => {
            handleRemoteData(data)
          })
          remoteConnection = connection
        })

        call.on('stream', (stream) => {
          console.log(stream)
          setRemoteStream(stream);
        })
        setCurrentPeer(call)
      }, (err) => {
        console.log(err)
      })

    })
  }

  function startScreenShare() {
    if (screenSharing) {
      stopScreenSharing()
    }
    local_stream && local_stream.getTracks().forEach(function (track) {
      track.stop();
    });
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
        let socket = new WebSocket('ws://127.0.0.1:5678')
        setSocket(socket)
        remoteVideoElement.current.style.display = "none"
        document.getElementById("title").innerHTML = "Screen is being shared"
        socket.addEventListener('open', function (event) {
          console.log("connected with local socket")
        });
        remoteConnection.send(JSON.stringify({
          mode: "ALERT",
          data: 0
        }))
      }
      console.log(screenStream)
    })
  }

  function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = local_stream.getVideoTracks()[0];
    if (peer) {
      let sender = currentPeer.peerConnection.getSenders().find(function (s) {
        return s.track.kind == videoTrack.kind;
      })
      sender.replaceTrack(videoTrack)
    }
    screenStream.getTracks().forEach(function (track) {
      track.stop();
    });
    remoteVideoElement.current.style.display = "block"
    document.getElementById("title").innerHTML = "Simple Controller"
    socket.close()
    remoteConnection.send(JSON.stringify({
      mode: "ALERT",
      data: 1
    }))
    getUserMedia({ video: true, audio: true }, (stream) => {
      local_stream = stream;
      setLocalStream(local_stream)
      let videoTrack = local_stream.getVideoTracks()[0];
      if (peer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack)
      }

    })
    screenSharing = false
  }
  return (
    <>
      <div className="header">
        <h1 id="title">Simple Controller</h1>
        <h5>Remote Peer Connected</h5>
        <h5>Local Socket Connected</h5>
      </div>
      {!peer && <div className="connection-dialogue">
        Enter Connection ID: <input type="text" value={roomID} onChange={e => setRoomID(e.target.value)} />
        <div className="options">
          <div className="btn" onClick={createRoom}>Create Room</div>
          <div className="btn" onClick={joinRoom}>Join Room</div>
        </div>
      </div>}
      <video id="remote-video" ref={remoteVideoElement}></video>
      <div className="floating-div">
        {peer && <p onClick={startScreenShare}>Start Streaming</p>}
        {peer && <p>Start Controlling</p>}
      </div>
      {error && <div className="error">
        {error}
      </div>}
      {/* <p id="notification" hidden></p>
      <div class="entry-modal" id="entry-modal">
        <p>Create or Join Meeting</p>
        <input id="room-input" class="room-input" placeholder="Enter Room ID" />
        <div>
          <button onClick={createRoom}>Create Room</button>
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
      <div class="meet-area">
      
      <div class="meet-controls-bar">
      <button onClick={startScreenShare}>Screen Share</button>
      </div>
    </div> */}
      <video id="local-video" ref={localVideoElement}></video>
    </>
  );
}

export default App;
