import type { ChatMessage } from "../types";
import RecipeCards from "./RecipeCards";

export default function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.kind === "image") {
    return (
      <div className="bubble user image">
        <img src={message.imageUrl} alt="Uploaded fridge" />
        <span className="caption">fridge photo</span>
      </div>
    );
  }

  if (message.kind === "recipes") {
    return (
      <div className="bubble assistant recipes">
        <RecipeCards plan={message.plan} />
      </div>
    );
  }

  return <div className={`bubble ${message.role}`}>{message.text}</div>;
}
