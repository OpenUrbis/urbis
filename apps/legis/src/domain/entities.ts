import {
  NormativeElement,
  SpecialSituation,
  SpecialSituationType,
  NewTextSpecialSituationType,
  NewTextSpecialSituationShape,
  OriginalNormativo,
  ColetaneaTematica,
  CollectionLink,
  Authority,
  ElementType,
} from "./types";

export {
  type NormativeElement,
  type SpecialSituation,
  type SpecialSituationType,
  type NewTextSpecialSituationType,
  type NewTextSpecialSituationShape,
  type OriginalNormativo,
  type ColetaneaTematica,
  type CollectionLink,
  type Authority,
  type ElementType,
};

export type NormativeElementEntity = NormativeElement & { content?: any };
export type EmentaAlteration = SpecialSituation;
export type LinkedElement = { elementId: string; segments?: any[] };
