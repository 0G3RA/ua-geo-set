// scripts/convert-kattog.ts

import * as fs from "fs";
import * as path from "path";

// UA-codes of cities with special status:
const KYIV_CODE = "UA80000000000093317";
const SEVASTOPOL_CODE = "UA85000000000065278";

const KYIV_REGION_CODE = "UA32000000000030281";
const SEVASTOPOL_REGION_CODE = "UA01000000000013043";

interface RawItemIn {
  level1: string | null; // UA-code of region or city (for O, K)
  level2: string | null; // UA-code of district (for P, B)
  level3: string | null; // UA-code of community (for H)
  level4: string | null; // UA-code of city (for M, B, K)
  level5: string | null; // UA-code of settlement (for C, X) or last level (B)
  category: string; // letter from KATOTTG: "O","K","P","H","C","X","M","B"
  name: string; // name
}

interface RawDataIn {
  orderDate: string;
  categories: Record<string, string>;
  items: RawItemIn[];
}

/** ItemRaw is a structure that will go into kattog.json.
 *  Contains only name/category/parent/children/independent, without any field type.
 */
interface ItemRawOut {
  n: string; //name
  k: string; //category code from KATOTTG
  p?: number; //parent
  c?: number[]; //children
  i?: boolean; //independent
}

interface Output {
  orderDate: string;
  categories: Record<string, string>;
  items: ItemRawOut[];
  indexToCode: string[];
}

/**
 * KATOTTG is a Ukrainian administrative division system.
 * This document was updated in 2024.
 *
 * Document source was taken from: https://github.com/kaminarifox/katottg-json
 */
const INPUT_PATH = path.resolve(__dirname, "../src/data/raw-kattog.json");

const OUTPUT_PATH = path.resolve(__dirname, "../src/data/kattog.json");

/**
 * Filter items by categories and return a object with arrays of items.
 *
 * @param items - array of items
 * @returns object with arrays of items
 */
const filterByCategories = (items: RawItemIn[]) => ({
  regions: items.filter(
    (i) =>
      (i.category === "O" || i.category === "K") &&
      i.level1 !== KYIV_CODE &&
      i.level1 !== SEVASTOPOL_CODE
  ),
  areaDistricts: items.filter((i) => i.category === "P"),
  citySettlements: items.filter((i) => i.category === "M"),
  specialCities: items.filter(
    (i) =>
      i.category === "K" &&
      (i.level1 === KYIV_CODE || i.level1 === SEVASTOPOL_CODE)
  ),
  cityDistricts: items.filter((i) => i.category === "B"),
  communities: items.filter((i) => i.category === "H"),
  otherSettlements: items.filter((i) => ["C", "X"].includes(i.category)),
});

/**
 * Add an item to the items array and return its index.
 *
 * @param items - array of items
 * @param codeToIndex - map of codes to indices
 * @param indexToCode - array of codes
 * @param item - item to add
 * @param code - code of the item
 * @returns index of the item
 */
const addItem = (
  items: ItemRawOut[],
  codeToIndex: Map<string, number>,
  indexToCode: string[],
  item: ItemRawOut,
  code: string
) => {
  const idx = items.length;
  items.push(item);
  codeToIndex.set(code, idx);
  indexToCode.push(code);
  return idx;
};

/**
 * Add a child to the parent's children array.
 *
 * @param items - array of items
 * @param parentIdx - index of the parent
 * @param childIdx - index of the child
 */
const addChildToParent = (
  items: ItemRawOut[],
  parentIdx: number,
  childIdx: number
) => {
  const parent = items[parentIdx];
  if (parent.c) {
    parent.c.push(childIdx);
  } else {
    parent.c = [childIdx];
  }
};

/**
 * Process regions.
 *
 * @param regions - array of regions
 * @param items - array of items
 * @param codeToIndex - map of codes to indices
 * @param indexToCode - array of codes
 */
const processRegions = (
  regions: RawItemIn[],
  items: ItemRawOut[],
  codeToIndex: Map<string, number>,
  indexToCode: string[]
) => {
  for (const r of regions) {
    const regionId = r.level1!;
    if (!codeToIndex.has(regionId)) {
      addItem(
        items,
        codeToIndex,
        indexToCode,
        {
          n: r.name.trim(),
          k: r.category,
        },
        regionId
      );
    }
  }
};

/**
 * Process area districts.
 *
 * @param districts - array of districts
 * @param items - array of items
 * @param codeToIndex - map of codes to indices
 * @param indexToCode - array of codes
 */
const processAreaDistricts = (
  districts: RawItemIn[],
  items: ItemRawOut[],
  codeToIndex: Map<string, number>,
  indexToCode: string[]
) => {
  for (const d of districts) {
    const regionId = d.level1!;
    const districtId = d.level2!;
    const parentIdx = codeToIndex.get(regionId);
    if (parentIdx === undefined) continue;
    if (!codeToIndex.has(districtId)) {
      const idx = addItem(
        items,
        codeToIndex,
        indexToCode,
        {
          n: d.name.trim(),
          k: d.category,
          p: parentIdx,
        },
        districtId
      );
      addChildToParent(items, parentIdx, idx);
    }
  }
};

/**
 * Process city settlements.
 *
 * @param settlements - array of settlements
 * @param items - array of items
 * @param codeToIndex - map of codes to indices
 * @param indexToCode - array of codes
 */
