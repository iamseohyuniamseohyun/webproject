const mysql = require("mysql");
const qs = require("querystring"); 
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "memo",
});
connection.connect();

const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static('img'))

app.get("/", (req, res) => {
  const htmlcode=`
  <!DOCTYPE html>
  <html lang="ko-KR">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>메모장</title>
      <style>
        @font-face {
        font-family: 'NanumSquareNeo-Variable';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_11-01@1.0/NanumSquareNeo-Variable.woff2')
            format('woff2');
        font-weight: normal;
        font-style: normal;
        }
        * {
        box-sizing: border-box;
        font-family: 'NanumSquareNeo-Variable';
        }
        body {
        background: url('http://localhost:3001/image.png') no-repeat center center fixed;
        background-size: cover;
        }

        .memo-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 80px 80px; /* 상하좌우 여백을 조절할 값(px)을 지정 */
        margin-left: 140px;
        }

        .memo-title,
        .memo-content {
        border: 1px solid #000;
        border-radius: 0px;
        padding: 10px;
        outline: none;
        transition: border-color 0.3s ease;
        font-size: 15px;
        width: 300px;
        resize: none;
        }
        .memo-content{
          height:400px;
          font-size: 13px;
        }

        .memo-title:focus,
        .memo-content:focus {
        border-color: #ff508d;
        }
        .button-container {
        display: flex;
        gap: 10px;
        }

        .saveBtn, .secondBtn {
        width: 146px;
        background-color: #ffbff8;
        color: white;
        border: none;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        cursor: pointer;
        border-radius: 0px;
        transition: background-color 0.3s ease;
        }

        .secondBtn {
        background-color: #a3dafe; 
        }

        .saveBtn:hover, .secondBtn:hover {
        background-color: rgb(141, 219, 173);
        }    
      </style>
    </head>

    <body>
      <main class="main">
        <section class="memo-pad">
          <div class="memo-container">
            <input type="text" name="" id="title" placeholder="제목을 적어주세요." class="memo-title" />
            <textarea name="" id="content" cols="30" rows="13" placeholder="여기를 누르면 메모를 작성할 수 있습니다." class="memo-content"></textarea>
            <div class="button-container">
                <button class="saveBtn" onclick="save()">저장</button>
                <button class="secondBtn" onclick="moveToMemo()">이동</button>
            </div>
          </div>
        </section>
      </main>
      <script>
        function save() {
          const title = document.querySelector('#title').value;
          const content = document.querySelector('#content').value;
          console.log(title, content)
          const memo = {
            title,
            content
          };
          fetch('http://localhost:3001/memo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(memo)
          });
          
          alert('저장되었습니다.');
        }
        
        function moveToMemo() {
          window.location.href = 'http://localhost:3001/memo';
        }
      </script>
    </body>
  </html>
  `
  res.send(htmlcode);
});


app.post("/memo", (req, res) => {
  const { title, content } = req.body;
  const query = connection.query(
    "INSERT INTO memo (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)",
    [title, content, new Date(), new Date()],
    (err, rows) => {
      if (err) {
        console.error('삽입 중 오류 발생 :', err);
        res.status(500).send('서버 오류로 인해 삽입에 실패했습니다.');
      } else {
        res.send('ok');
      }
    }
  );
});

app.post("/delete_process", (req, res) => {
  let body = '';
  req.on('data', (data) => {
    body += data;
  });
  req.on('end', () => {
    const post = qs.parse(body);
    const id = post.id;

    const query = connection.query(
      "DELETE FROM memo WHERE id=?", [id], (err, result) => {
        if (err) throw err;
        
        // 삭제 후에 메모 목록을 새로 읽어와 응답
        connection.query("SELECT * FROM memo", (err, rows) => {
          if (err) throw err;

          let html = '';
          for (let i = 0; i < rows.length; i++) {
            html += `
            <div class="text">
              <h1>${rows[i].title}</h1>
              <p>${rows[i].content}</p>
              <p>${rows[i].created_at}</p>
              <div class="button-container">
                <button class="del" onclick="del(${rows[i].id})">삭제</button>
                <button class="cor" onclick="cor()">수정</button>
              </div>
            </div>`;
          }
          res.send(html);
        });
      }
    );
  });
});

