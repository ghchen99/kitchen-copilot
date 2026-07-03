import { useRef, useState } from "react";

interface Props {
  disabled: boolean;
  onSend: (text: string) => void;
  onUpload: (file: File) => void;
}

export default function Composer({ disabled, onSend, onUpload }: Props) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <footer className="composer">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <button
        className="icon-btn"
        title="Upload fridge photo"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
      >
        📷
      </button>
      <input
        className="text-input"
        type="text"
        placeholder="Message Kitchen Copilot…"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button className="send-btn" disabled={disabled || !text.trim()} onClick={submit}>
        Send
      </button>
    </footer>
  );
}
