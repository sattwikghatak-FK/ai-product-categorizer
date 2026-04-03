import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const CHUNK   = 50000;
const PAL = ["#60a5fa","#34d399","#fbbf24","#f87171","#a78bfa","#22d3ee","#fb923c","#f472b6","#4ade80","#818cf8","#2dd4bf","#facc15","#c084fc","#67e8f9","#fdba74"];

// ── TAXONOMY ──────────────────────────────────────────────────────────────────
const TAXONOMY = {

  // ─── KIDS & BABY CLOTHING ──────────────────────────────────────────────────
  "Kids & Baby Clothing": {
    "Night Suits & Sleepwear":    ["night suit","nightsuit","night wear","nightwear","sleepwear","sleeping suit","pyjama set","pajama set","co-ord night","night dress","nighty","sleep set","loungewear set"],
    "T-Shirts & Tops":            ["t-shirt","tshirt","tee","printed top","half sleeves top","full sleeves top","sleeveless top","colorblocked top","co-ord top","knit top","cotton top","graphic tee","text print top"],
    "Sweaters & Sweatshirts":     ["sweater","sweatshirt","sweatjacket","pullover","hooded sweater","front open sweater","knit sweater","woollen","fleece sweater","cardigan","knitted sweater","jumper","winter wear sweater","fur lined"],
    "Jackets & Winterwear":       ["jacket","winter jacket","puffer jacket","quilted jacket","hooded jacket","windcheater","front open jacket","sweat jacket","kangaroo pocket","hoodie","zip jacket","bomber jacket","winter wear"],
    "Joggers & Track Pants":      ["jogger","track pant","trackpant","cargo jogger","knit jogger","lounge pant","casual pant","bottom wear","cargo pant","cotton jogger","printed jogger","solid jogger"],
    "Sets & Co-ords":             ["set","co-ord","co ord","suit set","top & jogger","top and jogger","top & pant","tee & jogger","night suit set","tracksuit","clothing set","outfit set","2 piece","3 piece","gift set","party suit"],
    "Thermal & Innerwear":        ["thermal","thermal set","thermal wear","inner wear","innerwear","vest","banyan","thermal inner","woollen inner","bodysuit","onesie","full body"],
    "Ethnic & Festive Wear":      ["sherwani","kurta pyjama","ethnic suit","festive wear","dhoti kurta","indo western","bandhgala","party suit","traditional wear","achkan","nawabi"],
    "Frocks & Dresses":           ["frock","dress","skirt","gown","floral dress","party dress","midi dress","baby dress","girls dress","printed dress","cotton dress","net dress"],
    "Rompers & Onesies":          ["romper","onesie","bodysuit","jumpsuit","dungaree","playsuit","all in one","baby romper","infant romper","short romper","sleepsuit"],
    "School & Uniform Wear":      ["school uniform","uniform","school dress","pinafore","blazer school","tie school"],
    "Caps & Accessories":         ["cap","beanie","booties","mittens","gloves kids","scarf kids","muffler","hat infant","baby cap","woollen cap","knitted cap","baby booties"],
    "Bathrobes & Towels":         ["bathrobe","bath robe","hooded bathrobe","towel kids","baby towel","terry robe","bath towel pack","microfiber towel"],
  },

  // ─── ADULT CLOTHING ───────────────────────────────────────────────────────
  "Men's Clothing": {
    "T-Shirts & Polos":           ["men t-shirt","mens tee","polo shirt","men polo","half sleeve shirt","printed tee men","plain tee","round neck tee","v-neck tee"],
    "Shirts":                     ["men shirt","formal shirt","casual shirt","check shirt","linen shirt","oxford shirt","slim fit shirt","regular fit shirt","party shirt"],
    "Trousers & Jeans":           ["men trouser","men jeans","chinos","cargo trousers","formal trousers","slim fit jeans","straight jeans","men denim","men pant"],
    "Ethnic Wear Men":            ["kurta","kurta pyjama","men sherwani","men dhoti","men lungi","men ethnic","nehru jacket","men bandhgala"],
    "Jackets & Hoodies":          ["men jacket","men hoodie","men sweatshirt","men pullover","men blazer","men coat","men windcheater","bomber jacket men"],
    "Innerwear & Socks":          ["men brief","men boxer","men trunk","men vest","men innerwear","men socks","ankle socks","men underwear"],
    "Activewear":                 ["men track pant","men jogger","men gym wear","men shorts","men cycling shorts","men activewear","gym t-shirt","compression tights"],
    "Winterwear":                 ["men sweater","men cardigan","men pullover","men thermal","men muffler","men woollen","men fleece"],
  },
  "Women's Clothing": {
    "Tops & Blouses":             ["women top","ladies top","women blouse","crop top","cami top","women tunic","women kurti","women shirt","off shoulder","peplum top","halter top","tank top women"],
    "Sarees":                     ["saree","sari","cotton saree","silk saree","chiffon saree","printed saree","embroidered saree","banarasi","kanjivaram","georgette saree"],
    "Salwar & Kurtas":            ["salwar kameez","salwar suit","anarkali","churidar","women kurta","kurti","palazzo kurta","straight kurta","flared kurta","a-line kurta"],
    "Lehenga & Ethnic":           ["lehenga","lehenga choli","chaniya choli","women ethnic","festive suit","gharara","sharara","women sherwani"],
    "Dresses":                    ["women dress","maxi dress","midi dress","mini dress","bodycon","wrap dress","shirt dress","sundress","floral dress women","casual dress"],
    "Jeans & Trousers":           ["women jeans","ladies jeans","women trouser","palazzo","women chinos","women denim","skinny jeans","bootcut jeans"],
    "Innerwear & Lingerie":       ["bra","panty","women brief","lingerie","shapewear","sports bra","bralette","padded bra","women innerwear","women underwear"],
    "Nightwear & Lounge":         ["women nightwear","women pyjama","women nightgown","night dress women","women loungewear","women robe","women sleepwear","nighty"],
    "Jackets & Shrugs":           ["women jacket","shrug","women hoodie","women blazer","women cardigan","women coat","women sweatshirt","women pullover"],
    "Winterwear":                 ["women sweater","women woollen","women thermal","women muffler","women shawl","women stole","women fleece"],
  },

  // ─── FOOTWEAR ─────────────────────────────────────────────────────────────
  "Kids Footwear": {
    "Casual Shoes":               ["casual shoes","velcro shoes","kids casual","slip on shoes","kids sneaker","canvas shoes kids","school shoes","children shoes","kids trainers","printed shoes","animal print shoes","floral shoes"],
    "Sandals & Slippers":         ["kids sandal","baby sandal","kids slipper","velcro sandal","solid sandal","cap toe sandal","strap sandal","kids chappal","kids flip flop","infant sandal"],
    "Formal & Party Shoes":       ["formal shoes kids","party shoes kids","slip on formal","kids loafer","dress shoes kids","bow shoes","kids oxford"],
    "Boots & Mojaris":            ["kids boot","ankle boot kids","mojari","jutti kids","ethnic shoes","embroidered shoes","sequin shoes","textured mojari"],
    "Clogs & Mules":              ["clog","mule kids","slip on clog","bow clog","kids clogs","easy wear"],
    "First Walker":               ["first walker","baby walker shoe","infant shoe","newborn shoe","toddler shoe","soft sole","baby booties shoe"],
  },
  "Men's Footwear": {
    "Sneakers & Sports":          ["men sneaker","men sports shoe","running shoe","men trainers","men canvas","athletic shoe men","men gym shoe"],
    "Formal Shoes":               ["men formal shoe","men oxford","men derby","men brogue","men loafer","men monk strap","men dress shoe"],
    "Sandals & Slippers":         ["men sandal","men slipper","men flip flop","men chappal","men slide","men mule","men kolhapuri"],
    "Ethnic & Casual":            ["men mojari","men jutti","kolhapuri","men ethnic shoe","men casual shoe","men loafer"],
    "Boots":                      ["men boot","men ankle boot","men chelsea boot","men combat boot","men hiking boot"],
  },
  "Women's Footwear": {
    "Heels & Wedges":             ["women heel","stiletto","wedge heel","block heel","kitten heel","platform heel","women pump","pencil heel"],
    "Flats & Ballerinas":         ["ballerina","women flat","women ballet","pointed flat","women slip on","women loafer flat"],
    "Sandals":                    ["women sandal","ladies sandal","strappy sandal","kolhapuri women","women chappal","anklet sandal","women slide"],
    "Casual & Sports":            ["women sneaker","women sports shoe","women canvas","women casual shoe","women running shoe"],
    "Ethnic Footwear":            ["women jutti","women mojari","women kolhapuri","embroidered footwear women"],
    "Boots":                      ["women boot","women ankle boot","women knee boot","women chelsea","women rain boot"],
  },

  // ─── BABY PRODUCTS ────────────────────────────────────────────────────────
  "Baby Care & Essentials": {
    "Diapers & Nappy Care":       ["diaper","nappy","pant style diaper","tape diaper","pull up pant","huggies","pampers","mamy poko","diaper pant","newborn diaper","wetness indicator","diaper rash"],
    "Wet Wipes":                  ["wet wipe","baby wipe","moist wipe","cleansing wipe","water wipe","fragrance free wipe","wipes pack"],
    "Baby Skincare":              ["baby lotion","baby cream","baby oil","baby powder","baby moisturizer","baby face cream","baby body wash","baby shampoo","baby soap","baby wash","nappy cream","cradle cap","baby sunscreen","powder puff"],
    "Baby Feeding":               ["feeding bottle","sipper bottle","sipper","sippy cup","straw sipper","breast pump","bottle warmer","sterilizer","feeding spoon","baby bowl","weaning set","bpa free bottle","steel sipper","insulated sipper","water sipper","straw bottle"],
    "Baby Bedding & Protectors":  ["baby bedsheet","crib sheet","baby blanket","sleeping bag","swaddle","muslin wrap","bed protector","waterproof sheet","mattress protector","anti piling fleece","quick dry sheet","baby quilt","baby pillow","cot bumper"],
    "Baby Gear & Travel":         ["stroller","pram","baby carrier","baby seat","infant seat","bouncer","rocker","baby swing","baby monitor","bassinet","crib","baby cot","high chair","baby walker","playpen","carry cot"],
    "Baby Bath":                  ["baby bath tub","bath seat","bath support","bath thermometer","bath toys","bath net"],
    "Baby Health & Safety":       ["nasal aspirator","baby nail cutter","baby grooming kit","gum massager","teething gel","gripe water","baby thermometer","baby weighing scale","cradle"],
  },

  // ─── BABY & KIDS TOYS ─────────────────────────────────────────────────────
  "Toys & Games": {
    "Soft Toys & Plush":          ["soft toy","plush toy","stuffed animal","teddy bear","plush bear","bunny plush","soft doll","rag doll","soft plush","cuddly toy","stuffed toy","plush rabbit","plush bunny","mi arcus"],
    "Baby & Infant Toys":         ["baby toy","rattle","teether","play mat","baby gym","sensory toy","activity toy","soft ball","baby ball","crinkle toy","developmental toy","infant toy","motor skills","newborn toy"],
    "Educational Toys":           ["puzzle","building blocks","lego","abacus","flashcard","learning toy","stem toy","alphabet toy","number toy","shape sorter","science kit","educational game","pop up book","rhyme book","activity book","story book","nursery rhyme"],
    "Outdoor & Sports Toys":      ["toy gun","blaster","water gun","nerf","outdoor toy","cricket toy","football toy","frisbee toy","sports toy","flying disc"],
    "Remote Control & Electronic":["remote control","rc car","drone toy","walkie talkie","electronic toy","radio toy","toy car remote","rechargeable toy","2 way radio"],
    "Dolls & Action Figures":     ["doll","barbie","action figure","superhero toy","hot wheels","figurine","miniature","toy soldier","fashion doll"],
    "Board Games & Puzzles":      ["board game","chess","ludo","carrom","monopoly","playing cards","dice game","memory game","card game","snakes and ladders"],
    "Pretend Play":               ["kitchen set toy","doctor set","tool set toy","tea set toy","play set","pretend play","role play toy","cash register toy"],
  },

  // ─── BOOKS & LEARNING ─────────────────────────────────────────────────────
  "Books & Learning": {
    "Children's Books":           ["children book","kids book","picture book","story book","activity book","colouring book","pop up book","lift the flap","board book","early reader","nursery rhymes","bedtime story","toddler book","rhyme time","interactive book"],
    "Educational Books":          ["textbook","guide book","workbook","practice book","olympiad","science book","math book","english book","cbse","ncert","reference book"],
    "Adult Books":                ["novel","fiction","non-fiction","biography","autobiography","self help","business book","thriller","romance novel","mystery","history book","cookbook","travel book"],
    "Stationery":                 ["pen","pencil","notebook","diary","sketch pen","colour pencil","crayon","eraser","sharpener","ruler","stapler","highlighter","marker pen","sticky note","glue stick","scissors","compass box"],
  },

  // ─── PERSONAL CARE & BEAUTY ───────────────────────────────────────────────
  "Skincare": {
    "Face Care":                  ["face wash","face cream","face lotion","face serum","moisturizer","sunscreen","spf","face mask","face pack","face scrub","cleanser","toner","micellar water","eye cream","under eye","face gel","bb cream","cc cream","lip balm"],
    "Body Care":                  ["body lotion","body cream","body wash","shower gel","body scrub","talc","body powder","body butter","foot cream","hand cream","intensive moisturizing","nourishing lotion","dry skin lotion","oil in lotion","cocoa butter","shea butter","venusia","nivea","cetaphil"],
    "Suncare":                    ["sunscreen","sunblock","spf 50","spf 30","uv protection","after sun","tan removal"],
  },
  "Haircare": {
    "Shampoo & Conditioner":      ["shampoo","conditioner","anti dandruff","hair fall","keratin shampoo","dry hair shampoo","oily hair","baby shampoo"],
    "Hair Treatments":            ["hair mask","hair serum","hair oil","hair cream","leave-in","hair spa","protein treatment","coconut oil hair","onion hair","argan oil"],
    "Styling Products":           ["hair gel","hair spray","wax","mousse","heat protectant","dry shampoo","volumizer"],
    "Hair Color":                 ["hair color","hair dye","henna","ammonia free","permanent color","semi permanent","highlights kit"],
  },
  "Makeup & Cosmetics": {
    "Face Makeup":                ["foundation","concealer","primer","bb cream","blush","bronzer","highlighter","contour","setting powder","setting spray"],
    "Eye Makeup":                 ["kajal","kohl","eyeliner","eyeshadow","mascara","eye primer","eyebrow","brow pencil"],
    "Lip Products":               ["lipstick","lip gloss","lip liner","lip tint","lip stain","matte lipstick","liquid lipstick"],
    "Nail Care":                  ["nail polish","nail paint","nail remover","nail care","nail art","base coat","top coat"],
    "Makeup Tools":               ["brush","makeup brush","sponge","beauty blender","makeup remover","cotton pad"],
  },
  "Men's Grooming": {
    "Shaving & Beard":            ["shaving cream","shaving gel","razor","trimmer","aftershave","beard oil","beard wax","beard balm","shaving brush","safety razor","disposable razor"],
    "Men Skincare":               ["men face wash","men moisturizer","men sunscreen","men serum","men face scrub","charcoal face wash"],
    "Deodorants":                 ["deodorant","men deo","body spray men","roll on men","antiperspirant","men perfume","cologne"],
  },
  "Fragrances": {
    "Perfumes":                   ["perfume","eau de parfum","edp","eau de toilette","edt","attar","body mist","women fragrance","men fragrance","unisex perfume","gift set perfume"],
    "Deodorants":                 ["deo","deodorant","body spray","roll on","antiperspirant","pocket perfume"],
  },

  // ─── HOME & KITCHEN ───────────────────────────────────────────────────────
  "Home & Kitchen": {
    "Cookware":                   ["kadai","wok","pressure cooker","frying pan","tawa","skillet","saucepan","casserole","non stick","induction pan","cast iron","cooking pan","dutch oven"],
    "Kitchen Appliances":         ["mixer grinder","blender","juicer","toaster","microwave","oven","air fryer","induction cooktop","food processor","hand blender","rice cooker","sandwich maker","electric kettle","coffee maker","water purifier"],
    "Storage & Containers":       ["container","storage box","lunch box","canister","tiffin","airtight container","food storage","tupperware","clip container","glass container","steel container"],
    "Dining & Serving":           ["dinner set","plate","bowl","glass","mug","cup","serving bowl","casserole serving","spoon set","cutlery","steel plate","melamine","crockery"],
    "Bedding & Linen":            ["bedsheet","bed sheet","pillow cover","comforter","duvet","blanket","quilt","bedspread","mattress protector","pillow","bolster","bedding set"],
    "Bath Linen":                 ["bath towel","face towel","hand towel","towel set","napkin","bath mat","shower curtain"],
    "Furniture":                  ["sofa","chair","table","wardrobe","cabinet","shelf","rack","bed frame","dining table","desk","bookcase","shoe rack","tv unit","study table"],
    "Home Decor":                 ["vase","photo frame","candle","wall art","curtain","rug","carpet","lamp","cushion","mirror","wall clock","wall sticker","showpiece","idol","figurine decor"],
    "Cleaning Supplies":          ["broom","mop","dustbin","cleaning brush","detergent","dishwash","floor cleaner","disinfectant","scrubber","vacuum","drain cleaner","toilet cleaner"],
    "Pooja & Spiritual":          ["pooja thali","diya","agarbatti","incense","idol puja","pooja set","brass diya","puja thali","camphor","kumkum"],
  },

  // ─── ELECTRONICS ──────────────────────────────────────────────────────────
  "Electronics & Gadgets": {
    "Mobile Phones":              ["mobile phone","smartphone","iphone","android phone","5g phone","4g phone","samsung phone","oneplus","redmi","realme","oppo","vivo","poco"],
    "Laptops & Computers":        ["laptop","notebook","macbook","desktop","computer","pc","chromebook","ultrabook","gaming laptop","workstation"],
    "Tablets":                    ["tablet","ipad","android tablet","e-reader","kindle","fire tablet","drawing tablet"],
    "Headphones & Earphones":     ["headphone","earphone","earbuds","tws","neckband","headset","airpods","in-ear","wireless earphone","noise cancelling","gaming headphone"],
    "Cameras & Photography":      ["camera","dslr","mirrorless","action camera","webcam","gopro","camcorder","lens","tripod","camera bag","memory card","flash"],
    "TV & Displays":              ["television","smart tv","led tv","oled tv","qled","4k tv","monitor","curved monitor","gaming monitor","projector","display screen"],
    "Accessories & Cables":       ["cable","charger","adapter","power bank","usb hub","screen protector","phone case","back cover","tempered glass","car charger","wireless charger","otg","data cable","type c"],
    "Smart Devices":              ["smart speaker","alexa","google home","smart bulb","smart plug","smart watch","fitness band","smartwatch","fire stick","chromecast","iot","robot vacuum"],
    "Audio & Home Theatre":       ["speaker","soundbar","bluetooth speaker","home theatre","subwoofer","amplifier","portable speaker","party speaker"],
    "Gaming":                     ["gaming console","playstation","xbox","nintendo","gaming chair","gaming keyboard","gaming mouse","gaming headset","controller","joystick"],
  },

  // ─── SPORTS & FITNESS ─────────────────────────────────────────────────────
  "Sports & Fitness": {
    "Exercise Equipment":         ["dumbbell","barbell","kettlebell","resistance band","pull up bar","treadmill","skipping rope","exercise cycle","elliptical","weight plate","gym bench","punching bag","ab roller"],
    "Yoga & Wellness":            ["yoga mat","yoga block","yoga strap","yoga wheel","pilates","foam roller","meditation cushion","balance board"],
    "Sports Nutrition":           ["whey protein","protein powder","creatine","bcaa","pre workout","mass gainer","protein bar","energy bar","supplement","glutamine","casein"],
    "Cricket":                    ["cricket bat","cricket ball","batting gloves","cricket pad","cricket helmet","cricket kit","cricket shoes","stumps"],
    "Football & Racket Sports":   ["football","basketball","badminton racket","tennis racket","shuttle cock","table tennis","squash","volleyball","handball"],
    "Swimming & Water":           ["swimwear","swimming costume","swim goggles","swim cap","swimming trunk","bikini","rashguard","kickboard"],
    "Cycling":                    ["bicycle","cycle","cycle helmet","cycling jersey","cycle gloves","bike pump","cycle lock","cycling shorts","bike stand"],
    "Outdoor & Adventure":        ["tent","sleeping bag camping","trekking shoe","hiking backpack","camping","carabiner","rope climbing","head torch"],
  },

  // ─── HEALTH & WELLNESS ────────────────────────────────────────────────────
  "Health & Wellness": {
    "Vitamins & Supplements":     ["vitamin c","vitamin d","omega 3","calcium","multivitamin","zinc","probiotic","iron supplement","folic acid","b12","fish oil","cod liver"],
    "Medical Devices":            ["thermometer","bp monitor","blood pressure","glucometer","oximeter","pulse oximeter","nebulizer","heating pad","hot water bag","ice pack","glucose monitor"],
    "Ayurvedic & Herbal":         ["ayurvedic","herbal","chyawanprash","ashwagandha","triphala","tulsi","neem","giloy","moringa","shatavari","brahmi","amla"],
    "Feminine Care":              ["sanitary pad","tampon","menstrual cup","feminine wash","pantyliner","period underwear","overnight pad","ultra thin pad"],
    "Oral Care":                  ["toothbrush","toothpaste","mouthwash","dental floss","tongue cleaner","electric toothbrush","whitening"],
    "Eye & Ear Care":             ["eye drop","contact lens solution","ear drop","ear wax","eye wash","lubricating drop"],
  },

  // ─── FOOD & GROCERY ───────────────────────────────────────────────────────
  "Food & Grocery": {
    "Snacks & Chips":             ["chips","biscuit","cookie","cracker","popcorn","namkeen","wafer","pringles","nachos","bhujia","mixture","chivda","chakli"],
    "Beverages":                  ["juice","cold drink","soda","energy drink","smoothie","iced tea","lemonade","coconut water","health drink","squash","syrup","mocktail","kombucha"],
    "Tea & Coffee":               ["tea","green tea","black tea","coffee","instant coffee","filter coffee","chai","herbal tea","matcha","espresso","cold brew"],
    "Rice, Grains & Pulses":      ["rice","basmati","wheat","atta","oats","quinoa","millet","daliya","poha","suji","besan","dal","lentil","rajma","chana","moong","masoor"],
    "Spices & Condiments":        ["masala","turmeric","cumin","pepper","chilli","garam masala","ketchup","pickle","chutney","vinegar","soy sauce","mustard","mayonnaise","pasta sauce"],
    "Dairy & Eggs":               ["milk","curd","yogurt","cheese","butter","ghee","paneer","cream","egg","condensed milk","skimmed milk","almond milk"],
    "Dry Fruits & Nuts":          ["almond","cashew","walnut","raisin","pista","dates","fig","apricot","dry fruit","mixed nuts","nut butter","peanut butter","trail mix"],
    "Packaged Foods":             ["noodles","pasta","maggi","instant noodles","ready to eat","frozen food","canned","soup packet","oatmeal","cornflakes","muesli","granola"],
    "Oils & Ghee":                ["cooking oil","sunflower oil","mustard oil","olive oil","coconut oil","rice bran oil","ghee","clarified butter","vanaspati"],
    "Sweets & Chocolates":        ["chocolate","candy","sweet","mithai","laddoo","barfi","halwa","rasgulla","gulab jamun","kaju katli","toffee","caramel","gummy"],
  },

  // ─── BAGS & ACCESSORIES ───────────────────────────────────────────────────
  "Bags & Luggage": {
    "Backpacks":                  ["backpack","school bag","laptop backpack","rucksack","daypack","college bag","hiking backpack","travel backpack"],
    "Handbags & Purses":          ["handbag","purse","tote bag","sling bag","clutch","shoulder bag","women bag","hobo bag","bucket bag","crossbody bag"],
    "Luggage & Trolleys":         ["suitcase","trolley bag","duffel bag","luggage","cabin bag","hard case luggage","soft luggage","travel bag","strolley"],
    "Kids Bags":                  ["kids backpack","school bag kids","lunch bag","pencil pouch","pencil box","children bag","toddler backpack","kindergarten bag"],
    "Wallets & Pouches":          ["wallet","card holder","money clip","billfold","purse wallet","women wallet","men wallet","coin pouch","travel pouch"],
  },
  "Fashion Accessories": {
    "Watches":                    ["watch","smartwatch","analog watch","digital watch","wristwatch","chronograph","kids watch","ladies watch","men watch"],
    "Jewellery":                  ["necklace","earring","bracelet","ring","bangle","anklet","pendant","chain","mangalsutra","nose ring","maang tikka","jhumka","oxidised","kundan","pearl","diamond","gold plated"],
    "Sunglasses & Eyewear":       ["sunglasses","spectacle frame","eyeglasses","contact lens","reading glasses","aviator","wayfarer","uv protection sunglasses"],
    "Belts":                      ["belt","leather belt","canvas belt","formal belt","casual belt","reversible belt","kids belt"],
    "Hair Accessories":           ["hair clip","hair band","scrunchie","hairpin","headband","hair tie","claw clip","hair bow","alligator clip","banana clip","kids hair clip"],
    "Scarves & Stoles":           ["scarf","stole","dupatta","shawl","muffler","neck scarf","silk scarf","woollen stole"],
    "Caps & Hats":                ["cap","hat","baseball cap","snapback","beanie","fedora","sun hat","bucket hat","men cap","kids cap"],
  },

  // ─── PET SUPPLIES ─────────────────────────────────────────────────────────
  "Pet Supplies": {
    "Dog Food & Treats":          ["dog food","puppy food","dog treat","dog biscuit","pedigree","royal canin dog","drools","dog kibble","dog wet food","adult dog food"],
    "Cat Food & Treats":          ["cat food","kitten food","cat treat","whiskas","royal canin cat","cat kibble","cat wet food","adult cat food"],
    "Pet Accessories":            ["pet collar","dog leash","pet harness","pet bed","dog bed","cat bed","pet toy","dog toy","cat toy","pet carrier","pet cage","aquarium","bird cage","fish tank"],
    "Pet Grooming":               ["pet shampoo","dog shampoo","cat shampoo","pet conditioner","pet brush","nail clipper pet","pet wipe","tick spray","flea collar","pet deodorant"],
    "Pet Health":                 ["pet vitamin","deworming","tick medicine","flea medicine","pet supplement","probiotics pet"],
  },

  // ─── AUTOMOTIVE ───────────────────────────────────────────────────────────
  "Automotive": {
    "Car Accessories":            ["car cover","car mat","car charger","car mount","seat cover","steering cover","dashboard","car freshener","car vacuum","wiper blade","car camera","reverse camera"],
    "Bike & Two Wheeler":         ["bike cover","bike lock","helmet","riding gloves","bike saddle","handlebar grip","bike mirror","chain lock","biker jacket"],
    "Tyres, Oils & Parts":        ["tyre","tire","alloy wheel","engine oil","gear oil","brake fluid","coolant","battery car","spark plug","car wax","car polish"],
  },

  // ─── STATIONERY & OFFICE ──────────────────────────────────────────────────
  "Office & Stationery": {
    "Writing Instruments":        ["pen","pencil","ball pen","gel pen","fountain pen","sketch pen","marker","whiteboard marker","permanent marker","highlighter pen"],
    "Notebooks & Diaries":        ["notebook","diary","planner","journal","spiral notebook","composition book","register","notepad","sticky note","post it"],
    "Art & Craft":                ["colour pencil","crayon","watercolor","acrylic paint","canvas","brush set","sketchbook","origami","clay","craft kit","scrapbook","drawing book"],
    "Office Supplies":            ["stapler","staple pin","paper clip","binder clip","file folder","document folder","calculator","tape dispenser","rubber band","correction pen","label"],
    "Printing & Paper":           ["a4 paper","photo paper","inkjet paper","printer ink","toner","carbon paper","chart paper","craft paper"],
  },
};


