// ==========================================
// 1. DATA DATABASE
// ==========================================

// --- VIENNA VARIATIONS ---
const viennaVariations = [
    {
        id: "vienna_modern",
        name: "Modern Defense (3...d5)",
        moves: [
            { san: "e4", desc: "Control center." }, { san: "e5", desc: "Black matches." },
            { san: "Nc3", desc: "Vienna Game." }, { san: "Nf6", desc: "Most common." },
            { san: "f4", desc: "Vienna Gambit." }, { san: "d5", desc: "Modern Defense. Striking back immediately!" },
            { san: "fxe5", desc: "White takes." }, { san: "Nxe4", desc: "Black recaptures in center." },
            { san: "Nf3", desc: "Develop and control e5." }, { san: "Be7", desc: "Preparing to castle." },
            { san: "d4", desc: "Seizing space." }, { san: "O-O", desc: "Safety." },
            { san: "Bd3", desc: "Active Bishop." }
        ]
    },
    {
        id: "vienna_trap",
        name: "Queen Trap Line",
        moves: [
            { san: "e4", desc: "Control center." }, { san: "e5", desc: "Black matches." },
            { san: "Nc3", desc: "Vienna Game." }, { san: "Nf6", desc: "Falkbeer variation." },
            { san: "f4", desc: "The Gambit." }, { san: "exf4", desc: "Accepted." },
            { san: "e5", desc: "Kick the Knight." }, { san: "Qe7", desc: "Pinning the pawn." },
            { san: "Qe2", desc: "Unpinning." }, { san: "Ng8", desc: "Knight retreats." },
            { san: "Nf3", desc: "Develop King side." }, { san: "d6", desc: "Black breaks center." },
            { san: "Nd5", desc: "Attack Queen and c7." }, { san: "Qd7", desc: "Defend c7." },
            { san: "exd6+", desc: "Discovered Check!" }, { san: "Kd8", desc: "King runs." },
            { san: "dxc7+", desc: "Forking King/Queen." }, { san: "Qxc7", desc: "Forced take." },
            { san: "Nxc7", desc: "Win the Queen." }
        ]
    },
    {
        id: "vienna_main",
        name: "Steinitz Main Line",
        moves: [
            { san: "e4", desc: "Control center." }, { san: "e5", desc: "Black matches." },
            { san: "Nc3", desc: "Vienna Game." }, { san: "Nf6", desc: "Falkbeer." },
            { san: "f4", desc: "Gambit." }, { san: "exf4", desc: "Accepted." },
            { san: "e5", desc: "Kick." }, { san: "Ng8", desc: "Retreat." },
            { san: "Nf3", desc: "Develop." }, { san: "d6", desc: "Challenge." },
            { san: "d4", desc: "Full center control." }
        ]
    },
    {
        id: "vienna_paulsen",
        name: "Paulsen Variation",
        moves: [
            { san: "e4", desc: "Control center." }, { san: "e5", desc: "Black matches." },
            { san: "Nc3", desc: "Vienna Game." }, { san: "Nf6", desc: "Develop." },
            { san: "f4", desc: "Gambit." }, { san: "d5", desc: "Modern Defense." },
            { san: "fxe5", desc: "Take." }, { san: "Nxe4", desc: "Recapture." },
            { san: "Qf3", desc: "Paulsen Attack. Active Queen." }, { san: "Nc6", desc: "Developing and attacking d4/e5." },
            { san: "Bb5", desc: "Pinning." }
        ]
    },
    {
        id: "vienna_declined",
        name: "Vienna Gambit Declined",
        moves: [
            { san: "e4", desc: "Control center." }, { san: "e5", desc: "Black matches." },
            { san: "Nc3", desc: "Vienna Game." }, { san: "Nf6", desc: "Falkbeer." },
            { san: "f4", desc: "Gambit." }, { san: "d6", desc: "Declined." },
            { san: "Nf3", desc: "Develop." }, { san: "Nc6", desc: "Develop." }
        ]
    },
    {
        id: "vienna_hamppe_muzio",
        name: "Hamppe-Muzio Gambit",
        moves: [
            { san: "e4", desc: "Control center." }, { san: "e5", desc: "Black matches." },
            { san: "Nc3", desc: "Vienna Game." }, { san: "Nc6", desc: "Max Lange." },
            { san: "f4", desc: "Vienna Gambit." }, { san: "exf4", desc: "Accepted." },
            { san: "Nf3", desc: "Prevent Qh4+." }, { san: "g5", desc: "Defending the pawn." },
            { san: "Bc4", desc: "Targeting f7." }, { san: "g4", desc: "Attacking the Knight." },
            { san: "O-O", desc: "The Muzio! Sacrificing the Knight for attack." }, { san: "gxf3", desc: "Accepted." },
            { san: "Qxf3", desc: "Developing with threat on f7." }
        ]
    }
];

