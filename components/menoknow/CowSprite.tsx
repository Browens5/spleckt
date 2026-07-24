"use client";

type CowSpriteProps = {
  counted?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  label?: string;
  tabIndex?: number;
};

export function CowSprite({
  counted = false,
  size = "md",
  onClick,
  label = "Cow",
  tabIndex,
}: CowSpriteProps) {
  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`mk-cow mk-cow--${size}${counted ? " is-counted" : ""}${onClick ? " mk-cow--tap" : ""}`}
      onClick={onClick}
      aria-label={label}
      tabIndex={tabIndex}
    >
      <span className="mk-cow__body" aria-hidden>
        <span className="mk-cow__spot" />
        <span className="mk-cow__spot mk-cow__spot--2" />
      </span>
      <span className="mk-cow__head" aria-hidden>
        <span className="mk-cow__ear mk-cow__ear--l" />
        <span className="mk-cow__ear mk-cow__ear--r" />
        <span className="mk-cow__snout" />
      </span>
      {counted ? <span className="mk-cow__check" aria-hidden /> : null}
    </Tag>
  );
}
