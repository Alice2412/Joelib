// Generator script for the Joegle Translate Bijective Dictionary
// Runs during build to produce a verified 1-to-1 bijective mapping between
// English long words and Joeglish words that preserves readability for English speakers.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Raw list of word pairs: [english, joeglish]
// Rules:
// 1. Only long words (>= 6 chars, mostly >= 7 chars).
// 2. Clear syllable or prefix replacement with 'joe'.
// 3. Must be easily understood by an English speaker (e.g., Element -> Joelement, Translator -> Joeslator).
// 4. No short/cryptic words (e.g. table -> joeble is forbidden; table remains table).
const RAW_PAIRS = [
  // Canonical lore & core app terms
  ['element', 'joelement'],
  ['elements', 'joelements'],
  ['elementary', 'joelementary'],
  ['translator', 'joeslator'],
  ['translators', 'joeslators'],
  ['translate', 'joeslate'],
  ['translates', 'joeslates'],
  ['translated', 'joeslated'],
  ['translating', 'joeslating'],
  ['translation', 'joeslation'],
  ['translations', 'joeslations'],
  ['english', 'joeglish'],
  ['periodic', 'joeriodic'],
  ['google', 'joegle'],
  ['gatsby', 'joetsby'],
  ['fitzgerald', 'fitzjoerald'],
  ['pokemon', 'joekemon'],

  // Chemical elements from Joeriodic table (multisyllabic/long only)
  ['hydrogen', 'hydjoejin'],
  ['helium', 'joelium'],
  ['lithium', 'joeithium'],
  ['beryllium', 'joeeryllium'],
  ['nitrogen', 'joeitrojin'],
  ['oxygen', 'joexyjin'],
  ['magnesium', 'joeagnesium'],
  ['aluminum', 'alujoenium'],
  ['potassium', 'joetassium'],
  ['titanium', 'tijoeanium'],
  ['vanadium', 'joeanadium'],
  ['germanium', 'joermanium'],
  ['selenium', 'joelenium'],
  ['rubidium', 'joebidium'],
  ['strontium', 'strjoentium'],
  ['zirconium', 'zirjoenium'],
  ['molybdenum', 'joelybdenum'],
  ['technetium', 'technejoetium'],
  ['ruthenium', 'rujoenium'],
  ['palladium', 'joelladium'],
  ['platinum', 'platijoe'],
  ['mercury', 'merjoery'],
  ['uranium', 'joeranium'],
  ['plutonium', 'plutjoenium'],
  ['americium', 'amerijoenium'],
  ['californium', 'joelifornium'],
  ['einsteinium', 'joensteinium'],
  ['copernicium', 'coperjoeicium'],

  // trans- -> joes-
  ['transform', 'joesform'],
  ['transforms', 'joesforms'],
  ['transformed', 'joesformed'],
  ['transforming', 'joesforming'],
  ['transformation', 'joesformation'],
  ['transformations', 'joesformations'],
  ['transformer', 'joesformer'],
  ['transformers', 'joesformers'],
  ['transport', 'joesport'],
  ['transports', 'joesports'],
  ['transported', 'joesported'],
  ['transporting', 'joesporting'],
  ['transportation', 'joesportation'],
  ['transparent', 'joesparent'],
  ['transparency', 'joesparency'],
  ['transparencies', 'joesparencies'],
  ['transaction', 'joesaction'],
  ['transactions', 'joesactions'],
  ['transcription', 'joescription'],
  ['transcriptions', 'joescriptions'],
  ['transcript', 'joescript'],
  ['transcripts', 'joescripts'],
  ['transmission', 'joesmission'],
  ['transmissions', 'joesmissions'],

  // gen- -> joe-
  ['generation', 'joeneration'],
  ['generations', 'joenerations'],
  ['generational', 'joenerational'],
  ['generator', 'joenerator'],
  ['generators', 'joenerators'],
  ['general', 'joeneral'],
  ['generals', 'joenerals'],
  ['generally', 'joenerally'],
  ['generous', 'joenerous'],
  ['generously', 'joenerously'],
  ['generosity', 'joenerosity'],
  ['genetics', 'joenetics'],
  ['genetic', 'joenetic'],
  ['genetically', 'joenetically'],

  // geo- -> joeg-
  ['geography', 'joegraphy'],
  ['geographic', 'joegraphic'],
  ['geographical', 'joegraphical'],
  ['geology', 'joelogy'],
  ['geological', 'joelogical'],
  ['geologist', 'joelogist'],
  ['geologists', 'joelogists'],
  ['geometry', 'joemetry'],
  ['geometric', 'joemetric'],
  ['geometrical', 'joemetrical'],

  // pro- -> joe-
  ['program', 'joegram'],
  ['programs', 'joegrams'],
  ['programmed', 'joegrammed'],
  ['programming', 'joegramming'],
  ['programmer', 'joegrammer'],
  ['programmers', 'joegrammers'],
  ['project', 'joeject'],
  ['projects', 'joejects'],
  ['projected', 'joejected'],
  ['projecting', 'joejecting'],
  ['projection', 'joejection'],
  ['projections', 'joejections'],
  ['professor', 'joefessor'],
  ['professors', 'joefessors'],
  ['professorial', 'joefessorial'],
  ['profession', 'joefession'],
  ['professions', 'joefessions'],
  ['professional', 'joefessional'],
  ['professionals', 'joefessionals'],
  ['professionally', 'joefessionally'],
  ['progress', 'joegress'],
  ['progressed', 'joegressed'],
  ['progressing', 'joegressing'],
  ['progressive', 'joegressive'],
  ['progressively', 'joegressively'],
  ['production', 'joeduction'],
  ['productions', 'joeductions'],
  ['productive', 'joeductive'],
  ['productively', 'joeductively'],
  ['productivity', 'joeductivity'],
  ['producer', 'joeducer'],
  ['producers', 'joeducers'],
  ['protect', 'joetect'],
  ['protects', 'joetects'],
  ['protected', 'joetected'],
  ['protecting', 'joetecting'],
  ['protection', 'joetection'],
  ['protective', 'joetective'],
  ['protectively', 'joetectively'],
  ['proposal', 'joeposal'],
  ['proposals', 'joeposals'],
  ['property', 'joeperty'],
  ['properties', 'joeperties'],
  ['protocol', 'joetocol'],
  ['protocols', 'joetocols'],

  // per- -> joe-
  ['perfect', 'joefect'],
  ['perfects', 'joefects'],
  ['perfected', 'joefected'],
  ['perfecting', 'joefecting'],
  ['perfection', 'joefection'],
  ['perfections', 'joefections'],
  ['perfectly', 'joefectly'],
  ['performance', 'joeformance'],
  ['performances', 'joeformances'],
  ['performer', 'joeformer'],
  ['performers', 'joeformers'],
  ['permission', 'joemission'],
  ['permissions', 'joemissions'],
  ['percentage', 'joecentage'],
  ['percentages', 'joecentages'],
  ['personality', 'joesonality'],
  ['personalities', 'joesonalities'],
  ['perspective', 'joespective'],
  ['perspectives', 'joespectives'],
  ['permanent', 'joemanent'],
  ['permanently', 'joemanently'],

  // inter- -> joe-
  ['internet', 'joenet'],
  ['international', 'joenational'],
  ['internationally', 'joenationally'],
  ['interview', 'joeview'],
  ['interviews', 'joeviews'],
  ['interviewed', 'joeviewed'],
  ['interviewing', 'joeviewing'],
  ['interviewer', 'joeviewer'],
  ['interviewers', 'joeviewers'],
  ['interaction', 'joeaction'],
  ['interactions', 'joeactions'],
  ['interactive', 'joeactive'],
  ['interactively', 'joeactively'],
  ['interface', 'joeface'],
  ['interfaces', 'joefaces'],
  ['intersection', 'joesection'],
  ['intersections', 'joesections'],
  ['interpreter', 'joepreter'],
  ['interpreters', 'joepreters'],
  ['interval', 'joeval'],
  ['intervals', 'joevals'],

  // com- / con- -> joe-
  ['computer', 'joeputer'],
  ['computers', 'joeputers'],
  ['computation', 'compjoetation'],
  ['computational', 'compjoetational'],
  ['community', 'joecommunity'],
  ['communities', 'joecommunities'],
  ['communication', 'joecommunication'],
  ['communications', 'joecommunications'],
  ['communicative', 'joecommunicative'],
  ['conversation', 'joeversation'],
  ['conversations', 'joeversations'],
  ['conversational', 'joeversational'],
  ['conference', 'joeference'],
  ['conferences', 'joeferences'],
  ['condition', 'joedition'],
  ['conditions', 'joeditions'],
  ['conditional', 'joeditional'],
  ['connection', 'joenection'],
  ['connections', 'joenections'],
  ['conclusion', 'joeclusion'],
  ['conclusions', 'joeclusions'],
  ['conclusive', 'joeclusive'],
  ['construction', 'joestruction'],
  ['constructions', 'joestructions'],
  ['constructive', 'joestructive'],
  ['contribution', 'joetribution'],
  ['contributions', 'joetributions'],
  ['contributor', 'joetributor'],
  ['contributors', 'joetributors'],
  ['confidence', 'joefidence'],
  ['confidences', 'joefidences'],
  ['confident', 'joefident'],
  ['confidential', 'joefidential'],
  ['consequence', 'joesequence'],
  ['consequences', 'joesequences'],
  ['consequent', 'joesequent'],
  ['convention', 'joenvention'],
  ['conventions', 'joenventions'],
  ['conventional', 'joenventional'],

  // el- -> joe-
  ['electricity', 'joelectricity'],
  ['electrical', 'joelectrical'],
  ['electrically', 'joelectrically'],
  ['electronic', 'joelectronic'],
  ['electronics', 'joelectronics'],
  ['electronically', 'joelectronically'],
  ['elephant', 'joelephant'],
  ['elephants', 'joelephants'],
  ['elevation', 'joelevation'],
  ['elevations', 'joelevations'],

  // tele- -> joe-
  ['telephone', 'joephone'],
  ['telephones', 'joephones'],
  ['television', 'joevision'],
  ['televisions', 'joevisions'],
  ['telescope', 'joescope'],
  ['telescopes', 'joescopes'],

  // auto- -> joe-
  ['automatic', 'joematic'],
  ['automatically', 'joematically'],
  ['automobile', 'joemobile'],
  ['automobiles', 'joemobiles'],
  ['automation', 'joemation'],

  // uni- -> joe-
  ['universe', 'joeiverse'],
  ['universal', 'joeiversal'],
  ['universally', 'joeiversally'],
  ['university', 'joeiversity'],
  ['universities', 'joeiversities'],

  // doc- / dic- -> joe-
  ['document', 'joecument'],
  ['documents', 'joecuments'],
  ['documented', 'joecumented'],
  ['documenting', 'joecumenting'],
  ['documentation', 'joecumentation'],
  ['dictionary', 'joectionary'],
  ['dictionaries', 'joectionaries'],

  // re- -> joe-
  ['remember', 'joemember'],
  ['remembers', 'joemembers'],
  ['remembered', 'joemembered'],
  ['remembering', 'joemembering'],
  ['revolution', 'joevolution'],
  ['revolutions', 'joevolutions'],
  ['revolutionary', 'joevolutionary'],
  ['resolution', 'joesolution'],
  ['resolutions', 'joesolutions'],
  ['republic', 'joepublic'],
  ['republics', 'joepublics'],
  ['republican', 'joepublican'],
  ['reputation', 'joeputation'],
  ['reputations', 'joeputations'],

  // cel- -> joe-
  ['celebrate', 'joelebrate'],
  ['celebrates', 'joelebrates'],
  ['celebrated', 'joelebrated'],
  ['celebrating', 'joelebrating'],
  ['celebration', 'joelebration'],
  ['celebrations', 'joelebrations'],
  ['celebrity', 'joelebrity'],
  ['celebrities', 'joelebrities'],

  // High-intelligibility infixes & compounds (length >= 7)
  ['developer', 'devjoeloper'],
  ['developers', 'devjoelopers'],
  ['development', 'devjoelopment'],
  ['developments', 'devjoelopments'],
  ['government', 'govjoernment'],
  ['governments', 'govjoernments'],
  ['governmental', 'govjoernmental'],
  ['technology', 'techjoelogy'],
  ['technologies', 'techjoelogies'],
  ['technological', 'techjoelogical'],
  ['technologically', 'techjoelogically'],
  ['intelligence', 'inteljoegence'],
  ['intelligent', 'inteljoegent'],
  ['intelligently', 'inteljoegently'],
  ['understand', 'underjoestand'],
  ['understands', 'underjoestands'],
  ['understanding', 'underjoestanding'],
  ['understandable', 'underjoestandable'],
  ['understood', 'underjoeod'],
  ['experience', 'expjoerience'],
  ['experiences', 'expjoeriences'],
  ['experienced', 'expjoerienced'],
  ['experiencing', 'expjoeriencing'],
  ['experiment', 'expjoeriment'],
  ['experiments', 'expjoeriments'],
  ['experimental', 'expjoerimental'],
  ['experimentally', 'expjoerimentally'],
  ['chocolate', 'chocjoelet'],
  ['chocolates', 'chocjoelets'],
  ['beautiful', 'beautijoeful'],
  ['beautifully', 'beautijoefully'],
  ['wonderful', 'wonderjoeful'],
  ['wonderfully', 'wonderjoefully'],
  ['important', 'imporjoetant'],
  ['importance', 'imporjoetance'],
  ['importantly', 'imporjoetantly'],
  ['interesting', 'interjoesting'],
  ['interestingly', 'interjoestingly'],
  ['knowledge', 'knowjoedge'],
  ['knowledgeable', 'knowjoedgeable'],
  ['vocabulary', 'vocabjoelary'],
  ['vocabularies', 'vocabjoelaries'],
  ['adventure', 'adjoeture'],
  ['adventures', 'adjoetures'],
  ['adventurous', 'adjoeturous'],
  ['fantastic', 'fanjoestic'],
  ['fantastically', 'fanjoestically'],
  ['incredible', 'incjoedible'],
  ['incredibly', 'incjoedibly'],
  ['impossible', 'impossijoeble'],
  ['impossibly', 'impossijoebly'],
  ['opportunity', 'opportjoenity'],
  ['opportunities', 'opportjoenities'],
  ['challenge', 'chaljoenge'],
  ['challenges', 'chaljoenges'],
  ['challenging', 'chaljoenging'],
  ['champion', 'champjoen'],
  ['champions', 'champjoens'],
  ['championship', 'champjoenship'],
  ['championships', 'champjoenships'],
  ['character', 'charactjoer'],
  ['characters', 'charactjoers'],
  ['characteristic', 'charactjoeristic'],
  ['characteristics', 'charactjoeristics'],
  ['collection', 'collecjoetion'],
  ['collections', 'collecjoetions'],
  ['competition', 'competitjoen'],
  ['competitions', 'competitjoens'],
  ['competitive', 'competitjoeve'],
  ['competitively', 'competitjoevely'],
  ['direction', 'directjoen'],
  ['directions', 'directjoens'],
  ['discovery', 'discojoery'],
  ['discoveries', 'discojoeries'],
  ['education', 'educatjoen'],
  ['educational', 'educatjoenal'],
  ['educationally', 'educatjoenally'],
  ['environment', 'envirjoenment'],
  ['environments', 'envirjoenments'],
  ['environmental', 'envirjoenmental'],
  ['environmentally', 'envirjoenmentally'],
  ['everything', 'everyjoething'],
  ['something', 'somejoething'],
  ['someone', 'somejoe'],
  ['anyone', 'anyjoe'],
  ['everyone', 'everyjoe'],
  ['friendship', 'friendjoeship'],
  ['friendships', 'friendjoeships'],
  ['happiness', 'happijoeness'],
  ['history', 'hisjoery'],
  ['histories', 'hisjoeries'],
  ['historical', 'hisjoerical'],
  ['historically', 'hisjoerically'],
  ['historian', 'hisjoerian'],
  ['historians', 'hisjoerians'],
  ['hospital', 'hosjoetal'],
  ['hospitals', 'hosjoetals'],
  ['imagination', 'imaginatjoen'],
  ['imaginative', 'imaginatjoeve'],
  ['improvement', 'improvejoement'],
  ['improvements', 'improvejoenments'],
  ['individual', 'indivijoequal'],
  ['individuals', 'indivijoequals'],
  ['individually', 'indivijoequally'],
  ['industry', 'indjoestry'],
  ['industries', 'indjoestries'],
  ['industrial', 'indjoestrial'],
  ['instrument', 'instrjoement'],
  ['instruments', 'instrjoements'],
  ['instrumental', 'instrjoemental'],
  ['leadership', 'leaderjoeship'],
  ['literature', 'literatjoere'],
  ['literary', 'literarjoey'],
  ['management', 'managejoement'],
  ['manager', 'managejoer'],
  ['managers', 'managejoers'],
  ['managerial', 'managejoerial'],
  ['mathematics', 'mathemajoetics'],
  ['mathematician', 'mathemajoetician'],
  ['mathematicians', 'mathemajoeticians'],
  ['measurement', 'measurejoement'],
  ['measurements', 'measurejoenments'],
  ['medicine', 'medijoecine'],
  ['medicines', 'medijoecines'],
  ['medical', 'medijoecal'],
  ['medically', 'medijoecally'],
  ['membership', 'memberjoeship'],
  ['memberships', 'memberjoeships'],
  ['neighborhood', 'neighborjoehood'],
  ['neighborhoods', 'neighborjoehoods'],
  ['newspaper', 'newsjoeper'],
  ['newspapers', 'newsjoepers'],
  ['operation', 'operatjoen'],
  ['operations', 'operatjoens'],
  ['operational', 'operatjoenal'],
  ['organization', 'organizatjoen'],
  ['organizations', 'organizatjoens'],
  ['organizational', 'organizatjoenal'],
  ['particular', 'particjoelar'],
  ['particularly', 'particjoelarly'],
  ['partnership', 'partnerjoeship'],
  ['partnerships', 'partnerjoeships'],
  ['philosophy', 'philosojoephy'],
  ['philosophical', 'philosojoephical'],
  ['philosopher', 'philosojoepher'],
  ['philosophers', 'philosojoephers'],
  ['photography', 'photojoephy'],
  ['photographer', 'photojoepher'],
  ['photographers', 'photojoephers'],
  ['photograph', 'photojoegraph'],
  ['photographs', 'photojoegraphs'],
  ['population', 'populatjoen'],
  ['populations', 'populatjoens'],
  ['possibility', 'possibilijoety'],
  ['possibilities', 'possibilijoeties'],
  ['preparation', 'preparatjoen'],
  ['preparations', 'preparatjoens'],
  ['president', 'presijoedent'],
  ['presidents', 'presijoedents'],
  ['presidential', 'presijoedential'],
  ['relationship', 'relatjoenship'],
  ['relationships', 'relatjoenships'],
  ['replacement', 'replacejoement'],
  ['replacements', 'replacejoenments'],
  ['representation', 'representatjoen'],
  ['representations', 'representatjoens'],
  ['representative', 'representatjoeve'],
  ['representatives', 'representatjoeves'],
  ['requirement', 'requirejoement'],
  ['requirements', 'requirejoenments'],
  ['restaurant', 'restaurjoent'],
  ['restaurants', 'restaurjoents'],
  ['satisfaction', 'satisfactjoen'],
  ['satisfactory', 'satisfactjoery'],
  ['scientific', 'scienjoetific'],
  ['scientifically', 'scienjoetifically'],
  ['scientist', 'scienjoetist'],
  ['scientists', 'scienjoetists'],
  ['secretary', 'secretarjoey'],
  ['secretaries', 'secretarjoeies'],
  ['significant', 'signifijoecant'],
  ['significantly', 'signifijoecantly'],
  ['significance', 'signifijoecance'],
  ['situation', 'situatjoen'],
  ['situations', 'situatjoens'],
  ['statement', 'statejoement'],
  ['statements', 'statejoenments'],
  ['successful', 'successjoeful'],
  ['successfully', 'successjoefully'],
  ['temperature', 'temperatjoere'],
  ['temperatures', 'temperatjoeres'],
  ['yesterday', 'yesterjoeday'],
  ['sentence', 'joentence'],
  ['sentences', 'joentences'],
  ['paragraph', 'parajoeph'],
  ['paragraphs', 'parajoephs'],
  ['alphabet', 'alphajoebet'],
  ['alphabets', 'alphajoebets'],
  ['alphabetical', 'alphajoebetical'],
  ['consonant', 'consojoenant'],
  ['consonants', 'consojoenants'],
  ['syllable', 'syljoeble'],
  ['syllables', 'syljoebles']
];