// --- RUY LOPEZ VARIATIONS ---
const ruyLopezVariations = [
    {
        id: "ruy_berlin", name: "Berlin Defense (The Wall)",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e5",desc:"Symmetrical."},{san:"Nf3",desc:"Attack e5."},{san:"Nc6",desc:"Defend e5."},{san:"Bb5",desc:"The Ruy López! Pressure on the defender."},{san:"Nf6",desc:"Berlin Defense. Attacking e4 immediately."},{san:"O-O",desc:"Castle. Ignoring the e4 threat."},{san:"Nxe4",desc:"Black takes the pawn."},{san:"d4",desc:"Striking back in the center."},{san:"Nd6",desc:"Knight retreats, attacking Bishop."},{san:"Bxc6",desc:"Exchange."},{san:"dxc6",desc:"Black captures away from center."},{san:"dxe5",desc:"Recapturing pawn."},{san:"Nf5",desc:"Knight moves to safety."},{san:"Qxd8+",desc:"Queen trade."},{san:"Kxd8",desc:"King is stuck in center, but solid."}
        ]
    },
    {
        id: "ruy_exchange", name: "Exchange Variation",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e5",desc:"Symmetrical."},{san:"Nf3",desc:"Attack e5."},{san:"Nc6",desc:"Defend e5."},{san:"Bb5",desc:"Ruy López."},{san:"a6",desc:"Morphy Defense. Challenge the Bishop."},{san:"Bxc6",desc:"Exchange Variation. Giving up the Bishop pair for structure damage."},{san:"dxc6",desc:"Black doubles pawns."},{san:"d4",desc:"Open the center immediately."},{san:"exd4",desc:"Trade."},{san:"Qxd4",desc:"Queen takes. White has a pawn majority on K-side."},{san:"Qxd4",desc:"Queen trade."},{san:"Nxd4",desc:"Endgame territory."}
        ]
    },
    {
        id: "ruy_marshall", name: "Marshall Attack",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e5",desc:"Symmetrical."},{san:"Nf3",desc:"Attack e5."},{san:"Nc6",desc:"Defend e5."},{san:"Bb5",desc:"Ruy López."},{san:"a6",desc:"Morphy."},{san:"Ba4",desc:"Retreat."},{san:"Nf6",desc:"Develop."},{san:"O-O",desc:"Safety."},{san:"Be7",desc:"Prepare castle."},{san:"Re1",desc:"Rook lifts."},{san:"b5",desc:"Expand."},{san:"Bb3",desc:"Retreat."},{san:"O-O",desc:"Safety."},{san:"c3",desc:"Prepare d4."},{san:"d5",desc:"The Marshall! Sacrificing a pawn for attack."},{san:"exd5",desc:"Accept."},{san:"Nxd5",desc:"Recapture."},{san:"Nxe5",desc:"White grabs the pawn."},{san:"Nxe5",desc:"Trade."},{san:"Rxe5",desc:"Rook active."},{san:"c6",desc:"Defend Knight."}
        ]
    }
];


// --- ITALIAN GAME VARIATIONS ---
const italianVariations = [
    {
        id: "italian_giuoco", name: "Giuoco Piano (Main)",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e5",desc:"Symmetrical."},{san:"Nf3",desc:"Attack."},{san:"Nc6",desc:"Defend."},{san:"Bc4",desc:"Italian Game. Eyeing f7."},{san:"Bc5",desc:"Giuoco Piano. Black mirrors."},{san:"c3",desc:"Preparing d4 push."},{san:"Nf6",desc:"Attacking e4."},{san:"d3",desc:"Giuoco Pianissimo (Quiet Game). Solid play."},{san:"d6",desc:"Solidify."},{san:"O-O",desc:"Safety."},{san:"O-O",desc:"Safety."},{san:"h3",desc:"Preventing Bg4 pin."}
        ]
    },
    {
        id: "italian_fried_liver", name: "Fried Liver Attack",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e5",desc:"Symmetrical."},{san:"Nf3",desc:"Attack."},{san:"Nc6",desc:"Defend."},{san:"Bc4",desc:"Italian."},{san:"Nf6",desc:"Two Knights Defense."},{san:"Ng5",desc:"The Attack! Targeting f7."},{san:"d5",desc:"Black blocks the Bishop."},{san:"exd5",desc:"White takes."},{san:"Nxd5",desc:"The mistake. Black recaptures."},{san:"Nxf7",desc:"THE SACRIFICE! Forking Queen and Rook."},{san:"Kxf7",desc:"King must take."},{san:"Qf3+",desc:"Check and attacking the Knight."},{san:"Ke6",desc:"King must defend Knight."},{san:"Nc3",desc:"Piling pressure on the pinned Knight."}
        ]
    }
];

