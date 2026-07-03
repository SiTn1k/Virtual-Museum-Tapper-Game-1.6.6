import { Epoch, EpochId, Generator, Artifact } from '../types/game';

// ═══════════════════════════════════════════════════════════════════════════
// EPOCHS DATA - Ukrainian + World History Combined
// Each rebirth unlocks more epochs
// ═══════════════════════════════════════════════════════════════════════════

const createGenerators = (templates: Array<{ id: string; icon: string; name: { ua: string; en: string }; desc: { ua: string; en: string }; baseCost: number; baseProd: number }>): Generator[] =>
  templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.desc,
    baseCost: t.baseCost,
    baseProduction: t.baseProd,
    costMultiplier: 1.27,
    icon: t.icon,
  }));

// ═══════════════════════════════════════════════════════════════════════════
// UKRAINIAN EPOCHS (Epochs 1-12)
// ═══════════════════════════════════════════════════════════════════════════

const trypilliaGenerators = createGenerators([
  { id: 'clay_pit', icon: '🏺', name: { ua: 'Глиняна яма', en: 'Clay Pit' }, desc: { ua: 'Видобування глини', en: 'Clay extraction' }, baseCost: 90, baseProd: 2 },
  { id: 'pottery', icon: '🎨', name: { ua: 'Гончарна майстерня', en: 'Pottery Workshop' }, desc: { ua: 'Виробництво кераміки', en: 'Ceramics production' }, baseCost: 360, baseProd: 8 },
  { id: 'settlement', icon: '🏘️', name: { ua: 'Поселення', en: 'Settlement' }, desc: { ua: 'Трипільська община', en: 'Trypillian community' }, baseCost: 1800, baseProd: 40 },
  { id: 'megastructure', icon: '🏛️', name: { ua: 'Мега-структура', en: 'Mega-Structure' }, desc: { ua: 'Величезна споруда', en: 'Massive structure' }, baseCost: 9000, baseProd: 200 },
  { id: 'temple', icon: '✨', name: { ua: 'Храм Богині', en: 'Temple of Goddess' }, desc: { ua: 'Священне місце', en: 'Sacred place' }, baseCost: 45000, baseProd: 1000 },
]);

const scythiaGenerators = createGenerators([
  { id: 'pasture', icon: '🐎', name: { ua: 'Пасовище', en: 'Pasture' }, desc: { ua: 'Коні та худоба', en: 'Horses and cattle' }, baseCost: 90, baseProd: 3 },
  { id: 'gold_mine', icon: '⛏️', name: { ua: 'Золота копальня', en: 'Gold Mine' }, desc: { ua: 'Скіфське золото', en: 'Scythian gold' }, baseCost: 450, baseProd: 12 },
  { id: 'kurgan', icon: '🎖️', name: { ua: 'Курган', en: 'Kurgan' }, desc: { ua: 'Поховання', en: 'Burial mound' }, baseCost: 2250, baseProd: 60 },
  { id: 'fortress', icon: '🏰', name: { ua: 'Фортеця', en: 'Fortress' }, desc: { ua: 'Захисна споруда', en: 'Defensive structure' }, baseCost: 11250, baseProd: 300 },
  { id: 'royal_tomb', icon: '👑', name: { ua: 'Царська гробниця', en: 'Royal Tomb' }, desc: { ua: 'Золота гробниця', en: 'Golden tomb' }, baseCost: 56250, baseProd: 1500 },
]);

const antiquityGenerators = createGenerators([
  { id: 'port', icon: '⚓', name: { ua: 'Порт', en: 'Port' }, desc: { ua: 'Торговий порт', en: 'Trading port' }, baseCost: 120, baseProd: 4 },
  { id: 'agora', icon: '🏛', name: { ua: 'Агора', en: 'Agora' }, desc: { ua: 'Торговельна площа', en: 'Market square' }, baseCost: 600, baseProd: 16 },
  { id: 'colony', icon: '🏪', name: { ua: 'Грецька колонія', en: 'Greek Colony' }, desc: { ua: 'Ольвія, Херсонес', en: 'Olbia, Chersonesus' }, baseCost: 3000, baseProd: 80 },
  { id: 'amphitheater', icon: '🎭', name: { ua: 'Амфітеатр', en: 'Amphitheater' }, desc: { ua: 'Культурний центр', en: 'Cultural center' }, baseCost: 15000, baseProd: 400 },
  { id: 'acropolis', icon: '🏛️', name: { ua: 'Акрополь', en: 'Acropolis' }, desc: { ua: 'Верхнє місто', en: 'Upper city' }, baseCost: 75000, baseProd: 2000 },
]);

const kyivRusGenerators = createGenerators([
  { id: 'field', icon: '🌾', name: { ua: 'Поле', en: 'Field' }, desc: { ua: 'Землеробство', en: 'Agriculture' }, baseCost: 180, baseProd: 6 },
  { id: 'craft_workshop', icon: '⚒️', name: { ua: 'Реміснича майстерня', en: 'Craft Workshop' }, desc: { ua: 'Ремесла', en: 'Crafts' }, baseCost: 900, baseProd: 24 },
  { id: 'city', icon: '🏰', name: { ua: 'Місто', en: 'City' }, desc: { ua: 'Київ, Чернігів', en: 'Kyiv, Chernihiv' }, baseCost: 4500, baseProd: 120 },
  { id: 'saint_sophia', icon: '☦️', name: { ua: 'Софійський собор', en: 'St. Sophia Cathedral' }, desc: { ua: 'Головна святиня', en: 'Main shrine' }, baseCost: 22500, baseProd: 600 },
  { id: 'golden_gate', icon: '🚪', name: { ua: 'Золоті ворота', en: 'Golden Gate' }, desc: { ua: 'Головна брама Києва', en: 'Main gate of Kyiv' }, baseCost: 112500, baseProd: 3000 },
]);

const halychVolhyniaGenerators = createGenerators([
  { id: 'salt_mine', icon: '🧂', name: { ua: 'Соляна копальня', en: 'Salt Mine' }, desc: { ua: 'Видобуток солі', en: 'Salt extraction' }, baseCost: 360, baseProd: 12 },
  { id: 'caravan', icon: '🐪', name: { ua: 'Купецький караван', en: 'Merchant Caravan' }, desc: { ua: 'Торгівля', en: 'Trade' }, baseCost: 1800, baseProd: 48 },
  { id: 'castle', icon: '🏯', name: { ua: 'Замок', en: 'Castle' }, desc: { ua: 'Львів, Камянець', en: 'Lviv, Kamenets' }, baseCost: 9000, baseProd: 240 },
  { id: 'cathedral', icon: '⛪', name: { ua: 'Собор', en: 'Cathedral' }, desc: { ua: 'Релігійний центр', en: 'Religious center' }, baseCost: 45000, baseProd: 1200 },
  { id: 'principality', icon: '👑', name: { ua: 'Князівство', en: 'Principality' }, desc: { ua: 'Данило Галицький', en: 'Danylo of Halych' }, baseCost: 225000, baseProd: 6000 },
]);

