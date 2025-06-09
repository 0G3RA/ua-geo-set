# Changelog

## [1.0.3] – 2025-06-09
### Fixed / Internal
- Додано копіювання kattog файлу до dist/data директоріїї.

---

## [1.0.2] – 2025-06-09
### Added
- Підтримку ECMAScript Modules (ESM).
- Підтримку CommonJS.

### Changed
- Оновлено конфігурацію TypeScript (`tsconfig.cjs.json` та `tsconfig.esm.json`) для коректної збірки обох форматів.
- Вдосконалено `package.json`:
  - Поля `"main"` і `"module"` налаштовані відповідно під CommonJS та ESM.
  - Секція `"exports"` адаптована під обидва формати модулів.
- Спрощено скрипт `build` — тепер одночасно генерує CJS-, ESM-білди та копіює дані.

---

## [1.0.1] – 2025-06-05
### Fixed / Internal
- Перенесено `raw-kattog.json` та `kattog.json` з `src/data` до `data/raw-kattog.json` для того, щоб уникнути дублювання файлу в `dist/` і зменшити розмір пакета.
- Змінено згадування в коментарях `raw-kattog.json` на `kattog.json` 
- Оновлено шлях імпорту в `src/lib/geo-api.ts` (`"../../data/raw-kattog.json"`).
- Оновлено налаштування `.npmignore` (або `"files"` у `package.json`), щоб у npm-пакет потрапляв єдиний екземпляр `kattog.json`.
- Зміненно розширення конфігурацій Jest з CommonJS на ES

---

## [1.0.0] – 2025-06-05
### Added
- Початковий реліз: повні дані KATOTTG 2024.
- GeoAPI з методами getAllRegions, getAllDistricts, getAllCommunities, getAllSettlements тощо.
- Пакет включає `kattog.json` (Крим, області, райони, громади, міста, селища, села).