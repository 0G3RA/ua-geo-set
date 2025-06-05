import rawJsonData from "../../data/kattog.json";
import {
  RawItem,
  RawOptimizedData,
  Region,
  District,
  Community,
  Settlement,
} from "./types";
import {
  rawNamesMap,
  normalizeRegion,
  normalizeDistrict,
  normalizeCommunity,
  normalizeSettlement,
} from "./normalize";
import { CategoryBase, CategoryCode, KattogStructureType } from "./enums";

export class GeoAPI {
  private readonly rawItems: RawItem[];
  private readonly indexToCode: string[];
  private readonly codeToIndex = new Map<string, number>();

  private readonly regions = new Map<string, Region>();
  private readonly districts = new Map<string, District>();
  private readonly communities = new Map<string, Community>();
  private readonly settlements = new Map<string, Settlement>();

  constructor() {
    const rawData = rawJsonData as RawOptimizedData;
    this.rawItems = rawData.items;
    this.indexToCode = rawData.indexToCode;
    this.indexToCode.forEach((code, i) => this.codeToIndex.set(code, i));

    // Fill rawNamesMap, so normalize-methods know names by code
    this.rawItems.forEach((item, idx) => {
      rawNamesMap[this.indexToCode[idx]] = item.n;
    });

    this.buildRegions();
    this.buildDistricts();
    this.buildCommunities();
    this.buildSettlements();
  }

  // —————————————————————————————————————————————————————
  // Public class methods
  // —————————————————————————————————————————————————————

  /**
   * Get all regions including independent settlements
   * @returns array of regions
   */
  public getAllRegions(): Region[] {
    return Array.from(this.regions.values());
  }

  /**
   * Get region by id
   * @param regionId - id of the region
   * @returns region or undefined
   */
  public getRegionById(regionId: string): Region | undefined {
    return this.regions.get(regionId);
  }

  /**
   * Get all Region's districts
   * @param regionId - id of the region
   * @returns array of districts
   */
  public getAllRegionDistricts(regionId?: string): District[] {
    const districts = Array.from(this.districts.values()).filter(
      (d) => d.category === CategoryBase.District
    );

    if (!regionId) return districts;
    return districts.filter((d) => d.regionId === regionId);
  }

  /**
   * Get district by id City or Region
   * @param districtId - id of the district
   * @returns district or undefined
   */
  public getDistrictById(districtId: string): District | undefined {
    return this.districts.get(districtId);
  }

  /**
   * Get all communities
   * @param [districtId]? - id of the district (optional)
   * @returns Community[] or communities by districtId
   */
  public getAllCommunities(districtId?: string): Community[] {
    if (!districtId) return Array.from(this.communities.values());
    return Array.from(this.communities.values()).filter(
      (c) => c.districtId === districtId
    );
  }

  /**
   * Get community by id
   * @param communityId - id of the community
   * @returns Community or community by id
   */
  public getCommunityById(communityId: string): Community | undefined {
    return this.communities.get(communityId);
  }

  /**
   * Search communities by name
   * @param substr - substring of the community name
   * @returns Community[] or communities by name
   */
  public searchCommunitiesByName(substr: string): Community[] {
    const lower = substr.toLowerCase();
    return Array.from(this.communities.values()).filter((s) =>
      s.name.toLowerCase().includes(lower)
    );
  }

  /**
   * Get all settlements
   * @param [opts] - options for filtering
   * @returns Settlement[] or settlements by regionId/districtId/communityId
   */
  public getAllSettlements(opts?: {
    regionId?: string;
    districtId?: string;
    communityId?: string;
  }): Settlement[] {
    let result = Array.from(this.settlements.values());
    if (opts?.regionId) {
      result = result.filter((s) => s.regionId === opts.regionId);
    }
    if (opts?.districtId) {
      result = result.filter(
        (s) =>
          s.parentId === opts.districtId &&
          s.parentType === KattogStructureType.District
      );
    }
    if (opts?.communityId) {
      result = result.filter(
        (s) =>
          s.parentId === opts.communityId &&
          s.parentType === KattogStructureType.Community
      );
    }
    return result;
  }

  /**
   * Get settlement by id
   * @param settlementId - id of the settlement
   * @returns Settlement or settlement by id
   */
  public getSettlementById(settlementId: string): Settlement | undefined {
    return this.settlements.get(settlementId);
  }

  /**
   * Search settlements by name
   * @param substr - substring of the settlement name
   * @returns Settlement[] or settlements by name
   */
  public searchSettlementsByName(substr: string): Settlement[] {
    const lower = substr.toLowerCase();
    return Array.from(this.settlements.values()).filter((s) =>
      s.name.toLowerCase().includes(lower)
    );
  }