const polishLithuanianGenerators = createGenerators([
  { id: 'manor', icon: '🏡', name: { ua: 'Маєток', en: 'Manor' }, desc: { ua: 'Шляхетська власність', en: 'Noble estate' }, baseCost: 600, baseProd: 20 },
  { id: 'market', icon: '🛒', name: { ua: 'Ринок', en: 'Market' }, desc: { ua: 'Торгівля', en: 'Trade' }, baseCost: 3000, baseProd: 80 },
  { id: 'cossack_sich', icon: '⚔️', name: { ua: 'Січ', en: 'Sich' }, desc: { ua: 'Запорозька Січ', en: 'Zaporizhian Sich' }, baseCost: 15000, baseProd: 400 },
  { id: 'brotherhood', icon: '📚', name: { ua: 'Братство', en: 'Brotherhood' }, desc: { ua: 'Культурний рух', en: 'Cultural movement' }, baseCost: 75000, baseProd: 2000 },
  { id: 'university', icon: '🎓', name: { ua: 'Острозька академія', en: 'Ostroh Academy' }, desc: { ua: 'Перший університет', en: 'First university' }, baseCost: 375000, baseProd: 10000 },
]);

const cossackGenerators = createGenerators([
  { id: 'homestead', icon: '🏠', name: { ua: 'Хутір', en: 'Homestead' }, desc: { ua: 'Козацьке господарство', en: 'Cossack farm' }, baseCost: 1200, baseProd: 40 },
  { id: 'cannon', icon: '💣', name: { ua: 'Гармата', en: 'Cannon' }, desc: { ua: 'Артилерія', en: 'Artillery' }, baseCost: 6000, baseProd: 160 },
  { id: 'regiment', icon: '⚠️', name: { ua: 'Полк', en: 'Regiment' }, desc: { ua: 'Козацьке військо', en: 'Cossack army' }, baseCost: 30000, baseProd: 800 },
  { id: 'fortress_sich', icon: '🏰', name: { ua: 'Фортеця Січ', en: 'Sich Fortress' }, desc: { ua: 'Головна база', en: 'Main base' }, baseCost: 150000, baseProd: 4000 },
  { id: 'hetman_capital', icon: '🏛️', name: { ua: 'Гетьманська столиця', en: "Hetman's Capital" }, desc: { ua: 'Чигирин, Глухів', en: 'Chyhyryn, Hlukhiv' }, baseCost: 750000, baseProd: 20000 },
]);

const hetmanateGenerators = createGenerators([
  { id: 'farm', icon: '🐄', name: { ua: 'Ферма', en: 'Farm' }, desc: { ua: 'Сільське господарство', en: 'Agriculture' }, baseCost: 2400, baseProd: 80 },
  { id: 'factory', icon: '🏭', name: { ua: 'Мануфактура', en: 'Manufactory' }, desc: { ua: 'Рання промисловість', en: 'Early industry' }, baseCost: 12000, baseProd: 320 },
  { id: 'gymnasium', icon: '📖', name: { ua: 'Гімназія', en: 'Gymnasium' }, desc: { ua: 'Освіта', en: 'Education' }, baseCost: 60000, baseProd: 1600 },
  { id: 'theater', icon: '🎭', name: { ua: 'Театр', en: 'Theater' }, desc: { ua: 'Культура', en: 'Culture' }, baseCost: 300000, baseProd: 8000 },
  { id: 'railway', icon: '🚂', name: { ua: 'Залізниця', en: 'Railway' }, desc: { ua: 'Транспорт', en: 'Transport' }, baseCost: 1500000, baseProd: 40000 },
]);

const empireGenerators = createGenerators([
  { id: 'manor_estate', icon: '🏛️', name: { ua: 'Панський маєток', en: 'Manor Estate' }, desc: { ua: 'Аграрна економіка', en: 'Agricultural economy' }, baseCost: 4800, baseProd: 160 },
  { id: 'ironworks', icon: '⚙️', name: { ua: 'Металургійний завод', en: 'Ironworks' }, desc: { ua: 'Промислова революція', en: 'Industrial revolution' }, baseCost: 24000, baseProd: 640 },
  { id: 'university_kyiv', icon: '🎓', name: { ua: 'Київський університет', en: 'Kyiv University' }, desc: { ua: 'Вища освіта', en: 'Higher education' }, baseCost: 120000, baseProd: 3200 },
  { id: 'railway_network', icon: '🚂', name: { ua: 'Залізнична мережа', en: 'Railway Network' }, desc: { ua: 'Транспортна система', en: 'Transport system' }, baseCost: 600000, baseProd: 16000 },
  { id: 'cultural_society', icon: '📚', name: { ua: 'Просвітницьке товариство', en: 'Cultural Society' }, desc: { ua: 'Національний рух', en: 'National movement' }, baseCost: 3000000, baseProd: 80000 },
]);

const revolutionGenerators = createGenerators([
  { id: 'workers_club', icon: '🏭', name: { ua: 'Робітничий клуб', en: 'Workers Club' }, desc: { ua: 'Революційний центр', en: 'Revolutionary center' }, baseCost: 9600, baseProd: 320 },
  { id: 'military_council', icon: '⚔️', name: { ua: 'Військова рада', en: 'Military Council' }, desc: { ua: 'Військове керівництво', en: 'Military command' }, baseCost: 48000, baseProd: 1280 },
  { id: 'national_parliament', icon: '🏛️', name: { ua: 'Центральна Рада', en: 'Central Council' }, desc: { ua: 'Перший парламент', en: 'First parliament' }, baseCost: 240000, baseProd: 6400 },
  { id: 'national_press', icon: '📰', name: { ua: 'Національна преса', en: 'National Press' }, desc: { ua: 'Інформаційний центр', en: 'Information center' }, baseCost: 1200000, baseProd: 32000 },
  { id: 'independence_square', icon: '🇺🇦', name: { ua: 'Площа Незалежності', en: 'Independence Square' }, desc: { ua: 'Символ свободи', en: 'Symbol of freedom' }, baseCost: 6000000, baseProd: 160000 },
]);

