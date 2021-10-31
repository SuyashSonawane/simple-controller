import asyncio
import websockets
import pyautogui
import json
# import win32gui
# import win32ui
# from win32api import GetSystemMetrics
pyautogui.FAILSAFE = False
# task = None
# dc = win32gui.GetDC(0)
# dcObj = win32ui.CreateDCFromHandle(dc)
# hwnd = win32gui.WindowFromPoint((0, 0))
# monitor = (0, 0, GetSystemMetrics(0), GetSystemMetrics(1))
CLIENT_WIDTH, CLIENT_HEIGHT = pyautogui.size()


def mapData(n, start1, stop1, start2, stop2):
    return ((n-start1)/(stop1-start1))*(stop2-start2)+start2


async def command(websocket):
    lastX = None
    lastY = None
    while True:
        currentMouseX, currentMouseY = pyautogui.position()
        if not (currentMouseX == lastX and currentMouseY == lastY):
            lastX = currentMouseX
            lastY = currentMouseY
            await websocket.send(f"{CLIENT_WIDTH}-{CLIENT_HEIGHT}-{currentMouseX}-{currentMouseY}")
        await asyncio.sleep(0.1)


def processMouseData(data):
    recv_width, recv_height, x, y = tuple(map(int, data.split("-")))
    x = int(mapData(x, 0, recv_width, 0, CLIENT_WIDTH))
    y = int(mapData(y, 0, recv_height, 0, CLIENT_HEIGHT))
    # dcObj.Rectangle((x, y, x+30, y+30))
    pyautogui.moveTo(x, y)
    # print(x, y)


def processMouseClick(data, isRightKey):
    recv_width, recv_height, x, y = tuple(map(int, data.split("-")))
    x = int(mapData(x, 0, recv_width, 0, CLIENT_WIDTH))
    y = int(mapData(y, 0, recv_height, 0, CLIENT_HEIGHT))
    # dcObj.Rectangle((x, y, x+30, y+30))
    if isRightKey:
        pyautogui.click(x, y, button="right")
    else:
        pyautogui.click(x, y)

    # print(x, y)


def processKeyEvent(data):
    pyautogui.press(data)


def processScroll(data):
    pyautogui.scroll(int(data))


async def main(socket, path):
    async for message in socket:
        message = json.loads(message)
        if message['mode'] == 'command':
            if message['data'] == "start":
                print("starting")
                task = asyncio.get_event_loop().create_task(command(socket))
            elif message['data'] == "stop":
                print("stopping")
                task.cancel()

        elif message['mode'] == 'calibration-data':
            REMOTE_WIDTH, REMOTE_HEIGHT = tuple(
                map(int, message['data'].split("-")))

        elif message['mode'] == 'mouse-data':
            # print(message)
            processMouseData(message['data'])
        elif message['mode'] == 'mouse-click-left':
            processMouseClick(message['data'], False)

        elif message['mode'] == 'mouse-click-right':
            processMouseClick(message['data'], True)

        elif message['mode'] == 'key':
            processKeyEvent(message['data'])

        elif message['mode'] == 'scroll':
            processScroll(message['data'])


start_server = websockets.server.serve(main, "127.0.0.1", 5678)
print("progarm initialted")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