app.post("/update_process", (req, res) => {
  let body = '';
  req.on('data', (data) => {
    body += data;
  });

  req.on('end', () => {
    const post = qs.parse(body);
    const id = post.id;
    const title = post.title;
    const content = post.content;
    const updated_at = post.updated_at;

    const query = connection.query(
      "UPDATE memo SET title=?, content=?, updated_at=? WHERE id=?",
      [title, content, new Date(), id],
      (err, result) => {
        if (err) throw err;
        
        // 수정 후에 메모 목록을 새로 읽어와 응답
        connection.query("SELECT * FROM memo", (err, rows) => {
          if (err) throw err;

          let html = '';
          for (let i = 0; i < rows.length; i++) {
            html += 
            `<div class="text">
              <h1>${rows[i].title}</h1>
              <p>${rows[i].content}</p>
              <p>${rows[i].created_at}</p>
              <div class="button-container">
                <button class="del" onclick="del(${rows[i].id})">삭제</button>
                <button class="cor" onclick="cor(${rows[i].id})">수정</button>
              </div>
            </div>`;
          }

          res.send(html);
        });
      }
    );
  });
});



app.get("/memo", (req, res) => {
  const query = connection.query("select * from memo", (err, rows) => {
    let html = ''
    for (let i = 0; i < rows.length; i++){
        html += `
        <div class="text">
        <h1>${rows[i].title}</h1>
        <p>${rows[i].content}</p>
        <p>${rows[i].created_at}</p>
        <div class="button-container">
          <button class="del" onclick="del(${rows[i].id})">삭제</button>
          <button class="cor" onclick="cor(${rows[i].id})">수정</button>
        </div>
        </div>`;
    }
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>My memo</title>
          <style>
          @font-face {
            font-family: 'NanumSquareNeo-Variable';
            src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_11-01@1.0/NanumSquareNeo-Variable.woff2')
                format('woff2');
            font-weight: normal;
            font-style: normal;
            }
            * {
            box-sizing: border-box;
            font-family: 'NanumSquareNeo-Variable';
            }
          .text{
            border: 3px solid #959090;
            border-radius: 15px;
            padding: 10px;
            outline: none;
            transition: border-color 0.3s ease;
            font-size: 15px;
            width: 300px;
            resize: none;
            margin: 30px;
          }
          .del, .cor, .editB{
            width: 100px;
            background-color: #959090;
            color: white;
            border: none;
            padding: 10px 20px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            cursor: pointer;
            border-radius: 5px;
            margin : 20px;
            transition: background-color 0.3s ease;
          }
          .del:hover, .cor:hover {
            background-color: rgb(141, 219, 173);
          }    
          .button-container {
            display: flex;
            gap: 10px;
          }
          .edit {
            border: 3px solid #66cc33;
            border-radius: 15px;
            padding: 10px;
            outline: none;
            transition: border-color 0.3s ease;
            font-size: 15px;
            width: 300px;
            resize: none;
            margin: 30px;
            display: flex;
            flex-direction: column;
            text-align: right;  
            margin-right:20px;
          }
          .editP{
            margin : 20px 0 0 0 ;
          }
          .editB:hover{
            background-color: #66cc33;
          }
          </style>
        </head>
        <body>
          ${html}
          <div id="edit-form" class="edit" style="display: none; text-align: right;">
            <label for="edit-title">수정할 제목:</label>
            <input type="text" id="edit-title" placeholder="수정할 제목">
            <label for="edit-content">수정할 내용:</label>
            <textarea id="edit-content" class="editP" placeholder="수정할 내용"></textarea>
            <button class="editB"onclick="update()">수정 완료</button>
        </div>
          <script>
          function del(id) {
            const params = new URLSearchParams();
            params.append('id', id);
          
            fetch('/delete_process', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params,
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.text();
            })
            .then(html => {
              // 서버에서 받아온 HTML로 페이지 갱신
              document.body.innerHTML = html;
            })
            .catch(error => {
              console.error('There was a problem with the fetch operation:', error);
            });
          }
          
          function cor(id) {
            // 수정 폼을 보여주기
            document.getElementById('edit-form').style.display = 'block';
          
            // 수정할 메모의 ID 저장
            document.getElementById('edit-form').memoId = id;
            document.getElementById('edit-form').memoUpdatedTime = new Date();
          }
          
          function update() {
            // 수정할 메모의 ID 가져오기
            const id = document.getElementById('edit-form').memoId;
          
            // 수정할 제목과 내용 가져오기
            const title = document.getElementById('edit-title').value;
            const content = document.getElementById('edit-content').value;
          
            // 서버로 수정할 내용 전송
            const params = new URLSearchParams();
            params.append('id', id);
            params.append('title', title);
            params.append('content', content);
          
            fetch('/update_process', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params,
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.text();
            })
            .then(html => {
              // 서버에서 받아온 HTML로 페이지 갱신
              document.body.innerHTML = html;
            })
            .catch(error => {
              console.error('There was a problem with the fetch operation:', error);
            });
          }
          </script>
        </body>
      </html>
      `
    res.send(template)
  });
});


app.listen(3001, () => {
  console.log("http://localhost:3001");
});