const sovietGenerators = createGenerators([
  { id: 'collective_farm', icon: '🌾', name: { ua: 'Колгосп', en: 'Collective Farm' }, desc: { ua: 'Сільське господарство', en: 'Agriculture' }, baseCost: 19200, baseProd: 640 },
  { id: 'industrial_plant', icon: '🏭', name: { ua: 'Промисловий завод', en: 'Industrial Plant' }, desc: { ua: 'Важка промисловість', en: 'Heavy industry' }, baseCost: 96000, baseProd: 2560 },
  { id: 'research_institute', icon: '🔬', name: { ua: 'Науково-дослідний інститут', en: 'Research Institute' }, desc: { ua: 'Наука та розробки', en: 'Science and research' }, baseCost: 480000, baseProd: 12800 },
  { id: 'space_center', icon: '🚀', name: { ua: 'Космічний центр', en: 'Space Center' }, desc: { ua: 'Космічні технології', en: 'Space technology' }, baseCost: 2400000, baseProd: 64000 },
  { id: 'chornobyl', icon: '☢️', name: { ua: 'Чорнобильська АЕС', en: 'Chernobyl NPP' }, desc: { ua: 'Ядерна енергія', en: 'Nuclear power' }, baseCost: 12000000, baseProd: 320000 },
]);

const independenceGenerators = createGenerators([
  { id: 'private_enterprise', icon: '💼', name: { ua: 'Приватне підприємство', en: 'Private Enterprise' }, desc: { ua: 'Приватизація', en: 'Privatization' }, baseCost: 38400, baseProd: 1280 },
  { id: 'it_company', icon: '💻', name: { ua: 'IT-компанія', en: 'IT Company' }, desc: { ua: 'Технологічний сектор', en: 'Tech sector' }, baseCost: 192000, baseProd: 5120 },
  { id: 'european_union_deal', icon: '🇪🇺', name: { ua: 'Угода з ЄС', en: 'EU Association Deal' }, desc: { ua: 'Європейська інтеграція', en: 'European integration' }, baseCost: 960000, baseProd: 25600 },
  { id: 'modern_infrastructure', icon: '🌉', name: { ua: 'Сучасна інфраструктура', en: 'Modern Infrastructure' }, desc: { ua: 'Мости та дороги', en: 'Bridges and roads' }, baseCost: 4800000, baseProd: 128000 },
  { id: 'digital_nation', icon: '🌐', name: { ua: 'Цифрова держава', en: 'Digital Nation' }, desc: { ua: 'Електронні послуги', en: 'E-government' }, baseCost: 24000000, baseProd: 640000 },
]);

// ═══════════════════════════════════════════════════════════════════════════
// WORLD HISTORY EPOCHS (13-20) - Unlocked by Rebirth
// ═══════════════════════════════════════════════════════════════════════════

const egyptGenerators = createGenerators([
  { id: 'pyramid_stone', icon: '🧱', name: { ua: 'Каменоломня', en: 'Stone Quarry' }, desc: { ua: 'Добування каменю', en: 'Stone extraction' }, baseCost: 60000, baseProd: 2000 },
  { id: 'nile_agriculture', icon: '🌾', name: { ua: 'Сільське господарство', en: 'Nile Agriculture' }, desc: { ua: 'Землеробство біля Нілу', en: 'Agriculture by Nile' }, baseCost: 300000, baseProd: 8000 },
  { id: 'pharaoh_palace', icon: '🏛️', name: { ua: 'Палац фараона', en: 'Pharaoh Palace' }, desc: { ua: 'Царська резиденція', en: 'Royal residence' }, baseCost: 1500000, baseProd: 40000 },
  { id: 'temple_complex', icon: '⛩️', name: { ua: 'Храмовий комплекс', en: 'Temple Complex' }, desc: { ua: 'Релігійний центр', en: 'Religious center' }, baseCost: 7500000, baseProd: 200000 },
  { id: 'great_pyramid', icon: '🔺', name: { ua: 'Велика піраміда', en: 'Great Pyramid' }, desc: { ua: 'Чудо світу', en: 'Wonder of the world' }, baseCost: 37500000, baseProd: 1000000 },
]);

const greeceGenerators = createGenerators([
  { id: 'agora_market', icon: '🏪', name: { ua: 'Агора', en: 'Agora Market' }, desc: { ua: 'Торговий центр', en: 'Trading center' }, baseCost: 72000, baseProd: 2400 },
  { id: 'gymnasium_athens', icon: '🏟️', name: { ua: 'Гімнасій', en: 'Gymnasium' }, desc: { ua: 'Освітній заклад', en: 'Educational institution' }, baseCost: 360000, baseProd: 9600 },
  { id: 'oracle_delphi', icon: '🔮', name: { ua: 'Оракул Дельфів', en: 'Oracle of Delphi' }, desc: { ua: 'Провісниця', en: 'Prophet' }, baseCost: 1800000, baseProd: 48000 },
  { id: 'parthenon', icon: '🏛️', name: { ua: 'Парфенон', en: 'Parthenon' }, desc: { ua: 'Храм Афіни', en: 'Temple of Athena' }, baseCost: 9000000, baseProd: 240000 },
  { id: 'alexander_empire', icon: '👑', name: { ua: 'Імперія Олександра', en: 'Alexander Empire' }, desc: { ua: 'Велика держава', en: 'Great empire' }, baseCost: 45000000, baseProd: 1200000 },
]);

const romeGenerators = createGenerators([
  { id: 'roman_forum', icon: '🏛️', name: { ua: 'Римський форум', en: 'Roman Forum' }, desc: { ua: 'Політичний центр', en: 'Political center' }, baseCost: 96000, baseProd: 3200 },
  { id: 'colosseum', icon: '🎭', name: { ua: 'Колізей', en: 'Colosseum' }, desc: { ua: 'Амфітеатр', en: 'Amphitheater' }, baseCost: 480000, baseProd: 12800 },
  { id: 'roman_aqueduct', icon: '🌉', name: { ua: 'Акведук', en: 'Aqueduct' }, desc: { ua: 'Водопостачання', en: 'Water supply' }, baseCost: 2400000, baseProd: 64000 },
  { id: 'roman_legion', icon: '⚔️', name: { ua: 'Римський легіон', en: 'Roman Legion' }, desc: { ua: 'Військові сили', en: 'Military forces' }, baseCost: 12000000, baseProd: 320000 },
  { id: 'imperial_palace', icon: '🏰', name: { ua: 'Імператорський палац', en: 'Imperial Palace' }, desc: { ua: 'Резиденція цезаря', en: "Caesar's residence" }, baseCost: 60000000, baseProd: 1600000 },
]);

