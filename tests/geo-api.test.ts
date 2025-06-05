import { CategoryBase, CategoryCode } from "../src/lib/enums";
import { GeoAPI } from "../src/lib/geo-api";
import { Settlement } from "../src/lib/types";
import rawData from "../data/kattog.json";

describe("GeoAPI (real data: kattog.json)", () => {
  let geo: GeoAPI;

  const KYIV_REGION_CODE = "UA32000000000030281";
  const SEVASTOPOL_REGION_CODE = "UA01000000000013043";

  // Constants for key cities
  const KYIV_NAME = "Київ";
  const KYIV_ID = "UA80000000000093317";
  const KYIV_DISTRICTS_COUNT = 10;

  const SEVASTOPOL_NAME = "Севастополь";
  const SEVASTOPOL_ID = "UA85000000000065278";
  const SEVASTOPOL_DISTRICTS_COUNT = 4;

  const POLTAVA_NAME = "Полтава";
  const POLTAVA_ID = "UA53080370010073240";
  const POLTAVA_DISTRICTS_COUNT = 3;

  beforeAll(() => {
    geo = new GeoAPI();
  });

  //
  // 1. REGION: check regions and special cities
  //
  describe("Regions (categories O + K)", () => {
    test("count of regions in geo.getAllRegions() should match count of raw data", () => {
      const rawRegionsCount = rawData.items.filter((it: any) =>
        [CategoryCode.O, CategoryCode.K].includes(it.k)
      ).length;

      const regions = geo.getAllRegions();
      expect(regions.length).toBe(rawRegionsCount);
    });

    test.each([
      [KYIV_NAME, KYIV_ID, CategoryBase.CitySpecial],
      [SEVASTOPOL_NAME, SEVASTOPOL_ID, CategoryBase.CitySpecial],
    ])(
      "%s should be in regions and settlements with correct category",
      (cityName, cityId, expectedCategory) => {
        const region = geo.getAllRegions().find((r) => r.name === cityName);
        expect(region).toBeDefined();
        expect(region!.id).toBe(cityId);

        const settlement = geo
          .searchSettlementsByName(cityName)
          ?.find((s) => s.id === cityId);
        expect(settlement).toBeDefined();
        expect(settlement!.category).toBe(expectedCategory);
      }
    );

    test("all regions should have at least one district", () => {
      const oblasts = geo
        .getAllRegions()
        .filter((r) => r.category === CategoryBase.Region);

      expect(oblasts.length).toBeGreaterThan(0);

      for (const oblast of oblasts) {
        const districts = geo.getAllRegionDistricts(oblast.id);
        expect(districts.length).toBeGreaterThan(0);
      }
    });
  });

  //
  // 2. COMMUNITY & SETTLEMENT: check C/X and search
  //
  describe("Communities & Settlements", () => {
    test("at least one community should have Settlement category 'C' or 'X'", () => {
      const allCommunities = geo.getAllCommunities();
      expect(allCommunities.length).toBeGreaterThan(0);

      const found = allCommunities.some((comm) => {
        const settlements = geo.getAllSettlements({ communityId: comm.id });
        return settlements.some((s) =>
          [CategoryBase.Village, CategoryBase.Urban].includes(s.category)
        );
      });
      expect(found).toBe(true);
    });

    test('search community by half name "Нікоп" and check results', () => {
      const results = geo.searchCommunitiesByName("Нікоп");
      expect(results.length).toBe(1);
      expect(results[0].name.toLowerCase()).toContain("нікопольська");
    });

    test("search settlement by half name 'Бар' and check results", () => {
      const results = geo.searchSettlementsByName("Бар");
      expect(results.length).toBeGreaterThan(0);
      for (const s of results as Settlement[]) {
        expect(s.name.toLowerCase()).toContain("бар");
      }
    });

    test.each([
      [KYIV_NAME, KYIV_ID, KYIV_REGION_CODE],
      [SEVASTOPOL_NAME, SEVASTOPOL_ID, SEVASTOPOL_REGION_CODE],
    ])(
      "Kyiv and Sevastopol should be in Kyiv and Crimea regions too",
      (cityName, cityId, regionId) => {
        const settlement = geo
          .searchSettlementsByName(cityName)
          ?.find((s) => s.id === cityId);

        expect(settlement).toBeDefined();
        expect(settlement!.regionId).toBe(regionId);
      }
    );
  });

  //
  // 3. CITY DISTRICTS: check districts for K and M level cities
  //
  describe("City Districts (categories K and M)", () => {
    test.each([
      [KYIV_NAME, KYIV_ID, KYIV_DISTRICTS_COUNT],
      [SEVASTOPOL_NAME, SEVASTOPOL_ID, SEVASTOPOL_DISTRICTS_COUNT],
      [POLTAVA_NAME, POLTAVA_ID, POLTAVA_DISTRICTS_COUNT],
    ])(
      `city %s should have %i district(s)`,
      (cityName, cityId, expectedCount) => {
        const settlement = geo
          .searchSettlementsByName(cityName)
          ?.find((s) => s.id === cityId);
        expect(settlement).toBeDefined();
        expect(settlement!.id).toBe(cityId);

        const districts = geo.getAllCityDistricts(cityId!);
        expect(districts.length).toBe(expectedCount);
      }
    );
  });
});
