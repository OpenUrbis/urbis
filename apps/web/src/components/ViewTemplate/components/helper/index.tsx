import { ReactNode } from "react";
import { Icon, RichTooltip } from "rmwc";
import "./style.scss";

export const Helper = ({
  properties,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
}) => {
  const { helper } = properties ?? {};

  return helper ? (
    <div className="d-flex align-items-center">
      {children}
      <section className="helper-container">
        <RichTooltip title="Ajuda" body={helper} align="end" className="helper">
          {
            (
              <Icon
                icon={{ icon: "info", size: "small" }}
                style={{ marginLeft: "8px" }}
              />
            ) as ReactNode
          }
        </RichTooltip>
      </section>
    </div>
  ) : (
    children
  );
};
