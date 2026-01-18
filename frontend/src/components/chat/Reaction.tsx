import { forwardRef } from "react";
import { ReactionPickerProps } from "@/types/types";
import { useLanguageStore } from "@/context/store/LanguageStore";

const ReactionPicker = forwardRef<HTMLElement, ReactionPickerProps>(
  ({ onSelect }, ref) => {
    const t = useLanguageStore((state) => state.t);
    const emojis = ["😊", "😂", "❤️", "😢", "😡"];

    return (
      <section
        ref={ref}
        className="reaction-picker"
        role="toolbar"
        aria-label={t("reaction.label")}
      >
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="reaction-button"
            aria-label={`${t("reaction.with")}: ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </section>
    );
  }
);

ReactionPicker.displayName = "ReactionPicker";

export default ReactionPicker;
