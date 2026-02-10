import { IconButton } from "rmwc";
import { createFn } from "../../utils/createFn";

export const LayerItemAction = ({
  icon,
  action,
}: {
  icon: string;
  action: string;
}) => {
  if (!action) {
    console.error(`action is not defined layer item action`);
    return null;
  }

  const actionFn = createFn(action, false);

  return action ? <IconButton onClick={() => actionFn()} icon={icon} /> : null;
};
