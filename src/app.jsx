import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const PAL = ["#60a5fa","#34d399","#fbbf24","#f87171","#a78bfa","#22d3ee","#fb923c","#f472b6","#4ade80","#818cf8","#2dd4bf","#facc15","#c084fc","#67e8f9","#fdba74"];

// ── TAXONOMY ──────────────────────────────────────────────────────────────────
const TAXONOMY = {
  "Kids & Baby Clothing": {
    "Night Suits & Sleepwear":    ["night suit","nightsuit","night wear","nightwear","sleepwear","sleeping suit","pyjama set","pajama set","co-ord night","night dress","nighty","sleep set","loungewear set","lounge pants kids"],
    "T-Shirts & Tops":            ["t-shirt","tshirt","tee","printed top","half sleeves top","full sleeves top","sleeveless top","colorblocked top","co-ord top","knit top","cotton top","graphic tee","text print top","boys t-shirt","kids tee","kids top","girls top"],
    "Sweaters & Sweatshirts":     ["sweater","sweatshirt","sweatjacket","pullover","hooded sweater","front open sweater","knit sweater","woollen","fleece sweater","cardigan","knitted sweater","jumper","winter wear sweater","fur lined"],
    "Jackets & Winterwear":       ["jacket","winter jacket","puffer jacket","quilted jacket","hooded jacket","windcheater","front open jacket","sweat jacket","kangaroo pocket","hoodie","zip jacket","bomber jacket","winter wear","boys jacket","kids jacket"],
    "Joggers & Track Pants":      ["jogger","track pant","trackpant","cargo jogger","knit jogger","lounge pant","cargo pant","cotton jogger","printed jogger","solid jogger","denim jogger","boys jogger","kids pant","boys pant"],
    "Jeans & Denim":              ["boys jeans","kids jeans","girls jeans","denim kids","whiskered denim","clean look jeans kids","bootcut kids","straight fit kids","kids denim"],
    "Shorts":                     ["boys shorts","kids shorts","cargo shorts","denim shorts boys","solid shorts kids","beach shorts kids"],
    "Sets & Co-ords":             ["set","co-ord","co ord","suit set","top & jogger","top and jogger","top & pant","tee & jogger","night suit set","tracksuit","clothing set","outfit set","2 piece","3 piece","gift set","party suit","boys set","girls set"],
    "Shirts (Boys)":              ["boys shirt","kids shirt","solid shirt boys","printed shirt boys","full sleeves shirt boys","half sleeves shirt boys","boys formal shirt","boys check shirt","polo boys"],
    "Thermal & Innerwear":        ["thermal","thermal set","thermal wear","inner wear","innerwear","vest","banyan","thermal inner","woollen inner","bodysuit","onesie","full body"],
    "Ethnic & Festive Wear":      ["sherwani","kurta pyjama","ethnic suit","festive wear","dhoti kurta","indo western","bandhgala","party suit","traditional wear","achkan","nawabi","boys ethnic","kids sherwani"],
    "Frocks & Dresses":           ["frock","dress","skirt","gown","floral dress","party dress","midi dress","baby dress","girls dress","printed dress","cotton dress","net dress","girls frock"],
    "Rompers & Onesies":          ["romper","onesie","bodysuit","jumpsuit","dungaree","playsuit","all in one","baby romper","infant romper","short romper","sleepsuit","baby jumpsuit"],
    "Caps & Accessories":         ["cap","beanie","booties","mittens","gloves kids","scarf kids","muffler","hat infant","baby cap","woollen cap","knitted cap","baby booties","kids cap","baby headband","kids headband","flower hairband","nylon headband"],
    "Bathrobes & Towels":         ["bathrobe","bath robe","hooded bathrobe","towel kids","baby towel","terry robe","bath towel pack","microfiber towel","cartoon print towel"],
  },
  "Men's Clothing": {
    "T-Shirts & Polos":           ["men t-shirt","mens tee","polo shirt","men polo","half sleeve shirt","printed tee men","plain tee","round neck tee","v-neck tee","polo t shirt","men polo tshirt"],
    "Shirts":                     ["men shirt","formal shirt","casual shirt","check shirt","linen shirt","oxford shirt","slim fit shirt","regular fit shirt","party shirt","cotton shirt men","full sleeves shirt men"],
    "Shackets & Overshirts":      ["shacket","shirt jacket","overshirt","men shacket","denim shacket","flannel shacket","longline shirt","men overshirt"],
    "Trousers & Jeans":           ["men trouser","men jeans","chinos","cargo trousers","formal trousers","slim fit jeans","straight jeans","men denim","men pant","mid rise jeans","relaxed fit jeans","loose fit jeans","clean look jeans","bootcut jeans men","baggy jeans","wide jeans men"],
    "Shorts & Cargos":            ["men shorts","cargo shorts men","men cargo","boxer shorts","chino shorts","swim shorts","casual shorts men"],
    "Ethnic Wear Men":            ["kurta","kurta pyjama","men sherwani","men dhoti","men lungi","men ethnic","nehru jacket","men bandhgala"],
    "Jackets & Hoodies":          ["men jacket","men hoodie","men sweatshirt","men pullover","men blazer","men coat","men windcheater","men overcoat","men parka"],
    "Innerwear & Socks":          ["men brief","men boxer","men trunk","men vest","men innerwear","men socks","ankle socks","men underwear","ice silk briefs","men trunks pack"],
    "Activewear":                 ["men track pant","men jogger","men gym wear","men shorts","gym t-shirt","compression tights","men sports shorts","men lycra track"],
    "Winterwear":                 ["men sweater","men cardigan","men pullover","men thermal","men muffler","men woollen","men fleece"],
  },
  "Women's Clothing": {
    "Tops & Blouses":             ["women top","ladies top","women blouse","crop top","cami top","women tunic","women shirt","off shoulder","peplum top","halter top","tank top women","longline top","oversized top","asymmetric top","printed top women","short top","fitted top","kaftan top","jaipuri top"],
    "Sarees":                     ["saree","sari","cotton saree","silk saree","chiffon saree","printed saree","embroidered saree","banarasi","kanjivaram","georgette saree","jaipuri saree"],
    "Salwar & Kurtas":            ["salwar kameez","salwar suit","anarkali","churidar","women kurta","kurti","palazzo kurta","straight kurta","flared kurta","a-line kurta","patiala salwar","patiala suit","jaipuri kurta"],
    "Palazzos & Wide Pants":      ["palazzo","palazzos","women palazzo","rayon palazzo","wide leg pant","flared pants women","parachute pants","baggy pants women","korean pant","korean trousers","straight pants women","solid palazzo","printed palazzo","viscose palazzo"],
    "Leggings & Jeggings":        ["legging","jegging","women legging","cotton legging","flared legging","printed legging","tregging","ankle length legging","churidar legging"],
    "Lehenga & Ethnic":           ["lehenga","lehenga choli","chaniya choli","women ethnic","festive suit","gharara","sharara"],
    "Dresses & Kaftans":          ["women dress","maxi dress","midi dress","mini dress","bodycon","wrap dress","shirt dress","sundress","floral dress women","kaftan","kaftan dress","kaftan nightdress","printed kaftan","cotton kaftan"],
    "Jeans & Trousers":           ["women jeans","ladies jeans","women trouser","women chinos","women denim","skinny jeans","bootcut jeans women","wide jeans","straight jeans women","mid rise jeans women","baggy jeans women","cargo jeans women"],
    "Blazers & Coats":            ["women blazer","ladies blazer","women coat","women overcoat","women trench","blazer women","single breasted blazer","double breasted blazer","mandarin collar overcoat"],
    "Innerwear & Lingerie":       ["bra","panty","women brief","lingerie","shapewear","sports bra","bralette","padded bra","women innerwear","tummy shaper","waist shaper","body shaper","thong","bikini women","net thong"],
    "Nightwear & Lounge":         ["women nightwear","women pyjama","women nightgown","night dress women","women loungewear","women robe","women sleepwear","nighty","kaftan nightdress","solid kaftan"],
    "Jackets & Shrugs":           ["women jacket","shrug","women hoodie","women blazer","women cardigan","women coat","women sweatshirt","women denim jacket"],
    "Winterwear":                 ["women sweater","women woollen","women thermal","women muffler","women shawl","women stole","women fleece"],
    "Blouse":                     ["cotton blouse","lycra blouse","stretchable blouse","designer blouse","silk blouse","cotton lycra blouse"],
  },
  "Kids Footwear": {
    "Casual Shoes":               ["casual shoes","velcro shoes","kids casual","slip on shoes","kids sneaker","canvas shoes kids","children shoes","printed shoes","animal print shoes","floral shoes","boys sneaker","girls sneaker","musical shoes","led shoes kids","asian kids","campus kids","pennen"],
    "Sandals & Slippers":         ["kids sandal","baby sandal","kids slipper","velcro sandal","solid sandal","cap toe sandal","strap sandal","kids chappal","infant sandal","kids flip flop","kids slider","kids slides","onyc slider"],
    "Formal & Party Shoes":       ["formal shoes kids","party shoes kids","slip on formal","kids loafer","dress shoes kids","bow shoes","kids party","pine kids shoes"],
    "Boots & Mojaris":            ["kids boot","ankle boot kids","mojari","jutti kids","ethnic shoes","embroidered shoes","sequin shoes","textured mojari","boyz n galz","kids mojari"],
    "Clogs & Mules":              ["clog","mule kids","slip on clog","bow clog","kids clogs"],
    "First Walker":               ["first walker","baby walker shoe","infant shoe","newborn shoe","toddler shoe","soft sole","lil lollipop"],
  },
  "Men's Footwear": {
    "Sneakers & Sports":          ["men sneaker","men sports shoe","running shoe","men trainers","men canvas","athletic shoe men","campus men","asian men shoes","jumplite","bornova","off limits","avant","gokik","bucik","grass walk","asian shoes","campus alex","campus slake"],
    "Formal Shoes":               ["men formal shoe","men oxford","men derby","men brogue","men loafer","men dress shoe","allen cooper formal","genuine leather formal","memory foam shoe","neemans"],
    "Sandals & Slippers":         ["men sandal","men slipper","men flip flop","men chappal","men slide","men kolhapuri","men thong","men massage flip flop","lotto flip flop","gokik flip","tiefit slipper","naal sandal","cushers slide"],
    "Boots & Hiking":             ["men boot","men ankle boot","men chelsea boot","men combat boot","men hiking boot","waterproof hiking","trekking shoe","bacca bucci","outdoor shoe men"],
    "Loafers & Moccasins":        ["men loafer","moccasin","slip on men","neeman","neemans loafer","charmers","casual loafer men"],
    "Lifestyle & Fashion":        ["lifestyle shoe","fashion shoe","zypso","men lifestyle"],
  },
  "Women's Footwear": {
    "Heels & Wedges":             ["women heel","stiletto","wedge heel","block heel","kitten heel","platform heel","women pump","sandal heel","marc loire heel","elle sandal heel","peep toe"],
    "Flats & Ballerinas":         ["ballerina","women flat","women ballet","pointed flat","women slip on","code ballerina","bow ballerina","flat sandal women"],
    "Loafers & Mules":            ["women loafer","ladies loafer","mule","women mule","slip on mule","allen solly mule","tomsy loafer","brixton flat","women slip on shoe"],
    "Sandals":                    ["women sandal","ladies sandal","strappy sandal","kolhapuri women","women chappal","anklet sandal","inc5 sandal","casual sandal women"],
    "Casual & Sports":            ["women sneaker","women sports shoe","women canvas","women casual shoe","women running shoe","air force women","women athletics"],
    "Ethnic Footwear":            ["women jutti","women mojari","women kolhapuri","embroidered footwear women"],
    "Boots":                      ["women boot","women ankle boot","women knee boot","women chelsea","ankle length boots","long boots women","hvnly boots","shuz touch boots"],
    "Slippers & Slides":          ["women slipper","women slider","women flip flop","women chappal","women slide","harriet slipper","knit glider"],
  },
  "Baby Care & Essentials": {
    "Diapers & Nappy Care":       ["diaper","nappy","pant style diaper","tape diaper","pull up pant","huggies","pampers","mamy poko","diaper pant","newborn diaper","wetness indicator","diaper rash"],
    "Wet Wipes":                  ["wet wipe","baby wipe","moist wipe","cleansing wipe","water wipe","fragrance free wipe","wipes pack"],
    "Baby Skincare":              ["baby lotion","baby cream","baby oil","baby powder","baby moisturizer","baby face cream","baby body wash","baby shampoo","baby soap","baby wash","nappy cream","powder puff"],
    "Baby Feeding":               ["feeding bottle","sipper bottle","sipper","sippy cup","straw sipper","breast pump","bottle warmer","sterilizer","feeding spoon","baby bowl","bpa free bottle","steel sipper","insulated sipper","water sipper","straw bottle"],
    "Baby Bedding & Protectors":  ["baby bedsheet","crib sheet","baby blanket","sleeping bag","swaddle","muslin wrap","bed protector","waterproof sheet","mattress protector","anti piling fleece","quick dry sheet","baby quilt","baby pillow"],
    "Baby Gear & Travel":         ["stroller","pram","baby carrier","baby seat","infant seat","bouncer","rocker","baby swing","baby monitor","bassinet","crib","baby cot","high chair","baby walker","playpen"],
    "Baby Bath":                  ["baby bath tub","bath seat","bath support","bath thermometer","bath toys","bath net"],
    "Baby Health & Safety":       ["nasal aspirator","baby nail cutter","baby grooming kit","gum massager","teething gel","gripe water","baby thermometer","baby weighing scale"],
  },
  "Toys & Games": {
    "Soft Toys & Plush":          ["soft toy","plush toy","stuffed animal","teddy bear","plush bear","bunny plush","soft doll","rag doll","soft plush","cuddly toy","stuffed toy","plush rabbit","plush bunny"],
    "Baby & Infant Toys":         ["baby toy","rattle","teether","play mat","baby gym","sensory toy","activity toy","soft ball","baby ball","crinkle toy","developmental toy","infant toy","motor skills","newborn toy"],
    "Educational Toys":           ["puzzle","building blocks","lego","abacus","flashcard","learning toy","stem toy","alphabet toy","number toy","shape sorter","science kit","educational game","pop up book","rhyme book","activity book","story book","nursery rhyme"],
    "Outdoor & Sports Toys":      ["toy gun","blaster","water gun","nerf","outdoor toy","sports toy","flying disc"],
    "Remote Control & Electronic":["remote control","rc car","drone toy","walkie talkie","electronic toy","radio toy","toy car remote","rechargeable toy","2 way radio"],
    "Dolls & Action Figures":     ["doll","barbie","action figure","superhero toy","hot wheels","figurine","fashion doll"],
    "Board Games & Puzzles":      ["board game","chess","ludo","carrom","monopoly","playing cards","dice game","snakes and ladders"],
    "Pretend Play":               ["kitchen set toy","doctor set","tool set toy","tea set toy","play set","pretend play","role play toy"],
  },
  "Plants & Gardening": {
    "Indoor Plants":              ["indoor plant","house plant","money plant","succulent","cactus","fern","snake plant","pothos","peace lily","air purifying plant","ornamental plant","bonsai","aglaonema","philodendron","monstera"],
    "Flowering Plants":           ["rose plant","flowering plant","bougainvillea","hibiscus","jasmine","mogra","champa","plumeria","marigold","dahlia","orchid","dendrobium","flower plant","champa plant","kat chapa","bougainvellia"],
    "Fruit & Vegetable Plants":   ["fruit plant","mango plant","lemon plant","tomato plant","chilli plant","strawberry plant","coconut plant","dwarf coconut","grafted plant","hybrid plant","gondhoraj lemon","vietnam coconut"],
    "Seeds & Soil":               ["seeds","flower seeds","vegetable seeds","soil","potting mix","cocopeat","fertilizer","compost","garden soil","plant food"],
    "Gardening Tools":            ["garden tool","trowel","pruner","watering can","plant pot","flower pot","planter","grow bag","garden gloves","rake","shovel","garden fork"],
    "Saplings & Cuttings":        ["sapling","cutting","plant sapling","orchid sapling","tree sapling","herb plant","tulsi plant","neem plant","aloe vera plant","curry leaf"],
  },
  "Mobile & Tablet Accessories": {
    "Phone Cases & Covers":       ["phone case","phone cover","mobile cover","back cover","silicon case","silicone cover","tpu case","hard case","transparent case","designer cover","printed cover","armour case","cycle armor","case vault","rosy morning","clear case","samsung cover","iphone cover","pixel cover","galaxy cover","mobile case","back case"],
    "Screen Protectors":          ["screen guard","tempered glass","screen protector","matte screen guard","privacy glass","anti glare","full cover glass"],
    "Chargers & Cables":          ["mobile charger","usb cable","type c cable","lightning cable","data cable","fast charger","pd charger","wireless charger pad","charging cable"],
    "Power Banks":                ["power bank","portable charger","20000mah","10000mah","fast charge power bank"],
    "Phone Holders & Mounts":     ["phone holder","car mount","mobile stand","ring holder","pop socket","phone grip","desk stand mobile"],
  },
  "Home Hardware & Tools": {
    "Locks & Security":           ["lock","padlock","shutter lock","door lock","combination lock","brass lock","steel lock","universal lock","almari lock"],
    "Taps & Fittings":            ["tap","bib cock","bathroom tap","kitchen tap","water tap","faucet","basin tap","plastic tap","pvc tap","shower head","pipe fitting"],
    "Storage & Shelving":         ["storage rack","wall rack","plastic rack","kitchen rack","bathroom rack","shoe rack","spice rack","plastic storage rack","organiser rack","shelf unit"],
    "Hand Tools":                 ["screwdriver","hammer","plier","wrench","drill","measuring tape","level","toolkit","tool set","allen key","socket set"],
    "Electrical":                 ["switch","socket","wire","extension board","mcb","crocodile clip","electrical clip","wire connector","cable tie","insulation tape"],
  },
  "Sports Support & Braces": {
    "Knee Support":               ["knee support","knee brace","knee cap","knee compression","knee guard","knee wrap","knee sleeve","patella support","sports knee support"],
    "Back & Spine Support":       ["back support","back brace","lumbar support","back stretcher","spinal stretcher","back relaxer","posture corrector","back pain relief","lumbar belt","spine support"],
    "Ankle & Wrist Support":      ["ankle support","ankle brace","wrist support","wrist brace","elbow support","elbow brace","shoulder support","compression sleeve"],
    "Gym Supports":               ["gym gloves","weightlifting belt","gym belt","gym strap","hand grip","gym band","fitness support"],
  },
  "Books & Learning": {
    "Children's Books":           ["children book","kids book","picture book","story book","activity book","colouring book","pop up book","lift the flap","board book","early reader","nursery rhymes","bedtime story","toddler book","rhyme time","interactive book","fire engine sound book","my encyclopedia","space book kids","encyclopaedia"],
    "Self Help & Motivation":     ["self help","motivation book","habit","atomic habits","subconscious mind","how to","improve your life","productivity book","mindset","personal development","moving on","living your best","success book","leadership book"],
    "Mythology & Spiritual":      ["mythology","spiritual book","ashtavakra","geeta","gita","ramayan","mahabharat","shiva trilogy","immortals of meluha","purana","vedas","upanishad","spiritual","religious book","bhagavad","hindu mythology"],
    "Competitive Exam Books":     ["upsssc","ssc je","ssc cgl","ssc chsl","ibps","rrb","upsc","civil engineering exam","jee","neet","gate","competitive exam","exam fighter","exam preparation","previous year paper","mock test","reasoning book","gk book","khan sir","pocket gk","ignou"],
    "Hindi Books":                ["hindi book","hindi novel","hindi sahitya","hindi paperback","chote badlav","asadharan","hindi medium","hindi guide"],
    "Educational Books":          ["textbook","guide book","workbook","practice book","olympiad","science book","math book","cbse","ncert","reference book","dental materials","concise dictionary"],
    "Adult Fiction & Non-Fiction":["novel","fiction","non-fiction","biography","autobiography","thriller","romance novel","mystery","history book","cookbook","alchemist","paulo coelho","james clear"],
    "Stationery":                 ["pen","pencil","notebook","diary","sketch pen","colour pencil","crayon","eraser","sharpener","ruler","stapler","highlighter","marker pen","sticky note","glue stick"],
  },
  "Skincare": {
    "Face Care":                  ["face wash","face cream","face lotion","face serum","moisturizer","sunscreen","spf","face mask","face pack","face scrub","cleanser","toner","micellar water","eye cream","under eye","face gel","bb cream","cc cream","lip balm"],
    "Body Care":                  ["body lotion","body cream","body wash","shower gel","body scrub","talc","body powder","body butter","foot cream","hand cream","intensive moisturizing","nourishing lotion","dry skin lotion","oil in lotion","cocoa butter","shea butter","venusia","nivea","cetaphil"],
    "Suncare":                    ["sunscreen","sunblock","spf 50","spf 30","uv protection","after sun","tan removal"],
  },
  "Haircare": {
    "Shampoo & Conditioner":      ["shampoo","conditioner","anti dandruff","hair fall","keratin shampoo","dry hair","oily hair"],
    "Hair Treatments":            ["hair mask","hair serum","hair oil","hair cream","leave-in","hair spa","coconut oil hair","onion hair","argan oil"],
    "Styling & Color":            ["hair gel","hair spray","wax","mousse","heat protectant","dry shampoo","hair color","hair dye","henna","ammonia free"],
  },
  "Makeup & Cosmetics": {
    "Face Makeup":                ["foundation","concealer","primer","blush","bronzer","highlighter","contour","setting powder","setting spray"],
    "Eye Makeup":                 ["kajal","kohl","eyeliner","eyeshadow","mascara","eyebrow","brow pencil"],
    "Lip Products":               ["lipstick","lip gloss","lip liner","lip tint","lip stain","matte lipstick","liquid lipstick"],
    "Nail & Tools":               ["nail polish","nail paint","nail remover","nail art","base coat","top coat","makeup brush","beauty blender"],
  },
  "Men's Grooming": {
    "Shaving & Beard":            ["shaving cream","shaving gel","razor","trimmer","aftershave","beard oil","beard wax","beard balm","shaving brush","safety razor"],
    "Men Skincare":               ["men face wash","men moisturizer","men sunscreen","men serum","charcoal face wash"],
    "Deodorants":                 ["deodorant","men deo","body spray men","roll on men","antiperspirant","men perfume","cologne"],
  },
  "Fragrances": {
    "Perfumes":                   ["perfume","eau de parfum","edp","eau de toilette","edt","attar","body mist","women fragrance","men fragrance","unisex perfume"],
    "Deodorants":                 ["deo","deodorant","body spray","roll on","antiperspirant","pocket perfume"],
  },
  "Home & Kitchen": {
    "Cookware":                   ["kadai","wok","pressure cooker","frying pan","tawa","skillet","saucepan","casserole","non stick","cooking pan","dutch oven"],
    "Kitchen Appliances":         ["mixer grinder","blender","juicer","toaster","microwave","oven","air fryer","induction cooktop","food processor","hand blender","rice cooker","electric kettle","coffee maker"],
    "Storage & Containers":       ["container","storage box","lunch box","canister","tiffin","airtight container","food storage","clip container","glass container","steel container"],
    "Dining & Serving":           ["dinner set","plate","bowl","glass","mug","cup","serving bowl","spoon set","cutlery","steel plate","melamine","crockery"],
    "Bedding & Linen":            ["bedsheet","bed sheet","pillow cover","comforter","duvet","blanket","quilt","bedspread","mattress protector","pillow","bolster","bedding set"],
    "Bath Linen":                 ["bath towel","face towel","hand towel","towel set","napkin","bath mat","shower curtain"],
    "Furniture":                  ["sofa","chair","wardrobe","cabinet","shelf","rack","bed frame","dining table","desk","bookcase","shoe rack","tv unit","study table"],
    "Home Decor":                 ["vase","photo frame","candle","wall art","curtain","rug","carpet","lamp","cushion","mirror","wall clock","wall sticker","showpiece","idol"],
    "Cleaning Supplies":          ["broom","mop","dustbin","cleaning brush","detergent","dishwash","floor cleaner","disinfectant","scrubber","toilet cleaner"],
    "Pooja & Spiritual":          ["pooja thali","diya","agarbatti","incense","idol puja","pooja set","brass diya","camphor","kumkum"],
  },
  "Electronics & Gadgets": {
    "Mobile Phones":              ["mobile phone","smartphone","iphone","android phone","5g phone","samsung phone","oneplus","redmi","realme","oppo","vivo","poco"],
    "Laptops & Computers":        ["laptop","notebook","macbook","desktop","computer","chromebook","ultrabook","gaming laptop"],
    "Tablets":                    ["tablet","ipad","android tablet","e-reader","kindle","drawing tablet"],
    "Headphones & Earphones":     ["headphone","earphone","earbuds","tws","neckband","headset","airpods","wireless earphone","noise cancelling"],
    "Cameras":                    ["camera","dslr","mirrorless","action camera","webcam","gopro","camcorder","lens","tripod"],
    "TV & Displays":              ["television","smart tv","led tv","oled tv","qled","4k tv","monitor","projector"],
    "Accessories & Cables":       ["cable","charger","adapter","power bank","usb hub","screen protector","phone case","back cover","tempered glass","car charger","wireless charger","type c"],
    "Smart Devices":              ["smart speaker","alexa","google home","smart bulb","smart plug","smart watch","fitness band","fire stick","chromecast"],
    "Audio & Speakers":           ["speaker","soundbar","bluetooth speaker","home theatre","subwoofer","amplifier","portable speaker"],
    "Gaming":                     ["gaming console","playstation","xbox","nintendo","gaming chair","gaming keyboard","gaming mouse","controller","joystick"],
  },
  "Sports & Fitness": {
    "Exercise Equipment":         ["dumbbell","barbell","kettlebell","resistance band","pull up bar","treadmill","skipping rope","exercise cycle","weight plate","gym bench","punching bag","ab roller"],
    "Yoga & Wellness":            ["yoga mat","yoga block","yoga strap","yoga wheel","pilates","foam roller","meditation cushion","balance board"],
    "Sports Nutrition":           ["whey protein","protein powder","creatine","bcaa","pre workout","mass gainer","protein bar","energy bar","glutamine","casein"],
    "Cricket":                    ["cricket bat","cricket ball","batting gloves","cricket pad","cricket helmet","cricket kit","stumps"],
    "Racket & Ball Sports":       ["football","basketball","badminton racket","tennis racket","shuttle cock","table tennis","squash","volleyball"],
    "Swimming & Cycling":         ["swimwear","swimming costume","swim goggles","swim cap","swimming trunk","bicycle","cycle helmet","cycling jersey","bike pump"],
  },
  "Health & Wellness": {
    "Vitamins & Supplements":     ["vitamin c","vitamin d","omega 3","calcium","multivitamin","zinc","probiotic","iron supplement","folic acid","b12","fish oil"],
    "Medical Devices":            ["thermometer","bp monitor","blood pressure","glucometer","oximeter","pulse oximeter","nebulizer","heating pad","hot water bag","glucose monitor"],
    "Ayurvedic & Herbal":         ["ayurvedic","herbal","chyawanprash","ashwagandha","triphala","tulsi","neem","giloy","moringa","shatavari","brahmi","amla"],
    "Feminine Care":              ["sanitary pad","tampon","menstrual cup","feminine wash","pantyliner","period underwear","overnight pad"],
    "Oral Care":                  ["toothbrush","toothpaste","mouthwash","dental floss","tongue cleaner","electric toothbrush","whitening"],
  },
  "Food & Grocery": {
    "Snacks & Chips":             ["chips","biscuit","cookie","cracker","popcorn","namkeen","wafer","nachos","bhujia","mixture","chivda","chakli"],
    "Beverages":                  ["juice","cold drink","soda","energy drink","smoothie","iced tea","lemonade","coconut water","health drink","squash","kombucha"],
    "Tea & Coffee":               ["tea","green tea","black tea","coffee","instant coffee","filter coffee","chai","herbal tea","matcha","espresso"],
    "Rice, Grains & Pulses":      ["rice","basmati","wheat","atta","oats","quinoa","millet","daliya","poha","suji","besan","dal","lentil","rajma","chana","moong","masoor"],
    "Spices & Condiments":        ["masala","turmeric","cumin","pepper","chilli","garam masala","ketchup","pickle","chutney","vinegar","soy sauce","mustard","mayonnaise"],
    "Dairy & Eggs":               ["curd","yogurt","cheese","butter","ghee","paneer","cream","condensed milk","skimmed milk","almond milk"],
    "Dry Fruits & Nuts":          ["almond","cashew","walnut","raisin","pista","dates","fig","apricot","dry fruit","mixed nuts","peanut butter","trail mix"],
    "Packaged Foods":             ["noodles","pasta","maggi","instant noodles","ready to eat","frozen food","soup packet","oatmeal","cornflakes","muesli","granola"],
    "Oils & Ghee":                ["cooking oil","sunflower oil","mustard oil","olive oil","coconut oil","rice bran oil","clarified butter","vanaspati"],
    "Sweets & Chocolates":        ["chocolate","candy","sweet","mithai","laddoo","barfi","halwa","rasgulla","gulab jamun","kaju katli","toffee","caramel","gummy"],
  },
  "Bags & Luggage": {
    "Backpacks":                  ["backpack","school bag","laptop backpack","rucksack","daypack","college bag","hiking backpack","travel backpack"],
    "Handbags & Purses":          ["handbag","purse","tote bag","sling bag","clutch","shoulder bag","women bag","hobo bag","bucket bag","crossbody bag"],
    "Luggage & Trolleys":         ["suitcase","trolley bag","duffel bag","luggage","cabin bag","hard case luggage","soft luggage","travel bag"],
    "Kids Bags":                  ["kids backpack","school bag kids","lunch bag","pencil pouch","pencil box","children bag","toddler backpack"],
    "Wallets & Pouches":          ["wallet","card holder","money clip","billfold","purse wallet","women wallet","men wallet","coin pouch","travel pouch"],
  },
  "Fashion Accessories": {
    "Watches":                    ["watch","smartwatch","analog watch","digital watch","wristwatch","chronograph","kids watch","ladies watch","men watch"],
    "Jewellery":                  ["necklace","earring","bracelet","ring","bangle","anklet","pendant","chain","mangalsutra","nose ring","maang tikka","jhumka","oxidised","kundan","pearl","gold plated"],
    "Sunglasses & Eyewear":       ["sunglasses","spectacle frame","eyeglasses","contact lens","reading glasses","aviator","wayfarer","uv protection"],
    "Belts":                      ["belt","leather belt","canvas belt","formal belt","casual belt","reversible belt","kids belt"],
    "Hair Accessories":           ["hair clip","hair band","scrunchie","hairpin","headband","hair tie","claw clip","hair bow","alligator clip","banana clip"],
    "Scarves & Stoles":           ["scarf","stole","dupatta","shawl","muffler","neck scarf","silk scarf","woollen stole"],
    "Caps & Hats":                ["cap","hat","baseball cap","snapback","beanie","fedora","sun hat","bucket hat"],
  },
  "Pet Supplies": {
    "Dog Products":               ["dog food","puppy food","dog treat","dog biscuit","pedigree","royal canin dog","drools","dog collar","dog leash","dog toy","dog bed"],
    "Cat Products":               ["cat food","kitten food","cat treat","whiskas","royal canin cat","cat collar","cat toy","cat bed","cat litter"],
    "Pet Accessories":            ["pet bed","pet toy","pet carrier","pet cage","aquarium","bird cage","fish tank","pet bowl","pet harness"],
    "Pet Grooming":               ["pet shampoo","dog shampoo","cat shampoo","pet brush","nail clipper pet","pet wipe","tick spray","flea collar"],
  },
  "Automotive": {
    "Car Accessories":            ["car cover","car mat","car charger","car mount","seat cover","steering cover","dashboard","car freshener","car vacuum","wiper blade","car camera"],
    "Bike & Two Wheeler":         ["bike cover","bike lock","helmet","riding gloves","bike saddle","handlebar grip","bike mirror","chain lock","biker jacket"],
    "Tyres, Oils & Parts":        ["tyre","tire","alloy wheel","engine oil","gear oil","brake fluid","coolant","battery car","spark plug","car wax"],
  },
  "Office & Stationery": {
    "Writing Instruments":        ["ball pen","gel pen","fountain pen","sketch pen","marker","whiteboard marker","permanent marker","highlighter pen"],
    "Notebooks & Diaries":        ["notebook","diary","planner","journal","spiral notebook","composition book","register","notepad","sticky note","post it"],
    "Art & Craft":                ["colour pencil","crayon","watercolor","acrylic paint","canvas","brush set","sketchbook","origami","clay","craft kit","scrapbook","drawing book"],
    "Office Supplies":            ["stapler","staple pin","paper clip","binder clip","file folder","document folder","calculator","tape dispenser","rubber band","correction pen"],
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
        const cleanKw = kw.toLowerCase().trim();
        // Tokenize without hyphens for the unordered backup check
        const tokens = cleanKw.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
        idx.push({ 
          kw: cleanKw, 
          tokens: tokens, 
          cat, 
          sub, 
          w: tokens.length || 1 
        });
      }
    }
  }
  idx.sort((a, b) => b.w - a.w);
  KW_INDEX = idx;
  return idx;
}