const medievalGenerators = createGenerators([
  { id: 'medieval_village', icon: '🏘️', name: { ua: 'Середньовічне селище', en: 'Medieval Village' }, desc: { ua: 'Селянська громада', en: 'Peasant community' }, baseCost: 120000, baseProd: 4000 },
  { id: 'cathedral_church', icon: '⛪', name: { ua: 'Кафедральний собор', en: 'Cathedral' }, desc: { ua: 'Релігійний центр', en: 'Religious center' }, baseCost: 600000, baseProd: 16000 },
  { id: 'feudal_castle', icon: '🏰', name: { ua: 'Феодальний замок', en: 'Feudal Castle' }, desc: { ua: 'Замок феодала', en: "Feudal's castle" }, baseCost: 3000000, baseProd: 80000 },
  { id: 'crusader_order', icon: '⚜️', name: { ua: 'Орден хрестоносців', en: 'Crusader Order' }, desc: { ua: 'Лицарський орден', en: 'Knight order' }, baseCost: 15000000, baseProd: 400000 },
  { id: 'royal_palace_medieval', icon: '👑', name: { ua: 'Королівський палац', en: 'Royal Palace' }, desc: { ua: 'Резиденція короля', en: "King's residence" }, baseCost: 75000000, baseProd: 2000000 },
]);

const renaissanceGenerators = createGenerators([
  { id: 'art_studio', icon: '🎨', name: { ua: 'Художня майстерня', en: 'Art Studio' }, desc: { ua: 'Творчість митців', en: 'Artists creativity' }, baseCost: 150000, baseProd: 5000 },
  { id: 'printing_press', icon: '📖', name: { ua: 'Друкарський верстат', en: 'Printing Press' }, desc: { ua: 'Книгодрукування', en: 'Book printing' }, baseCost: 750000, baseProd: 20000 },
  { id: 'renaissance_academy', icon: '🎓', name: { ua: 'Академія мистецтв', en: 'Renaissance Academy' }, desc: { ua: 'Освітній центр', en: 'Educational center' }, baseCost: 3750000, baseProd: 100000 },
  { id: 'scientific_lab', icon: '🔬', name: { ua: 'Наукова лабораторія', en: 'Scientific Lab' }, desc: { ua: 'Дослідження', en: 'Research' }, baseCost: 18750000, baseProd: 500000 },
  { id: 'monument_masterpiece', icon: '🗿', name: { ua: 'Архітектурний шедевр', en: 'Architectural Masterpiece' }, desc: { ua: 'Вічний пам\'ятник', en: 'Eternal monument' }, baseCost: 93750000, baseProd: 2500000 },
]);

const enlightenmentGenerators = createGenerators([
  { id: 'philosophy_salon', icon: '📚', name: { ua: 'Філософський салон', en: 'Philosophy Salon' }, desc: { ua: 'Ідеї Просвітництва', en: 'Enlightenment ideas' }, baseCost: 180000, baseProd: 6000 },
  { id: 'royal_academy', icon: '🏛️', name: { ua: 'Королівська академія', en: 'Royal Academy' }, desc: { ua: 'Наука та мистецтва', en: 'Science and art' }, baseCost: 900000, baseProd: 24000 },
  { id: 'imperial_palace_europe', icon: '🏰', name: { ua: 'Імператорський палац', en: 'Imperial Palace Europe' }, desc: { ua: 'Монархія', en: 'Monarchy' }, baseCost: 4500000, baseProd: 120000 },
  { id: 'industrial_revolution', icon: '🏭', name: { ua: 'Промислова революція', en: 'Industrial Revolution' }, desc: { ua: 'Фабрики та заводи', en: 'Factories' }, baseCost: 22500000, baseProd: 600000 },
  { id: 'world_empire', icon: '🌍', name: { ua: 'Світова імперія', en: 'World Empire' }, desc: { ua: 'Кolonії по всьому світу', en: 'World colonies' }, baseCost: 112500000, baseProd: 3000000 },
]);

const victorianGenerators = createGenerators([
  { id: 'london_industry', icon: '🏭', name: { ua: 'Лондонська промисловість', en: 'London Industry' }, desc: { ua: 'Центр промисловості', en: 'Industrial center' }, baseCost: 240000, baseProd: 8000 },
  { id: 'colonial_trade', icon: '⚓', name: { ua: 'Колоніальна торгівля', en: 'Colonial Trade' }, desc: { ua: 'Глобальна торгівля', en: 'Global trade' }, baseCost: 1200000, baseProd: 32000 },
  { id: 'railway_empire', icon: '🚂', name: { ua: 'Залізнична імперія', en: 'Railway Empire' }, desc: { ua: 'Трансконтинентальні залізниці', en: 'Transcontinental railways' }, baseCost: 6000000, baseProd: 160000 },
  { id: 'imperial_parliament', icon: '🏛️', name: { ua: 'Імперський парламент', en: 'Imperial Parliament' }, desc: { ua: 'Політична влада', en: 'Political power' }, baseCost: 30000000, baseProd: 800000 },
  { id: 'british_empire_network', icon: '🌐', name: { ua: 'Британська імперія', en: 'British Empire' }, desc: { ua: 'Найбільша імперія', en: 'Largest empire' }, baseCost: 150000000, baseProd: 4000000 },
]);

const modernGenerators = createGenerators([
  { id: 'tech_startup', icon: '💻', name: { ua: 'Техно-стартап', en: 'Tech Startup' }, desc: { ua: 'Інновації Кремнієвої долини', en: 'Silicon Valley innovations' }, baseCost: 300000, baseProd: 10000 },
  { id: 'global_corporation', icon: '🌍', name: { ua: 'Глобальна корпорація', en: 'Global Corporation' }, desc: { ua: 'Міжнародний бізнес', en: 'International business' }, baseCost: 1500000, baseProd: 40000 },
  { id: 'research_university', icon: '🔬', name: { ua: 'Дослідницький університет', en: 'Research University' }, desc: { ua: 'Наука та освіта', en: 'Science and education' }, baseCost: 7500000, baseProd: 200000 },
  { id: 'space_agency', icon: '🚀', name: { ua: 'Космічна агенція', en: 'Space Agency' }, desc: { ua: 'Дослідження космосу', en: 'Space exploration' }, baseCost: 37500000, baseProd: 1000000 },
  { id: 'digital_world', icon: '🌐', name: { ua: 'Цифровий світ', en: 'Digital World' }, desc: { ua: 'Глобальна мережа', en: 'Global network' }, baseCost: 187500000, baseProd: 5000000 },
]);

