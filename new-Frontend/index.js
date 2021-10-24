
/*

0 - screen sharing starts
1 - screen sharing stops

DATA FORMAT
{
  mode:{ALERT | COMMAND},
  data:{INT | STRING}
}

*/



const PRE = "SIMPLE"
const SUF = "CONTROLLER"
let room_id;
let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let local_stream;
let screenStream;
let peer = null;
let currentPeer = null
let screenSharing = false
let remoteConnection = null
let socket = null
function createRoom() {
  console.log("Creating Room")
  let room = document.getElementById("room-input").value;
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
      local_stream = stream;
      setLocalStream(local_stream)
    }, (err) => {
      console.log(err)
    })
    notify("Waiting for peer to join.")
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
    currentPeer = call;
  })
}

// function processMouseMove(event) {
//   let offset = document.querySelector('#remote-video').getBoundingClientRect();
//   document.addEventListener('mousemove',
//     function (e) {
//       var pos = { left: e.pageX - offset.left, top: e.pageY - offset.top }
//     })
// }

function handleMouseMove(e) {
  let offset = document.querySelector('#remote-video').getBoundingClientRect();
  let pos = { x: e.pageX - offset.left, y: e.pageY - offset.top }
  if (pos.x >= 0 && pos.x < offset.width && pos.y >= 0 && pos.y < offset.height) {
    if (Math.random() > 0.7)
      remoteConnection.send(JSON.stringify({
        mode: "COMMAND",
        data: `${Math.round(offset.width)}-${Math.round(offset.height)}-${Math.round(pos.x)}-${Math.round(pos.y)}`
      }))
  }
}

function attachHandlers() {
  document.addEventListener('mousemove', handleMouseMove)
}
function removeHandlers() {
  document.removeEventListener('mousemove', handleMouseMove)
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
    if (data['mode'] === 'COMMAND') {
      socket.send(JSON.stringify({
        mode: 'mouse-data',
        data: data['data']
      }))
    }
}

function setLocalStream(stream) {

  let video = document.getElementById("local-video");
  video.srcObject = stream;
  video.muted = true;
  video.play();
}
function setRemoteStream(stream) {
  let video = document.getElementById("remote-video");
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
  }, 3000)
}

function joinRoom() {
  console.log("Joining Room")
  let room = document.getElementById("room-input").value;
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
      local_stream = stream;
      setLocalStream(local_stream)
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
        setRemoteStream(stream);
      })
      currentPeer = call;
    }, (err) => {
      console.log(err)
    })

  })
}

function startScreenShare() {
  if (screenSharing) {
    stopScreenSharing()
  }
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
      socket = new WebSocket('ws://127.0.0.1:5678');

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
  socket.close()
  remoteConnection.send(JSON.stringify({
    mode: "ALERT",
    data: 1
  }))
  screenSharing = false
}