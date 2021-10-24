var firebaseConfig = {
  apiKey: "AIzaSyCyKDZoBzru_tSGYLNXThK2NvxX2d_t-NU",
  databaseURL: "https://todo-api-f7314.firebaseio.com",
  projectId: "todo-api-f7314",
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

let peer = undefined

function create() {
  peer = new SimplePeer({ initiator: true, trickle: false })
  peer.on('signal', async data => {
    const ref = await db.collection("pair").add({ key: data })
    console.log(ref)
    console.log(ref.id)
    db.collection("pair").doc(ref.id)
      .onSnapshot(function (doc) {
        if (doc.data().ans) {
          peer.signal(doc.data().ans);
        }
      });
  })
  peer.on('connect', () => {
    console.log("connected")
  })
  peer.on('data', data => {
    console.log(String(data))
  })
}

async function load() {
  let value = document.getElementById('value').value
  peer = new SimplePeer({ initiator: false, trickle: false })
  let doc = await db.collection('pair').doc(value).get()
  const key = doc.data().key
  peer.signal(key)
  peer.on('signal', data => {
    db.collection('pair').doc(value).update({
      ans: data
    })
  })
  peer.on('connect', () => {
    console.log("connected")
  })
  const socket = new WebSocket('ws://127.0.0.1:5678');
  socket.addEventListener('open', function (event) {
    console.log("connected with local socket")
  });

  peer.on('data', data => {
    socket.send(String(data))
  })
}

async function startSend() {
  const socket = new WebSocket('ws://127.0.0.1:5678');

  // Connection opened
  socket.addEventListener('open', function (event) {
    socket.send(JSON.stringify({
      "mode": "command",
      "data": "start"
    }));
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
    peer.send(JSON.stringify({
      mode: 'mouse-data',
      data: event.data
    }))
  });
}