// ═══════════════════════════════════════════════════════════════════════════
// EPOCHS ARRAY
// ═══════════════════════════════════════════════════════════════════════════

export const EPOCHS: Epoch[] = [
  { id: 'trypillia', name: { ua: 'Трипільська культура', en: 'Trypillian Culture' }, description: { ua: 'Перша цивілізація на території України', en: 'First civilization on Ukrainian territory' }, period: { ua: '5000-2750 до н.е.', en: '5000-2750 BC' }, levelRange: { min: 1, max: 50 }, unlockLevel: 1, currency: 'глини', currencyIcon: '🏺', generators: trypilliaGenerators, color: '#CD853F', bgGradient: 'from-amber-700 to-orange-800', requiredRebirth: 0 },
  { id: 'scythia', name: { ua: 'Скіфія', en: 'Scythia' }, description: { ua: 'Велика Скіфська імперія', en: 'Great Scythian Empire' }, period: { ua: 'VII-III ст. до н.е.', en: '7th-3rd c. BC' }, levelRange: { min: 51, max: 100 }, unlockLevel: 51, currency: 'золота', currencyIcon: '🪙', generators: scythiaGenerators, color: '#FFD700', bgGradient: 'from-yellow-600 to-amber-700', requiredRebirth: 0 },
  { id: 'antiquity', name: { ua: 'Античність', en: 'Antiquity' }, description: { ua: 'Грецькі колонії в Україні', en: 'Greek colonies in Ukraine' }, period: { ua: 'VII ст. до н.е. - V ст. н.е.', en: '7th c. BC - 5th c. AD' }, levelRange: { min: 101, max: 150 }, unlockLevel: 101, currency: 'монети', currencyIcon: '💰', generators: antiquityGenerators, color: '#4169E1', bgGradient: 'from-blue-600 to-indigo-700', requiredRebirth: 0 },
  { id: 'kyiv_rus', name: { ua: 'Київська Русь', en: 'Kyivan Rus' }, description: { ua: 'Перша слов\'янська держава', en: 'First Slavic state' }, period: { ua: 'IX-XIII ст.', en: '9th-13th c.' }, levelRange: { min: 151, max: 250 }, unlockLevel: 151, currency: 'гривні', currencyIcon: '☦️', generators: kyivRusGenerators, color: '#8B4513', bgGradient: 'from-orange-700 to-red-800', requiredRebirth: 0 },
  { id: 'halych_volhynia', name: { ua: 'Галицько-Волинська', en: 'Halych-Volhynia' }, description: { ua: 'Спадкоємець Київської Русі', en: 'Successor of Kyivan Rus' }, period: { ua: '1199-1349', en: '1199-1349' }, levelRange: { min: 251, max: 320 }, unlockLevel: 251, currency: 'талярів', currencyIcon: '🪙', generators: halychVolhyniaGenerators, color: '#800020', bgGradient: 'from-red-800 to-pink-900', requiredRebirth: 0 },
  { id: 'polish_lithuanian', name: { ua: 'Річ Посполита', en: 'Polish-Lithuanian' }, description: { ua: 'Запорозька Січ та шляхетська культура', en: 'Zaporizhian Sich and noble culture' }, period: { ua: 'XIV-XVII ст.', en: '14th-17th c.' }, levelRange: { min: 321, max: 420 }, unlockLevel: 321, currency: 'злотих', currencyIcon: '⚔️', generators: polishLithuanianGenerators, color: '#4B0082', bgGradient: 'from-purple-700 to-indigo-800', requiredRebirth: 0 },
  { id: 'cossack', name: { ua: 'Козацька доба', en: 'Cossack Era' }, description: { ua: 'Хмельниччина та козацька держава', en: 'Khmelnytsky Uprising and Cossack state' }, period: { ua: '1648-1764', en: '1648-1764' }, levelRange: { min: 421, max: 550 }, unlockLevel: 421, currency: 'козацьких', currencyIcon: '⚔️', generators: cossackGenerators, color: '#228B22', bgGradient: 'from-green-700 to-emerald-800', requiredRebirth: 0 },
  { id: 'hetmanate', name: { ua: 'Гетьманат', en: 'Hetmanate' }, description: { ua: 'Українська державність у складі імперій', en: 'Ukrainian statehood within empires' }, period: { ua: '1764-1917', en: '1764-1917' }, levelRange: { min: 551, max: 650 }, unlockLevel: 551, currency: 'рублів', currencyIcon: '₽', generators: hetmanateGenerators, color: '#2F4F4F', bgGradient: 'from-gray-600 to-slate-700', requiredRebirth: 0 },
  { id: 'empire', name: { ua: 'Імперські часи', en: 'Imperial Era' }, description: { ua: 'Російська імперія в Україні', en: 'Russian Empire in Ukraine' }, period: { ua: 'XIX - поч. ХХ ст.', en: '19th - early 20th c.' }, levelRange: { min: 651, max: 780 }, unlockLevel: 651, currency: 'рублів', currencyIcon: '₽', generators: empireGenerators, color: '#696969', bgGradient: 'from-gray-500 to-gray-700', requiredRebirth: 0 },
  { id: 'revolution', name: { ua: 'Революція та УНР', en: 'Revolution and UNR' }, description: { ua: 'Боротьба за незалежність', en: 'Struggle for independence' }, period: { ua: '1917-1921', en: '1917-1921' }, levelRange: { min: 781, max: 850 }, unlockLevel: 781, currency: 'карбованців', currencyIcon: '🇺🇦', generators: revolutionGenerators, color: '#FFD700', bgGradient: 'from-yellow-500 to-amber-600', requiredRebirth: 0 },
  { id: 'soviet', name: { ua: 'Радянська доба', en: 'Soviet Era' }, description: { ua: 'УРСР - частина Радянського Союзу', en: 'Ukrainian SSR - part of Soviet Union' }, period: { ua: '1922-1991', en: '1922-1991' }, levelRange: { min: 851, max: 950 }, unlockLevel: 851, currency: 'карбованців', currencyIcon: '⭐', generators: sovietGenerators, color: '#B22222', bgGradient: 'from-red-700 to-red-900', requiredRebirth: 0 },
  { id: 'independence', name: { ua: 'Незалежна Україна', en: 'Independent Ukraine' }, description: { ua: 'Сучасна Україна - незалежна держава', en: 'Modern Ukraine - independent state' }, period: { ua: '1991 - теперішність', en: '1991 - present' }, levelRange: { min: 951, max: 999 }, unlockLevel: 951, currency: 'гривень', currencyIcon: '🇺🇦', generators: independenceGenerators, color: '#005BBB', bgGradient: 'from-blue-600 to-blue-800', requiredRebirth: 0 },
  { id: 'egypt', name: { ua: 'Стародавній Єгипет', en: 'Ancient Egypt' }, description: { ua: 'Цивілізація біля Нілу', en: 'Civilization by the Nile' }, period: { ua: '3100-30 до н.е.', en: '3100-30 BC' }, levelRange: { min: 1000, max: 1050 }, unlockLevel: 1000, currency: 'єгипетських', currencyIcon: '🏛️', generators: egyptGenerators, color: '#DAA520', bgGradient: 'from-yellow-600 to-orange-700', requiredRebirth: 1 },
  { id: 'greece', name: { ua: 'Стародавня Греція', en: 'Ancient Greece' }, description: { ua: 'Колиска демократії та філософії', en: 'Cradle of democracy and philosophy' }, period: { ua: '800-31 до н.е.', en: '800-31 BC' }, levelRange: { min: 1051, max: 1100 }, unlockLevel: 1051, currency: 'давньогрецьких', currencyIcon: '🏛️', generators: greeceGenerators, color: '#4169E1', bgGradient: 'from-blue-500 to-cyan-600', requiredRebirth: 1 },
  { id: 'rome', name: { ua: 'Римська імперія', en: 'Roman Empire' }, description: { ua: 'Найвеличніша імперія античності', en: 'Greatest empire of antiquity' }, period: { ua: '27 до н.е. - 476 н.е.', en: '27 BC - 476 AD' }, levelRange: { min: 1101, max: 1150 }, unlockLevel: 1101, currency: 'римських', currencyIcon: '🏛️', generators: romeGenerators, color: '#8B0000', bgGradient: 'from-red-700 to-red-900', requiredRebirth: 2 },
  { id: 'medieval', name: { ua: 'Середньовічна Європа', en: 'Medieval Europe' }, description: { ua: 'Епоха замків та лицарів', en: 'Era of castles and knights' }, period: { ua: '476-1453', en: '476-1453' }, levelRange: { min: 1151, max: 1200 }, unlockLevel: 1151, currency: 'середньовічних', currencyIcon: '🏰', generators: medievalGenerators, color: '#4B0082', bgGradient: 'from-purple-600 to-violet-800', requiredRebirth: 2 },
  { id: 'renaissance', name: { ua: 'Відродження', en: 'Renaissance' }, description: { ua: 'Культурний розквіт Європи', en: 'Cultural flourishing of Europe' }, period: { ua: '1400-1700', en: '1400-1700' }, levelRange: { min: 1201, max: 1250 }, unlockLevel: 1201, currency: 'відродженських', currencyIcon: '🎨', generators: renaissanceGenerators, color: '#FF69B4', bgGradient: 'from-pink-500 to-rose-600', requiredRebirth: 3 },
  { id: 'enlightenment', name: { ua: 'Епоха Просвітництва', en: 'Age of Enlightenment' }, description: { ua: 'Наука та ідеї змінюють світ', en: 'Science and ideas change the world' }, period: { ua: '1700-1815', en: '1700-1815' }, levelRange: { min: 1251, max: 1300 }, unlockLevel: 1251, currency: 'просвітницьких', currencyIcon: '📚', generators: enlightenmentGenerators, color: '#20B2AA', bgGradient: 'from-teal-500 to-cyan-600', requiredRebirth: 3 },
  { id: 'victorian', name: { ua: 'Вікторіанська епоха', en: 'Victorian Era' }, description: { ua: 'Британська імперія та промислова революція', en: 'British Empire and industrial revolution' }, period: { ua: '1815-1914', en: '1815-1914' }, levelRange: { min: 1301, max: 1350 }, unlockLevel: 1301, currency: 'фунтів', currencyIcon: '👑', generators: victorianGenerators, color: '#800080', bgGradient: 'from-violet-600 to-purple-800', requiredRebirth: 4 },
  { id: 'modern_world', name: { ua: 'Сучасний світ', en: 'Modern World' }, description: { ua: 'Цифрова ера та глобалізація', en: 'Digital age and globalization' }, period: { ua: '1914-2025+', en: '1914-2025+' }, levelRange: { min: 1351, max: 1500 }, unlockLevel: 1351, currency: 'доларів', currencyIcon: '🌐', generators: modernGenerators, color: '#00CED1', bgGradient: 'from-cyan-500 to-blue-600', requiredRebirth: 5 },
];

