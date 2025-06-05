import { KattogStructureType } from "./enums";
import { NORMALIZED_CATEGORY_DATA_BY_KATOTTG } from "./mappers";
import {
  RawItem,
  Region,
  RegionChild,
  District,
  DistrictChild,
  Community,
  CommunityChild,
  Settlement,
  NormalizedCategoryData,
} from "./types";

/**
 * Build nameFull in format "<suffix> <name> <postfix>"
 *
 * @param name - name of the item
 * @param categoryData - category data
 * @returns nameFull in format "<suffix> <name> <postfix>"
 */
const buildNameFull = (name: string, categoryData: NormalizedCategoryData) => {
  const suffix = categoryData.suffix ?? "";
  const postfix = categoryData.postfix ?? "";
  return `${suffix} ${name} ${postfix}`.trim();
};

/**
 * Normalization of Region
 *
 * @param raw - raw item
 * @param id - id of the region
 * @param childrenIds - ids of the children
 * @returns normalized region
 */
export function normalizeRegion(
  raw: RawItem,
  id: string,
  childrenIds: string[]
): Region {
  const categoryData = NORMALIZED_CATEGORY_DATA_BY_KATOTTG[raw.k];

  const nameFull = buildNameFull(raw.n, categoryData);
  const districts: RegionChild[] = childrenIds.map((cid) => ({
    id: cid,
    name: rawNamesMap[cid] || "",
  }));
  return {
    id,
    name: raw.n,
    category: categoryData.category,
    nameFull,
    districts,
  };
}

/**
 * Normalization of District
 *
 * @param raw - raw item
 * @param id - id of the district
 * @param regionId - id of the region
 * @param childrenIds - ids of the children
 * @returns normalized district
 */
export function normalizeDistrict(
  raw: RawItem,
  id: string,
  regionId: string,
  childrenIds: string[]
): District {
  const categoryData = NORMALIZED_CATEGORY_DATA_BY_KATOTTG[raw.k];
  const nameFull = buildNameFull(raw.n, categoryData);

  const communities: DistrictChild[] = childrenIds.map((cid) => ({
    id: cid,
    name: rawNamesMap[cid] || "",
  }));
  return {
    id,
    name: raw.n,
    category: categoryData.category,
    nameFull,
    regionId,
    communities,
  };
}

/**
 * Normalization of Community
 *
 * @param raw - raw item
 * @param id - id of the community
 * @param districtId - id of the district
 * @param regionId - id of the region
 * @param childrenIds - ids of the children
 * @returns normalized community
 */
export function normalizeCommunity(
  raw: RawItem,
  id: string,
  districtId: string,
  regionId: string,
  childrenIds: string[]
): Community {
  const categoryData = NORMALIZED_CATEGORY_DATA_BY_KATOTTG[raw.k];
  const nameFull = buildNameFull(raw.n, categoryData);

  const settlements: CommunityChild[] = childrenIds.map((cid) => ({
    id: cid,
    name: rawNamesMap[cid] || "",
  }));
  return {
    id,
    name: raw.n,
    category: categoryData.category,
    nameFull,
    districtId,
    regionId,
    settlements,
  };
}

/**
 * Normalization of Settlement
 *
 * @param raw - raw item
 * @param id - id of the settlement
 * @param parentId - id of the parent
 * @param regionId - id of the region
 * @param parentType - type of the parent
 * @returns normalized settlement
 */
export function normalizeSettlement(
  raw: RawItem,
  id: string,
  parentId: string | null,
  regionId: string | null,
  parentType:
    | KattogStructureType.Community
    | KattogStructureType.District
    | null
): Settlement {
  const categoryData = NORMALIZED_CATEGORY_DATA_BY_KATOTTG[raw.k];
  const nameFull = buildNameFull(raw.n, categoryData);

  return {
    id,
    name: raw.n,
    category: categoryData.category,
    nameFull,
    parentId,
    parentType,
    regionId,
  };
}

/**
 * Helper map "index → raw.name"
 */
export const rawNamesMap: Record<string, string> = {};
