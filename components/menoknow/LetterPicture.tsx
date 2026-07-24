"use client";

import type { PictureId } from "@/lib/menoknow/truck-letters";

export function LetterPicture({
  id,
  word,
}: {
  id: PictureId;
  word: string;
}) {
  return (
    <div className={`mk-pic mk-pic--${id}`} role="img" aria-label={word}>
      <span className="mk-pic__art" aria-hidden />
      <span className="mk-pic__word">{word}</span>
    </div>
  );
}
