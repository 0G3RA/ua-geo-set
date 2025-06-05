import { CategoryBase, CategoryCode, KattogStructureType } from "./enums";

export interface RawItem {
  n: string;
  k: CategoryCode; //category code from KATOTTG
  p?: number; //parent
  c?: number[]; //children
  i?: boolean;
}

export interface RawOptimizedData {
  orderDate: string;
  categories: Record<string, string>;
  items: RawItem[];
  indexToCode: string[];
}

export type NormalizedCategoryData = {
  alias: string;
  specificAlias?: string;
  suffix?: string;
  postfix?: string;
  categoryName: string;
  category: CategoryBase;
  short: string;
};

export interface RegionChild {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
  category: CategoryBase;
  nameFull: string;
  districts: RegionChild[];
}

export interface DistrictChild {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  category: CategoryBase;
  nameFull: string;
  regionId: string;
  communities: DistrictChild[];
}

export interface CommunityChild {
  id: string;
  name: string;
}

export interface Community {
  id: string;
  name: string;
  category: CategoryBase;
  nameFull: string;
  districtId: string;
  regionId: string;
  settlements: CommunityChild[];
}

export interface Settlement {
  id: string;
  name: string;
  category: CategoryBase;
  nameFull: string;
  parentId: string | null;
  parentType:
    | KattogStructureType.Community
    | KattogStructureType.District
    | null;
  regionId: string | null;
}