function classify(title) {
  const idx = buildIndex();
  
  // Clean string for Layer 1: Exact Match (keeps hyphens)
  const cleanRegexStr = title.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ").replace(/\s+/g, " ").trim();
  
  // Clean tokens for Layer 2: Flexible Match (removes hyphens, handles plurals)
  const rawTokens = title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const titleTokens = new Set(rawTokens);
  
  for (const t of rawTokens) {
    if (t.length > 3 && t.endsWith("ies")) titleTokens.add(t.slice(0, -3) + "y");
    else if (t.length > 2 && t.endsWith("es")) titleTokens.add(t.slice(0, -2));
    else if (t.length > 1 && t.endsWith("s")) titleTokens.add(t.slice(0, -1));
  }

  const scores = {};
  let matchFound = false;

  for (const { kw, tokens, cat, sub, w } of idx) {
    let isMatch = false;
    
    // LAYER 1: Original Exact Phrase Match (e.g., "t-shirt", "co-ord")
    const exactRegex = new RegExp("\\b" + kw.replace(/[-]/g, "\\-") + "\\b");
    if (exactRegex.test(cleanRegexStr)) {
      isMatch = true;
    } 
    // LAYER 2: Unordered Token Match (e.g., "shirt for men", "hoodies")
    else if (tokens.length > 0 && tokens.every(t => titleTokens.has(t))) {
      isMatch = true;
    }

    if (isMatch) {
      matchFound = true;
      const key = cat + "||" + sub;
      scores[key] = (scores[key] || 0) + w;
    }
  }

  if (!matchFound) return { category: "Uncategorized", subcategory: "General" };

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const [category, subcategory] = best.split("||");
  return { category, subcategory };
}
// ── EXPORT — receives ONLY the rows it should write ──────────────────────────
function buildAndDownload(rowsToExport, fileName, sheetTitle, includeFullTaxonomy) {
  const wb = XLSX.utils.book_new();

  // Sheet 1 — always includes Category + Sub-Category so any download is self-identified
  const ws1 = XLSX.utils.json_to_sheet(
    rowsToExport.map(r => ({
      "Product Title": r.title,
      "Category":      r.category,
      "Sub-Category":  r.subcategory,
    }))
  );
  ws1["!cols"] = [{ wch: 65 }, { wch: 32 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, ws1, sheetTitle.substring(0, 31));

  // Sheet 2 — summary of only the rows in this export
  const countMap = {};
  rowsToExport.forEach(r => {
    const k = r.category + "||" + r.subcategory;
    countMap[k] = (countMap[k] || 0) + 1;
  });
  const summaryRows = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => {
      const [cat, sub] = k.split("||");
      return { "Category": cat, "Sub-Category": sub, "Count": n };
    });
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  ws2["!cols"] = [{ wch: 32 }, { wch: 32 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  // Sheet 3 — full taxonomy only for the complete download
  if (includeFullTaxonomy) {
    const taxRows = [];
    for (const [cat, subs] of Object.entries(TAXONOMY))
      for (const [sub, kws] of Object.entries(subs))
        taxRows.push({ "Category": cat, "Sub-Category": sub, "Keywords": kws.join(", ") });
    const ws3 = XLSX.utils.json_to_sheet(taxRows);
    ws3["!cols"] = [{ wch: 32 }, { wch: 32 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Taxonomy & Keywords");
  }

  XLSX.writeFile(wb, fileName);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:  { background: "#080f1e", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui,sans-serif", padding: "24px 16px" },
  wrap:  { maxWidth: 900, margin: "0 auto" },
  card:  { background: "#0d1829", border: "1px solid #1e2d45", borderRadius: 16, padding: "22px 24px", marginBottom: 14 },
  h2:    { margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#475569", marginBottom: 6 },
  sel:   { background: "#111f33", border: "1px solid #1e3a5f", borderRadius: 9, padding: "9px 13px", fontSize: 13, color: "#e2e8f0", outline: "none" },
  btn:   (bg, fg) => ({ background: bg || "#2563eb", color: fg || "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  stat:  { background: "#111f33", border: "1px solid #1e2d45", borderRadius: 12, padding: "12px 14px", flex: 1 },
};

function Spin() {
  return <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}
function Bar({ pct, a, b }) {
  return (
    <div style={{ height: 8, background: "#111f33", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(pct, 1)}%`, height: "100%", background: `linear-gradient(90deg,${a},${b})`, transition: "width 0.3s", borderRadius: 999 }} />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase,   setPhase]   = useState("upload");
  const [file,    setFile]    = useState(null);
  const [cols,    setCols]    = useState([]);
  const [col,     setCol]     = useState("");
  const [prog,    setProg]    = useState({ total: 0, done: 0 });
  const [rows,    setRows]    = useState([]);   // {title, category, subcategory}[]
  const [live,    setLive]    = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [drag,    setDrag]    = useState(false);
  const [err,     setErr]     = useState("");

  const fileRef  = useRef();
  const allRows  = useRef([]);   // single source of truth for export
  const timerRef = useRef(null);
  const t0Ref    = useRef(0);

  const tick   = () => { timerRef.current = setInterval(() => setElapsed(((Date.now() - t0Ref.current) / 1000) | 0), 600); };
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
    allRows.current = [];
    setRows([]); setLive([]);
    setPhase("running");
    t0Ref.current = Date.now(); tick();
    buildIndex();

    try {
      const collected = await new Promise((res, rej) => {
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
              const rec = { title, category, subcategory };
              acc.push(rec);
              batch.push(rec);
            });
            setProg({ total: acc.length, done: acc.length });
            setLive(batch.slice(-6));
          },
          complete: () => res(acc),
          error:    rej
        });
      });

      allRows.current = collected;
      setRows(collected);
      noTick();
      setPhase("done");
    } catch (e) {
      noTick();
      setErr(e.message);
      setPhase("error");
    }
  }

  // ── Download: pass a category name to filter, or null for everything ────────
  function download(categoryFilter) {
    const base = file?.name?.replace(".csv", "") || "products";

    if (categoryFilter === null) {
      // Complete download — all rows, 3 sheets
      buildAndDownload(
        allRows.current,
        `ALL__${base}.xlsx`,
        "Categorized Products",
        true   // include taxonomy sheet
      );
    } else {
      // Single category — only matching rows, 2 sheets
      const subset = allRows.current.filter(r => r.category === categoryFilter);
      const safe   = categoryFilter.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      buildAndDownload(
        subset,
        `${safe}__${base}.xlsx`,
        categoryFilter,
        false  // no taxonomy sheet
      );
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const fmtSec = s => s > 60 ? `${(s / 60) | 0}m ${s % 60}s` : `${s}s`;
  const fmt    = n => (n || 0).toLocaleString();

  const catSummary = {};
  rows.forEach(r => {
    if (!catSummary[r.category]) catSummary[r.category] = { total: 0, subs: {} };
    catSummary[r.category].total++;
    catSummary[r.category].subs[r.subcategory] = (catSummary[r.category].subs[r.subcategory] || 0) + 1;
  });
  const sortedCats = Object.entries(catSummary).sort((a, b) => b[1].total - a[1].total);
  const rowPct     = n => rows.length > 0 ? Math.round((n / rows.length) * 100) : 0;

  const STEPS   = ["Upload", "Column", "Process", "Done"];
  const STEP_I  = { upload: 0, setup: 1, running: 2, done: 3, error: 0 };
  const curStep = STEP_I[phase] || 0;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
      <div style={S.wrap}>

        {/* Header */}
        <div style={{ textAlign: "center", paddingBottom: 22 }}>
          <div style={{ display: "inline-flex", gap: 6, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 999, padding: "4px 14px", fontSize: 11, color: "#60a5fa", marginBottom: 10 }}>
            ⚡ No API Key · Keyword NLP · Streaming · 3 GB+ · Per-Category Excel Download
          </div>
          <h1 style={{ margin: "0 0 5px", fontSize: 27, fontWeight: 900, background: "linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AI Product Categorizer
          </h1>
          <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>Keyword NLP · Category → Sub-Category · Download All or Per-Category</p>
        </div>

        {/* Step bar */}
        <div style={{ ...S.card, display: "flex", alignItems: "center", padding: "12px 20px", marginBottom: 14 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, background: i < curStep ? "#22c55e" : i === curStep ? "#3b82f6" : "#111f33", color: i <= curStep ? "#fff" : "#475569", border: i > curStep ? "1px solid #1e2d45" : "none", boxShadow: i === curStep ? "0 0 0 4px rgba(59,130,246,0.2)" : "none" }}>
                  {i < curStep ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: i < curStep ? "#4ade80" : i === curStep ? "#93c5fd" : "#334155", whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "#1e2d45", margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        {/* UPLOAD */}
        {phase === "upload" && (
          <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); loadFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
            style={{ ...S.card, textAlign: "center", padding: "60px 24px", cursor: "pointer", border: `2px dashed ${drag ? "#3b82f6" : "#1e2d45"}`, background: drag ? "rgba(59,130,246,0.04)" : "#0d1829" }}>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => loadFile(e.target.files[0])} />
            <div style={{ fontSize: 52, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>Drop your product CSV here</div>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>Handles 3 GB+ · No API key needed · <code style={{ background: "#111f33", padding: "2px 7px", borderRadius: 6, color: "#60a5fa" }}>product_title</code> auto-detected</div>
            <div style={S.btn()}>Browse File</div>
          </div>
        )}

        {/* SETUP */}
        {phase === "setup" && (
          <div style={S.card}>
            <h2 style={S.h2}>🗂 Select Product Title Column</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label style={S.label}>Column to Categorize</label>
                <select value={col} onChange={e => setCol(e.target.value)} style={{ ...S.sel, width: "100%" }}>
                  {cols.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div style={{ background: "#111f33", border: "1px solid #1e2d45", borderRadius: 11, padding: "13px 15px", fontSize: 12, color: "#64748b" }}>
                <div style={{ fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>📄 File Info</div>
                <div>Name: <span style={{ color: "#cbd5e1" }}>{file?.name}</span></div>
                <div style={{ marginTop: 3 }}>Size: <span style={{ color: "#cbd5e1" }}>{((file?.size || 0) / 1024 / 1024).toFixed(1)} MB</span></div>
                <div style={{ marginTop: 3 }}>Columns: <span style={{ color: "#cbd5e1" }}>{cols.length}</span></div>
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>Taxonomy Preview ({Object.keys(TAXONOMY).length} Categories)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(TAXONOMY).map(([cat, subs], i) => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, background: "#111f33", border: "1px solid #1e2d45", borderRadius: 9, padding: "6px 11px", fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: PAL[i % PAL.length], flexShrink: 0 }} />
                    <span style={{ color: "#94a3b8" }}>{cat}</span>
                    <span style={{ color: "#334155" }}>· {Object.keys(subs).length} subcats</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={doProcess} style={S.btn()}>🚀 Start Categorizing →</button>
              <span style={{ fontSize: 11, color: "#475569" }}>Pure keyword NLP · No API · Instant</span>
            </div>
          </div>
        )}

        {/* RUNNING */}
        {phase === "running" && (
          <div style={S.card}>
            <h2 style={{ ...S.h2, display: "flex", alignItems: "center", gap: 10 }}><Spin /> Processing…</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Rows Classified</div><div style={{ fontSize: 20, fontWeight: 800, color: "#93c5fd" }}>{fmt(prog.done)}</div></div>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Time Elapsed</div><div style={{ fontSize: 20, fontWeight: 800, color: "#fde68a" }}>{fmtSec(elapsed)}</div></div>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Speed</div><div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>{elapsed > 0 ? fmt((prog.done / elapsed) | 0) : 0}/s</div></div>
            </div>
            <Bar pct={prog.total > 0 ? 100 : 5} a="#3b82f6" b="#8b5cf6" />
            {live.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Live Feed</div>
                {live.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#111f33", borderRadius: 8, padding: "7px 12px", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ flex: 1, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                    <span style={{ color: "#60a5fa", fontWeight: 600, flexShrink: 0 }}>{item.category}</span>
                    <span style={{ color: "#a78bfa", flexShrink: 0 }}>→ {item.subcategory}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DONE */}
        {phase === "done" && (
          <div style={S.card}>

            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ ...S.h2, margin: 0 }}>✅ Categorization Complete!</h2>
              <button
                onClick={() => download(null)}
                style={{ ...S.btn("#16a34a"), display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                📊 Download All — {fmt(rows.length)} rows
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Total Rows</div><div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(rows.length)}</div><div style={{ fontSize: 11, color: "#374151" }}>{((file?.size || 0) / 1024 / 1024).toFixed(1)} MB</div></div>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Categories Found</div><div style={{ fontSize: 20, fontWeight: 800, color: "#93c5fd" }}>{sortedCats.length}</div></div>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Time Taken</div><div style={{ fontSize: 20, fontWeight: 800, color: "#86efac" }}>{fmtSec(elapsed)}</div></div>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Uncategorized</div><div style={{ fontSize: 20, fontWeight: 800, color: "#f87171" }}>{fmt((catSummary["Uncategorized"] || { total: 0 }).total)}</div><div style={{ fontSize: 11, color: "#374151" }}>{rowPct((catSummary["Uncategorized"] || { total: 0 }).total)}%</div></div>
            </div>

            {/* Category breakdown with per-category download */}
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Results by Category — click ⬇️ to download that category only
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
              {sortedCats.map(([cat, data], i) => {
                const p = rowPct(data.total);
                return (
                  <div key={cat} style={{ background: "#111f33", border: "1px solid #1e2d45", borderRadius: 11, padding: "12px 14px" }}>

                    {/* Category header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: PAL[i % PAL.length], flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", flex: 1 }}>{cat}</span>
                      <span style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700 }}>{fmt(data.total)} rows</span>
                      <span style={{ fontSize: 11, color: "#475569", marginRight: 10 }}>({p}%)</span>
                      <button
                        onClick={() => download(cat)}
                        style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.35)", color: "#60a5fa", borderRadius: 7, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                        ⬇️ Download ({fmt(data.total)})
                      </button>
                    </div>

                    {/* Bar */}
                    <div style={{ height: 4, background: "#1e2d45", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ width: `${p}%`, height: "100%", background: PAL[i % PAL.length] + "bb", borderRadius: 999 }} />
                    </div>

                    {/* Sub-category pills */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingLeft: 16 }}>
                      {Object.entries(data.subs).sort((a, b) => b[1] - a[1]).map(([sub, cnt]) => (
                        <span key={sub} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1e2d45", borderRadius: 999, padding: "2px 9px", fontSize: 11, color: "#94a3b8" }}>
                          {sub} <span style={{ color: "#60a5fa", fontWeight: 700 }}>{fmt(cnt)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: 14, background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 11, padding: "13px 16px", fontSize: 12, color: "#4ade80", display: "flex", gap: 10 }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <div>
                <b>Download All</b> → 3 sheets: Categorized Products · Summary · Taxonomy &amp; Keywords
                <br />
                <b>Download (per category)</b> → 2 sheets: that category's rows only · Sub-category summary
                <div style={{ color: "#16a34a", marginTop: 3, fontSize: 11 }}>Every Excel file includes <b>Category</b> and <b>Sub-Category</b> columns so each file is self-identified.</div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div style={{ background: "rgba(127,29,29,0.12)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f87171", marginBottom: 10 }}>❌ Error</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, background: "rgba(127,29,29,0.18)", color: "#fca5a5", borderRadius: 9, padding: "10px 13px", marginBottom: 12 }}>{err}</div>
            <button onClick={() => { setPhase("upload"); setFile(null); setErr(""); setRows([]); allRows.current = []; setProg({ total: 0, done: 0 }); }}
              style={{ ...S.btn("#1e293b"), border: "1px solid #334155", color: "#cbd5e1" }}>↩ Start Over</button>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: "#1e2d45", paddingTop: 8 }}>
          {Object.keys(TAXONOMY).length} categories · {Object.values(TAXONOMY).flatMap(s => Object.values(s)).flat().length}+ keywords · No API key required
        </div>
      </div>
    </div>
  );
}
