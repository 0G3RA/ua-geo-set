import { CategoryBase, CategoryCode } from "./enums";
import { NormalizedCategoryData } from "./types";

export const CategoryKattogToBase: Record<CategoryCode, CategoryBase> = {
  [CategoryCode.O]: CategoryBase.Region,
  [CategoryCode.P]: CategoryBase.District,
  [CategoryCode.H]: CategoryBase.Community,
  [CategoryCode.C]: CategoryBase.Village,
  [CategoryCode.X]: CategoryBase.Urban,
  [CategoryCode.M]: CategoryBase.City,
  [CategoryCode.B]: CategoryBase.DistrictCity,
  [CategoryCode.K]: CategoryBase.CitySpecial,
};

export const NORMALIZED_CATEGORY_DATA_BY_KATOTTG: Record<
  CategoryCode,
  NormalizedCategoryData
> = {
  [CategoryCode.O]: {
    alias: "region",
    specificAlias: "region",
    postfix: "область",
    categoryName: "Область",
    category: CategoryKattogToBase[CategoryCode.O],
    short: "обл.",
  },
  [CategoryCode.P]: {
    alias: "district",
    specificAlias: "district",
    postfix: "район",
    categoryName: "Район",
    category: CategoryKattogToBase[CategoryCode.P],
    short: "р-н",
  },
  [CategoryCode.H]: {
    alias: "community",
    specificAlias: "community",
    postfix: "територіальна громада",
    categoryName: "Територіальна громада",
    category: CategoryKattogToBase[CategoryCode.H],
    short: "ОТГ",
  },
  [CategoryCode.C]: {
    alias: "settlement",
    specificAlias: "village",
    suffix: "село",
    categoryName: "Село",
    category: CategoryKattogToBase[CategoryCode.C],
    short: "с.",
  },
  [CategoryCode.X]: {
    alias: "settlement",
    specificAlias: "urban",
    suffix: "селище",
    categoryName: "Селище",
    category: CategoryKattogToBase[CategoryCode.X],
    short: "с-ще",
  },
  [CategoryCode.M]: {
    alias: "settlement",
    specificAlias: "city",
    suffix: "місто",
    categoryName: "Місто",
    category: CategoryKattogToBase[CategoryCode.M],
    short: "м.",
  },
  [CategoryCode.B]: {
    alias: "districtCity",
    specificAlias: "district",
    postfix: "район міста",
    categoryName: "Район міста",
    category: CategoryKattogToBase[CategoryCode.B],
    short: "р-н",
  },
  [CategoryCode.K]: {
    alias: "settlement",
    specificAlias: "citySpecial",
    postfix: "місто зі спецстатусом",
    categoryName: "Місто зі спецстатусом",
    category: CategoryKattogToBase[CategoryCode.K],
    short: "м.",
  },
};