const processCitySettlements = (
  settlements: RawItemIn[],
  items: ItemRawOut[],
  codeToIndex: Map<string, number>,
  indexToCode: string[]
) => {
  for (const s of settlements) {
    const districtId = s.level2!;
    const settlementId = s.level4!;
    const parentIdx = codeToIndex.get(districtId);
    if (parentIdx === undefined) continue;
    if (!codeToIndex.has(settlementId)) {
      const idx = addItem(
        items,
        codeToIndex,
        indexToCode,
        {
          n: s.name.trim(),
          k: s.category,
          p: parentIdx,
        },
        settlementId
      );
      addChildToParent(items, parentIdx, idx);
    }
  }
};

/**
 * Process special cities.
 *
 * @param cities - array of cities
 * @param items - array of items
 * @param codeToIndex - map of codes to indices
 * @param indexToCode - array of codes
 */
const processSpecialCities = (
  cities: RawItemIn[],
  items: ItemRawOut[],
  codeToIndex: Map<string, number>,
  indexToCode: string[]
) => {
  for (const s of cities) {
    const settlementId = s.level1!;
    const parentRegionCode =
      settlementId === KYIV_CODE ? KYIV_REGION_CODE : SEVASTOPOL_REGION_CODE;

    const parentIdx = codeToIndex.get(parentRegionCode);

    const idx = addItem(
      items,
      codeToIndex,
      indexToCode,
      {
        n: s.name.trim(),
        k: s.category,
        i: true,
        p: parentIdx === undefined ? undefined : parentIdx,
      },
      settlementId
    );

    if (parentIdx !== undefined) {
      addChildToParent(items, parentIdx, idx);
    }
  }
};

/**
 * Process city districts.
 *
 * @param districts - array of districts
 * @param items - array of items
 * @param codeToIndex - map of codes to indices
 * @param indexToCode - array of codes
 */
const processCityDistricts = (
  districts: RawItemIn[],
  items: ItemRawOut[],
  codeToIndex: Map<string, number>,
  indexToCode: string[]
) => {
  for (const d of districts) {
    const cityId = d.level4!;
    const districtId = d.level5!;
    const parentIdx = codeToIndex.get(cityId);
    if (parentIdx === undefined) continue;
    if (!codeToIndex.has(districtId)) {
      const idx = addItem(
        items,
        codeToIndex,
        indexToCode,
        {
          n: d.name.trim(),
          k: d.category,
          p: parentIdx,
        },
        districtId
      );
      addChildToParent(items, parentIdx, idx);
    }
  }
};

/**
 * Process communities.
 *
 * @param communities - array of communities
 * @param items - array of items
 * @param codeToIndex - map of codes to indices
 * @param indexToCode - array of codes
 */
const processCommunities = (
  communities: RawItemIn[],
  items: ItemRawOut[],
  codeToIndex: Map<string, number>,
  indexToCode: string[]
) => {
  for (const c of communities) {
    const districtId = c.level2!;
    const communityId = c.level3!;
    const parentIdx = codeToIndex.get(districtId);
    if (parentIdx === undefined) continue;
    if (!codeToIndex.has(communityId)) {
      const idx = addItem(
        items,
        codeToIndex,
        indexToCode,
        {
          n: c.name.trim(),
          k: c.category,
          p: parentIdx,
        },
        communityId
      );
      addChildToParent(items, parentIdx, idx);
    }
  }
};

/**
 * Process other settlements.
 *
 * @param settlements - array of settlements
 * @param items - array of items
 * @param codeToIndex - map of codes to indices
 * @param indexToCode - array of codes
 */
const processOtherSettlements = (
  settlements: RawItemIn[],
  items: ItemRawOut[],
  codeToIndex: Map<string, number>,
  indexToCode: string[]
) => {
  for (const s of settlements) {
    const districtId = s.level2!;
    const communityId = s.level3!;
    const settlementId = s.level4 ?? s.level5!;
    const parentKey = communityId || districtId;
    const parentIdx = codeToIndex.get(parentKey);
    if (parentIdx === undefined) continue;
    if (!codeToIndex.has(settlementId)) {
      const idx = addItem(
        items,
        codeToIndex,
        indexToCode,
        {
          n: s.name.trim(),
          k: s.category,
          p: parentIdx,
        },
        settlementId
      );
      addChildToParent(items, parentIdx, idx);
    }
  }
};

/**
 * Main function.
 *
 * @returns void
 */
const main = () => {
  const rawJson: RawDataIn = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  const items: ItemRawOut[] = [];
  const indexToCode: string[] = [];
  const codeToIndex = new Map<string, number>();

  const categories = filterByCategories(rawJson.items);

  // Process in correct order
  processRegions(categories.regions, items, codeToIndex, indexToCode);
  processAreaDistricts(
    categories.areaDistricts,
    items,
    codeToIndex,
    indexToCode
  );
  processCitySettlements(
    categories.citySettlements,
    items,
    codeToIndex,
    indexToCode
  );
  processSpecialCities(
    categories.specialCities,
    items,
    codeToIndex,
    indexToCode
  );
  processCityDistricts(
    categories.cityDistricts,
    items,
    codeToIndex,
    indexToCode
  );
  processCommunities(categories.communities, items, codeToIndex, indexToCode);
  processOtherSettlements(
    categories.otherSettlements,
    items,
    codeToIndex,
    indexToCode
  );

  // Cleanup empty children
  for (const it of items) {
    if (it.c && it.c.length === 0) {
      delete it.c;
    }
  }

  const output: Output = {
    orderDate: rawJson.orderDate,
    categories: rawJson.categories,
    items,
    indexToCode,
  };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output), "utf-8");
  console.log("✅ kattog.json created");
};

main();
