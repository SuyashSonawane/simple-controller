// // const socket = io.connect("http://localhost:5678");
// // socket.onAny(console.log)
// // socket.on('connect', () => {
// //   console.log("connected")
// //   // let i = 0;
// //   // setInterval(() => {
// //   //   socket.emit("pointer_data", JSON.stringify({
// //   //     // x: 10,a
// //   //     // y: 150
// //   //     i: i++
// //   //   }))
// //   //   console.log(i)
// //   // }, 500);
// //   socket.emit('start', {})
// //   setTimeout(() => {
// //     console.log("sendinf stop")
// //     socket.emit('stop', {})
// //   }, 5000);
// // })
// // socket.onAny(console.log)
// // // socket.on('pointer_data_in', console.log)
// const socket = new WebSocket('ws://127.0.0.1:5678');

// // Connection opened
// socket.addEventListener('open', function (event) {
//   // socket.send(JSON.stringify({
//   //   "mode": "command",
//   //   "data": "start"
//   // }));
//   // setTimeout(() => {
//   //   alert("sending stop")
//   //   socket.send(JSON.stringify({
//   //     "mode": "command",
//   //     "data": "stop"
//   //   }));
//   // }, 5000);
//   socket.send(JSON.stringify({
//     mode: 'mouse-data',
//     data: '5-10'
//   }))

//   socket.close()
// });

// // Listen for messages
// socket.addEventListener('message', function (event) {
//   console.log('Message from server ', event.data);
// });

document.body.addEventListener("keypress", event => {
  console.log(event.keyCode)
})

document.getElementById("box").oncontextmenu = e => (false)