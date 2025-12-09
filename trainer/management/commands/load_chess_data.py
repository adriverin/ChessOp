from django.core.management.base import BaseCommand
from trainer.models import OpeningCategory, Opening, Variation

class Command(BaseCommand):
    help = 'Loads initial chess data'

    def handle(self, *args, **kwargs):
        # Update existing data (non-destructive)

        # --- HELPER: Metadata Defaults ---
        def get_meta(variation_id):
            """Returns (difficulty, training_goal, themes) based on variation ID keywords."""
            vid = variation_id.lower()
            
            # 1. Determine Difficulty
            difficulty = "intermediate"
            if any(k in vid for k in ["main", "classical", "orthodox", "tarrasch"]):
                difficulty = "advanced"
            if any(k in vid for k in ["elite", "poisoned", "botvinnik", "moscow", "anti_moscow", "najdorf", "gruenfeld"]):
                difficulty = "elite"
            if any(k in vid for k in ["beginner", "exchange", "london", "colle", "four_knights"]):
                difficulty = "beginner"

            # 2. Determine Goal
            goal = "strategy"
            if any(k in vid for k in ["gambit", "attack", "sac", "poisoned", "dragon", "najdorf", "king_indian", "benoni"]):
                goal = "attack"
            if any(k in vid for k in ["defense", "solid", "exchange", "berlin", "petrov", "caro", "slav"]):
                goal = "defense"
            if any(k in vid for k in ["endgame", "minority", "rubinstein"]):
                goal = "endgame"
            if any(k in vid for k in ["tactic", "trap", "fried_liver", "halloween", "muzio"]):
                goal = "tactics"

            # 3. Determine Themes
            themes = []
            if "iqp" in vid or "tarrasch" in vid: themes.append("IQP")
            if "minority" in vid or "exchange" in vid: themes.append("minority_attack")
            if "king_indian" in vid or "sicilian" in vid: themes.append("opposite_castling")
            if "fianchetto" in vid or "catalan" in vid or "dragon" in vid: themes.append("fianchetto")
            if "french" in vid or "advance" in vid: themes.append("pawn_chain")
            if "isolated" in vid: themes.append("isolated_pawn")
            if "gambit" in vid: themes.append("initiative")
            if "endgame" in vid: themes.append("endgame_technique")
            if "attack" in vid: themes.append("king_attack")
            
            # Fallback themes if empty
            if not themes:
                if goal == "strategy": themes.append("space_advantage")
                if goal == "attack": themes.append("piece_activity")
                if goal == "defense": themes.append("prophylaxis")

            return difficulty, goal, list(set(themes)) # unique themes

        # --- VIENNA VARIATIONS ---
        viennaVariations = [
            {
                "id": "vienna_modern", "name": "Modern Defense (3...d5)",
                "moves": [
                    { "san": "e4", "desc": "Control center." }, { "san": "e5", "desc": "Black matches." },
                    { "san": "Nc3", "desc": "Vienna Game." }, { "san": "Nf6", "desc": "Most common." },
                    { "san": "f4", "desc": "Vienna Gambit." }, { "san": "d5", "desc": "Modern Defense. Striking back immediately!" },
                    { "san": "fxe5", "desc": "White takes." }, { "san": "Nxe4", "desc": "Black recaptures in center." },
                    { "san": "Nf3", "desc": "Develop and control e5." }, { "san": "Be7", "desc": "Preparing to castle." },
                    { "san": "d4", "desc": "Seizing space." }, { "san": "O-O", "desc": "Safety." },
                    { "san": "Bd3", "desc": "Active Bishop." }
                ]
            },
            {
                "id": "vienna_trap", "name": "Queen Trap Line",
                "moves": [
                    { "san": "e4", "desc": "Control center." }, { "san": "e5", "desc": "Black matches." },
                    { "san": "Nc3", "desc": "Vienna Game." }, { "san": "Nf6", "desc": "Falkbeer variation." },
                    { "san": "f4", "desc": "The Gambit." }, { "san": "exf4", "desc": "Accepted." },
                    { "san": "e5", "desc": "Kick the Knight." }, { "san": "Qe7", "desc": "Pinning the pawn." },
                    { "san": "Qe2", "desc": "Unpinning." }, { "san": "Ng8", "desc": "Knight retreats." },
                    { "san": "Nf3", "desc": "Develop King side." }, { "san": "d6", "desc": "Black breaks center." },
                    { "san": "Nd5", "desc": "Attack Queen and c7." }, { "san": "Qd7", "desc": "Defend c7." },
                    { "san": "exd6+", "desc": "Discovered Check!" }, { "san": "Kd8", "desc": "King runs." },
                    { "san": "dxc7+", "desc": "Forking King/Queen." }, { "san": "Qxc7", "desc": "Forced take." },
                    { "san": "Nxc7", "desc": "Win the Queen." }
                ]
            },
            {
                "id": "vienna_main", "name": "Steinitz Main Line",
                "moves": [
                    { "san": "e4", "desc": "Control center." }, { "san": "e5", "desc": "Black matches." },
                    { "san": "Nc3", "desc": "Vienna Game." }, { "san": "Nf6", "desc": "Falkbeer." },
                    { "san": "f4", "desc": "Gambit." }, { "san": "exf4", "desc": "Accepted." },
                    { "san": "e5", "desc": "Kick." }, { "san": "Ng8", "desc": "Retreat." },
                    { "san": "Nf3", "desc": "Develop." }, { "san": "d6", "desc": "Challenge." },
                    { "san": "d4", "desc": "Full center control." }
                ]
            },
            {
                "id": "vienna_paulsen", "name": "Paulsen Variation",
                "moves": [
                    { "san": "e4", "desc": "Control center." }, { "san": "e5", "desc": "Black matches." },
                    { "san": "Nc3", "desc": "Vienna Game." }, { "san": "Nf6", "desc": "Develop." },
                    { "san": "f4", "desc": "Gambit." }, { "san": "d5", "desc": "Modern Defense." },
                    { "san": "fxe5", "desc": "Take." }, { "san": "Nxe4", "desc": "Recapture." },
                    { "san": "Qf3", "desc": "Paulsen Attack. Active Queen." }, { "san": "Nc6", "desc": "Developing and attacking d4/e5." },
                    { "san": "Bb5", "desc": "Pinning." }
                ]
            },
            {
                "id": "vienna_declined", "name": "Vienna Gambit Declined",
                "moves": [
                    { "san": "e4", "desc": "Control center." }, { "san": "e5", "desc": "Black matches." },
                    { "san": "Nc3", "desc": "Vienna Game." }, { "san": "Nf6", "desc": "Falkbeer." },
                    { "san": "f4", "desc": "Gambit." }, { "san": "d6", "desc": "Declined." },
                    { "san": "Nf3", "desc": "Develop." }, { "san": "Nc6", "desc": "Develop." }
                ]
            },
            {
                "id": "vienna_hamppe_muzio", "name": "Hamppe-Muzio Gambit",
                "moves": [
                    { "san": "e4", "desc": "Control center." }, { "san": "e5", "desc": "Black matches." },
                    { "san": "Nc3", "desc": "Vienna Game." }, { "san": "Nc6", "desc": "Max Lange." },
                    { "san": "f4", "desc": "Vienna Gambit." }, { "san": "exf4", "desc": "Accepted." },
                    { "san": "Nf3", "desc": "Prevent Qh4+." }, { "san": "g5", "desc": "Defending the pawn." },
                    { "san": "Bc4", "desc": "Targeting f7." }, { "san": "g4", "desc": "Attacking the Knight." },
                    { "san": "O-O", "desc": "The Muzio! Sacrificing the Knight for attack." }, { "san": "gxf3", "desc": "Accepted." },
                    { "san": "Qxf3", "desc": "Developing with threat on f7." }
                ]
            },
            {
                "id": "vienna_max_lange", "name": "Max Lange Defense",
                "moves": [
                    { "san": "e4", "desc": "King's Pawn." }, { "san": "e5", "desc": "Symmetrical." },
                    { "san": "Nc3", "desc": "Vienna." }, { "san": "Nc6", "desc": "Max Lange." },
                    { "san": "g3", "desc": "Fianchetto approach." }, { "san": "Bc5", "desc": "Active Bishop." },
                    { "san": "Bg2", "desc": "Fianchetto." }, { "san": "d6", "desc": "Solid." },
                    { "san": "d3", "desc": "Controlling center." }, { "san": "Nf6", "desc": "Develop." }
                ]
            }
        ]

        # --- RUY LOPEZ VARIATIONS ---
        # ### RUY LÓPEZ – MODERN ELITE LINES
        ruyLopezVariations = [
            {
                "id": "ruy_berlin", "name": "Berlin Defense (The Wall)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack e5."},{"san":"Nc6","desc":"Defend e5."},{"san":"Bb5","desc":"The Ruy López! Pressure on the defender."},{"san":"Nf6","desc":"Berlin Defense. Attacking e4 immediately."},{"san":"O-O","desc":"Castle. Ignoring the e4 threat."},{"san":"Nxe4","desc":"Black takes the pawn."},{"san":"d4","desc":"Striking back in the center."},{"san":"Nd6","desc":"Knight retreats, attacking Bishop."},{"san":"Bxc6","desc":"Exchange."},{"san":"dxc6","desc":"Black captures away from center."},{"san":"dxe5","desc":"Recapturing pawn."},{"san":"Nf5","desc":"Knight moves to safety."},{"san":"Qxd8+","desc":"Queen trade."},{"san":"Kxd8","desc":"King is stuck in center, but solid."}
                ]
            },
            {
                "id": "ruy_berlin_endgame", "name": "Berlin Endgame (Main)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy López."},{"san":"Nf6","desc":"Berlin."},{"san":"O-O","desc":"Safety."},{"san":"Nxe4","desc":"Take."},{"san":"d4","desc":"Center."},{"san":"Nd6","desc":"Retreat."},{"san":"Bxc6","desc":"Exchange."},{"san":"dxc6","desc":"Structure."},{"san":"dxe5","desc":"Regain pawn."},{"san":"Nf5","desc":"Square."},{"san":"Qxd8+","desc":"Endgame."},{"san":"Kxd8","desc":"King active."},{"san":"Nc3","desc":"Develop."},{"san":"Ke8","desc":"Prophylaxis."},{"san":"h3","desc":"Luft."},{"san":"h5","desc":"Space."},{"san":"Bf4","desc":"Active."},{"san":"Be7","desc":"Develop."},{"san":"Rad1","desc":"Control."}
                ]
            },
            {
                "id": "ruy_exchange", "name": "Exchange Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack e5."},{"san":"Nc6","desc":"Defend e5."},{"san":"Bb5","desc":"Ruy López."},{"san":"a6","desc":"Morphy Defense. Challenge the Bishop."},{"san":"Bxc6","desc":"Exchange Variation. Giving up the Bishop pair for structure damage."},{"san":"dxc6","desc":"Black doubles pawns."},{"san":"d4","desc":"Open the center immediately."},{"san":"exd4","desc":"Trade."},{"san":"Qxd4","desc":"Queen takes. White has a pawn majority on K-side."},{"san":"Qxd4","desc":"Queen trade."},{"san":"Nxd4","desc":"Endgame territory."}
                ]
            },
            {
                "id": "ruy_marshall", "name": "Marshall Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack e5."},{"san":"Nc6","desc":"Defend e5."},{"san":"Bb5","desc":"Ruy López."},{"san":"a6","desc":"Morphy."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Prepare castle."},{"san":"Re1","desc":"Rook lifts."},{"san":"b5","desc":"Expand."},{"san":"Bb3","desc":"Retreat."},{"san":"O-O","desc":"Safety."},{"san":"c3","desc":"Prepare d4."},{"san":"d5","desc":"The Marshall! Sacrificing a pawn for attack."},{"san":"exd5","desc":"Accept."},{"san":"Nxd5","desc":"Recapture."},{"san":"Nxe5","desc":"White grabs the pawn."},{"san":"Nxe5","desc":"Trade."},{"san":"Rxe5","desc":"Rook active."},{"san":"c6","desc":"Defend Knight."}
                ]
            },
            {
                "id": "ruy_marshall_main_line", "name": "Marshall (Main Line)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy."},{"san":"a6","desc":"Morphy."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Develop."},{"san":"Re1","desc":"Rook."},{"san":"b5","desc":"Space."},{"san":"Bb3","desc":"Retreat."},{"san":"O-O","desc":"Safety."},{"san":"c3","desc":"Center prep."},{"san":"d5","desc":"Marshall!"},{"san":"exd5","desc":"Take."},{"san":"Nxd5","desc":"Recapture."},{"san":"Nxe5","desc":"Take pawn."},{"san":"Nxe5","desc":"Trade."},{"san":"Rxe5","desc":"Active Rook."},{"san":"c6","desc":"Defend."},{"san":"d4","desc":"Center."},{"san":"Bd6","desc":"Bishop active."},{"san":"Re1","desc":"Retreat."},{"san":"Qh4","desc":"Attack!"},{"san":"g3","desc":"Defend."},{"san":"Qh3","desc":"Infiltration."},{"san":"Be3","desc":"Develop."},{"san":"Bg4","desc":"Pin."}
                ]
            },
            {
                "id": "ruy_anti_marshall", "name": "Anti-Marshall (8.a4)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack e5."},{"san":"Nc6","desc":"Defend e5."},{"san":"Bb5","desc":"Ruy López."},{"san":"a6","desc":"Morphy Defense."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Prepare castle."},{"san":"Re1","desc":"Rook lifts."},{"san":"b5","desc":"Expand."},{"san":"Bb3","desc":"Retreat."},{"san":"O-O","desc":"Safety."},{"san":"a4","desc":"Anti-Marshall. Forcing Black to resolve the queenside structure early."},{"san":"b4","desc":"Black gains space but weakens structure."},{"san":"d3","desc":"Solidifying center."}
                ]
            },
            {
                "id": "ruy_anti_marshall_d3", "name": "Anti-Marshall (8.h3 d3)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy."},{"san":"a6","desc":"Morphy."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Develop."},{"san":"Re1","desc":"Rook."},{"san":"b5","desc":"Space."},{"san":"Bb3","desc":"Retreat."},{"san":"d6","desc":"Solid."},{"san":"c3","desc":"Prep d4."},{"san":"O-O","desc":"Safety."},{"san":"h3","desc":"Prevent Bg4."},{"san":"Bb7","desc":"Fianchetto."},{"san":"d3","desc":"Slow center."},{"san":"Na5","desc":"Kick."},{"san":"Bc2","desc":"Save."},{"san":"c5","desc":"Space."},{"san":"Nbd2","desc":"Maneuver."}
                ]
            },
            {
                "id": "ruy_chigorin", "name": "Closed Defense (Chigorin)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack e5."},{"san":"Nc6","desc":"Defend e5."},{"san":"Bb5","desc":"Ruy López."},{"san":"a6","desc":"Morphy Defense."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Prepare castle."},{"san":"Re1","desc":"Rook lifts."},{"san":"b5","desc":"Expand."},{"san":"Bb3","desc":"Retreat."},{"san":"d6","desc":"Prophylaxis."},{"san":"c3","desc":"Preparing d4."},{"san":"O-O","desc":"Safety."},{"san":"h3","desc":"Preventing Bg4."},{"san":"Na5","desc":"Chigorin! Knight hunts the Bishop."},{"san":"Bc2","desc":"Bishop saved."},{"san":"c5","desc":"Challenging the center."},{"san":"d4","desc":"Strike."}
                ]
            },
            {
                "id": "ruy_breyer", "name": "Breyer Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy López."},{"san":"a6","desc":"Morphy."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Develop."},{"san":"Re1","desc":"Rook."},{"san":"b5","desc":"Expand."},{"san":"Bb3","desc":"Retreat."},{"san":"d6","desc":"Structure."},{"san":"c3","desc":"Prep d4."},{"san":"O-O","desc":"Safety."},{"san":"h3","desc":"Anti-Bg4."},{"san":"Nb8","desc":"The Breyer! Rerouting the knight to d7."},{"san":"d4","desc":"Center."},{"san":"Nbd7","desc":"Solidifying."}
                ]
            },
            {
                "id": "ruy_breyer_zaitsev", "name": "Zaitsev Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy."},{"san":"a6","desc":"Morphy."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Develop."},{"san":"Re1","desc":"Rook."},{"san":"b5","desc":"Space."},{"san":"Bb3","desc":"Retreat."},{"san":"d6","desc":"Solid."},{"san":"c3","desc":"Prep d4."},{"san":"O-O","desc":"Safety."},{"san":"h3","desc":"Luft."},{"san":"Bb7","desc":"Zaitsev! Pressure e4."},{"san":"d4","desc":"Strike."},{"san":"Re8","desc":"Active Rook."},{"san":"Nbd2","desc":"Develop."},{"san":"Bf8","desc":"Regroup."},{"san":"a4","desc":"Q-side play."},{"san":"h6","desc":"Prophylaxis."}
                ]
            },
            {
                "id": "ruy_arkhangelsk", "name": "Arkhangelsk Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy."},{"san":"a6","desc":"Morphy."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"b5","desc":"Space."},{"san":"Bb3","desc":"Retreat."},{"san":"Bb7","desc":"Arkhangelsk! Fianchetto."},{"san":"Re1","desc":"Rook."},{"san":"Bc5","desc":"Active Bishop."},{"san":"c3","desc":"Center."},{"san":"d6","desc":"Solid."},{"san":"d4","desc":"Strike."},{"san":"Bb6","desc":"Safe."},{"san":"Bg5","desc":"Pin."},{"san":"h6","desc":"Kick."}
                ]
            },
            {
                "id": "ruy_neo_archangel", "name": "Neo-Arkhangelsk",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy."},{"san":"a6","desc":"Morphy."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"b5","desc":"Space."},{"san":"Bb3","desc":"Retreat."},{"san":"Bc5","desc":"Neo-Arkhangelsk. Direct activity."},{"san":"c3","desc":"Center."},{"san":"d6","desc":"Solid."},{"san":"a4","desc":"Challenge b5."},{"san":"Rb8","desc":"Defense."},{"san":"d4","desc":"Center."},{"san":"Bb6","desc":"Retreat."},{"san":"h3","desc":"Luft."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "ruy_worrall", "name": "Worrall Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy."},{"san":"a6","desc":"Morphy."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Develop."},{"san":"Qe2","desc":"Worrall Attack. Queen supports Rook later."},{"san":"b5","desc":"Space."},{"san":"Bb3","desc":"Retreat."},{"san":"O-O","desc":"Safety."},{"san":"c3","desc":"Center."},{"san":"d6","desc":"Solid."},{"san":"d4","desc":"Center."}
                ]
            },
            {
                "id": "ruy_open", "name": "Open Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy López."},{"san":"a6","desc":"Morphy."},{"san":"Ba4","desc":"Retreat."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Nxe4","desc":"The Open Ruy! Taking the pawn."},{"san":"d4","desc":"Strike center."},{"san":"b5","desc":"Kick Bishop."},{"san":"Bb3","desc":"Retreat."},{"san":"d5","desc":"Strong center."},{"san":"dxe5","desc":"Regain pawn."},{"san":"Be6","desc":"Solidify."}
                ]
            },
            {
                "id": "ruy_schliemann", "name": "Schliemann Defense",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy López."},{"san":"f5","desc":"Schliemann Defense! Aggressive counter-gambit."},{"san":"Nc3","desc":"Developing and defending."},{"san":"fxe4","desc":"Taking."},{"san":"Nxe4","desc":"Recapture."},{"san":"d5","desc":"Black strikes center."},{"san":"Nxe5","desc":"Tactical shot."},{"san":"dxe4","desc":"Chaos."},{"san":"Nxc6","desc":"Fork threat."}
                ]
            },
            {
                "id": "ruy_cozio", "name": "Cozio Defense",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bb5","desc":"Ruy López."},{"san":"Nge7","desc":"Cozio Defense. Solid but passive."},{"san":"O-O","desc":"Safety."},{"san":"g6","desc":"Fianchetto plan."},{"san":"c3","desc":"Prepare d4."},{"san":"Bg7","desc":"Develop."},{"san":"d4","desc":"Strike."},{"san":"exd4","desc":"Trade."},{"san":"cxd4","desc":"Big center."}
                ]
            }
        ]

        # --- ITALIAN GAME VARIATIONS ---
        italianVariations = [
            {
                "id": "italian_giuoco", "name": "Giuoco Piano (Main)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bc4","desc":"Italian Game. Eyeing f7."},{"san":"Bc5","desc":"Giuoco Piano. Black mirrors."},{"san":"c3","desc":"Preparing d4 push."},{"san":"Nf6","desc":"Attacking e4."},{"san":"d3","desc":"Giuoco Pianissimo (Quiet Game). Solid play."},{"san":"d6","desc":"Solidify."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."},{"san":"h3","desc":"Preventing Bg4 pin."}
                ]
            },
            {
                "id": "italian_fried_liver", "name": "Fried Liver Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bc4","desc":"Italian."},{"san":"Nf6","desc":"Two Knights Defense."},{"san":"Ng5","desc":"The Attack! Targeting f7."},{"san":"d5","desc":"Black blocks the Bishop."},{"san":"exd5","desc":"White takes."},{"san":"Nxd5","desc":"The mistake. Black recaptures."},{"san":"Nxf7","desc":"THE SACRIFICE! Forking Queen and Rook."},{"san":"Kxf7","desc":"King must take."},{"san":"Qf3+","desc":"Check and attacking the Knight."},{"san":"Ke6","desc":"King must defend Knight."},{"san":"Nc3","desc":"Piling pressure on the pinned Knight."}
                ]
            },
            {
                "id": "italian_evans", "name": "Evans Gambit",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bc4","desc":"Italian Game."},{"san":"Bc5","desc":"Giuoco Piano."},{"san":"b4","desc":"Evans Gambit! Sacrificing b-pawn for center control."},{"san":"Bxb4","desc":"Accepted."},{"san":"c3","desc":"Tempo on Bishop."},{"san":"Ba5","desc":"Retreat."},{"san":"d4","desc":"Strike center."},{"san":"exd4","desc":"Open lines."},{"san":"O-O","desc":"Safety."},{"san":"d3","desc":"Black can hold on, but White has attack."}
                ]
            },
            {
                "id": "italian_pianissimo", "name": "Giuoco Pianissimo",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bc4","desc":"Italian."},{"san":"Bc5","desc":"Piano."},{"san":"d3","desc":"Pianissimo. Slow game."},{"san":"Nf6","desc":"Develop."},{"san":"c3","desc":"Support d4 later."},{"san":"d6","desc":"Solid."},{"san":"O-O","desc":"Safety."},{"san":"a6","desc":"Prophylaxis."},{"san":"Re1","desc":"Rook active."},{"san":"Ba7","desc":"Retreat."}
                ]
            },
            {
                "id": "italian_two_knights_traxler", "name": "Two Knights: Traxler",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bc4","desc":"Italian."},{"san":"Nf6","desc":"Two Knights."},{"san":"Ng5","desc":"Attack f7."},{"san":"Bc5","desc":"The Traxler! Ignoring the threat."},{"san":"Nxf7","desc":"Fork."},{"san":"Bxf2+","desc":"Counter-sacrifice!"},{"san":"Kxf2","desc":"Takes."},{"san":"Nxe4+","desc":"Check."},{"san":"Kg1","desc":"Safety."},{"san":"Qh4","desc":"Attack!"}
                ]
            },
            {
                "id": "italian_two_knights_main", "name": "Two Knights: 4.d5",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bc4","desc":"Italian."},{"san":"Nf6","desc":"Two Knights."},{"san":"Ng5","desc":"Attack f7."},{"san":"d5","desc":"The only good defense."},{"san":"exd5","desc":"Takes."},{"san":"Na5","desc":"Polerio Defense. Main Line."},{"san":"Bb5+","desc":"Check."},{"san":"c6","desc":"Block."},{"san":"dxc6","desc":"Takes."},{"san":"bxc6","desc":"Takes."},{"san":"Bd3","desc":"Retreat."}
                ]
            },
            {
                "id": "italian_deutz", "name": "Deutz Gambit",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Bc4","desc":"Italian."},{"san":"Bc5","desc":"Piano."},{"san":"O-O","desc":"Safety."},{"san":"Nf6","desc":"Develop."},{"san":"d4","desc":"Deutz Gambit! Opening lines early."},{"san":"Bxd4","desc":"Takes."},{"san":"Nxd4","desc":"Takes."},{"san":"Nxd4","desc":"Takes."},{"san":"f4","desc":"Attacking center."},{"san":"d6","desc":"Solid."},{"san":"fxe5","desc":"Opening f-file."}
                ]
            }
        ]

        # --- SCOTCH GAME VARIATIONS ---
        scotchVariations = [
            {
                "id": "scotch_main", "name": "Scotch Main Line",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"d4","desc":"Scotch Game! Breaking the center early."},{"san":"exd4","desc":"Black trades."},{"san":"Nxd4","desc":"Recapture."},{"san":"Bc5","desc":"Developing and attacking the Knight."},{"san":"Be3","desc":"Defending the Knight."},{"san":"Qf6","desc":"Adding more pressure on d4."},{"san":"c3","desc":"Solidifying the Knight support."},{"san":"Nge7","desc":"Developing."},{"san":"Bc4","desc":"Active Bishop."}
                ]
            },
            {
                "id": "scotch_mieses", "name": "Mieses Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"d4","desc":"Scotch."},{"san":"exd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Schmidt Variation."},{"san":"Nxc6","desc":"Exchange."},{"san":"bxc6","desc":"Structure change."},{"san":"e5","desc":"Mieses Variation. Aggressive push."},{"san":"Qe7","desc":"Pinning pawn."},{"san":"Qe2","desc":"Unpinning."},{"san":"Nd5","desc":"Active Knight."},{"san":"c4","desc":"Kick."},{"san":"Ba6","desc":"Counter-pin."}
                ]
            },
            {
                "id": "scotch_potter", "name": "Potter Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"d4","desc":"Scotch."},{"san":"exd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Bc5","desc":"Classical."},{"san":"Nb3","desc":"Potter Variation. Retreating to safety."},{"san":"Bb6","desc":"Bishop safe."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Qe2","desc":"Setup for long castle."},{"san":"d6","desc":"Solid."}
                ]
            },
            {
                "id": "scotch_classical", "name": "Classical Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"d4","desc":"Scotch."},{"san":"exd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Bc5","desc":"Classical."},{"san":"Be3","desc":"Defend."},{"san":"Qf6","desc":"Pressure."},{"san":"c3","desc":"Support."},{"san":"Nge7","desc":"Develop."}
                ]
            },
            {
                "id": "scotch_goring", "name": "Göring Gambit",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"d4","desc":"Scotch."},{"san":"exd4","desc":"Takes."},{"san":"c3","desc":"Göring Gambit! Offering a pawn for rapid development."},{"san":"dxc3","desc":"Accepted."},{"san":"Nxc3","desc":"Develop."},{"san":"Bb4","desc":"Pin."},{"san":"Bc4","desc":"Active."},{"san":"Nf6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."}
                ]
            }
        ]

        # --- FOUR KNIGHTS VARIATIONS ---
        fourKnightsVariations = [
            {
                "id": "four_knights_spanish", "name": "Spanish Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Nc3","desc":"Three Knights."},{"san":"Nf6","desc":"Four Knights."},{"san":"Bb5","desc":"Spanish Variation. Ruy Lopez style."},{"san":"Bb4","desc":"Symmetrical response."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."},{"san":"d3","desc":"Solid."},{"san":"d6","desc":"Solid."},{"san":"Bg5","desc":"Pin."}
                ]
            },
            {
                "id": "four_knights_scotch", "name": "Scotch Four Knights",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Four Knights."},{"san":"d4","desc":"Scotch break."},{"san":"exd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Bb4","desc":"Pin."},{"san":"Nxc6","desc":"Trade."},{"san":"bxc6","desc":"Structure change."},{"san":"Bd3","desc":"Develop."},{"san":"d5","desc":"Strike."}
                ]
            },
            {
                "id": "four_knights_halloween", "name": "Halloween Gambit",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Four Knights."},{"san":"Nxe5","desc":"Halloween Gambit! Speculative Knight sac."},{"san":"Nxe5","desc":"Accepted."},{"san":"d4","desc":"Center push."},{"san":"Ng6","desc":"Retreat."},{"san":"e5","desc":"Kick."},{"san":"Ng8","desc":"Retreat."},{"san":"Bc4","desc":"Attack f7."}
                ]
            },
            {
                "id": "four_knights_belgrade", "name": "Belgrade Gambit",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nc6","desc":"Defend."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Four Knights."},{"san":"d4","desc":"Scotch."},{"san":"exd4","desc":"Takes."},{"san":"Nd5","desc":"Belgrade Gambit."},{"san":"Be7","desc":"Solid."},{"san":"Bg5","desc":"Pin."},{"san":"d6","desc":"Kick."},{"san":"Nxd4","desc":"Recapture."}
                ]
            }
        ]

        # --- PETROV DEFENSE VARIATIONS ---
        petrovVariations = [
            {
                "id": "petrov_main", "name": "Petrov Main Line",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nf6","desc":"Petrov Defense. Counter-attack."},{"san":"Nxe5","desc":"White takes first."},{"san":"d6","desc":"Kick the Knight back."},{"san":"Nf3","desc":"Retreat."},{"san":"Nxe4","desc":"Black regains the pawn."},{"san":"d4","desc":"Seize center."},{"san":"d5","desc":"Black solidifies."},{"san":"Bd3","desc":"Develop."},{"san":"Nc6","desc":"Develop."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "petrov_cochrane", "name": "Cochrane Gambit",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nf6","desc":"Petrov."},{"san":"Nxe5","desc":"Takes."},{"san":"d6","desc":"Kick."},{"san":"Nxf7","desc":"Cochrane Gambit! Knight sac for exposure."},{"san":"Kxf7","desc":"Accepted."},{"san":"d4","desc":"Center."},{"san":"Nxe4","desc":"Counter."},{"san":"Nc3","desc":"Develop."},{"san":"Nxc3","desc":"Trade."},{"san":"bxc3","desc":"Line opening."}
                ]
            },
            {
                "id": "petrov_three_knights", "name": "Three Knights Game",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nf6","desc":"Petrov."},{"san":"Nc3","desc":"Three Knights. Avoiding main lines."},{"san":"Bb4","desc":"Pinning."},{"san":"Nxe5","desc":"Taking."},{"san":"O-O","desc":"Safety."},{"san":"Nd3","desc":"Retreat and attack Bishop."},{"san":"Bxc3","desc":"Trade."},{"san":"dxc3","desc":"Open lines."},{"san":"Nxe4","desc":"Regain pawn."}
                ]
            },
            {
                "id": "petrov_modern", "name": "Modern Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"Nf6","desc":"Petrov."},{"san":"d4","desc":"Modern Attack."},{"san":"Nxe4","desc":"Capture."},{"san":"Bd3","desc":"Develop."},{"san":"d5","desc":"Solidify."},{"san":"Nxe5","desc":"Recapture."},{"san":"Nd7","desc":"Challenge Knight."},{"san":"Nxd7","desc":"Trade."},{"san":"Bxd7","desc":"Develop."},{"san":"O-O","desc":"Safety."}
                ]
            }
        ]

        # --- PHILIDOR DEFENSE VARIATIONS ---
        philidorVariations = [
            {
                "id": "philidor_main", "name": "Philidor (Hanham)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"d6","desc":"Philidor Defense. Solid but passive."},{"san":"d4","desc":"Challenge center."},{"san":"Nd7","desc":"Hanham Variation. Keeping center tension."},{"san":"Bc4","desc":"Eyeing f7."},{"san":"c6","desc":"Controlling squares."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Prepare castle."}
                ]
            },
            {
                "id": "philidor_exchange", "name": "Exchange Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"d6","desc":"Philidor."},{"san":"d4","desc":"Center."},{"san":"exd4","desc":"Exchange."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Defend."},{"san":"Be7","desc":"Solid."},{"san":"Bf4","desc":"Active."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "philidor_counter", "name": "Philidor Counter-Gambit",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e5","desc":"Symmetrical."},{"san":"Nf3","desc":"Attack."},{"san":"d6","desc":"Philidor."},{"san":"d4","desc":"Center."},{"san":"f5","desc":"Counter-Gambit! Risky but sharp."},{"san":"dxe5","desc":"Opening lines."},{"san":"fxe4","desc":"Counter-capture."},{"san":"Ng5","desc":"Knight jumps in."},{"san":"d5","desc":"Space."},{"san":"e6","desc":"Thorn in position."},{"san":"Nh6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"c6","desc":"Control."}
                ]
            }
        ]

        # --- SICILIAN DEFENSE VARIATIONS ---
        # ### SICILIAN – ADVANCED DEPTH
        sicilianVariations = [
            {
                "id": "sicilian_najdorf", "name": "Open Sicilian: Najdorf",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian Defense. Fighting for d4 from the flank."},{"san":"Nf3","desc":"White prepares d4."},{"san":"d6","desc":"Control e5, prepare Nf6."},{"san":"d4","desc":"Open Sicilian! Breaking the center."},{"san":"cxd4","desc":"Black trades flank pawn for center pawn."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Attack e4."},{"san":"Nc3","desc":"Defend e4."},{"san":"a6","desc":"The Najdorf. Prevents pieces from using b5."},{"san":"Be3","desc":"English Attack setup."},{"san":"e5","desc":"Challenging the center immediately."},{"san":"Nb3","desc":"Knight retreats to safety."}
                ]
            },
            {
                "id": "sicilian_najdorf_poisoned", "name": "Najdorf: Poisoned Pawn",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"d6","desc":"Control."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"a6","desc":"Najdorf."},{"san":"Bg5","desc":"Main Line."},{"san":"e6","desc":"Solid."},{"san":"f4","desc":"Space."},{"san":"Qb6","desc":"Poisoned Pawn! Eyeing b2."},{"san":"Qd2","desc":"Sacrifice."},{"san":"Qxb2","desc":"Taken."},{"san":"Rb1","desc":"Rook active."},{"san":"Qa3","desc":"Queen trapped?"},{"san":"f5","desc":"Attack."}
                ]
            },
            {
                "id": "sicilian_najdorf_english", "name": "Najdorf: English Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"d6","desc":"Control."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"a6","desc":"Najdorf."},{"san":"Be3","desc":"English Attack start."},{"san":"e5","desc":"Black challenge."},{"san":"Nb3","desc":"Retreat."},{"san":"Be6","desc":"Develop."},{"san":"f3","desc":"Support."},{"san":"Be7","desc":"Develop."},{"san":"Qd2","desc":"Battery."},{"san":"O-O","desc":"Safety."},{"san":"g4","desc":"Storm!"},{"san":"O-O-O","desc":"Opposite castling."}
                ]
            },
            {
                "id": "sicilian_dragon", "name": "Open Sicilian: Dragon",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"d6","desc":"Control e5."},{"san":"d4","desc":"Open Center."},{"san":"cxd4","desc":"Trade."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Attack e4."},{"san":"Nc3","desc":"Defend."},{"san":"g6","desc":"The Dragon! Preparing to fianchetto the Bishop."},{"san":"Be3","desc":"Be3/f3 setup is standard."},{"san":"Bg7","desc":"Bishop controls the long diagonal."},{"san":"f3","desc":"Solidify e4, prevent Ng4."},{"san":"Nc6","desc":"Develop Knight."},{"san":"Qd2","desc":"Prepare Queenside castle."},{"san":"O-O","desc":"King safety."}
                ]
            },
            {
                "id": "sicilian_dragon_yugoslav", "name": "Dragon: Yugoslav Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"d6","desc":"Control."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"g6","desc":"Dragon."},{"san":"Be3","desc":"Yugoslav setup."},{"san":"Bg7","desc":"Bishop."},{"san":"f3","desc":"Anti-Ng4."},{"san":"O-O","desc":"Safety."},{"san":"Qd2","desc":"Battery."},{"san":"Nc6","desc":"Develop."},{"san":"Bc4","desc":"Eyeing f7."},{"san":"Bd7","desc":"Develop."},{"san":"O-O-O","desc":"Long Castle."},{"san":"Rc8","desc":"C-file."},{"san":"Bb3","desc":"Safety."},{"san":"h4","desc":"The storm begins."}
                ]
            },
            {
                "id": "sicilian_dragon_classical", "name": "Dragon: Classical",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"d6","desc":"Control."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"g6","desc":"Dragon."},{"san":"Be2","desc":"Classical."},{"san":"Bg7","desc":"Bishop."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."},{"san":"Nb3","desc":"Prophylaxis."},{"san":"Nc6","desc":"Develop."},{"san":"Be3","desc":"Develop."},{"san":"Be6","desc":"Solid."}
                ]
            },
            {
                "id": "sicilian_alapin", "name": "Alapin Variation (Anti-Sicilian)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"c3","desc":"The Alapin. Preparing to build a full center with d4."},{"san":"Nf6","desc":"Counter-attack e4."},{"san":"e5","desc":"Pushing the pawn to harass the Knight."},{"san":"Nd5","desc":"Knight hops to the center."},{"san":"d4","desc":" seizing the center."},{"san":"cxd4","desc":"Black trades."},{"san":"cxd4","desc":"White maintains a strong pawn center."},{"san":"d6","desc":"Challenging the e5 pawn."},{"san":"Nf3","desc":"Developing."},{"san":"Nc6","desc":"Developing."}
                ]
            },
            {
                "id": "sicilian_closed", "name": "Closed Sicilian",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nc3","desc":"Closed Sicilian. Delaying d4 to play a slower game."},{"san":"Nc6","desc":"Black develops naturally."},{"san":"g3","desc":"Fianchetto setup."},{"san":"g6","desc":"Black mirrors."},{"san":"Bg2","desc":"Control diagonal."},{"san":"Bg7","desc":"Control diagonal."},{"san":"d3","desc":"Solid structure."},{"san":"d6","desc":"Solid structure."}
                ]
            },
            {
                "id": "sicilian_sveshnikov", "name": "Sveshnikov Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian Defense."},{"san":"Nf3","desc":"Prepare d4."},{"san":"Nc6","desc":"Control center."},{"san":"d4","desc":"Open Sicilian."},{"san":"cxd4","desc":"Exchange."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Attack e4."},{"san":"Nc3","desc":"Defend e4."},{"san":"e5","desc":"Sveshnikov! Aggressive center claim."},{"san":"Ndb5","desc":"Threatening d6."},{"san":"d6","desc":"Preventing Nd6+."},{"san":"Bg5","desc":"Pinning."},{"san":"a6","desc":"Kicking the Knight."},{"san":"Na3","desc":"Knight retreats to edge."},{"san":"b5","desc":"Gaining space."}
                ]
            },
            {
                "id": "sicilian_sveshnikov_bxf6", "name": "Sveshnikov: 9.Bxf6",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"Nc6","desc":"Develop."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"e5","desc":"Sveshnikov."},{"san":"Ndb5","desc":"Square."},{"san":"d6","desc":"Control."},{"san":"Bg5","desc":"Pin."},{"san":"a6","desc":"Kick."},{"san":"Na3","desc":"Retreat."},{"san":"b5","desc":"Space."},{"san":"Bxf6","desc":"Damage structure."},{"san":"gxf6","desc":"Accept weakness."},{"san":"Nd5","desc":"Outpost."},{"san":"f5","desc":"Counterplay."},{"san":"Bd3","desc":"Develop."},{"san":"Be6","desc":"Develop."}
                ]
            },
            {
                "id": "sicilian_sveshnikov_sac", "name": "Sveshnikov: 9.Nd5",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"Nc6","desc":"Develop."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"e5","desc":"Sveshnikov."},{"san":"Ndb5","desc":"Square."},{"san":"d6","desc":"Control."},{"san":"Bg5","desc":"Pin."},{"san":"a6","desc":"Kick."},{"san":"Na3","desc":"Retreat."},{"san":"b5","desc":"Space."},{"san":"Nd5","desc":"Positional sac."},{"san":"Be7","desc":"Unpin."},{"san":"Bxf6","desc":"Trade."},{"san":"Bxf6","desc":"Recapture."},{"san":"c3","desc":"Support."}
                ]
            },
            {
                "id": "sicilian_scheveningen", "name": "Scheveningen Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Prepare d4."},{"san":"d6","desc":"Control e5."},{"san":"d4","desc":"Open Sicilian."},{"san":"cxd4","desc":"Exchange."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Attack e4."},{"san":"Nc3","desc":"Defend e4."},{"san":"e6","desc":"Scheveningen. Small center setup."},{"san":"Be2","desc":"Solid development."},{"san":"a6","desc":"Control b5."},{"san":"O-O","desc":"Safety."},{"san":"Be7","desc":"Development."},{"san":"Be3","desc":"Standard English Attack setup."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "sicilian_kan", "name": "Kan Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"e6","desc":"The Kan. Flexible."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"a6","desc":"Kan signature. Controlling b5."},{"san":"Bd3","desc":"Maroczy Bind setup?"},{"san":"Bc5","desc":"Active Bishop."},{"san":"Nb3","desc":"Retreat."},{"san":"Ba7","desc":"Sniper Bishop."},{"san":"O-O","desc":"Safety."},{"san":"Nc6","desc":"Develop."}
                ]
            },
            {
                "id": "sicilian_taimanov", "name": "Taimanov Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"e6","desc":"French-like."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nc6","desc":"Taimanov."},{"san":"Nc3","desc":"Develop."},{"san":"Qc7","desc":"Queen control."},{"san":"Be3","desc":"English setup."},{"san":"a6","desc":"Prevent Nb5."},{"san":"Qd2","desc":"Battery."},{"san":"Nf6","desc":"Develop."},{"san":"O-O-O","desc":"Sharp game."}
                ]
            },
            {
                "id": "sicilian_classical_rauzer", "name": "Classical (Richter-Rauzer)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"d6","desc":"Control."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Attack."},{"san":"Nc3","desc":"Defend."},{"san":"Nc6","desc":"Classical."},{"san":"Bg5","desc":"Richter-Rauzer Attack."},{"san":"e6","desc":"Unpinning preparation."},{"san":"Qd2","desc":"Queenside Castle plan."},{"san":"a6","desc":"Prevent Nb5."},{"san":"O-O-O","desc":"Castling."},{"san":"Bd7","desc":"Develop."}
                ]
            },
            {
                "id": "sicilian_classical_sozin", "name": "Classical: Sozin Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nf3","desc":"Develop."},{"san":"d6","desc":"Control."},{"san":"d4","desc":"Open."},{"san":"cxd4","desc":"Takes."},{"san":"Nxd4","desc":"Recapture."},{"san":"Nf6","desc":"Attack."},{"san":"Nc3","desc":"Defend."},{"san":"Nc6","desc":"Classical."},{"san":"Bc4","desc":"Sozin Attack! Eyeing f7."},{"san":"e6","desc":"Blunting Bishop."},{"san":"Bb3","desc":"Prophylaxis."},{"san":"Be7","desc":"Develop."},{"san":"Be3","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "sicilian_grand_prix", "name": "Grand Prix Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c5","desc":"Sicilian."},{"san":"Nc3","desc":"Closed."},{"san":"Nc6","desc":"Develop."},{"san":"f4","desc":"Grand Prix! Aggressive Kingside expansion."},{"san":"g6","desc":"Fianchetto."},{"san":"Nf3","desc":"Develop."},{"san":"Bg7","desc":"Bishop active."},{"san":"Bc4","desc":"Eyeing f7."},{"san":"d6","desc":"Control."},{"san":"O-O","desc":"Safety."},{"san":"e6","desc":"Solid."},{"san":"d3","desc":"Structure."},{"san":"Nge7","desc":"Flexible."},{"san":"Qe1","desc":"The Queen lift!"}
                ]
            }
        ]

        # --- FRENCH DEFENSE VARIATIONS ---
        # ### FRENCH DEFENSE – ADVANCED DEPTH
        frenchVariations = [
            {
                "id": "french_advance", "name": "Advance Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French Defense. Solid and prepares d5."},{"san":"d4","desc":"Take the center."},{"san":"d5","desc":"Challenge e4 immediately."},{"san":"e5","desc":"Advance Variation. Gaining space and locking the center."},{"san":"c5","desc":"Attacking the d4 pawn base."},{"san":"c3","desc":"Reinforcing d4."},{"san":"Nc6","desc":"Adding pressure on d4."},{"san":"Nf3","desc":"Defending d4."},{"san":"Qb6","desc":"Classic French setup. Pressure on b2 and d4."},{"san":"a3","desc":"Prepare b4 expansion."}
                ]
            },
            {
                "id": "french_advance_milner_barry", "name": "Advance: Milner-Barry",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"e5","desc":"Space."},{"san":"c5","desc":"Attack."},{"san":"c3","desc":"Support."},{"san":"Nc6","desc":"Develop."},{"san":"Nf3","desc":"Develop."},{"san":"Qb6","desc":"Pressure."},{"san":"Bd3","desc":"Milner-Barry Gambit!"},{"san":"cxd4","desc":"Accept?"},{"san":"cxd4","desc":"Recapture."},{"san":"Nxd4","desc":"Pawn taken."},{"san":"Nc3","desc":"Development compensation."}
                ]
            },
            {
                "id": "french_exchange", "name": "Exchange Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"exd5","desc":"Exchange. Releasing tension."},{"san":"exd5","desc":"Recapture."},{"san":"Nf3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Bd3","desc":"Active Bishop."},{"san":"Bd6","desc":"Active Bishop."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "french_winawer", "name": "Winawer Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nc3","desc":"Paulsen Attack. Defending e4."},{"san":"Bb4","desc":"Winawer! Pinning the Knight."},{"san":"e5","desc":"Gaining space."},{"san":"c5","desc":"Counter-attack center."},{"san":"a3","desc":"Putting the question to the Bishop."},{"san":"Bxc3+","desc":"Exchange."},{"san":"bxc3","desc":"White has doubled pawns but open lines."},{"san":"Ne7","desc":"Developing flexible Knight."}
                ]
            },
            {
                "id": "french_winawer_poisoned", "name": "Winawer: Poisoned Pawn",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nc3","desc":"Develop."},{"san":"Bb4","desc":"Winawer."},{"san":"e5","desc":"Space."},{"san":"c5","desc":"Break."},{"san":"a3","desc":"Kick."},{"san":"Bxc3+","desc":"Exchange."},{"san":"bxc3","desc":"Structure."},{"san":"Ne7","desc":"Develop."},{"san":"Qg4","desc":"Attack g7."},{"san":"Qc7","desc":"Counter-attack."},{"san":"Qxg7","desc":"Poisoned Pawn!"},{"san":"Rg8","desc":"Active Rook."},{"san":"Qxh7","desc":"Grab h-pawn."},{"san":"cxd4","desc":"Strike center."}
                ]
            },
            {
                "id": "french_tarrasch", "name": "Tarrasch Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French Defense."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nd2","desc":"Tarrasch. Avoiding the Winawer pin."},{"san":"c5","desc":"Striking the center immediately."},{"san":"exd5","desc":"Opening lines."},{"san":"exd5","desc":"Recapture."},{"san":"Ngf3","desc":"Develop."},{"san":"Nc6","desc":"Pressure on d4."},{"san":"Bb5","desc":"Pinning."},{"san":"Bd6","desc":"Active Bishop."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "french_tarrasch_iqp", "name": "Tarrasch: IQP Line",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nd2","desc":"Tarrasch."},{"san":"c5","desc":"Break."},{"san":"exd5","desc":"Exchange."},{"san":"exd5","desc":"Recapture."},{"san":"Ngf3","desc":"Develop."},{"san":"Nc6","desc":"Develop."},{"san":"Bb5","desc":"Pin."},{"san":"Bd6","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Nge7","desc":"Develop."},{"san":"dxc5","desc":"Isolate d5."},{"san":"Bxc5","desc":"IQP created."},{"san":"Nb3","desc":"Blockade."},{"san":"Bd6","desc":"Active."}
                ]
            },
            {
                "id": "french_rubinstein", "name": "Rubinstein Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French Defense."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nc3","desc":"Develop."},{"san":"dxe4","desc":"Rubinstein. Releasing tension."},{"san":"Nxe4","desc":"Recapture."},{"san":"Nd7","desc":"Preparing Ngf6."},{"san":"Nf3","desc":"Develop."},{"san":"Ngf6","desc":"Challenge Knight."},{"san":"Nxf6+","desc":"Exchange."},{"san":"Nxf6","desc":"Recapture."},{"san":"Bd3","desc":"Active."}
                ]
            },
            {
                "id": "french_rubinstein_endgame", "name": "Rubinstein Endgame",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nc3","desc":"Develop."},{"san":"dxe4","desc":"Rubinstein."},{"san":"Nxe4","desc":"Recapture."},{"san":"Bd7","desc":"Fort Knox setup."},{"san":"Nf3","desc":"Develop."},{"san":"Bc6","desc":"Exchange prep."},{"san":"Bd3","desc":"Active."},{"san":"Nd7","desc":"Solid."},{"san":"O-O","desc":"Safety."},{"san":"Ngf6","desc":"Challenge."},{"san":"Nxf6+","desc":"Trade."},{"san":"Nxf6","desc":"Recapture."},{"san":"Qe2","desc":"Space."}
                ]
            },
            {
                "id": "french_classical", "name": "Classical (Steinitz)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Classical."},{"san":"e5","desc":"Steinitz Variation."},{"san":"Nfd7","desc":"Retreat."},{"san":"f4","desc":"Space."},{"san":"c5","desc":"Break."},{"san":"Nf3","desc":"Support."},{"san":"Nc6","desc":"Pressure."},{"san":"Be3","desc":"Solid."}
                ]
            },
            {
                "id": "french_burn", "name": "Burn Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Classical."},{"san":"Bg5","desc":"Pin."},{"san":"dxe4","desc":"Burn Variation."},{"san":"Nxe4","desc":"Recapture."},{"san":"Be7","desc":"Unpin."},{"san":"Bxf6","desc":"Damage."},{"san":"Bxf6","desc":"Recapture."},{"san":"Nf3","desc":"Develop."},{"san":"Nd7","desc":"Solid."}
                ]
            },
            {
                "id": "french_mccutcheon", "name": "McCutcheon Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"e6","desc":"French."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Classical."},{"san":"Bg5","desc":"Pin."},{"san":"Bb4","desc":"McCutcheon! Counter-pin."},{"san":"e5","desc":"Space."},{"san":"h6","desc":"Kick."},{"san":"Bd2","desc":"Retreat."},{"san":"Bxc3","desc":"Damage."},{"san":"bxc3","desc":"Doubled pawns."},{"san":"Ne4","desc":"Outpost."},{"san":"Qg4","desc":"Attack."},{"san":"Kf8","desc":"Safe."}
                ]
            }
        ]

        # --- CARO-KANN DEFENSE VARIATIONS ---
        caroVariations = [
            {
                "id": "caro_main", "name": "Classical Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c6","desc":"Caro-Kann Defense."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nc3","desc":"Develop."},{"san":"dxe4","desc":"Take."},{"san":"Nxe4","desc":"Recapture."},{"san":"Bf5","desc":"Classical. Active Bishop."},{"san":"Ng3","desc":"Kick."},{"san":"Bg6","desc":"Safety."},{"san":"h4","desc":"Space."},{"san":"h6","desc":"Luft."},{"san":"Nf3","desc":"Develop."},{"san":"Nd7","desc":"Support."},{"san":"h5","desc":"Squeeze."},{"san":"Bh7","desc":"Safe."},{"san":"Bd3","desc":"Trade."}
                ]
            },
            {
                "id": "caro_two_knights", "name": "Two Knights Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c6","desc":"Caro."},{"san":"Nc3","desc":"Develop."},{"san":"d5","desc":"Challenge."},{"san":"Nf3","desc":"Two Knights."},{"san":"Bg4","desc":"Pin."},{"san":"h3","desc":"Kick."},{"san":"Bxf3","desc":"Trade."},{"san":"Qxf3","desc":"Recapture."},{"san":"e6","desc":"Solid."},{"san":"d3","desc":"Structure."},{"san":"Nf6","desc":"Develop."},{"san":"g3","desc":"Fianchetto."}
                ]
            },
            {
                "id": "caro_fantasy", "name": "Fantasy Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c6","desc":"Caro."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"f3","desc":"Fantasy Variation! Holding center."},{"san":"dxe4","desc":"Take."},{"san":"fxe4","desc":"Recapture."},{"san":"e5","desc":"Counter."},{"san":"Nf3","desc":"Develop."},{"san":"Bg4","desc":"Pin."},{"san":"Bc4","desc":"Active."},{"san":"Nd7","desc":"Develop."},{"san":"c3","desc":"Solid."}
                ]
            },
            {
                "id": "caro_tartakower", "name": "Tartakower (Nf6)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c6","desc":"Caro."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"Nc3","desc":"Develop."},{"san":"dxe4","desc":"Take."},{"san":"Nxe4","desc":"Recapture."},{"san":"Nf6","desc":"Tartakower."},{"san":"Nxf6+","desc":"Damage."},{"san":"exf6","desc":"Open lines."},{"san":"Nf3","desc":"Develop."},{"san":"Bd6","desc":"Active."},{"san":"Bd3","desc":"Active."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "caro_advance", "name": "Advance Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c6","desc":"Caro-Kann."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"e5","desc":"Advance. Space."},{"san":"Bf5","desc":"Active Bishop."},{"san":"Nf3","desc":"Develop."},{"san":"e6","desc":"Solid."},{"san":"Be2","desc":"Develop."},{"san":"Ne7","desc":"Flexible."},{"san":"O-O","desc":"Safety."},{"san":"c5","desc":"Break."}
                ]
            },
            {
                "id": "caro_panov", "name": "Panov Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c6","desc":"Caro-Kann."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"exd5","desc":"Exchange."},{"san":"cxd5","desc":"Recapture."},{"san":"c4","desc":"Panov Attack! IQP positions."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Pressure."},{"san":"e6","desc":"Solid."},{"san":"Nf3","desc":"Develop."},{"san":"Bb4","desc":"Pin."}
                ]
            },
            {
                "id": "caro_exchange", "name": "Exchange Variation",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"c6","desc":"Caro-Kann."},{"san":"d4","desc":"Center."},{"san":"d5","desc":"Challenge."},{"san":"exd5","desc":"Exchange."},{"san":"cxd5","desc":"Recapture."},{"san":"Bd3","desc":"Control."},{"san":"Nc6","desc":"Pressure."},{"san":"c3","desc":"Solid."},{"san":"Nf6","desc":"Develop."},{"san":"Bf4","desc":"Active."}
                ]
            }
        ]

        # --- OTHER 1.e4 OPENINGS ---
        pircVariations = [
            {
                "id": "pirc_austrian", "name": "Austrian Attack",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"d6","desc":"Pirc Defense."},{"san":"d4","desc":"Center."},{"san":"Nf6","desc":"Attack."},{"san":"Nc3","desc":"Defend."},{"san":"g6","desc":"Fianchetto."},{"san":"f4","desc":"Austrian Attack! Aggressive center."},{"san":"Bg7","desc":"Bishop."},{"san":"Nf3","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Bd3","desc":"Active."},{"san":"Nc6","desc":"Counter."}
                ]
            },
            {
                "id": "pirc_classical", "name": "Classical System",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"d6","desc":"Pirc."},{"san":"d4","desc":"Center."},{"san":"Nf6","desc":"Attack."},{"san":"Nc3","desc":"Defend."},{"san":"g6","desc":"Fianchetto."},{"san":"Nf3","desc":"Classical."},{"san":"Bg7","desc":"Bishop."},{"san":"Be2","desc":"Solid."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."}
                ]
            }
        ]

        modernVariations = [
            {
                "id": "modern_defense", "name": "Modern Defense",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"g6","desc":"Modern Defense. Hypermodern."},{"san":"d4","desc":"Center."},{"san":"Bg7","desc":"Fianchetto."},{"san":"Nc3","desc":"Develop."},{"san":"d6","desc":"Control."},{"san":"f4","desc":"Space."},{"san":"c6","desc":"Flexible."},{"san":"Nf3","desc":"Develop."},{"san":"Nd7","desc":"Solid."}
                ]
            }
        ]

        alekhineVariations = [
            {
                "id": "alekhine_defense", "name": "Alekhine Defense (Main)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"Nf6","desc":"Alekhine Defense. Provoking e5."},{"san":"e5","desc":"Kick."},{"san":"Nd5","desc":"Knight jumps."},{"san":"d4","desc":"Space."},{"san":"d6","desc":"Challenge."},{"san":"Nf3","desc":"Modern Main Line."},{"san":"g6","desc":"Fianchetto."},{"san":"Bc4","desc":"Active."},{"san":"Nb6","desc":"Retreat."},{"san":"Bb3","desc":"Safe."}
                ]
            }
        ]

        scandiVariations = [
            {
                "id": "scandi_modern", "name": "Scandinavian (Modern)",
                "moves": [
                    {"san":"e4","desc":"King's Pawn."},{"san":"d5","desc":"Scandinavian Defense."},{"san":"exd5","desc":"Take."},{"san":"Nf6","desc":"Modern Variation. Gambit style."},{"san":"d4","desc":"Center."},{"san":"Nxd5","desc":"Recapture."},{"san":"c4","desc":"Kick."},{"san":"Nb6","desc":"Retreat."},{"san":"Nf3","desc":"Develop."},{"san":"g6","desc":"Fianchetto."},{"san":"Nc3","desc":"Develop."},{"san":"Bg7","desc":"Bishop."}
                ]
            }
        ]

        # --- QUEEN'S GAMBIT VARIATIONS ---
        qgVariations = [
            {
                "id": "qg_exchange", "name": "Exchange Variation",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"Queen's Gambit."},{"san":"e6","desc":"Declined."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"cxd5","desc":"Exchange."},{"san":"exd5","desc":"Recapture."},{"san":"Bg5","desc":"Pin."},{"san":"Be7","desc":"Unpin."},{"san":"e3","desc":"Solid."},{"san":"O-O","desc":"Safety."},{"san":"Bd3","desc":"Active."}
                ]
            }
        ]

        # --- QGD VARIATIONS ---
        qgdVariations = [
            {
                "id": "qgd_orthodox", "name": "Orthodox Defense",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"Queen's Gambit."},{"san":"e6","desc":"QGD."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Knight out."},{"san":"Bg5","desc":"Pinning."},{"san":"Be7","desc":"Unpin."},{"san":"e3","desc":"Solidify."},{"san":"O-O","desc":"Safety."},{"san":"Nf3","desc":"Develop."},{"san":"Nbd7","desc":"Capablanca's move."},{"san":"Rc1","desc":"Rook to file."},{"san":"c6","desc":"Solid structure."}
                ]
            },
            {
                "id": "qgd_minority", "name": "Exchange (Minority Attack)",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"e6","desc":"QGD."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"cxd5","desc":"Exchange."},{"san":"exd5","desc":"Recapture."},{"san":"Bg5","desc":"Pin."},{"san":"Be7","desc":"Unpin."},{"san":"e3","desc":"Solid."},{"san":"O-O","desc":"Safety."},{"san":"Bd3","desc":"Bishop."},{"san":"Nbd7","desc":"Develop."},{"san":"Nge2","desc":"Plan f3/e4 or 0-0."},{"san":"Rb1","desc":"Prep b4 (Minority Attack)."}
                ]
            },
            {
                "id": "qgd_tartakower_b6", "name": "Tartakower Defense",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"e6","desc":"QGD."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Bg5","desc":"Pin."},{"san":"Be7","desc":"Unpin."},{"san":"e3","desc":"Solid."},{"san":"O-O","desc":"Safety."},{"san":"Nf3","desc":"Develop."},{"san":"h6","desc":"Kick."},{"san":"Bh4","desc":"Retreat."},{"san":"b6","desc":"Tartakower! Fianchetto."},{"san":"cxd5","desc":"Exchange."},{"san":"Nxd5","desc":"Recapture."},{"san":"Bxe7","desc":"Trade."},{"san":"Qxe7","desc":"Recapture."}
                ]
            },
            {
                "id": "qgd_lasker", "name": "Lasker Defense",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"e6","desc":"QGD."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Bg5","desc":"Pin."},{"san":"Be7","desc":"Unpin."},{"san":"e3","desc":"Solid."},{"san":"O-O","desc":"Safety."},{"san":"Nf3","desc":"Develop."},{"san":"h6","desc":"Kick."},{"san":"Bh4","desc":"Retreat."},{"san":"Ne4","desc":"Lasker! Simplifying."},{"san":"Bxe7","desc":"Trade."},{"san":"Qxe7","desc":"Recapture."},{"san":"Rc1","desc":"Control."},{"san":"Nxc3","desc":"Trade."},{"san":"Rxc3","desc":"Recapture."}
                ]
            },
            {
                "id": "qgd_ragozin", "name": "Ragozin Defense",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"e6","desc":"QGD."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nf3","desc":"Develop."},{"san":"Bb4","desc":"Ragozin! Active pin."},{"san":"Bg5","desc":"Pin."},{"san":"h6","desc":"Kick."},{"san":"Bxf6","desc":"Trade."},{"san":"Qxf6","desc":"Recapture."},{"san":"e3","desc":"Solid."},{"san":"O-O","desc":"Safety."},{"san":"Bd3","desc":"Active."}
                ]
            },
            {
                "id": "qgd_tarrasch", "name": "Tarrasch Defense",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"e6","desc":"QGD."},{"san":"Nc3","desc":"Develop."},{"san":"c5","desc":"Tarrasch! Active center."},{"san":"cxd5","desc":"Open."},{"san":"exd5","desc":"Recapture."},{"san":"Nf3","desc":"Develop."},{"san":"Nc6","desc":"Develop."},{"san":"g3","desc":"Rubinstein var."},{"san":"Nf6","desc":"Develop."},{"san":"Bg2","desc":"Fianchetto."},{"san":"Be7","desc":"Develop."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "qgd_semi_tarrasch", "name": "Semi-Tarrasch",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"e6","desc":"QGD."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nf3","desc":"Develop."},{"san":"c5","desc":"Semi-Tarrasch."},{"san":"cxd5","desc":"Exchange."},{"san":"Nxd5","desc":"Recapture."},{"san":"e3","desc":"Solid."},{"san":"Nc6","desc":"Develop."},{"san":"Bd3","desc":"Active."},{"san":"cxd4","desc":"Trade."},{"san":"exd4","desc":"IQP."}
                ]
            }
        ]

        qgaVariations = [
            {
                "id": "qga_main", "name": "Queen's Gambit Accepted",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"Queen's Gambit."},{"san":"dxc4","desc":"Accepted! Open game."},{"san":"e4","desc":"Center grab."},{"san":"e5","desc":"Counter-strike."},{"san":"Nf3","desc":"Develop."},{"san":"exd4","desc":"Trade."},{"san":"Bxc4","desc":"Recapture."},{"san":"Nc6","desc":"Develop."},{"san":"O-O","desc":"Safety."}
                ]
            }
        ]

        # --- SLAV DEFENSE VARIATIONS ---
        slavVariations = [
            {
                "id": "slav_main", "name": "Slav Main Line",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"c6","desc":"Slav Defense. Solid."},{"san":"Nf3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Pressure."},{"san":"dxc4","desc":"Main Line take."},{"san":"a4","desc":"Prevent b5."},{"san":"Bf5","desc":"Active Bishop."},{"san":"e3","desc":"Solid."},{"san":"e6","desc":"Solid."},{"san":"Bxc4","desc":"Recapture."},{"san":"Bb4","desc":"Active."}
                ]
            },
            {
                "id": "slav_main_a4_deep", "name": "Slav: Dutch Variation",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"c6","desc":"Slav."},{"san":"Nf3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Pressure."},{"san":"dxc4","desc":"Take."},{"san":"a4","desc":"Stop b5."},{"san":"Bf5","desc":"Bishop out."},{"san":"e3","desc":"Solid."},{"san":"e6","desc":"Solid."},{"san":"Bxc4","desc":"Recapture."},{"san":"Bb4","desc":"Pin."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."},{"san":"Qe2","desc":"Plan e4."},{"san":"Nbd7","desc":"Develop."}
                ]
            },
            {
                "id": "slav_exchange", "name": "Exchange Slav",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"c6","desc":"Slav."},{"san":"cxd5","desc":"Exchange."},{"san":"cxd5","desc":"Recapture."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nf3","desc":"Develop."},{"san":"Nc6","desc":"Symmetrical."},{"san":"Bf4","desc":"Active."},{"san":"Bf5","desc":"Copycat."},{"san":"e3","desc":"Solid."},{"san":"e6","desc":"Solid."}
                ]
            },
            {
                "id": "slav_chebanenko", "name": "Chebanenko Slav",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"c6","desc":"Slav."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nf3","desc":"Develop."},{"san":"a6","desc":"Chebanenko. Waiting move."},{"san":"c5","desc":"Space squeeze."},{"san":"Bf5","desc":"Active."},{"san":"Bf4","desc":"Active."},{"san":"e6","desc":"Solid."},{"san":"e3","desc":"Solid."}
                ]
            }
        ]

        semiSlavVariations = [
            {
                "id": "semislav_meran", "name": "Meran Variation",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"c6","desc":"Slav."},{"san":"Nf3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"e6","desc":"Semi-Slav."},{"san":"e3","desc":"Solid."},{"san":"Nbd7","desc":"Develop."},{"san":"Bd3","desc":"Active."},{"san":"dxc4","desc":"Meran start."},{"san":"Bxc4","desc":"Recapture."},{"san":"b5","desc":"Expand."},{"san":"Bd3","desc":"Retreat."},{"san":"a6","desc":"Prepare c5."},{"san":"e4","desc":"Center push."}
                ]
            },
            {
                "id": "semislav_meran_main", "name": "Meran (Main Line)",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"c6","desc":"Slav."},{"san":"Nf3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"e6","desc":"Semi-Slav."},{"san":"e3","desc":"Solid."},{"san":"Nbd7","desc":"Develop."},{"san":"Bd3","desc":"Active."},{"san":"dxc4","desc":"Meran."},{"san":"Bxc4","desc":"Recapture."},{"san":"b5","desc":"Space."},{"san":"Bd3","desc":"Retreat."},{"san":"a6","desc":"Prep."},{"san":"e4","desc":"Strike."},{"san":"c5","desc":"Break."},{"san":"e5","desc":"Advanced."},{"san":"cxd4","desc":"Trade."},{"san":"Nxb5","desc":"Sacrifice."}
                ]
            },
            {
                "id": "semislav_botvinnik", "name": "Botvinnik System",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"c6","desc":"Slav."},{"san":"Nf3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"e6","desc":"Semi-Slav."},{"san":"Bg5","desc":"Sharpest."},{"san":"dxc4","desc":"Botvinnik!"},{"san":"e4","desc":"Center."},{"san":"b5","desc":"Hang on."},{"san":"e5","desc":"Attack pinned N."},{"san":"h6","desc":"Kick."},{"san":"Bh4","desc":"Retreat."},{"san":"g5","desc":"Crazy."},{"san":"Nxg5","desc":"Sacrifice."},{"san":"hxg5","desc":"Open h-file."}
                ]
            },
            {
                "id": "semislav_moscow", "name": "Moscow Variation",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"c6","desc":"Slav."},{"san":"Nf3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"e6","desc":"Semi-Slav."},{"san":"Bg5","desc":"Pin."},{"san":"h6","desc":"Moscow."},{"san":"Bxf6","desc":"Trade."},{"san":"Qxf6","desc":"Recapture."},{"san":"e3","desc":"Solid."},{"san":"Nd7","desc":"Develop."},{"san":"Bd3","desc":"Active."}
                ]
            },
            {
                "id": "semislav_anti_moscow", "name": "Anti-Moscow Gambit",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"c4","desc":"QG."},{"san":"c6","desc":"Slav."},{"san":"Nf3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nc3","desc":"Develop."},{"san":"e6","desc":"Semi-Slav."},{"san":"Bg5","desc":"Pin."},{"san":"h6","desc":"Check."},{"san":"Bh4","desc":"Retreat."},{"san":"g5","desc":"Anti-Moscow."},{"san":"Bg3","desc":"Safe."},{"san":"dxc4","desc":"Take."},{"san":"e4","desc":"Center."},{"san":"b5","desc":"Defend."}
                ]
            }
        ]

        # --- INDIAN DEFENSES ---
        nimzoVariations = [
            {
                "id": "nimzo_classical", "name": "Nimzo: Classical (4.Qc2)",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian Defense."},{"san":"c4","desc":"Center."},{"san":"e6","desc":"Nimzo setup."},{"san":"Nc3","desc":"Develop."},{"san":"Bb4","desc":"Nimzo-Indian. Pinning."},{"san":"Qc2","desc":"Classical. Avoiding doubled pawns."},{"san":"O-O","desc":"Safety."},{"san":"a3","desc":"Put the question."},{"san":"Bxc3+","desc":"Exchange."},{"san":"Qxc3","desc":"Recapture."},{"san":"b6","desc":"Fianchetto."},{"san":"Bg5","desc":"Pin."}
                ]
            },
            {
                "id": "nimzo_rubinstein", "name": "Nimzo: Rubinstein (4.e3)",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"e6","desc":"Nimzo."},{"san":"Nc3","desc":"Develop."},{"san":"Bb4","desc":"Nimzo."},{"san":"e3","desc":"Rubinstein. Solid."},{"san":"O-O","desc":"Safety."},{"san":"Bd3","desc":"Active."},{"san":"d5","desc":"Strike."},{"san":"Nf3","desc":"Develop."},{"san":"c5","desc":"Counter-strike."},{"san":"O-O","desc":"Safety."}
                ]
            }
        ]

        qidVariations = [
            {
                "id": "qid_main", "name": "Queen's Indian (Main)",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"e6","desc":"Prep."},{"san":"Nf3","desc":"Prevent Nimzo."},{"san":"b6","desc":"Queen's Indian."},{"san":"g3","desc":"Fianchetto."},{"san":"Ba6","desc":"Challenge c4."},{"san":"b3","desc":"Defend."},{"san":"Bg7","desc":"Fianchetto."},{"san":"Bg2","desc":"Fianchetto."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."}
                ]
            }
        ]

        kidVariations = [
            {
                "id": "kid_classical", "name": "KID: Classical Main Line",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"g6","desc":"KID setup."},{"san":"Nc3","desc":"Develop."},{"san":"Bg7","desc":"Fianchetto."},{"san":"e4","desc":"Big center."},{"san":"d6","desc":"Control."},{"san":"Nf3","desc":"Classical."},{"san":"O-O","desc":"Safety."},{"san":"Be2","desc":"Development."},{"san":"e5","desc":"Strike center."},{"san":"O-O","desc":"Safety."},{"san":"Nc6","desc":"Pressure."},{"san":"d5","desc":"Close center."},{"san":"Ne7","desc":"Retreat for attack."}
                ]
            },
            {
                "id": "kid_bayonet", "name": "KID: Bayonet Attack",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"g6","desc":"KID."},{"san":"Nc3","desc":"Develop."},{"san":"Bg7","desc":"Bishop."},{"san":"e4","desc":"Space."},{"san":"d6","desc":"Control."},{"san":"Nf3","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be2","desc":"Develop."},{"san":"e5","desc":"Strike."},{"san":"O-O","desc":"Safety."},{"san":"Nc6","desc":"Develop."},{"san":"d5","desc":"Close."},{"san":"Ne7","desc":"Retreat."},{"san":"b4","desc":"The Bayonet! Queenside storm."},{"san":"Nh5","desc":"Kingside play."},{"san":"Re1","desc":"Prophylaxis."},{"san":"f5","desc":"Break."}
                ]
            },
            {
                "id": "kid_gligoric", "name": "KID: Gligoric System",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"g6","desc":"KID."},{"san":"Nc3","desc":"Develop."},{"san":"Bg7","desc":"Bishop."},{"san":"e4","desc":"Space."},{"san":"d6","desc":"Control."},{"san":"Nf3","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be2","desc":"Develop."},{"san":"e5","desc":"Strike."},{"san":"Be3","desc":"Gligoric."},{"san":"Ng4","desc":"Harass."},{"san":"Bg5","desc":"Active."},{"san":"f6","desc":"Kick."},{"san":"Bc1","desc":"Retreat."}
                ]
            },
            {
                "id": "kid_petrosian", "name": "KID: Petrosian System",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"g6","desc":"KID."},{"san":"Nc3","desc":"Develop."},{"san":"Bg7","desc":"Bishop."},{"san":"e4","desc":"Space."},{"san":"d6","desc":"Control."},{"san":"Nf3","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Be2","desc":"Develop."},{"san":"e5","desc":"Strike."},{"san":"d5","desc":"Close."},{"san":"e7","desc":"Wait... wait. (Typo fix: this is Petrosian line)."},{"san":"Bg5","desc":"Petrosian System."},{"san":"h6","desc":"Kick."},{"san":"Bh4","desc":"Retreat."},{"san":"g5","desc":"Aggressive."},{"san":"Bg3","desc":"Safety."},{"san":"Nh5","desc":"Attack."}
                ]
            },
            {
                "id": "kid_averbakh", "name": "KID: Averbakh Variation",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"g6","desc":"KID."},{"san":"Nc3","desc":"Develop."},{"san":"Bg7","desc":"Bishop."},{"san":"e4","desc":"Space."},{"san":"d6","desc":"Control."},{"san":"Be2","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"Bg5","desc":"Averbakh. Pinning."},{"san":"c5","desc":"Counter-strike."},{"san":"d5","desc":"Close."},{"san":"e6","desc":"Break."},{"san":"Qd2","desc":"Battery."},{"san":"exd5","desc":"Open."},{"san":"cxd5","desc":"Recapture."}
                ]
            },
            {
                "id": "kid_makogonov", "name": "KID: Makogonov System",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"g6","desc":"KID."},{"san":"Nc3","desc":"Develop."},{"san":"Bg7","desc":"Bishop."},{"san":"e4","desc":"Space."},{"san":"d6","desc":"Control."},{"san":"h3","desc":"Makogonov. Anti-Ng4/Bg4."},{"san":"O-O","desc":"Safety."},{"san":"Be3","desc":"Develop."},{"san":"e5","desc":"Strike."},{"san":"d5","desc":"Close."},{"san":"c6","desc":"Break."},{"san":"Nf3","desc":"Develop."},{"san":"cxd5","desc":"Exchange."},{"san":"cxd5","desc":"Recapture."}
                ]
            },
            {
                "id": "kid_saemisch", "name": "KID: Sämisch Variation",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"g6","desc":"KID."},{"san":"Nc3","desc":"Develop."},{"san":"Bg7","desc":"Bishop."},{"san":"e4","desc":"Space."},{"san":"d6","desc":"Control."},{"san":"f3","desc":"Sämisch! Solid wall."},{"san":"O-O","desc":"Safety."},{"san":"Be3","desc":"Develop."},{"san":"e5","desc":"Strike."},{"san":"d5","desc":"Close."},{"san":"c5","desc":"Break."},{"san":"Nge2","desc":"Develop."}
                ]
            }
        ]

        grunfeldVariations = [
            {
                "id": "grunfeld_exchange", "name": "Grünfeld Exchange",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"g6","desc":"Prep."},{"san":"Nc3","desc":"Develop."},{"san":"d5","desc":"Grünfeld Defense."},{"san":"cxd5","desc":"Exchange."},{"san":"Nxd5","desc":"Recapture."},{"san":"e4","desc":"Big center."},{"san":"Nxc3","desc":"Exchange."},{"san":"bxc3","desc":"Big center."},{"san":"Bg7","desc":"Fianchetto pressure."},{"san":"Bc4","desc":"Active."},{"san":"c5","desc":"Strike d4."},{"san":"Ne2","desc":"Support."}
                ]
            }
        ]

        # --- D4 SYSTEMS ---
        londonVariations = [
            {
                "id": "london_system", "name": "London System (Main)",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"d5","desc":"Symmetrical."},{"san":"Bf4","desc":"The London System."},{"san":"Nf6","desc":"Develop."},{"san":"e3","desc":"Solid pyramid."},{"san":"c5","desc":"Challenge center."},{"san":"c3","desc":"Reinforce."},{"san":"Nc6","desc":"Develop."},{"san":"Nd2","desc":"Control e4."},{"san":"e6","desc":"Solid."},{"san":"Ngf3","desc":"Develop."},{"san":"Bd6","desc":"Challenge Bishop."},{"san":"Bg3","desc":"Retreat."},{"san":"O-O","desc":"Safety."}
                ]
            }
        ]

        trompowskyVariations = [
            {
                "id": "trompowsky_main", "name": "Trompowsky Attack",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"Bg5","desc":"Trompowsky! Aggressive."},{"san":"Ne4","desc":"Jump."},{"san":"Bf4","desc":"Retreat."},{"san":"c5","desc":"Strike."},{"san":"f3","desc":"Kick."},{"san":"Qa5+","desc":"Check."},{"san":"c3","desc":"Block."},{"san":"Nf6","desc":"Retreat."},{"san":"d5","desc":"Space."}
                ]
            }
        ]

        dutchVariations = [
            {
                "id": "dutch_leningrad", "name": "Leningrad Dutch",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"f5","desc":"Dutch Defense."},{"san":"g3","desc":"Fianchetto."},{"san":"Nf6","desc":"Develop."},{"san":"Bg2","desc":"Control."},{"san":"g6","desc":"Leningrad."},{"san":"Nf3","desc":"Develop."},{"san":"Bg7","desc":"Bishop."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."},{"san":"c4","desc":"Space."},{"san":"d6","desc":"Control e5."},{"san":"Nc3","desc":"Develop."}
                ]
            }
        ]

        benoniVariations = [
            {
                "id": "benoni_modern", "name": "Modern Benoni",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"c5","desc":"Benoni."},{"san":"d5","desc":"Advance."},{"san":"e6","desc":"Challenge."},{"san":"Nc3","desc":"Develop."},{"san":"exd5","desc":"Trade."},{"san":"cxd5","desc":"Recapture."},{"san":"d6","desc":"Stop e5."},{"san":"e4","desc":"Center."},{"san":"g6","desc":"Fianchetto."},{"san":"Nf3","desc":"Develop."},{"san":"Bg7","desc":"Bishop."},{"san":"h3","desc":"Prophylaxis."},{"san":"O-O","desc":"Safety."},{"san":"Bd3","desc":"Develop."}
                ]
            }
        ]

        benkoVariations = [
            {
                "id": "benko_gambit", "name": "Benko Gambit",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"c5","desc":"Benoni."},{"san":"d5","desc":"Advance."},{"san":"b5","desc":"Benko Gambit!"},{"san":"cxb5","desc":"Accepted."},{"san":"a6","desc":"Challenge."},{"san":"bxa6","desc":"Greedy."},{"san":"Bxa6","desc":"Recapture."},{"san":"Nc3","desc":"Develop."},{"san":"d6","desc":"Solid."},{"san":"e4","desc":"Center."},{"san":"Bxf1","desc":"Remove caster."},{"san":"Kxf1","desc":"King walk."},{"san":"g6","desc":"Fianchetto."}
                ]
            }
        ]

        catalanVariations = [
            {
                "id": "catalan_open", "name": "Catalan (Open)",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"e6","desc":"Solid."},{"san":"g3","desc":"Catalan."},{"san":"d5","desc":"Center."},{"san":"Bg2","desc":"Bishop."},{"san":"Be7","desc":"Develop."},{"san":"Nf3","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."},{"san":"dxc4","desc":"Open Catalan."},{"san":"Qc2","desc":"Regain pawn."},{"san":"a6","desc":"Expansion."},{"san":"Qxc4","desc":"Recapture."},{"san":"b5","desc":"Kick."},{"san":"Qc2","desc":"Retreat."}
                ]
            },
            {
                "id": "catalan_open_b5", "name": "Catalan: Open 6...dc4",
                "moves": [
                    {"san":"d4","desc":"Queen's Pawn."},{"san":"Nf6","desc":"Indian."},{"san":"c4","desc":"Center."},{"san":"e6","desc":"Solid."},{"san":"g3","desc":"Catalan."},{"san":"d5","desc":"Center."},{"san":"Bg2","desc":"Bishop."},{"san":"Be7","desc":"Develop."},{"san":"Nf3","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"dxc4","desc":"Open."},{"san":"Qc2","desc":"Recover."},{"san":"a6","desc":"Prep b5."},{"san":"a4","desc":"Stop b5."},{"san":"Bd7","desc":"Develop."},{"san":"Qxc4","desc":"Take."},{"san":"Bc6","desc":"Control diagonal."}
                ]
            }
        ]

        # --- FLANK OPENINGS ---
        englishVariations = [
            {
                "id": "english_sicilian", "name": "Reversed Sicilian",
                "moves": [
                    {"san":"c4","desc":"English Opening."},{"san":"e5","desc":"King's English. Reversed Sicilian."},{"san":"Nc3","desc":"Develop."},{"san":"Nf6","desc":"Develop."},{"san":"Nf3","desc":"Attack e5."},{"san":"Nc6","desc":"Defend."},{"san":"g3","desc":"Fianchetto."},{"san":"Bb4","desc":"Active."},{"san":"Bg2","desc":"Control."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."}
                ]
            },
            {
                "id": "eng_botvinnik", "name": "Botvinnik System",
                "moves": [
                    {"san":"c4","desc":"English."},{"san":"e5","desc":"Reverse Sicilian."},{"san":"Nc3","desc":"Develop."},{"san":"Nc6","desc":"Develop."},{"san":"g3","desc":"Fianchetto."},{"san":"g6","desc":"Symmetrical."},{"san":"Bg2","desc":"Bishop."},{"san":"Bg7","desc":"Bishop."},{"san":"d3","desc":"Control."},{"san":"d6","desc":"Control."},{"san":"e4","desc":"Botvinnik! Clamp."},{"san":"Nge2","desc":"Develop."},{"san":"Nge2","desc":"Develop."},{"san":"O-O","desc":"Safety."},{"san":"O-O","desc":"Safety."}
                ]
            }
        ]
        
        # --- MAIN DATABASE STRUCTURE ---
        data = {
            "1.e4 — King’s Pawn Openings": [
                { "id": "ruy_lopez", "name": "Ruy López", "tags": "White, Open Game", "variations": ruyLopezVariations },
                { "id": "italian", "name": "Italian Game", "tags": "White, Open Game", "variations": italianVariations },
                { "id": "scotch", "name": "Scotch Game", "tags": "White, Open Game", "variations": scotchVariations },
                { "id": "four_knights", "name": "Four Knights Game", "tags": "White, Open Game", "variations": fourKnightsVariations },
                { "id": "petrov", "name": "Petrov Defense", "tags": "Black, Open Game", "variations": petrovVariations },
                { "id": "vienna", "name": "Vienna Game", "tags": "White, Open Game", "variations": viennaVariations },
                { "id": "philidor", "name": "Philidor Defense", "tags": "Black, Open Game", "variations": philidorVariations },
                { "id": "sicilian", "name": "Sicilian Defense", "tags": "Black, Semi-Open", "variations": sicilianVariations },
                { "id": "french", "name": "French Defense", "tags": "Black, Semi-Open", "variations": frenchVariations },
                { "id": "caro", "name": "Caro-Kann Defense", "tags": "Black, Semi-Open", "variations": caroVariations },
                { "id": "pirc", "name": "Pirc Defense", "tags": "Black, Semi-Open", "variations": pircVariations },
                { "id": "modern", "name": "Modern Defense", "tags": "Black, Semi-Open", "variations": modernVariations },
                { "id": "alekhine", "name": "Alekhine Defense", "tags": "Black, Semi-Open", "variations": alekhineVariations },
                { "id": "scandi", "name": "Scandinavian Defense", "tags": "Black, Semi-Open", "variations": scandiVariations }
            ],
            "1.d4 — Queen’s Pawn Openings": [
                { "id": "qg", "name": "Queen's Gambit", "tags": "White, Closed Game", "variations": qgVariations },
                { "id": "qgd", "name": "Queen's Gambit Declined", "tags": "Black, Closed Game", "variations": qgdVariations },
                { "id": "qga", "name": "Queen's Gambit Accepted", "tags": "Black, Closed Game", "variations": qgaVariations },
                { "id": "slav", "name": "Slav Defense", "tags": "Black, Closed Game", "variations": slavVariations },
                { "id": "semi_slav", "name": "Semi-Slav Defense", "tags": "Black, Closed Game", "variations": semiSlavVariations },
                { "id": "nimzo", "name": "Nimzo-Indian Defense", "tags": "Black, Indian Game", "variations": nimzoVariations },
                { "id": "qid", "name": "Queen's Indian Defense", "tags": "Black, Indian Game", "variations": qidVariations },
                { "id": "kid", "name": "King's Indian Defense", "tags": "Black, Indian Game", "variations": kidVariations },
                { "id": "grunfeld", "name": "Grünfeld Defense", "tags": "Black, Indian Game", "variations": grunfeldVariations },
                { "id": "london", "name": "London System", "tags": "White, Closed Game", "variations": londonVariations },
                { "id": "trompowsky", "name": "Trompowsky Attack", "tags": "White, Closed Game", "variations": trompowskyVariations },
                { "id": "dutch", "name": "Dutch Defense", "tags": "Black, Closed Game", "variations": dutchVariations },
                { "id": "benoni", "name": "Benoni Defense", "tags": "Black, Closed Game", "variations": benoniVariations },
                { "id": "benko", "name": "Benko Gambit", "tags": "Black, Closed Game", "variations": benkoVariations },
                { "id": "catalan", "name": "Catalan Opening", "tags": "White, Closed Game", "variations": catalanVariations }
            ],
            "Flank Openings": [
                { "id": "english", "name": "English Opening", "tags": "White, Flank", "variations": englishVariations }
                # Reti, etc. could go here
            ]
        }
        
        # --- LOADING LOGIC (IDEMPOTENT) ---
        total_openings = 0
        total_variations = 0

        # Create Categories and Openings
        # Note: We comment out the deletion to be safe, or we use update_or_create
        # OpeningCategory.objects.all().delete() 

        for cat_name, openings in data.items():
            category, _ = OpeningCategory.objects.get_or_create(name=cat_name)
            
            for op_data in openings:
                opening, _ = Opening.objects.update_or_create(
                    slug=op_data["id"],
                    defaults={
                        "category": category,
                        "name": op_data["name"],
                        "tags": op_data["tags"]
                    }
                )
                total_openings += 1
                
                # Variations
                for var_data in op_data["variations"]:
                    # Enrich with metadata
                    diff, goal, theme_list = get_meta(var_data["id"])
                    
                    Variation.objects.update_or_create(
                        slug=var_data["id"],
                        opening=opening,
                        defaults={
                            "name": var_data["name"],
                            "moves": var_data["moves"],
                            "difficulty": diff,
                            "training_goal": goal,
                            "themes": theme_list
                        }
                    )
                    total_variations += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully loaded {total_openings} openings and {total_variations} variations with enhanced metadata'))
