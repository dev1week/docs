import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash-es";
import TextEditor from "../components/textEditor/TextEditor";
import { socket } from "../socket";

//사용자 실시간 커서위치 저장
const cursorMap = new Map();
const cursorColor = [
  "#FF0000",
  "#FF5E00",
  "#FFBB00",
  "#FFE400",
  "#ABF200",
  "#1DDB16",
  "#00D8FF",
  "#0054FF",
];

const EditorContainer = () => {
  const timeRef = useRef(null);
  const cursorRef = useRef(null);
  const reactQuillRef = useRef(null);

  const { id: documentId } = useParams();

  const [text, setText] = useState("");
  //사용자 접속과 동시에 join 이벤트 호출
  //클라이언트에서 획득한 documentId 같이
  useEffect(() => {
    socket.emit("join", documentId);
    return () => {
      socket.disconnect();
    };
  });

  //연결후 무조건 한번만 실행
  //미리 작성된 문서의 내용과 접속중인 사용자 정보 가져오기
  useEffect(() => {
    socket.once("initDocument", (res) => {
      const { _document, userList } = res;
      setText(_document);
      userList.forEach((user) => {
        setCursor(user);
      });
    });
  });

  //새로운 사용자 접속시
  useEffect(() => {
    function setCurosrHandler(user) {
      //커서 정보 등록
      setCursor(user);
    }
    socket.on("newUser", setCurosrHandler);
    return () => {
      socket.off("newUser", setCurosrHandler);
    };
  }, []);

  //quill-cursors 모듈을 설정
  useEffect(() => {
    if (!reactQuillRef.current) return;
    cursorRef.current = reactQuillRef.current.getEditor().getModule("cursors");
  }, []);

  //사용자가 텍스트 작성시
  useEffect(() => {
    //에디터 내 내용을 수정
    function updateContentHandler(delta) {
      reactQuillRef.current.getEditor().updateContentHandler(delta);
      socket.on("receive-changes", updateContentHandler);
      return () => {
        socket.off("receive-changes", updateContentHandler);
      };
    }
  }, []);

  //다른 사용자의 커서 이동시 움직인 dlseprtm qksghks
  useEffect(() => {
    function updateHandler(res) {
      const { range, id } = res;
      debouncedUpdate(range, id);
    }
    socket.on("receive-cursor", updateHandler);
    return () => {
      socket.off("recieve-cursor", updateHandler);
    };
  });

  //문서 내 내용 변화 감지
  const onChangeTextHandler = (content, delta, source, editor) => {
    //모든 입력에 대해서가 아닌 타이핑을 완료한 후 마지막 순간에만 한번 실행
    if (timeRef.current != null) {
      clearTimeout(timeRef.current);
    }

    timeRef.current = setTimeout(() => {
      socket.emit(
        "save-document",
        reactQuillRef.current.getEditor().getContents()
      );
      timeRef.current = null;
    }, 1000);
    if (source !== "user") return;
    socket.emit("send-changes", delta);
  };
  //커서 생성 및 id부여 후 맵에 저장
  function setCursor(id) {
    if (!cursorMap.get(id)) {
      cursorRef.current.createCursor(
        id,
        id,
        cursorColor[Math.floor(Math.random() * 8)]
      );
      cursorMap.set(id, cursorRef.current);
    }
  }
  //커서의 위치를 실시간으로 이동
  const debouncedUpdate = debounce((range, id) => {
    cursorMap.get(id).moveCursor(id, range);
  }, 500);

  const onChangeSelection = (selection, source, editor) => {
    if (source !== "user") return;
    socket.emit("cursor-changes", selection);
  };

  //컴포넌트 정의
  return (
    <TextEditor
      text={text}
      onChangeTextHandler={onChangeTextHandler}
      onChangeSelection={onChangeSelection}
      reactQuillRef={reactQuillRef}
    />
  );
};
export default EditorContainer;