// --- SCOTCH GAME VARIATIONS ---
const scotchVariations = [
    {
        id: "scotch_main", name: "Scotch Main Line",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e5",desc:"Symmetrical."},{san:"Nf3",desc:"Attack."},{san:"Nc6",desc:"Defend."},{san:"d4",desc:"Scotch Game! Breaking the center early."},{san:"exd4",desc:"Black trades."},{san:"Nxd4",desc:"Recapture."},{san:"Bc5",desc:"Developing and attacking the Knight."},{san:"Be3",desc:"Defending the Knight."},{san:"Qf6",desc:"Adding more pressure on d4."},{san:"c3",desc:"Solidifying the Knight support."},{san:"Nge7",desc:"Developing."},{san:"Bc4",desc:"Active Bishop."}
        ]
    }
];

// --- PETROV DEFENSE VARIATIONS ---
const petrovVariations = [
    {
        id: "petrov_main", name: "Petrov Main Line",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e5",desc:"Symmetrical."},{san:"Nf3",desc:"Attack."},{san:"Nf6",desc:"Petrov Defense. Counter-attack."},{san:"Nxe5",desc:"White takes first."},{san:"d6",desc:"Kick the Knight back."},{san:"Nf3",desc:"Retreat."},{san:"Nxe4",desc:"Black regains the pawn."},{san:"d4",desc:"Seize center."},{san:"d5",desc:"Black solidifies."},{san:"Bd3",desc:"Develop."},{san:"Nc6",desc:"Develop."},{san:"O-O",desc:"Safety."}
        ]
    }
];

 // --- PHILIDOR DEFENSE VARIATIONS ---
 const philidorVariations = [
    {
        id: "philidor_main", name: "Philidor (Hanham)",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e5",desc:"Symmetrical."},{san:"Nf3",desc:"Attack."},{san:"d6",desc:"Philidor Defense. Solid but passive."},{san:"d4",desc:"Challenge center."},{san:"Nd7",desc:"Hanham Variation. Keeping center tension."},{san:"Bc4",desc:"Eyeing f7."},{san:"c6",desc:"Controlling squares."},{san:"O-O",desc:"Safety."},{san:"Be7",desc:"Prepare castle."}
        ]
    }
];


// --- SICILIAN DEFENSE VARIATIONS ---
const sicilianVariations = [
    {
        id: "sicilian_najdorf", name: "Open Sicilian: Najdorf",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"c5",desc:"Sicilian Defense. Fighting for d4 from the flank."},{san:"Nf3",desc:"White prepares d4."},{san:"d6",desc:"Control e5, prepare Nf6."},{san:"d4",desc:"Open Sicilian! Breaking the center."},{san:"cxd4",desc:"Black trades flank pawn for center pawn."},{san:"Nxd4",desc:"Recapture."},{san:"Nf6",desc:"Attack e4."},{san:"Nc3",desc:"Defend e4."},{san:"a6",desc:"The Najdorf. Prevents pieces from using b5."},{san:"Be3",desc:"English Attack setup."},{san:"e5",desc:"Challenging the center immediately."},{san:"Nb3",desc:"Knight retreats to safety."}
        ]
    },
    {
        id: "sicilian_dragon", name: "Open Sicilian: Dragon",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"c5",desc:"Sicilian."},{san:"Nf3",desc:"Develop."},{san:"d6",desc:"Control e5."},{san:"d4",desc:"Open Center."},{san:"cxd4",desc:"Trade."},{san:"Nxd4",desc:"Recapture."},{san:"Nf6",desc:"Attack e4."},{san:"Nc3",desc:"Defend."},{san:"g6",desc:"The Dragon! Preparing to fianchetto the Bishop."},{san:"Be3",desc:"Be3/f3 setup is standard."},{san:"Bg7",desc:"Bishop controls the long diagonal."},{san:"f3",desc:"Solidify e4, prevent Ng4."},{san:"Nc6",desc:"Develop Knight."},{san:"Qd2",desc:"Prepare Queenside castle."},{san:"O-O",desc:"King safety."}
        ]
    },
    {
        id: "sicilian_alapin", name: "Alapin Variation (Anti-Sicilian)",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"c5",desc:"Sicilian."},{san:"c3",desc:"The Alapin. Preparing to build a full center with d4."},{san:"Nf6",desc:"Counter-attack e4."},{san:"e5",desc:"Pushing the pawn to harass the Knight."},{san:"Nd5",desc:"Knight hops to the center."},{san:"d4",desc:" seizing the center."},{san:"cxd4",desc:"Black trades."},{san:"cxd4",desc:"White maintains a strong pawn center."},{san:"d6",desc:"Challenging the e5 pawn."},{san:"Nf3",desc:"Developing."},{san:"Nc6",desc:"Developing."}
        ]
    },
    {
        id: "sicilian_closed", name: "Closed Sicilian",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"c5",desc:"Sicilian."},{san:"Nc3",desc:"Closed Sicilian. Delaying d4 to play a slower game."},{san:"Nc6",desc:"Black develops naturally."},{san:"g3",desc:"Fianchetto setup."},{san:"g6",desc:"Black mirrors."},{san:"Bg2",desc:"Control diagonal."},{san:"Bg7",desc:"Control diagonal."},{san:"d3",desc:"Solid structure."},{san:"d6",desc:"Solid structure."}
        ]
    }
];

