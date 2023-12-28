const mongoose = require("mongoose");
const Document = require("./schema");

const uri =
  "mongodb+srv://google-docs:1111@cluster0.pct2lvg.mongodb.net/?retryWrites=true&w=majority";

mongoose.set("strictQuery", false);

mongoose
  .connect(uri)
  .then(() => console.log("몽고디비 접속"))
  .catch((err) => console.log(err));

//접속한 사용자 정보 저장 맵
const userMap = new Map();
function setUserMap(documentId, myId) {
  const tempUserList = userMap.get(documentId);
  if (!tempUserList) {
    userMap.set(documentId, [myId]);
  } else {
    userMap.set(documentId, [...tempUserList, myId]);
  }
}

const io = requiere("socket.io")(5000, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  let _documentId = "";

  //사용자가 최초 사이트 접속시
  socket.on("join", async (documentId) => {
    _documentId = "";

    //기존에 작성중인 문서가 있는지 확인
    //없으면 빈 문서 반환
    const document = await findOrCreateDocument(documentId);

    //문서별로 소켓방 관리
    socket.join(documentId);
    //현재 사용자에게 문서 내용과 접속한 사용자 정보를 반환
    socket.emit("initDocument", {
      _document: document.data,
      userList: userMap.get(documentId) || [],
    });

    //기본적인 socketId 가져옴
    const myId = Array.from(socket.rooms)[0];
    //현재 아이디값을 저장해둠
    setUserMap(_documentId, myId);
    //방에 있는 사람에게 나의 socketId를 전송함
    socket.broadcast.to(_documentId).emit("newUser", myId);
  });

  //현재 작성중인 글을 저장함
  socket.on("save-document", async (data) => {
    await Document.findByIdAndUpdate(_documentId, { data });
  });

  //수정되는 글을 실시간으로 반영
  socket.on("send-changes", (delta) => {
    socket.broadcast.to(_documentId).emit("receive-changes", delta);
  });

  //다른 사용자 커서 클릭 감지
  socket.on("cursor-changes", (range) => {
    const myRooms = Array.from(socket.rooms);

    socket.broadcast
      .to(_documentId)
      .emit("recieve-cursor", { range: range, id: myRooms[0] });
  });

  socket.on("disconnect", () => {
    console.log("종료되었습니다.");
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;

  return await Document.create({ _id: id, data: defaultValue });
}