  /**
   * Get all city districts
   * @param [cityId]? - id of the city
   * @returns District[] or districts by cityId
   */
  public getAllCityDistricts(cityId?: string): District[] {
    const districts = Array.from(this.districts.values()).filter(
      (d) => d.category === CategoryBase.DistrictCity
    );

    if (!cityId) return districts;
    return districts.filter((d) => d.regionId === cityId);
  }

  // —————————————————————————————————————————————————————
  // Internal build-methods
  // —————————————————————————————————————————————————————

  /**
   * Build regions
   * @returns Region[] or regions by category
   */
  private buildRegions() {
    this.rawItems.forEach((item, idx) => {
      if (item.k === CategoryCode.O) {
        const code = this.indexToCode[idx];
        const childIndices = item.c ?? [];
        const childCodes = childIndices.map((ci) => this.indexToCode[ci]);
        const regionObj = normalizeRegion(item, code, childCodes);

        this.regions.set(code, regionObj);
      }
    });

    /**
     * All with category==="K".
     *
     * If independent===true, then it is an "independent settlement" (Kyiv/Sevastopol)
     */
    this.rawItems.forEach((item, idx) => {
      if (item.k === CategoryCode.K && item.i) {
        const code = this.indexToCode[idx];
        const childIndices = item.c ?? [];
        const childCodes = childIndices.map((ci) => this.indexToCode[ci]);
        const regionObj = normalizeRegion(item, code, childCodes);
        this.regions.set(code, regionObj);
      }
    });
  }

  /**
   * Build regional's and city's districts
   *
   * category === "P" or "B"
   * parent must exist (region or city)
   *
   * if parent is city, then it is a city district
   * if parent is region, then it is a regional district
   *
   * @returns District[] or districts by category
   */
  private buildDistricts() {
    this.rawItems.forEach((item, idx) => {
      if (item.k === CategoryCode.P || item.k === CategoryCode.B) {
        const code = this.indexToCode[idx];
        const parentIdx = item.p!;
        const regionCode = this.indexToCode[parentIdx];
        const childIndices = item.c ?? [];
        const childCodes = childIndices.map((ci) => this.indexToCode[ci]);
        const districtObj = normalizeDistrict(
          item,
          code,
          regionCode,
          childCodes
        );
        this.districts.set(code, districtObj);
      }
    });
  }

  /**
   * Build communities
   *
   * category === "H"
   * parent must exist (district)
   *
   * if parent is district, then it is a community
   *
   * @returns Community[] or communities by category
   */
  private buildCommunities() {
    this.rawItems.forEach((item, idx) => {
      if (item.k === CategoryCode.H) {
        const code = this.indexToCode[idx];
        const parentIdx = item.p!;
        const districtCode = this.indexToCode[parentIdx];
        const regionCode = this.districts.get(districtCode)!.regionId;
        const childIndices = item.c ?? [];
        const childCodes = childIndices.map((ci) => this.indexToCode[ci]);
        const commObj = normalizeCommunity(
          item,
          code,
          districtCode,
          regionCode,
          childCodes
        );
        this.communities.set(code, commObj);
      }
    });
  }

  /**
   * Build settlements
   *
   * category === "C" or "X" or "M" or "K"
   *
   * @returns Settlement[] or settlements by category
   */
  private buildSettlements() {
    this.rawItems.forEach((item, idx) => {
      if (
        [
          CategoryCode.C,
          CategoryCode.X,
          CategoryCode.M,
          CategoryCode.K,
        ].includes(item.k)
      ) {
        const code = this.indexToCode[idx];

        // parent can be district, community, region or "independent settlement"
        const parentIdx = item.p ?? -1;

        const parentCode = this.indexToCode[parentIdx];
        const parentCategory = this.rawItems[parentIdx]?.k;

        let parentType:
          | KattogStructureType.Community
          | KattogStructureType.District
          | null = null;
        let regionCode: string | null = null;

        if (parentCategory === CategoryCode.H) {
          // parent is community
          parentType = KattogStructureType.Community;
          regionCode = this.communities.get(parentCode)!.regionId;
        } else if (
          parentCategory === CategoryCode.P ||
          parentCategory === CategoryCode.B
        ) {
          // parent is district
          parentType = KattogStructureType.District;
          regionCode = this.districts.get(parentCode)!.regionId;
        } else {
          // parent is region or "independent settlement"
          regionCode = parentCode;
        }

        const settleObj = normalizeSettlement(
          item,
          code,
          parentCode,
          regionCode,
          parentType
        );
        this.settlements.set(code, settleObj);
      }
    });
  }
}