// --- FRENCH DEFENSE VARIATIONS ---
const frenchVariations = [
    {
        id: "french_advance", name: "Advance Variation",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e6",desc:"French Defense. Solid and prepares d5."},{san:"d4",desc:"Take the center."},{san:"d5",desc:"Challenge e4 immediately."},{san:"e5",desc:"Advance Variation. Gaining space and locking the center."},{san:"c5",desc:"Attacking the d4 pawn base."},{san:"c3",desc:"Reinforcing d4."},{san:"Nc6",desc:"Adding pressure on d4."},{san:"Nf3",desc:"Defending d4."},{san:"Qb6",desc:"Classic French setup. Pressure on b2 and d4."},{san:"a3",desc:"Prepare b4 expansion."}
        ]
    },
    {
        id: "french_exchange", name: "Exchange Variation",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e6",desc:"French."},{san:"d4",desc:"Center."},{san:"d5",desc:"Challenge."},{san:"exd5",desc:"Exchange. Releasing tension."},{san:"exd5",desc:"Recapture."},{san:"Nf3",desc:"Develop."},{san:"Nf6",desc:"Develop."},{san:"Bd3",desc:"Active Bishop."},{san:"Bd6",desc:"Active Bishop."},{san:"O-O",desc:"Safety."},{san:"O-O",desc:"Safety."}
        ]
    },
    {
        id: "french_winawer", name: "Winawer Variation",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"e6",desc:"French."},{san:"d4",desc:"Center."},{san:"d5",desc:"Challenge."},{san:"Nc3",desc:"Paulsen Attack. Defending e4."},{san:"Bb4",desc:"Winawer! Pinning the Knight."},{san:"e5",desc:"Gaining space."},{san:"c5",desc:"Counter-attack center."},{san:"a3",desc:"Putting the question to the Bishop."},{san:"Bxc3+",desc:"Exchange."},{san:"bxc3",desc:"White has doubled pawns but open lines."},{san:"Ne7",desc:"Developing flexible Knight."}
        ]
    }
];

// --- CARO-KANN VARIATIONS ---
const caroVariations = [
    {
        id: "caro_advance", name: "Advance Variation",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"c6",desc:"Caro-Kann. Preparing d5."},{san:"d4",desc:"Center."},{san:"d5",desc:"Strike center."},{san:"e5",desc:"Advance. Gaining space."},{san:"Bf5",desc:"Developing Bishop *outside* the pawn chain."},{san:"Nf3",desc:"Develop."},{san:"e6",desc:"Solidifying center (now playing e6 is safe)."},{san:"Be2",desc:"Development."},{san:"c5",desc:"Challenging the center."}
        ]
    },
    {
        id: "caro_classical", name: "Classical Variation",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"c6",desc:"Caro-Kann."},{san:"d4",desc:"Center."},{san:"d5",desc:"Strike."},{san:"Nc3",desc:"Defend e4."},{san:"dxe4",desc:"Take."},{san:"Nxe4",desc:"Recapture."},{san:"Bf5",desc:"Challenge the Knight."},{san:"Ng3",desc:"Knight moves and attacks Bishop."},{san:"Bg6",desc:"Bishop retreats but stays active."},{san:"h4",desc:"Aggressive! Threatening to trap Bishop with h5."},{san:"h6",desc:"Creating an escape square."}
        ]
    }
];

