import { computed } from "@preact/signals-core";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { ProspectiveSearchResults } from "./ProspectiveSearchResults";

export const ProspectiveView = () => {
  const { currentPage } = useNavigationContext();

  const isProspectiveSearchActive = computed(() => {
    return currentPage.value?.key === "nav-prospective-search";
  });

  return (
    <div>{isProspectiveSearchActive.value && <ProspectiveSearchResults />}</div>
  );
};
