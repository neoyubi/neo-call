import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Button, Tooltip } from "@vector-im/compound-web";
import { RaisedHandSolidIcon } from "@vector-im/compound-design-tokens/assets/web/icons";

import { type ReactionData } from "./ReactionToggleButton";
import { useReactionsSender } from "../reactions/useReactionsSender";
import { useBehavior } from "../useBehavior";

interface Props {
  /** The membership whose hand this raises: `${userId}:${deviceId}`. */
  identifier: string;
  reactionData: ReactionData;
  size?: "md" | "lg";
  className?: string;
}

/**
 * A single toggle for raising and lowering one's hand. Takes the place of the
 * reaction menu, which also offers emoji reactions that a consultation call
 * has no use for.
 */
export const RaiseHandButton: FC<Props> = ({
  identifier,
  reactionData,
  size,
  className,
}) => {
  const { t } = useTranslation();
  const { toggleRaisedHand } = useReactionsSender();
  const handsRaised = useBehavior(reactionData.handsRaised$);
  const raised = identifier in handsRaised;
  const label = raised ? t("action.lower_hand") : t("action.raise_hand");

  return (
    <Tooltip label={label}>
      <Button
        className={className}
        size={size}
        kind={raised ? "primary" : "secondary"}
        iconOnly
        Icon={RaisedHandSolidIcon}
        aria-label={label}
        aria-pressed={raised}
        onClick={() => void toggleRaisedHand()}
      />
    </Tooltip>
  );
};