// --- SCANDINAVIAN VARIATIONS ---
const scandiVariations = [
    {
        id: "scandi_main", name: "Main Line (Mieses)",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"d5",desc:"Scandinavian! Immediate attack."},{san:"exd5",desc:"Take."},{san:"Qxd5",desc:"Queen takes."},{san:"Nc3",desc:"Developing with tempo (attacking Queen)."},{san:"Qa5",desc:"The classic retreat square."},{san:"d4",desc:"Take center."},{san:"Nf6",desc:"Develop."},{san:"Nf3",desc:"Develop."},{san:"c6",desc:"Provide escape for Queen and control d5."},{san:"Bd2",desc:"Preparing discovered attacks."}
        ]
    }
];

// --- PIRC / MODERN VARIATIONS ---
const pircVariations = [
    {
        id: "pirc_150", name: "150 Attack",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"d6",desc:"Pirc Setup."},{san:"d4",desc:"Center."},{san:"Nf6",desc:"Attack e4."},{san:"Nc3",desc:"Defend."},{san:"g6",desc:"Fianchetto."},{san:"Be3",desc:"Setting up the 150 Attack (English style)."},{san:"Bg7",desc:"Bishop active."},{san:"Qd2",desc:"Battery."},{san:"O-O",desc:"Castle."}
        ]
    }
];

// --- ALEKHINE VARIATIONS ---
const alekhineVariations = [
    {
        id: "alekhine_modern", name: "Modern Variation",
        moves: [
            {san:"e4",desc:"King's Pawn."},{san:"Nf6",desc:"Alekhine Defense. Provoking the pawns."},{san:"e5",desc:"White accepts the challenge."},{san:"Nd5",desc:"Knight moves to center."},{san:"d4",desc:"Taking space."},{san:"d6",desc:"Challenging the pawn."},{san:"Nf3",desc:"Developing."},{san:"Bg4",desc:"Pinning."},{san:"Be2",desc:"Unpinning."}
        ]
    }
];


// --- QUEEN'S GAMBIT FAMILY ---
const qgVariations = [
    {
        id: "qg_main", name: "Queen's Gambit (Main)",
        moves: [
            {san:"d4",desc:"Queen's Pawn. Control center."},{san:"d5",desc:"Black matches."},{san:"c4",desc:"Queen's Gambit! Trading a flank pawn for the center."},{san:"e6",desc:"Declining the gambit (QGD)."},{san:"Nc3",desc:"Pressure on d5."},{san:"Nf6",desc:"Defending."},{san:"Bg5",desc:"Pinning the Knight."},{san:"Be7",desc:"Unpinning."},{san:"e3",desc:"Solidifying."},{san:"O-O",desc:"Safety."},{san:"Nf3",desc:"Develop."}
        ]
    }
];

const qgdVariations = [
    {
        id: "qgd_exchange", name: "Exchange Variation",
        moves: [
            {san:"d4",desc:"Center."},{san:"d5",desc:"Center."},{san:"c4",desc:"Gambit."},{san:"e6",desc:"Declined."},{san:"Nc3",desc:"Develop."},{san:"Nf6",desc:"Develop."},{san:"cxd5",desc:"Exchange Variation."},{san:"exd5",desc:"Recapture. The structure is fixed."},{san:"Bg5",desc:"Pin."},{san:"c6",desc:"Solidify d5."},{san:"e3",desc:"Open lines for Bishop."}
        ]
    }
];

const qgaVariations = [
    {
        id: "qga_main", name: "QG Accepted",
        moves: [
            {san:"d4",desc:"Center."},{san:"d5",desc:"Center."},{san:"c4",desc:"Gambit."},{san:"dxc4",desc:"Accepted! Giving up the center temporarily."},{san:"e3",desc:"Opening diagonal to recover pawn."},{san:"Nf6",desc:"Develop."},{san:"Bxc4",desc:"Recapture."},{san:"e6",desc:"Prepare c5 break."},{san:"Nf3",desc:"Develop."},{san:"c5",desc:"Striking back at the center."},{san:"O-O",desc:"Safety."}
        ]
    }
];

const slavVariations = [
    {
        id: "slav_main", name: "Slav Defense (Main)",
        moves: [
            {san:"d4",desc:"Center."},{san:"d5",desc:"Center."},{san:"c4",desc:"Gambit."},{san:"c6",desc:"Slav Defense. Solid, keeping the light-squared bishop free."},{san:"Nf3",desc:"Prevent ...e5."},{san:"Nf6",desc:"Develop."},{san:"Nc3",desc:"Pressure."},{san:"dxc4",desc:"Taking now ensures Bishop can develop."},{san:"a4",desc:"Stopping ...b5."},{san:"Bf5",desc:"The point of the Slav. Bishop is out!"}
        ]
    }
];

