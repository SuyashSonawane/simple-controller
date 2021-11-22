# Simple Controller Documentation

<aside>
💡 The project is hosted live here and can be accessed directly

</aside>

[Simple Controller](https://suyashsonawane.me/simple-controller/)

---

# Running Locally

## Controller Module Service

The controller module service is written in Python, for running it **Python Interpreter** of version **3.6** is required. The dependencies can be installed via pip with the requirements.txt file 

```bash
$ pip install -r requirements.txt 
```

Once all the dependencies are installed the program can be executed 

```bash
$ python app.py
```

## Web Interface

The web interface is built in HTML, CSS and JS no installation is required, the folder can be opened in any local web server that supports local SSL or localhost, as for accessing webcam and other userMedia secured connection is required.

# How to use

## Controller Module Service

Either if you are running locally or using directly through the live site, once the app.py / app.exe is executed GUI popup with start server button, when this is pressed a websocket server is started and is ready for accepting connection 

![Untitled](Simple%20Controller%20Documentation%20a68bcbf5cb60461b9dbefe5bb2c18880/Untitled.png)

![Untitled](Simple%20Controller%20Documentation%20a68bcbf5cb60461b9dbefe5bb2c18880/Untitled%201.png)

<aside>
💡 Some antivirus flag the executable as malicious because of its controlling nature, I'm working towards resolving this issue. Below is the report ran on Virus Total 
[https://www.virustotal.com/gui/file/f601fcb02e47bdae513c1bb9c6dd8e4a4b3594e09a7a794c3e62a26e76a87a9e?nocache=1](https://www.virustotal.com/gui/file/f601fcb02e47bdae513c1bb9c6dd8e4a4b3594e09a7a794c3e62a26e76a87a9e?nocache=1)

</aside>

## Web Interface

The standalone executable can be downloaded from here 

![Untitled](Simple%20Controller%20Documentation%20a68bcbf5cb60461b9dbefe5bb2c18880/Untitled%202.png)

On the website anyone of the peer can start the connection, the room id is needed to start the connection, the other can join in with the same room id

![Untitled](Simple%20Controller%20Documentation%20a68bcbf5cb60461b9dbefe5bb2c18880/Untitled%203.png)

When the peer is connected a options bar will appear to control Audio, Video, Screen Sharing and Local Video Setting

![Untitled](Simple%20Controller%20Documentation%20a68bcbf5cb60461b9dbefe5bb2c18880/Untitled%204.png)

Contact : [https://suyashsonawane.me/](https://suyashsonawane.me/)