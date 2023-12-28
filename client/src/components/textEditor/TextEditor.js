import { css } from "@emotion/react";
import QuillCursors from "quill-cursors/dist/quill-cursors/quill-cursors";
import { container } from "./textEditor.style";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.css";

//Quill을 활용해 에디터 정의 및 등록
const modules = {
  cursors: true,
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline", "stricke"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
  ],
};

Quill.register("modules/cursors", QuillCursors);

const TextEditor = ({
  text,
  onChangeTextHandler,
  reactQuillRef,
  onChangeSelection,
}) => {
  return (
    <div css={container}>
      <ReactQuill
        theme="snow"
        module={modules}
        value={text}
        onChange={onChangeSelection}
        ref={(el) => {
          reactQuillRef.current = el;
        }}
      />
    </div>
  );
};

export default TextEditor;