const semiSlavVariations = [
    {
        id: "semislav_meran", name: "Meran Variation",
        moves: [
            {san:"d4",desc:"Center."},{san:"d5",desc:"Center."},{san:"c4",desc:"Gambit."},{san:"c6",desc:"Slav."},{san:"Nf3",desc:"Develop."},{san:"Nf6",desc:"Develop."},{san:"Nc3",desc:"Develop."},{san:"e6",desc:"Semi-Slav. Solid triangle structure."},{san:"e3",desc:"Solid."},{san:"Nbd7",desc:"Preparing ...c5 or ...e5."},{san:"Bd3",desc:"Active Bishop."},{san:"dxc4",desc:"Giving up tension."},{san:"Bxc4",desc:"Recapture."},{san:"b5",desc:"Expansion!"},{san:"Bd3",desc:"Retreat."}
        ]
    }
];

// --- INDIAN DEFENSES (1.d4 Nf6) ---
const nimzoVariations = [
    {
        id: "nimzo_main", name: "Nimzo-Indian (Rubinstein)",
        moves: [
            {san:"d4",desc:"Center."},{san:"Nf6",desc:"Indian Defense."},{san:"c4",desc:"Space."},{san:"e6",desc:"Prepare ...d5 or ...Bb4."},{san:"Nc3",desc:"Develop."},{san:"Bb4",desc:"Nimzo-Indian. Pinning the Knight."},{san:"e3",desc:"Rubinstein System. Solid."},{san:"O-O",desc:"Safety."},{san:"Bd3",desc:"Develop."},{san:"d5",desc:"Strike center."},{san:"Nf3",desc:"Develop."}
        ]
    }
];

const qidVariations = [
    {
        id: "qid_main", name: "Queen's Indian",
        moves: [
            {san:"d4",desc:"Center."},{san:"Nf6",desc:"Indian."},{san:"c4",desc:"Space."},{san:"e6",desc:"Solid."},{san:"Nf3",desc:"Preventing Nimzo (Nc3 allows Bb4)."},{san:"b6",desc:"Queen's Indian. Fianchetto."},{san:"g3",desc:"Counter-Fianchetto."},{san:"Ba6",desc:"Modern approach. Attacking c4."},{san:"b3",desc:"Defending c4."},{san:"Bb4+",desc:"Check."}
        ]
    }
];

const kidVariations = [
    {
        id: "kid_classical", name: "KID (Classical)",
        moves: [
            {san:"d4",desc:"Center."},{san:"Nf6",desc:"Indian."},{san:"c4",desc:"Space."},{san:"g6",desc:"KID Setup."},{san:"Nc3",desc:"Develop."},{san:"Bg7",desc:"Fianchetto."},{san:"e4",desc:"Taking full center."},{san:"d6",desc:"Prevent e5."},{san:"Nf3",desc:"Develop."},{san:"O-O",desc:"Safety."},{san:"Be2",desc:"Classical Setup."},{san:"e5",desc:"Striking back!"},{san:"O-O",desc:"Safety."},{san:"Nc6",desc:"Pressure on d4."},{san:"d5",desc:"Closing the center. The race begins."},{san:"Ne7",desc:"Knight retreats to prepare f5."}
        ]
    }
];

const grunfeldVariations = [
    {
        id: "grunfeld_exchange", name: "Exchange Variation",
        moves: [
            {san:"d4",desc:"Center."},{san:"Nf6",desc:"Indian."},{san:"c4",desc:"Space."},{san:"g6",desc:"Setup."},{san:"Nc3",desc:"Develop."},{san:"d5",desc:"Grünfeld! Allowing white center to attack it."},{san:"cxd5",desc:"Exchange."},{san:"Nxd5",desc:"Recapture."},{san:"e4",desc:"White takes massive center."},{san:"Nxc3",desc:"Trade."},{san:"bxc3",desc:"White has pawns, Black has activity."},{san:"Bg7",desc:"Fianchetto."},{san:"Nf3",desc:"Develop."},{san:"c5",desc:"Attacking the center immediately."}
        ]
    }
];

// --- OTHER d4 SYSTEMS ---
const dutchVariations = [
    {
        id: "dutch_stonewall", name: "Stonewall Dutch",
        moves: [
            {san:"d4",desc:"Center."},{san:"f5",desc:"Dutch Defense. Aggressive/Risky."},{san:"c4",desc:"Space."},{san:"e6",desc:"Solid."},{san:"g3",desc:"Preventing f4 attacks."},{san:"Nf6",desc:"Develop."},{san:"Bg2",desc:"Fianchetto."},{san:"d5",desc:"Stonewall. Locking center control."},{san:"Nf3",desc:"Develop."},{san:"c6",desc:"Fortifying."},{san:"O-O",desc:"Safety."},{san:"Bd6",desc:"Active Bishop."}
        ]
    }
];

