import { Button, UrbisIcon } from "@open-urbis/map-ui";
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

  return action ? (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => actionFn()}
    >
      <UrbisIcon name={icon} className="text-base" aria-hidden="true" />
    </Button>
  ) : null;
};