// ── NLP ENGINE ────────────────────────────────────────────────────────────────
let KW_INDEX = null;

function buildIndex() {
  if (KW_INDEX) return KW_INDEX;
  const idx = [];
  for (const [cat, subs] of Object.entries(TAXONOMY)) {
    for (const [sub, kws] of Object.entries(subs)) {
      for (const kw of kws) {
        idx.push({ kw: kw.toLowerCase(), cat, sub, w: kw.trim().split(/\s+/).length });
      }
    }
  }
  idx.sort((a, b) => b.w - a.w); // longer keywords first
  KW_INDEX = idx;
  return idx;
}

function classify(title) {
  const idx   = buildIndex();
  const clean = title.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ").replace(/\s+/g, " ").trim();
  const scores = {};
  for (const { kw, cat, sub, w } of idx) {
    const re = new RegExp("\\b" + kw.replace(/[-]/g, "\\-") + "\\b");
    if (re.test(clean)) {
      const key = `${cat}||${sub}`;
      scores[key] = (scores[key] || 0) + w;
    }
  }
  if (!Object.keys(scores).length) return { category: "Uncategorized", subcategory: "General" };
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const [category, subcategory] = best.split("||");
  return { category, subcategory };
}

// ── Excel export ──────────────────────────────────────────────────────────────
function exportExcel(rows, fname, categoryLabel) {
  const wb = XLSX.utils.book_new();
  const isSingle = !!categoryLabel;

  // Sheet 1 — Categorized rows (always includes Category + Sub-Category columns)
  const sheetName = isSingle
    ? categoryLabel.substring(0, 28)   // Excel sheet name max 31 chars
    : "Categorized Products";
  const ws1 = XLSX.utils.json_to_sheet(rows.map(r => ({
    "Product Title":  r.title,
    "Category":       r.category,
    "Sub-Category":   r.subcategory
  })));
  ws1["!cols"] = [{ wch: 60 }, { wch: 32 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, ws1, sheetName);

  // Sheet 2 — Sub-category summary for these rows only
  const sumMap = {};
  rows.forEach(r => {
    const k = `${r.category}||${r.subcategory}`;
    sumMap[k] = (sumMap[k] || 0) + 1;
  });
  const ws2 = XLSX.utils.json_to_sheet(
    Object.entries(sumMap)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => {
        const [cat, sub] = k.split("||");
        return { "Category": cat, "Sub-Category": sub, "Count": n };
      })
  );
  ws2["!cols"] = [{ wch: 32 }, { wch: 32 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  // Sheet 3 — Taxonomy reference (full download only)
  if (!isSingle) {
    const taxRows = [];
    for (const [cat, subs] of Object.entries(TAXONOMY))
      for (const [sub, kws] of Object.entries(subs))
        taxRows.push({ "Category": cat, "Sub-Category": sub, "Keywords": kws.join(", ") });
    const ws3 = XLSX.utils.json_to_sheet(taxRows);
    ws3["!cols"] = [{ wch: 32 }, { wch: 32 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Taxonomy & Keywords");
  }

  XLSX.writeFile(wb, fname);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:  { background:"#080f1e", minHeight:"100vh", color:"#e2e8f0", fontFamily:"system-ui,sans-serif", padding:"24px 16px" },
  wrap:  { maxWidth:900, margin:"0 auto" },
  card:  { background:"#0d1829", border:"1px solid #1e2d45", borderRadius:16, padding:"22px 24px", marginBottom:14 },
  h2:    { margin:"0 0 14px", fontSize:16, fontWeight:700, color:"#f1f5f9" },
  label: { display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:"#475569", marginBottom:6 },
  sel:   { background:"#111f33", border:"1px solid #1e3a5f", borderRadius:9, padding:"9px 13px", fontSize:13, color:"#e2e8f0", outline:"none" },
  btn:   (bg) => ({ background:bg||"#2563eb", color:"#fff", border:"none", borderRadius:10, padding:"10px 22px", fontWeight:700, fontSize:13, cursor:"pointer" }),
  stat:  { background:"#111f33", border:"1px solid #1e2d45", borderRadius:12, padding:"12px 14px", flex:1 },
};

function Bar({ pct, a, b }) {
  return (
    <div style={{ height:8, background:"#111f33", borderRadius:999, overflow:"hidden" }}>
      <div style={{ width:`${Math.max(pct,1)}%`, height:"100%", background:`linear-gradient(90deg,${a},${b})`, transition:"width 0.3s", borderRadius:999 }} />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase,   setPhase]   = useState("upload");
  const [file,    setFile]    = useState(null);
  const [cols,    setCols]    = useState([]);
  const [col,     setCol]     = useState("");
  const [prog,    setProg]    = useState({ total:0, done:0 });
  const [rows,    setRows]    = useState([]);
  const [live,    setLive]    = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [drag,    setDrag]    = useState(false);
  const [err,     setErr]     = useState("");

  const fileRef  = useRef();
  const rowsRef  = useRef([]);
  const timerRef = useRef(null);
  const t0Ref    = useRef(0);

  const tick   = () => { timerRef.current = setInterval(() => setElapsed(((Date.now() - t0Ref.current)/1000)|0), 600); };
  const noTick = () => clearInterval(timerRef.current);

  function loadFile(f) {
    if (!f?.name?.endsWith(".csv")) { alert("Please upload a .csv file"); return; }
    setFile(f);
    Papa.parse(f.slice(0, 80000), {
      header: true, preview: 4,
      complete: r => {
        const h = r.meta.fields || [];
        setCols(h);
        setCol(h.find(x => /product.?title/i.test(x)) || h[0] || "");
        setPhase("setup");
      }
    });
  }

  async function doProcess() {
    rowsRef.current = []; setRows([]); setLive([]);
    setPhase("running"); t0Ref.current = Date.now(); tick();

    // Pre-build keyword index
    buildIndex();

    try {
      const allRows = await new Promise((res, rej) => {
        const acc = [];
        Papa.parse(file, {
          header: true, skipEmptyLines: true,
          chunkSize: 3 * 1024 * 1024,
          chunk: results => {
            const batch = [];
            results.data.forEach(row => {
              const title = String(row[col] || "").trim();
              if (!title) return;
              const { category, subcategory } = classify(title);
              acc.push({ title, category, subcategory });
              batch.push({ title, category, subcategory });
            });
            setProg({ total: acc.length, done: acc.length });
            setLive(batch.slice(-6));
          },
          complete: () => res(acc), error: rej
        });
      });

      rowsRef.current = allRows;
      setRows(allRows);
      noTick();
      setPhase("done");
    } catch(e) { noTick(); setErr(e.message); setPhase("error"); }
  }

  function doExport() {
    exportExcel(rowsRef.current, `categorized_${file?.name?.replace(".csv","") || "products"}.xlsx`);
  }

  const fmtSec = s => s > 60 ? `${(s/60)|0}m ${s%60}s` : `${s}s`;
  const fmt    = n => (n||0).toLocaleString();

  const catSummary = {};
  rows.forEach(r => {
    if (!catSummary[r.category]) catSummary[r.category] = { total:0, subs:{} };
    catSummary[r.category].total++;
    catSummary[r.category].subs[r.subcategory] = (catSummary[r.category].subs[r.subcategory]||0)+1;
  });
  const sortedCats = Object.entries(catSummary).sort((a,b) => b[1].total - a[1].total);
  const pct = (n) => rows.length > 0 ? Math.round((n/rows.length)*100) : 0;

  const STEPS   = ["Upload","Column","Process","Done"];
  const STEP_I  = { upload:0, setup:1, running:2, done:3, error:0 };
  const curStep = STEP_I[phase]||0;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
      <div style={S.wrap}>

        {/* Header */}
        <div style={{ textAlign:"center", paddingBottom:22 }}>
          <div style={{ display:"inline-flex", gap:6, background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:999, padding:"4px 14px", fontSize:11, color:"#60a5fa", marginBottom:10 }}>
            ⚡ No API Key · Keyword NLP · Streaming · 3 GB+ · Excel Export
          </div>
          <h1 style={{ margin:"0 0 5px", fontSize:27, fontWeight:900, background:"linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            AI Product Categorizer
          </h1>
          <p style={{ margin:0, color:"#475569", fontSize:13 }}>Keyword NLP · Category → Sub-Category · 3 GB+ CSV → Excel</p>
        </div>

        {/* Step bar */}
        <div style={{ ...S.card, display:"flex", alignItems:"center", padding:"12px 20px", marginBottom:14 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, background: i<curStep?"#22c55e":i===curStep?"#3b82f6":"#111f33", color:i<=curStep?"#fff":"#475569", border:i>curStep?"1px solid #1e2d45":"none", boxShadow:i===curStep?"0 0 0 4px rgba(59,130,246,0.2)":"none" }}>
                  {i < curStep ? "✓" : i+1}
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:i<curStep?"#4ade80":i===curStep?"#93c5fd":"#334155", whiteSpace:"nowrap" }}>{label}</span>
              </div>
              {i < STEPS.length-1 && <div style={{ flex:1, height:1, background:"#1e2d45", margin:"0 8px" }} />}
            </div>
          ))}
        </div>

        {/* UPLOAD */}
        {phase === "upload" && (
          <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);loadFile(e.dataTransfer.files[0]);}}
            onClick={()=>fileRef.current.click()}
            style={{ ...S.card, textAlign:"center", padding:"60px 24px", cursor:"pointer", border:`2px dashed ${drag?"#3b82f6":"#1e2d45"}`, background:drag?"rgba(59,130,246,0.04)":"#0d1829" }}>
            <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])} />
            <div style={{ fontSize:52, marginBottom:12 }}>📦</div>
            <div style={{ fontSize:19, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>Drop your product CSV here</div>
            <div style={{ fontSize:12, color:"#475569", marginBottom:20 }}>Handles 3 GB+ · No API key needed · <code style={{ background:"#111f33", padding:"2px 7px", borderRadius:6, color:"#60a5fa" }}>product_title</code> auto-detected</div>
            <div style={S.btn()}>Browse File</div>
          </div>
        )}

        {/* SETUP */}
        {phase === "setup" && (
          <div style={S.card}>
            <h2 style={S.h2}>🗂 Select Product Title Column</h2>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
              <div>
                <label style={S.label}>Column to Categorize</label>
                <select value={col} onChange={e=>setCol(e.target.value)} style={{...S.sel, width:"100%"}}>
                  {cols.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div style={{ background:"#111f33", border:"1px solid #1e2d45", borderRadius:11, padding:"13px 15px", fontSize:12, color:"#64748b" }}>
                <div style={{ fontWeight:700, color:"#94a3b8", marginBottom:6 }}>📄 File Info</div>
                <div>Name: <span style={{color:"#cbd5e1"}}>{file?.name}</span></div>
                <div style={{marginTop:3}}>Size: <span style={{color:"#cbd5e1"}}>{((file?.size||0)/1024/1024).toFixed(1)} MB</span></div>
                <div style={{marginTop:3}}>Columns: <span style={{color:"#cbd5e1"}}>{cols.length}</span></div>
              </div>
            </div>

            {/* Taxonomy preview */}
            <div style={{ marginBottom:18 }}>
              <label style={S.label}>Taxonomy Preview ({Object.keys(TAXONOMY).length-1} Categories)</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Object.entries(TAXONOMY).filter(([c])=>c!=="Uncategorized").map(([cat,subs],i) => (
                  <div key={cat} style={{ display:"flex", alignItems:"center", gap:6, background:"#111f33", border:"1px solid #1e2d45", borderRadius:9, padding:"6px 11px", fontSize:11 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:PAL[i%PAL.length], flexShrink:0 }} />
                    <span style={{ color:"#94a3b8" }}>{cat}</span>
                    <span style={{ color:"#334155" }}>· {Object.keys(subs).length} subcats</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={doProcess} style={S.btn()}>🚀 Start Categorizing →</button>
              <span style={{ fontSize:11, color:"#475569" }}>Pure keyword matching · No API · Instant results</span>
            </div>
          </div>
        )}

        {/* RUNNING */}
        {phase === "running" && (
          <div style={S.card}>
            <h2 style={{ ...S.h2, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ display:"inline-block", width:18, height:18, border:"2px solid #3b82f6", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
              Processing…
            </h2>
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Rows Processed</div><div style={{fontSize:20,fontWeight:800,color:"#93c5fd"}}>{fmt(prog.done)}</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Time Elapsed</div><div style={{fontSize:20,fontWeight:800,color:"#fde68a"}}>{fmtSec(elapsed)}</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Speed</div><div style={{fontSize:20,fontWeight:800,color:"#4ade80"}}>{elapsed>0?fmt((prog.done/elapsed)|0):0}/s</div></div>
            </div>
            <Bar pct={prog.total>0?100:5} a="#3b82f6" b="#8b5cf6" />
            {live.length > 0 && (
              <div style={{ marginTop:14 }}>
                <div style={{fontSize:11,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Live Feed</div>
                {live.map((item,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#111f33",borderRadius:8,padding:"7px 12px",fontSize:11,marginBottom:4}}>
                    <span style={{flex:1,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</span>
                    <span style={{color:"#60a5fa",fontWeight:600,flexShrink:0}}>{item.category}</span>
                    <span style={{color:"#a78bfa",flexShrink:0}}>→ {item.subcategory}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DONE */}
        {phase === "done" && (
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{...S.h2,margin:0}}>✅ Categorization Complete!</h2>
              <button onClick={() => doExport(null)}
                style={{...S.btn("#16a34a"),display:"flex",alignItems:"center",gap:8}}>
                📊 Download All ({fmt(rows.length)} rows)
              </button>
            </div>

            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Total Rows</div><div style={{fontSize:20,fontWeight:800}}>{fmt(rows.length)}</div><div style={{fontSize:11,color:"#374151"}}>{((file?.size||0)/1024/1024).toFixed(1)} MB</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Categories Found</div><div style={{fontSize:20,fontWeight:800,color:"#93c5fd"}}>{sortedCats.length}</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Time Taken</div><div style={{fontSize:20,fontWeight:800,color:"#86efac"}}>{fmtSec(elapsed)}</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Uncategorized</div><div style={{fontSize:20,fontWeight:800,color:"#f87171"}}>{fmt((catSummary["Uncategorized"]||{total:0}).total)}</div><div style={{fontSize:11,color:"#374151"}}>{pct((catSummary["Uncategorized"]||{total:0}).total)}%</div></div>
            </div>

            <div style={{fontSize:11,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>
              Results by Category — click any row to download that category
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:400,overflowY:"auto"}}>
              {sortedCats.map(([cat, data], i) => (
                <div key={cat} style={{background:"#111f33",border:"1px solid #1e2d45",borderRadius:11,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:PAL[i%PAL.length],flexShrink:0}} />
                    <span style={{fontWeight:700,fontSize:13,color:"#e2e8f0",flex:1}}>{cat}</span>
                    <span style={{fontSize:12,color:"#60a5fa",fontWeight:700}}>{fmt(data.total)}</span>
                    <span style={{fontSize:11,color:"#475569",marginRight:8}}>({pct(data.total)}%)</span>
                    <button
                      onClick={() => doExport(cat)}
                      title={`Download ${cat}`}
                      style={{background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.3)",color:"#60a5fa",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
                      ⬇️ {fmt(data.total)} rows
                    </button>
                  </div>
                  <div style={{height:5,background:"#1e2d45",borderRadius:999,overflow:"hidden",marginBottom:8}}>
                    <div style={{width:`${pct(data.total)}%`,height:"100%",background:PAL[i%PAL.length]+"bb",borderRadius:999}} />
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingLeft:16}}>
                    {Object.entries(data.subs).sort((a,b)=>b[1]-a[1]).map(([sub,cnt]) => (
                      <span key={sub} style={{background:"rgba(255,255,255,0.04)",border:"1px solid #1e2d45",borderRadius:999,padding:"2px 9px",fontSize:11,color:"#94a3b8"}}>
                        {sub} <span style={{color:"#60a5fa",fontWeight:700}}>{fmt(cnt)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:14,background:"rgba(22,163,74,0.07)",border:"1px solid rgba(22,163,74,0.2)",borderRadius:11,padding:"13px 16px",fontSize:12,color:"#4ade80",display:"flex",gap:10}}>
              <span style={{fontSize:18}}>📊</span>
              <div>
                <b>Download options:</b>
                <div style={{color:"#16a34a",marginTop:3,fontSize:11}}>
                  • <b>Download All</b> (top right) — full {fmt(rows.length)} rows, 3 sheets: Categorized Products · Summary · Taxonomy<br/>
                  • <b>⬇️ N rows</b> button on each category — only that category's rows, single sheet
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div style={{background:"rgba(127,29,29,0.12)",border:"1px solid rgba(220,38,38,0.25)",borderRadius:16,padding:"22px 24px"}}>
            <div style={{fontSize:16,fontWeight:700,color:"#f87171",marginBottom:10}}>❌ Error</div>
            <div style={{fontFamily:"monospace",fontSize:12,background:"rgba(127,29,29,0.18)",color:"#fca5a5",borderRadius:9,padding:"10px 13px",marginBottom:12}}>{err}</div>
            <button onClick={()=>{setPhase("upload");setFile(null);setErr("");setRows([]);setProg({total:0,done:0});}}
              style={{...S.btn("#1e293b"),border:"1px solid #334155",color:"#cbd5e1"}}>↩ Start Over</button>
          </div>
        )}

        <div style={{textAlign:"center",fontSize:11,color:"#1e2d45",paddingTop:8}}>
          Keyword NLP · {Object.keys(TAXONOMY).length-1} categories · {Object.values(TAXONOMY).flatMap(s=>Object.values(s)).flat().length}+ keywords · No API key required
        </div>
      </div>
    </div>
  );
}