// ═══════════════════════════════════════════════════════════════════════════
// SIT STUDIO EASTER EGG SYSTEM
// Word: "Sit Studio" - 10 letters + space = 11 elements
// Only 1 in 100 active players will ever complete it!
// ═══════════════════════════════════════════════════════════════════════════

export const SIT_STUDIO_WORD = "Sit Studio";
export const SIT_STUDIO_LETTERS = ['S', 'I', 'T', ' ', 'S', 'T', 'U', 'D', 'I', 'O'];
export const SIT_STUDIO_DROP_CHANCE = 0.001; // 0.1% chance per chest = ~1 in 1000 active players

export interface SitStudioLetterState {
  letter: string;
  collected: boolean;
  collectedAt?: number;
}

export function initSitStudioState(): SitStudioLetterState[] {
  return SIT_STUDIO_LETTERS.map(letter => ({
    letter,
    collected: false,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// ARTIFACTS
// ═══════════════════════════════════════════════════════════════════════════

export const ARTIFACTS: Artifact[] = [
  // Ukrainian Artifacts (Epochs 1-12)
  { id: 'trypillia_vase', name: { ua: 'Трипільський посуд', en: 'Trypillian Vessel' }, epoch: 'trypillia', rarity: 'common', parts: 10, bonus: { type: 'passive_boost', value: 1.05 }, icon: '🏺' },
  { id: 'trypillia_idol', name: { ua: 'Богиня-Мати', en: 'Mother Goddess' }, epoch: 'trypillia', rarity: 'rare', parts: 10, bonus: { type: 'xp_multiplier', value: 1.10 }, icon: '🕉️' },
  { id: 'scythian_gold', name: { ua: 'Скіфське золото', en: 'Scythian Gold' }, epoch: 'scythia', rarity: 'common', parts: 10, bonus: { type: 'currency_multiplier', value: 1.05 }, icon: '💰' },
  { id: 'scythian_sword', name: { ua: 'Скіфський меч', en: 'Scythian Sword' }, epoch: 'scythia', rarity: 'rare', parts: 10, bonus: { type: 'xp_multiplier', value: 1.10 }, icon: '⚔️' },
  { id: 'scythian_amulet', name: { ua: 'Золотий олень', en: 'Golden Stag' }, epoch: 'scythia', rarity: 'legendary', parts: 10, bonus: { type: 'passive_boost', value: 1.15 }, icon: '🦌' },
  { id: 'greek_coin', name: { ua: 'Грецька монета', en: 'Greek Coin' }, epoch: 'antiquity', rarity: 'common', parts: 10, bonus: { type: 'currency_multiplier', value: 1.05 }, icon: '🪙' },
  { id: 'greek_amphora', name: { ua: 'Глек для вина', en: 'Wine Amphora' }, epoch: 'antiquity', rarity: 'rare', parts: 10, bonus: { type: 'passive_boost', value: 1.08 }, icon: '🏺' },
  { id: 'chersonesus_coin', name: { ua: 'Херсонеська монета', en: 'Chersonesus Coin' }, epoch: 'antiquity', rarity: 'epic', parts: 10, bonus: { type: 'xp_multiplier', value: 1.12 }, icon: '🪙' },
  { id: 'rus_currency', name: { ua: 'Київська гривня', en: 'Kyivan Hryvnia' }, epoch: 'kyiv_rus', rarity: 'common', parts: 10, bonus: { type: 'currency_multiplier', value: 1.05 }, icon: '₴' },
  { id: 'sophia_icon', name: { ua: 'Ікона Софії', en: 'Sophia Icon' }, epoch: 'kyiv_rus', rarity: 'rare', parts: 10, bonus: { type: 'xp_multiplier', value: 1.10 }, icon: '☦️' },
  { id: 'yaroslav_book', name: { ua: 'Закон Ярослава', en: "Yaroslav's Law" }, epoch: 'kyiv_rus', rarity: 'legendary', parts: 10, bonus: { type: 'passive_boost', value: 1.15 }, icon: '📜' },
  { id: 'galician_salt', name: { ua: 'Галицька сель', en: 'Galician Salt' }, epoch: 'halych_volhynia', rarity: 'common', parts: 10, bonus: { type: 'passive_boost', value: 1.05 }, icon: '🧂' },
  { id: 'danylo_charter', name: { ua: 'Грамота Данила', en: 'Danylo Charter' }, epoch: 'halych_volhynia', rarity: 'rare', parts: 10, bonus: { type: 'currency_multiplier', value: 1.10 }, icon: '📜' },
  { id: 'sich_medal', name: { ua: 'Медаль Січі', en: 'Sich Medal' }, epoch: 'polish_lithuanian', rarity: 'common', parts: 10, bonus: { type: 'passive_boost', value: 1.05 }, icon: '🏅' },
  { id: 'cossack_banner', name: { ua: 'Козацький прапор', en: 'Cossack Banner' }, epoch: 'cossack', rarity: 'rare', parts: 10, bonus: { type: 'xp_multiplier', value: 1.12 }, icon: '🚩' },
  { id: 'cossack_mace', name: { ua: 'Булава Богдана', en: "Bohdan's Mace" }, epoch: 'cossack', rarity: 'legendary', parts: 10, bonus: { type: 'xp_multiplier', value: 1.20 }, icon: '🏏' },
  { id: 'hetman_seal', name: { ua: 'Печать гетьмана', en: "Hetman's Seal" }, epoch: 'hetmanate', rarity: 'rare', parts: 10, bonus: { type: 'currency_multiplier', value: 1.12 }, icon: '🔏' },
  { id: 'empire_medal', name: { ua: 'Імперська медаль', en: 'Imperial Medal' }, epoch: 'empire', rarity: 'common', parts: 10, bonus: { type: 'passive_boost', value: 1.06 }, icon: '🏅' },
  { id: 'empire_factory', name: { ua: 'Заводський знак', en: 'Factory Badge' }, epoch: 'empire', rarity: 'rare', parts: 10, bonus: { type: 'passive_boost', value: 1.12 }, icon: '🏭' },
  { id: 'revolution_poster', name: { ua: 'Агітаційний плакат', en: 'Propaganda Poster' }, epoch: 'revolution', rarity: 'common', parts: 10, bonus: { type: 'xp_multiplier', value: 1.08 }, icon: '📰' },
  { id: 'revolution_flag', name: { ua: 'Прапор УНР', en: 'UNR Flag' }, epoch: 'revolution', rarity: 'legendary', parts: 10, bonus: { type: 'xp_multiplier', value: 1.20 }, icon: '🇺🇦' },
  { id: 'soviet_badge', name: { ua: 'Радянський значок', en: 'Soviet Badge' }, epoch: 'soviet', rarity: 'common', parts: 10, bonus: { type: 'passive_boost', value: 1.06 }, icon: '⭐' },
  { id: 'soviet_rocket', name: { ua: 'Модель ракети', en: 'Rocket Model' }, epoch: 'soviet', rarity: 'epic', parts: 10, bonus: { type: 'passive_boost', value: 1.15 }, icon: '🚀' },
  { id: 'ind_flag', name: { ua: 'Національний прапор', en: 'National Flag' }, epoch: 'independence', rarity: 'common', parts: 10, bonus: { type: 'xp_multiplier', value: 1.08 }, icon: '🇺🇦' },
  { id: 'ind_constitution', name: { ua: 'Конституція', en: 'Constitution' }, epoch: 'independence', rarity: 'legendary', parts: 10, bonus: { type: 'passive_boost', value: 1.20 }, icon: '📜' },
  
  // SIT STUDIO EASTER EGG - Each letter is a special artifact!
  { id: 'sit_s', name: { ua: 'Таємнича літера "S"', en: 'Mysterious Letter "S"' }, epoch: 'independence', rarity: 'secret', parts: 1, bonus: { type: 'xp_multiplier', value: 1.01 }, icon: '🔮', requiredPrestige: 0 },
  { id: 'sit_i', name: { ua: 'Таємнича літера "I"', en: 'Mysterious Letter "I"' }, epoch: 'independence', rarity: 'secret', parts: 1, bonus: { type: 'xp_multiplier', value: 1.01 }, icon: '🔮', requiredPrestige: 0 },
  { id: 'sit_t', name: { ua: 'Таємнича літера "T"', en: 'Mysterious Letter "T"' }, epoch: 'independence', rarity: 'secret', parts: 1, bonus: { type: 'xp_multiplier', value: 1.01 }, icon: '🔮', requiredPrestige: 0 },
  { id: 'sit_space', name: { ua: 'Таємничий пробіл " "', en: 'Mysterious Space " "' }, epoch: 'independence', rarity: 'secret', parts: 1, bonus: { type: 'xp_multiplier', value: 1.01 }, icon: '✨', requiredPrestige: 0 },
  { id: 'sit_u', name: { ua: 'Таємнича літера "U"', en: 'Mysterious Letter "U"' }, epoch: 'independence', rarity: 'secret', parts: 1, bonus: { type: 'xp_multiplier', value: 1.01 }, icon: '🔮', requiredPrestige: 0 },
  { id: 'sit_d', name: { ua: 'Таємнича літера "D"', en: 'Mysterious Letter "D"' }, epoch: 'independence', rarity: 'secret', parts: 1, bonus: { type: 'xp_multiplier', value: 1.01 }, icon: '🔮', requiredPrestige: 0 },
  { id: 'sit_o', name: { ua: 'Таємнича літера "O"', en: 'Mysterious Letter "O"' }, epoch: 'independence', rarity: 'secret', parts: 1, bonus: { type: 'xp_multiplier', value: 1.01 }, icon: '🔮', requiredPrestige: 0 },
  
  // World History Secret Artifacts
  { id: 'secret_pyramid', name: { ua: 'Таємниця піраміди', en: 'Pyramid Secret' }, epoch: 'egypt', rarity: 'secret', parts: 15, bonus: { type: 'xp_multiplier', value: 1.15 }, icon: '🔺', requiredPrestige: 1 },
  { id: 'secret_parthenon', name: { ua: 'Таємниця Парфенону', en: 'Parthenon Secret' }, epoch: 'greece', rarity: 'secret', parts: 15, bonus: { type: 'currency_multiplier', value: 1.16 }, icon: '🏛️', requiredPrestige: 1 },
  { id: 'secret_colosseum', name: { ua: 'Таємниця Колізею', en: 'Colosseum Secret' }, epoch: 'rome', rarity: 'secret', parts: 15, bonus: { type: 'passive_boost', value: 1.17 }, icon: '🏟️', requiredPrestige: 2 },
  { id: 'secret_crusade', name: { ua: 'Таємниця хрестоносців', en: 'Crusade Secret' }, epoch: 'medieval', rarity: 'secret', parts: 15, bonus: { type: 'xp_multiplier', value: 1.18 }, icon: '⚔️', requiredPrestige: 2 },
  { id: 'secret_mona', name: { ua: 'Таємниця Мони Лізи', en: 'Mona Lisa Secret' }, epoch: 'renaissance', rarity: 'secret', parts: 15, bonus: { type: 'currency_multiplier', value: 1.18 }, icon: '🎨', requiredPrestige: 3 },
  { id: 'secret_enlightenment', name: { ua: 'Таємниця просвітників', en: 'Enlightenment Secret' }, epoch: 'enlightenment', rarity: 'secret', parts: 15, bonus: { type: 'passive_boost', value: 1.19 }, icon: '💡', requiredPrestige: 3 },
  { id: 'secret_industrial', name: { ua: 'Таємниця індустрії', en: 'Industrial Secret' }, epoch: 'victorian', rarity: 'secret', parts: 15, bonus: { type: 'xp_multiplier', value: 1.19 }, icon: '⚙️', requiredPrestige: 4 },
  { id: 'secret_digital', name: { ua: 'Таємниця цифрової ери', en: 'Digital Age Secret' }, epoch: 'modern_world', rarity: 'secret', parts: 15, bonus: { type: 'currency_multiplier', value: 1.20 }, icon: '🌐', requiredPrestige: 5 },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getEpochById(id: EpochId): Epoch {
  return EPOCHS.find(e => e.id === id) || EPOCHS[0];
}

export function getCurrentEpochByLevel(level: number): Epoch {
  for (let i = EPOCHS.length - 1; i >= 0; i--) {
    if (level >= EPOCHS[i].levelRange.min) {
      return EPOCHS[i];
    }
  }
  return EPOCHS[0];
}

export function getEpochByIndex(index: number): Epoch {
  return EPOCHS[Math.min(index, EPOCHS.length - 1)];
}

export function getGeneratorCost(generator: Generator, currentLevel: number): number {
  return Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, currentLevel));
}

export function getGeneratorProduction(generator: Generator, currentLevel: number): number {
  return generator.baseProduction * currentLevel;
}

export function getArtifactsForEpoch(epochId: EpochId, prestigeLevel: number = 0): Artifact[] {
  return ARTIFACTS.filter(a => {
    if (a.epoch !== epochId) return false;
    if (a.requiredPrestige && a.requiredPrestige > prestigeLevel) return false;
    return true;
  });
}

export function getUnlockedEpochsForRebirth(rebirthLevel: number): EpochId[] {
  return EPOCHS
    .filter(e => e.requiredRebirth <= rebirthLevel)
    .map(e => e.id);
}

export function getNextUnlockableEpoch(rebirthLevel: number): Epoch | null {
  const nextEpoch = EPOCHS.find(e => e.requiredRebirth === rebirthLevel + 1);
  return nextEpoch || null;
}

// Check if a letter drop is for Sit Studio Easter Egg
export function isSitStudioLetter(artifactId: string): boolean {
  return artifactId.startsWith('sit_');
}

// Get letter index for Sit Studio (returns -1 if not a letter)
export function getSitStudioLetterIndex(artifactId: string): number {
  const letterMap: Record<string, number> = {
    'sit_s': 0, 'sit_i': 1, 'sit_t': 2, 'sit_space': 3,
    'sit_s2': 4, 'sit_t2': 5, 'sit_u': 6, 'sit_d': 7, 'sit_i2': 8, 'sit_o': 9,
  };
  return letterMap[artifactId] ?? -1;
}
