
## 🇺🇦 UaGeoSet 🇺🇦

**UaGeoSet** is a zero-dependency TypeScript/JavaScript library that wraps a pre-compiled JSON snapshot of the Ukrainian administrative-territorial catalogue (KATOTTG) as of 2024. It exposes a simple `GeoAPI` class to query regions, districts, communities, and settlements by their official UA-codes (in KATOTTG style).

### Key Characteristics

- **Zero Dependencies**: Pure TypeScript implementation
- **Lightweight**: Bundles only a minimal, index-based JSON (`raw-kattog.json`), optimized from the original KATOTTG dataset
- **Offline First**: No external network requests—everything works offline
- **Type-Safe**: Full TypeScript support with proper interfaces [_Almost_]
- **Universal**: Works in both Node.js and browser environments

### Data Coverage

The library provides access to the complete Ukrainian administrative hierarchy:
- Regions (Області) and AR Crimea
- Districts (Райони)
- Communities (Громади)
- Settlements (Населені пункти)

> 💡 The optimization process reduces the original dataset size while maintaining all essential information and relationships.


## Table of Contents:
1. [📊 Data Source](#-data-source)
    - [Data Processing Pipeline](#data-processing-pipeline)  
2. [Features](#features)  
3. [Installation](#installation)  
4. [Data Model & Categories](#data-model--categories)  
    - [The KATOTTG to API Categories Table](#the-katottg-to-api-categories-table)
5. [🧑‍💻 Basic Usage](#-basic-usage)  
   - [Initializing the API](#initializing-the-api)  
   - [Regions](#regions)  
   - [Districts](#districts)  
   - [Communities](#communities)  
   - [Settlements](#settlements)  
   - [Search Examples](#search-examples)  
6. [Folder Structure](#folder-structure)  
7. [CHANGELOG](#changelog)  
8. [License](#license)



## Overview



## 📊 Data Source [](#-data-source)
The library is built on top of the official **KATOTTG 2024** dataset, which is maintained by [kaminarifox](https://github.com/kaminarifox/katottg-json). 

### Data Processing Pipeline

1. **Source Data**: Raw KATOTTG JSON from (`src/data/raw-kattog.json`)
2. **Optimization**: Custom script (`scripts/optimize-kattog.ts`) transforms the data into a compact, index-based format
3. **Output**: Optimized JSON (`src/data/kattog.json`) with minimal footprint and fast lookups

> 💡 The optimization process reduces the original dataset size (9.7MB -> 2.3MB) while maintaining all essential information and relationships.



## Features

- **Official UA-codes** for every administrative unit (exactly as in KATOTTG).  
- Covers the full hierarchy (2024):
  1. **Regions and AR Crimea** / **Області та Автономна Республіка Крим**  
  2. **Cities with special status** / **Міста, що мають спеціальний статус** (e.g. Kyiv, Sevastopol)  
  3. **Districts in regions and AR Crimea** / **Райони в областях та Автономній Республіці Крим**  
  4. **Territorial communities** / **Території територіальних громад** (names of territorial communities in each oblast, including Crimea)  
  5. **Cities** / **Міста**  
  6. **Urban-type settlements** / **СМТ** (deprecated; now treated under **"Cелища"**)  
  7. **Villages** / **Села**  
  8. **Settlements** / **Селища**  
  9. **City districts** / **Райони в містах**  
- **Lightweight**: index-based JSON, no redundant fields, minimal footprint.  
- Fully TypeScript-typed: you get `Region`, `District`, `Community`, and `Settlement` interfaces, each with its UA-code, name, category, and parent/children relationships.  
- No runtime dependencies—suitable for both browser and Node.js.



## Installation

Using **npm** (preferred):

```bash
npm add ua-geo-set
```

Or with npm:

```bash
npm install ua-geo-set
```

Yarn:
```
yarn add ua-geo-set
```

## Data Model & Categories

The 2024 KATOTTG hierarchy is represented by a single JSON (`raw-kattog.json`) with two arrays:

1. `indexToCode: string[]`
   - Maps each numeric index to a UA-code (e.g. "UA02000000000045678")
2. `items: RawItem[]`
   - Each `RawItem` contains:
     - `name: string` – the official name (e.g., "Вінницька область", "Київ")
     - `category: CategoryCode` – one of { O, K, P, H, C, X, M, B }
     - `parent?: number` – numeric index of its parent (if any)
     - `children?: number[]` – array of numeric indices of its children (if any)
     - `independent?: boolean` – set to true for "independent" city-regions (K) like Kyiv and Sevastopol

#### The KATOTTG to API Categories Table:

| Code | Alias | Description (Ukrainian) | Description (English) | Notes |
|------|-------|----------------|----------------------|-------|
| O | Region | Області та АР Крим | Regions and  AR Crimea  | Top-level regions |
| K | CitySpecial [Settlements] |Міста зі спец. статусом | Cities with special status | Treated as both Region & Settlement |
| P | District | Райони в областях та АР Крим | Districts in regions and AR Crimea | District of an oblast |
| H | Community | Територіальні громади | Territorial communities | Аssociation of small settlements|
| M | City [Settlements] | Міста | Сities | Basically, it's about second-tier cities.  |
| X | Urban [Settlements] | Селища | Urbans* | Urban-type settlement category folded |
| C | Village [Settlements] | Села | Villages | Common village type |
| B | DistrictCity [Settlements] | Райони в містах | City districts | Urban district (e.g. "Святошинський") |

> Note: The older "Селища міського типу" (category **T**) _has been deprecated_ and merged into category X.

## 🧑‍💻 Basic Usage [](#-basic-usage)

#### Initializing the API:

```typescript
import { GeoAPI } from "ua-geo-set";

const geo = new GeoAPI();
```

#### Regions:

```typescript
// Get all regions (categories O + K)
const regions = geo.getAllRegions();

// Find a specific region by UA-code
const vinnitsa = geo.getRegionById("UA02000000000045678");
console.log(vinnitsa?.name); // "Вінницька область"

// Find "Kyiv" (a special-status city) in regions
const kyivRegion = regions.find(r => r.name === "Київ");
console.log(kyivRegion?.id); // "UA80000000000093317"
```

Each `Region` object has:
```typescript
  interface Region {
  id: string;                     // UA-code, e.g. "UA02000000000045678"
  name: string;                   // e.g. "Вінницька область" or "Київ"
  category: CategoryBase;         // "Region" or "CitySpecial"
  nameFull: string;               // e.g. "Вінницька область"
  districts: RegionChild[];
}
```

#### Districts:

```typescript
// Get all region's districts
const allRegionDistricts = geo.getAllRegionDistricts();

// Get all cities districts
const allCitiesDistricts = geo.getAllCityDistricts();

// Get Any District by id
const district = geo.getDistrictById("UA80000000000875983"); // "Святошинський р-н" міста Київ


// Get only districts belonging to a given region
const vinnytsiaDistricts = geo.getAllRegionDistricts("UA05000000000010236");
vinnytsiaDistricts.forEach(d => console.log(d.name));

// For a city district ("B"), regionId will be the city-code
const kyivDistricts = geo.getAllCityDistricts("UA80000000000093317");
console.log(kyivDistricts.map(d => d.name));
```

Each `District`:
```typescript
interface District {
  id: string;                      // UA-code of the district
  name: string;                    // e.g. "Бахчисарайський" or "Святошинський"
  category: CategoryBase;          // "District" or "DistrictCity"
  nameFull: string;                // e.g. "Бахчисарайський район"
  regionId: string;                // UA-code of parent (oblast or city)
  communities: DistrictChild}[];
}
```

#### Communities:

```typescript
// Get all communities
const communities = geo.getAllCommunities();

// Filter by district
const nikopolsDistrictkaComms = geo.getAllCommunities("UA12080000000023578");

// Search by partial name
const nikop = geo.searchCommunitiesByName("Нікоп");
console.log(nikop.map(c => c.name)); // ["Нікопольська"]
```

Each `Community`:
```typescript
interface Community {
  id: string;                     // UA-code
  name: string;                   // e.g. "Андріївська"
  category: CategoryBase;         // "Community"
  nameFull: string;               // "Андріївська територіальна громада"
  districtId: string;             // UA-code of parent district
  regionId: string;               // UA-code of parent oblast or city
  settlements: CommunityChild[];
}
```

#### Settlements:

```typescript
// Get all settlements
const allSettlements = geo.getAllSettlements();

// Filter by region, district, or community
const poltavasSettlements = geo.getAllSettlements({ regionId: "UA53000000000028050" });
const bahchisarayskiyDistrictSettlements = geo.getAllSettlements({ districtId: "UA01020000000022387" });
const nikopolskaComms = geo.getAllSettlements({ communityId: "UA12080050000062712" });

// Search by partial name
const barSettlements = geo.searchSettlementsByName("Бар");
console.log(barSettlements.map(s => s.name)); 

// Fetch a single settlement by UA-code
const andriyivka = geo.getSettlementById("UA12140250020066759");
console.log(andriyivka?.name); // село "Андріївка"
```

Each `Settlement`:
```typescript
interface Settlement {
  id: string;               // UA-code
  name: string;             // e.g. "Андріївка", "Київ"
  category: string;         // "City" | "CitySpecial" | "Urban" | "Village" | 
  nameFull: string;         // e.g. "Андріївка село"
  parentId: string | null;  // UA-code of parent (community or district)
  parentType:               // one of:
    | KattogStructureType.Community 
    | KattogStructureType.District 
    | null;
  regionId: string | null;  // UA-code of oblast or city for urban districts
}
```

#### Search Examples:

```typescript
// [Temp solution] Search regions by name
const region = geo.getAllRegions().find((r) => r.name === cityName);
getAllDistricts
// Search districts by name
const district = geo.getAllRegions().find((r) => r.name === regionDistrictName);
console.log(barDistricts.map(d => d.name)); // ["Барський район"]

// Search communities by name
const andriyivkaComms = geo.searchCommunitiesByName("Андріївська");
console.log(andriyivkaComms.map(c => c.name)); // ["Андріївська територіальна громада"]

// Search settlements by name
const barSettlements = geo.searchSettlementsByName("Бар");
console.log(barSettlements.map(s => s.name)); // ["Бар", "Барок", "Барське", ...]
```


## 🌳 Folder Structure
```
ua-geo-set/
├─ src/
│ ├─ data/
│ │ └─ raw-kattog.json # Compact, index-based JSON (KATOTTG 2024)
│ ├─ lib/
│ │ ├─ enums.ts # CategoryCode, CategoryBase, KattogStructureType
│ │ ├─ types.ts # RawItem, RawOptimizedData, Region, etc.
│ │ ├─ normalize.ts # normalizeRegion/District/Community/Settlement
│ │ ├─ mappers.ts # Mapping CategoryCode → suffix/postfix
│ │ └─ geo-api.ts # GeoAPI class
│ └─ index.ts # (optional) re-export of GeoAPI
├─ tests/
│ └─ geo-api.test.ts # Jest tests for GeoAPI
├─ scripts/
│ └─ convert-kattog.ts # Script to generate raw-kattog.json from kattog.json
├─ README.md
├─ CHANGELOG.md
├─ package.json
└─ tsconfig.json
```

## CHANGELOG

Please see [CHANGELOG.md]('./CHANGELOG.md') for a detailed list of changes and version history.

## License

This project is licensed under the MIT License. See [LICENSE]('./LICENSE') for details.