function buildAndVerify() {
  console.log('--- Generating Joeglish Bijective Dictionary ---');

  const engToJoe = new Map();
  const joeToEng = new Map();
  const errors = [];

  for (const [rawEng, rawJoe] of RAW_PAIRS) {
    const eng = rawEng.trim().toLowerCase();
    const joe = rawJoe.trim().toLowerCase();

    // Check minimum length rule
    if (eng.length < 6) {
      errors.push(`Word "${eng}" is too short (< 6 chars). Short words must remain unchanged.`);
    }

    // Check for "joe" presence in target
    if (!joe.includes('joe')) {
      errors.push(`Joeglish translation "${joe}" for "${eng}" does not contain "joe".`);
    }

    // Check duplicate english key
    if (engToJoe.has(eng)) {
      errors.push(`Duplicate English word: "${eng}" maps to both "${engToJoe.get(eng)}" and "${joe}".`);
    }

    // Check duplicate joeglish value (violates bijectivity)
    if (joeToEng.has(joe)) {
      errors.push(`Collision in Joeglish: "${joe}" maps to both "${joeToEng.get(joe)}" and "${eng}".`);
    }

    // Check identity collision (eng word equal to joe word)
    if (eng === joe) {
      errors.push(`English word equals Joeglish word: "${eng}" == "${joe}".`);
    }

    engToJoe.set(eng, joe);
    joeToEng.set(joe, eng);
  }

  // Cross-check: Ensure no English word in dictionary is also in Joeglish codomain
  for (const eng of engToJoe.keys()) {
    if (joeToEng.has(eng)) {
      errors.push(`Word "${eng}" exists in both English domain and Joeglish codomain (cycle/ambiguity).`);
    }
  }

  // Bijectivity round-trip assertion
  for (const [eng, joe] of engToJoe.entries()) {
    const back = joeToEng.get(joe);
    if (back !== eng) {
      errors.push(`Bijectivity violation: ${eng} -> ${joe} -> ${back}`);
    }
  }

  if (errors.length > 0) {
    console.error(`FATAL: ${errors.length} validation errors found:`);
    for (const err of errors) {
      console.error(` - ${err}`);
    }
    process.exit(1);
  }

  // Convert to clean sorted object
  const sortedDict = {};
  const sortedKeys = Array.from(engToJoe.keys()).sort();
  for (const k of sortedKeys) {
    sortedDict[k] = engToJoe.get(k);
  }

  const outDir = path.resolve(__dirname, '../src/engine');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write TypeScript dictionary file
  const tsContent = `// AUTO-GENERATED BY scripts/generateDictionary.js - DO NOT EDIT MANUALLY
// Truly bijective, highly readable Joeglish <-> English mapping
// Total word pairs: ${sortedKeys.length}

export const BIJECTIVE_DICTIONARY: Record<string, string> = ${JSON.stringify(sortedDict, null, 2)};
`;

  const tsFilePath = path.join(outDir, 'dictionary.ts');
  fs.writeFileSync(tsFilePath, tsContent, 'utf-8');

  // Also write JSON for easy reading / inspection
  const jsonFilePath = path.join(outDir, 'dictionary.json');
  fs.writeFileSync(jsonFilePath, JSON.stringify(sortedDict, null, 2), 'utf-8');

  console.log(`Successfully generated and verified ${sortedKeys.length} word pairs.`);
  console.log(`Written to:\n  ${tsFilePath}\n  ${jsonFilePath}`);
  console.log('Bijectivity: 100% verified (E <-> J is strictly 1-to-1).');
}

buildAndVerify();