const benoniVariations = [
    {
        id: "benoni_modern", name: "Modern Benoni",
        moves: [
            {san:"d4",desc:"Center."},{san:"Nf6",desc:"Indian."},{san:"c4",desc:"Space."},{san:"c5",desc:"Benoni. Provoking d5."},{san:"d5",desc:"Space gain."},{san:"e6",desc:"Challenging the pawn."},{san:"Nc3",desc:"Develop."},{san:"exd5",desc:"Trade."},{san:"cxd5",desc:"Modern Benoni Structure. White has center, Black has queenside majority."},{san:"d6",desc:"Stopping e5."},{san:"e4",desc:"Center."},{san:"g6",desc:"Fianchetto."}
        ]
    }
];

const benkoVariations = [
    {
        id: "benko_accepted", name: "Benko Gambit",
        moves: [
            {san:"d4",desc:"Center."},{san:"Nf6",desc:"Indian."},{san:"c4",desc:"Space."},{san:"c5",desc:"Benoni push."},{san:"d5",desc:"Space."},{san:"b5",desc:"Benko Gambit! Sacrificing pawn for pressure."},{san:"cxb5",desc:"Accepted."},{san:"a6",desc:"Undermining."},{san:"bxa6",desc:"White takes."},{san:"g6",desc:"Fianchetto."},{san:"Nc3",desc:"Develop."},{san:"Bxa6",desc:"Black has open files for Rooks."}
        ]
    }
];

const catalanVariations = [
    {
        id: "catalan_open", name: "Catalan (Open)",
        moves: [
            {san:"d4",desc:"Center."},{san:"Nf6",desc:"Indian."},{san:"c4",desc:"Space."},{san:"e6",desc:"Solid."},{san:"g3",desc:"Catalan. Hybrid of QG and Reti."},{san:"d5",desc:"Center."},{san:"Bg2",desc:"Fianchetto."},{san:"Be7",desc:"Develop."},{san:"Nf3",desc:"Develop."},{san:"O-O",desc:"Safety."},{san:"O-O",desc:"Safety."},{san:"dxc4",desc:"Taking the pawn."}
        ]
    }
];

// ==========================================
// FLANK OPENINGS
// ==========================================
const englishVariations = [
    {
        id: "eng_rev_sic", name: "Reversed Sicilian",
        moves: [{san:"c4",desc:"English."},{san:"e5",desc:"Rev. Sicilian."},{san:"Nc3",desc:""},{san:"Nf6",desc:""},{san:"g3",desc:""},{san:"Bb4",desc:""}]
    },
    {
        id: "eng_sym", name: "Symmetrical",
        moves: [{san:"c4",desc:""},{san:"c5",desc:"Symmetrical."},{san:"Nc3",desc:""},{san:"Nc6",desc:""},{san:"g3",desc:""},{san:"g6",desc:""}]
    }
];

const retiVariations = [
    {
        id: "reti_main", name: "Réti System",
        moves: [{san:"Nf3",desc:"Réti."},{san:"d5",desc:""},{san:"c4",desc:"Gambit."},{san:"e6",desc:""},{san:"g3",desc:""},{san:"Nf6",desc:""},{san:"Bg2",desc:""}]
    }
];

const kiaVariations = [
    {
        id: "kia_setup", name: "Main Setup",
        moves: [{san:"Nf3",desc:""},{san:"d5",desc:""},{san:"g3",desc:"KIA."},{san:"Nf6",desc:""},{san:"Bg2",desc:""},{san:"e6",desc:""},{san:"d3",desc:""},{san:"c5",desc:""},{san:"O-O",desc:""},{san:"Nc6",desc:""},{san:"Nbd2",desc:""},{san:"Be7",desc:""},{san:"e4",desc:"Strike."}]
    }
];

const birdVariations = [
    {
        id: "bird_main", name: "Main Line",
        moves: [{san:"f4",desc:"Bird's."},{san:"d5",desc:""},{san:"Nf3",desc:""},{san:"Nf6",desc:""},{san:"e3",desc:""},{san:"g6",desc:""},{san:"Be2",desc:""}]
    }
];

const larsenVariations = [
    {
        id: "larsen_mod", name: "Modern Setup",
        moves: [{san:"b3",desc:"Larsen's."},{san:"e5",desc:""},{san:"Bb2",desc:"Attack e5."},{san:"Nc6",desc:"Defend."},{san:"e3",desc:""},{san:"Nf6",desc:""}]
    }
];

const sokolskyVariations = [
    {
        id: "sokolsky_exc", name: "Exchange",
        moves: [{san:"b4",desc:"Sokolsky."},{san:"e5",desc:""},{san:"Bb2",desc:""},{san:"Bxb4",desc:"Take."},{san:"Bxe5",desc:"Take."},{san:"Nf6",desc:""}]
    }
];


        
// --- FULL LIST STRUCTURE ---
const database = {
    "1.e4 — King’s Pawn Openings": [
        { id: "ruy_lopez", name: "Ruy López", tags: ["White", "Open Game"], variations: ruyLopezVariations },
        { id: "italian", name: "Italian Game", tags: ["White", "Open Game"], variations: italianVariations },
        { id: "scotch", name: "Scotch Game", tags: ["White", "Open Game"], variations: scotchVariations },
        { id: "petrov", name: "Petrov Defense", tags: ["Black", "Open Game"], variations: petrovVariations },
        { id: "vienna", name: "Vienna Game", tags: ["White", "Open Game"], variations: viennaVariations },
        { id: "four_knights", name: "Four Knights Game", tags: ["White", "Open Game"], variations: [] },
        { id: "philidor", name: "Philidor Defense", tags: ["Black", "Open Game"], variations: philidorVariations },
        { id: "sicilian", name: "Sicilian Defense", tags: ["Black", "Semi-Open"], variations: sicilianVariations },
        { id: "french", name: "French Defense", tags: ["Black", "Semi-Open"], variations: frenchVariations },
        { id: "caro", name: "Caro-Kann Defense", tags: ["Black", "Semi-Open"], variations: caroVariations },
        { id: "pirc", name: "Pirc Defense", tags: ["Black", "Semi-Open"], variations: pircVariations },
        { id: "modern", name: "Modern Defense", tags: ["Black", "Semi-Open"], variations: [] },
        { id: "alekhine", name: "Alekhine Defense", tags: ["Black", "Semi-Open"], variations: alekhineVariations },
        { id: "scandi", name: "Scandinavian Defense", tags: ["Black", "Semi-Open"], variations: scandiVariations }
    ],
    "1.d4 — Queen’s Pawn Openings": [
        { id: "qg", name: "Queen’s Gambit", tags: ["White", "Closed"], variations: qgVariations },
        { id: "qgd", name: "QG Declined", tags: ["Black", "Closed"], variations: qgdVariations },
        { id: "qga", name: "QG Accepted", tags: ["Black", "Closed"], variations: qgaVariations },
        { id: "slav", name: "Slav Defense", tags: ["Black", "Closed"], variations: slavVariations },
        { id: "semi_slav", name: "Semi-Slav Defense", tags: ["Black", "Closed"], variations: semiSlavVariations },
        { id: "nimzo", name: "Nimzo-Indian", tags: ["Black", "Indian"], variations: nimzoVariations },
        { id: "qid", name: "Queen’s Indian", tags: ["Black", "Indian"], variations: [] },
        { id: "kid", name: "King’s Indian", tags: ["Black", "Indian"], variations: kidVariations },
        { id: "grunfeld", name: "Grünfeld Defense", tags: ["Black", "Indian"], variations: [] },
        { id: "dutch", name: "Dutch Defense", tags: ["Black", "Other"], variations: dutchVariations },
        { id: "benoni", name: "Benoni Defense", tags: ["Black", "Other"], variations: benoniVariations },
        { id: "benko", name: "Benko Gambit", tags: ["Black", "Other"], variations: benkoVariations },
        { id: "catalan", name: "Catalan Opening", tags: ["White", "Other"], variations: catalanVariations }
    ],
    "Flank Openings": [
        { id: "english", name: "English Opening", tags: ["White", "Flank"], variations: englishVariations },
        { id: "reti", name: "Reti Opening", tags: ["White", "Flank"], variations: retiVariations },
        { id: "kia", name: "King’s Indian Attack", tags: ["White", "Flank"], variations: kiaVariations },
        { id: "bird", name: "Bird’s Opening", tags: ["White", "Flank"], variations: birdVariations },
        { id: "larsen", name: "Larsen’s Opening", tags: ["White", "Flank"], variations: larsenVariations },
        { id: "sokolsky", name: "Sokolsky Opening", tags: ["White", "Flank"], variations: sokolskyVariations }
    ]
};

