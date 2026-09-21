import type { RelatedLink } from "@/components/GuideRelated";

export type GlobalFindsSection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

export type GlobalFindsGuide = {
  path: string;
  title: string;
  description: string;
  h1: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  intro: string;
  catalogCategory: string;
  catalogSubcategory: string;
  catalogQuery?: string;
  productPattern?: RegExp;
  productExcludePattern?: RegExp;
  browseHref: string;
  browseLabel: string;
  productHeading: string;
  closingHeading: string;
  closing: string;
  sections: GlobalFindsSection[];
  related: RelatedLink[];
};

const commonRelated: RelatedLink[] = [
  { href: "/cnfans-size-guide", title: "CNFans Size Guide", blurb: "Measure a similar garment before choosing a label." },
  { href: "/how-to-order", title: "How to Order", blurb: "A clear route from product page to tracking." },
  { href: "/cnfans-delivery-uk", title: "Delivery Guide", blurb: "Check current delivery and tracking notes." },
  { href: "/cnfans-finds", title: "CNFans Finds", blurb: "Browse the wider clothing discovery edit." },
];

export const PHASE_FIVE_GUIDES: GlobalFindsGuide[] = [
  {
    path: "/cnfans-sweater-finds",
    title: "CNFans Sweater Finds 2026 | Knit & Crewneck Clothing Finds",
    description: "Explore CNFans sweater finds for 2026, with practical notes on knit texture, fabric weight, fit and everyday layering.",
    h1: "CNFans Sweater Finds 2026",
    primaryKeyword: "cnfans sweater finds",
    secondaryKeywords: ["crewneck sweaters", "knit jumper fits", "everyday knitwear"],
    searchIntent: "Find current sweaters, compare knit construction and choose a wearable fit for layering.",
    intro: "A sweater earns its place when it feels right against the skin, sits cleanly over a base layer and works with more than one pair of bottoms. This 2026 edit focuses on crewnecks and knitted pullovers in the live catalogue, with practical checks for weight, texture, proportions and care.",
    catalogCategory: "tops",
    catalogSubcategory: "sweaters",
    catalogQuery: "sweater",
    productPattern: /sweater|jumper|pullover|knit/i,
    browseHref: "/category/tops/sweaters",
    browseLabel: "Browse Sweaters",
    productHeading: "Crewnecks and knit layers in the live catalogue",
    closingHeading: "A useful sweater is a repeat-wear layer",
    closing: "Keep the product measurements beside the way you plan to wear the sweater. Check the current size and material notes, then use <a href=\"/how-to-order\">How to Order</a> if you need the purchase steps. The catalogue changes over time, so return to <a href=\"/category/new-in\">New In</a> when you are ready to compare another batch.",
    sections: [
      { heading: "Read the knit before the colour", paragraphs: [
        "The surface tells you a lot. A fine, even knit gives a smoother layer beneath a jacket, while a chunky or brushed texture adds volume on its own. Look for the relationship between stitch size and the intended shape: a heavy-looking yarn in a close cut can feel warmer than a thin, wide jumper, but it will not drape in the same way.",
        "Crewnecks are often easier to use than a deep neckline because they frame a T-shirt without exposing too much of the base layer. Ribbed cuffs and hem should recover after a gentle stretch. If the product images show the knit sitting away from the body, allow that ease when comparing measurements in the <a href=\"/cnfans-size-guide\">size guide</a>." ] },
      { heading: "Weight and warmth are separate choices", paragraphs: [
        "A dense wool blend may hold warmth while remaining relatively thin, whereas a looser cotton knit can feel breathable but occupy more room under a coat. Think about the layer that normally goes over it. A sweater for an indoor-to-outdoor commute needs less bulk through the sleeve than one worn alone on a mild day.",
        "The catalogue may describe fibre or blend details, but not every listing gives a complete composition. Treat missing information as unknown rather than guessing from a photograph. For a broader look at live knit layers, use the <a href=\"/category/tops\">Tops collection</a> and compare the product notes side by side." ] },
      { heading: "Get the proportion right", paragraphs: [
        "A relaxed sweater does not have to be long. A wider body with a hem around the hip works neatly with straight or wider jeans, while a longer jumper can cover the rise and make the outfit look heavier. Shoulder construction matters too: a dropped seam adds visual width and changes where the sleeve measurement begins.",
        "Use a sweater you already wear as the reference. Measure chest, shoulder, sleeve and back length flat, then compare like-for-like. If you are between sizes, decide whether you need extra body room or simply prefer a softer shoulder line. The <a href=\"/cnfans-finds\">finds index</a> helps you compare the surrounding categories without losing that fit-led approach." ] },
      { heading: "Build a small rotation", paragraphs: [
        "One neutral crewneck can support several outfits: dark denim and trainers, relaxed trousers with a shirt collar showing, or shorts in a cool evening. A second sweater can bring texture or colour, but it should still connect with the layers already in your wardrobe. Repeating the same shape in different yarns often gives more use than buying several near-identical colours.",
        "For a clean casual line, keep the sweater hem visible and let the lower half provide contrast. A cropped or boxy knit works with a higher rise; a longer, finer layer sits better with a straight trouser. Check the current <a href=\"/category/new-in\">New In</a> arrivals when you want to see what has changed rather than assuming every listed style is newly added." ] },
      { heading: "A sweater for the day you actually have", paragraphs: [
        "A crewneck that works from a desk to an evening walk is usually easier to justify than a piece reserved for one temperature. Keep a light tee beneath it when you expect indoor heat, or choose a denser knit when the sweater is the outermost layer. The small decision is about the gaps between places, not a fixed season label.",
        "Notice how the cuff meets your watch or sleeve and how the hem behaves when you sit. Those contact points decide comfort more than a trend description. A little movement at the shoulder and a stable hem are good signs that the sweater will earn repeat wears."
      ] },
      { heading: "Care that protects the shape", paragraphs: [
        "Knitwear rewards a slower wash. Follow the care label, avoid high heat and support a wet sweater rather than hanging it from the shoulders. Pilling is affected by friction, so rotate pieces and keep rough fasteners away from the surface. Fold heavier jumpers instead of leaving them on a thin hanger.",
        "Availability and colour options can move between batches. Confirm the size and material notes on the product page, then use <a href=\"/how-to-order\">How to Order</a> if you need a quick walkthrough. CNFans UK is an independent clothing store and product discovery site; product information remains the useful source for the individual item." ] },
    ],
    related: commonRelated,
  },
  {
    path: "/cnfans-cardigan-finds",
    title: "CNFans Cardigan Finds 2026 | Knitwear & Layering Finds",
    description: "Browse CNFans cardigan finds for 2026, focusing on button placement, knit structure, layering room and everyday styling.",
    h1: "CNFans Cardigan Finds 2026",
    primaryKeyword: "cnfans cardigan finds",
    secondaryKeywords: ["button-up cardigans", "open-front knitwear", "cardigan layering"],
    searchIntent: "Compare real cardigans by closure, knit texture, fit and the layers they can sit over.",
    intro: "A cardigan is a layer with more moving parts than a crewneck: the front can be worn closed, open or partly fastened, and the knit has to keep its shape around the placket. These notes help you compare current cardigan listings without treating every knitted top as the same garment.",
    catalogCategory: "tops",
    catalogSubcategory: "sweaters",
    catalogQuery: "cardigan",
    productPattern: /cardigan/i,
    browseHref: "/category/tops/sweaters",
    browseLabel: "Browse Knit Layers",
    productHeading: "Cardigans currently listed",
    closingHeading: "Let the front construction earn its space",
    closing: "Before ordering, check the cardigan closed as well as open: front width, button spacing and sleeve length decide how often it will be worn. Confirm the listing measurements, then use <a href=\"/how-to-order\">How to Order</a> or the <a href=\"/cnfans-delivery-uk\">delivery guide</a> for service details. CNFans UK is an independent clothing store and product discovery site, and each live listing remains the source for its own specifications.",
    sections: [
      { heading: "Buttoned, open or zip-front", paragraphs: [
        "A button-up cardigan gives you the most control over the neckline. Fasten the top button over a tee for a tidy frame, leave the middle open for movement or wear it fully closed as a soft alternative to a jumper. An open-front style creates a longer vertical line but needs enough structure at the shoulder to avoid collapsing.",
        "A zip detail does not automatically make a cardigan a hoodie. Look at the collar, front construction and knit surface first. The listing photos should show how the front lies when closed. Compare those details with the <a href=\"/category/tops/sweaters\">Sweaters category</a> rather than relying only on a product title." ] },
      { heading: "Knit structure changes the fit", paragraphs: [
        "Fine-gauge knits are easier to layer beneath a jacket and tend to follow the body more closely. Chunkier cables, brushed yarns and patterned stitches add warmth and visual weight, so a cardigan can feel full even when the chest measurement looks familiar. Ribbing around the cuff and hem also affects how much the piece gathers.",
        "Check the shoulder and sleeve as carefully as the chest. A dropped shoulder can make a cardigan look relaxed while leaving a shorter sleeve measurement; a set-in shoulder will read neater. Use a favourite knit as a flat reference and record the numbers before opening the <a href=\"/cnfans-size-guide\">size guide</a>." ] },
      { heading: "Layer it with a clear base", paragraphs: [
        "A plain tee keeps a patterned cardigan from becoming busy. A collared shirt under a fine knit gives a sharper line, while an open cardigan over a heavyweight tee feels more casual. Keep the layer beneath no wider than the cardigan through the shoulder unless the loose silhouette is intentional.",
        "For colder weather, a cardigan can sit under a roomy jacket, but avoid forcing thick sleeves into a narrow armhole. If you need a different outer layer, the <a href=\"/category/outerwear\">Outerwear collection</a> shows jackets with more space to work around knitwear. The <a href=\"/cnfans-jacket-finds\">jacket finds guide</a> gives additional proportion notes." ] },
      { heading: "Colour and pattern with purpose", paragraphs: [
        "A charcoal, navy, brown or cream cardigan can cover the same role as a neutral sweater while giving you the option of changing the neckline. Stripes, contrast buttons and intarsia patterns bring interest, but check what they sit next to. A patterned knit usually needs simpler bottoms and a quieter base layer.",
        "Look at the hem in the product images. A shorter cardigan suits higher-rise trousers and jeans; a longer one can balance a straight or relaxed leg. The current <a href=\"/category/new-in\">New In</a> page changes over time, so save a listing only after confirming its present colour and size options." ] },
      { heading: "Use the front to change the outfit", paragraphs: [
        "The same cardigan can read neat, relaxed or almost jacket-like depending on how many buttons you use. Fasten the middle over a plain tee for a straightforward line, leave it open over a shirt for movement or let one button sit at the waist to show the rise of your trousers. The garment stays the same; the proportion changes.",
        "Keep a note of the front width when closed. A cardigan that only looks good open may be too narrow for the way you intend to wear it, while one that sits neatly both ways gives you more options from a single layer."
      ] },
      { heading: "Care and ordering checks", paragraphs: [
        "Buttons and loose stitches are the first areas to inspect when a cardigan arrives. Follow the care label, wash gently and dry flat when the knit calls for it. Avoid hanging a heavy cardigan wet, which can pull the shoulder and stretch the front band.",
        "Product availability can change between catalogue batches. Read the listing measurements and material note, then use <a href=\"/how-to-order\">How to Order</a> or the <a href=\"/cnfans-delivery-uk\">delivery guide</a> for service details. CNFans UK is an independent clothing store and product discovery site, so the individual listing remains the authority for its own specifications." ] },
    ],
    related: [
      { href: "/cnfans-sweater-finds", title: "Sweater Finds", blurb: "Crewnecks and pullovers with a different front construction." },
      ...commonRelated,
    ],
  },
  {
    path: "/cnfans-shorts-finds",
    title: "CNFans Shorts Finds 2026 | Casual & Summer Clothing Finds",
    description: "Explore CNFans shorts finds for 2026, with practical notes on length, rise, fabric weight, pockets and warm-weather outfits.",
    h1: "CNFans Shorts Finds 2026",
    primaryKeyword: "cnfans shorts finds",
    secondaryKeywords: ["casual shorts", "sweat shorts", "summer outfits"],
    searchIntent: "Find wearable shorts and compare length, rise, fabric and outfit use before ordering.",
    intro: "Shorts are simple until the rise, hem and fabric weight work against the way you move. This page focuses on current casual and sweat-short listings, with a few checks that make a pair easier to wear through warm days, travel and relaxed weekends.",
    catalogCategory: "bottoms",
    catalogSubcategory: "shorts",
    catalogQuery: "shorts",
    productPattern: /shorts/i,
    browseHref: "/category/bottoms/shorts",
    browseLabel: "Browse Shorts",
    productHeading: "Shorts to compare for warmer days",
    closingHeading: "Choose the pair you will reach for",
    closing: "Use the outseam, rise and waistband measurements as your final check, then confirm the fabric and pocket details on the live listing. <a href=\"/how-to-order\">How to Order</a> explains the purchase path, while <a href=\"/category/co-ords-sets/shorts-sets\">Shorts Sets</a> is there when a coordinated outfit makes more sense. CNFans UK is an independent clothing store and product discovery site; no generic summer rule replaces the actual garment information.",
    sections: [
      { heading: "Length starts with your movement", paragraphs: [
        "A shorter hem gives the leg more air and works well for sport-inspired outfits, while a longer pair offers more coverage and a calmer proportion with an oversized tee. The important point is where the hem lands while you walk and sit, not only how it looks in a product photo.",
        "Use a pair from your wardrobe as a reference. Measure the outseam, waist and leg opening flat, then compare with the listing. The <a href=\"/cnfans-size-guide\">size guide</a> is useful when the product uses a different measurement method or a letter size that does not match your usual label." ] },
      { heading: "Rise, waistband and pocket weight", paragraphs: [
        "A mid-rise sits comfortably with most tees and shirts. Elastic or drawcord waists give flexibility, but the relaxed measurement still needs to hold securely without relying on a cord pulled too tight. Fixed waistbands can look cleaner, though they leave less tolerance when your body sits between sizes.",
        "Pockets add weight at the hip. Deep side pockets are useful, while large cargo-style pockets change the silhouette and can pull the fabric when filled. Look for the pocket opening and stitching in the photos, then browse the wider <a href=\"/category/bottoms\">Bottoms collection</a> for alternatives." ] },
      { heading: "Pick fabric for the temperature", paragraphs: [
        "Light cotton jersey feels soft and breathable, loopback fleece gives more substance without a brushed interior and woven nylon often dries quickly. A heavy fleece short can feel uncomfortable in high heat, while a very light jersey may lose its shape when used as an everyday bottom.",
        "Think about the top you will wear with it. A structured woven short can support a relaxed shirt; a soft sweat short pairs naturally with a tee or hoodie. The <a href=\"/category/co-ords-sets/shorts-sets\">shorts sets</a> category is a useful place to compare coordinated options without pretending every set fits the same way." ] },
      { heading: "Keep summer outfits balanced", paragraphs: [
        "A roomy short looks considered with a tee that has a defined hem or a shirt worn open over a plain base. If both the top and bottom are wide, show some waist or use a shorter layer to keep the outfit from becoming one long block. Neutral shorts make colour and texture easier to change above them.",
        "For travel, choose pockets and a waistband that stay comfortable when seated. For evenings, a longer short with a lightweight overshirt gives more coverage without adding a full trouser. Check <a href=\"/category/new-in\">New In</a> for current warm-weather arrivals and confirm the exact size before ordering." ] },
      { heading: "A short rotation beats a single-use pair", paragraphs: [
        "Two shorts can cover most warm-weather days when they serve different jobs: one soft pair for travel and movement, one cleaner woven pair for an overshirt or evening plan. Change the top, footwear or colour rather than adding another pair with the same rise and length.",
        "If you prefer a longer hem, balance it with a shorter or tucked top. If you prefer a shorter cut, a relaxed tee can add visual weight above it. The useful choice is the one that still feels comfortable after sitting, walking and carrying what you normally carry."
      ] },
      { heading: "Wash, dry and order with care", paragraphs: [
        "Turn printed or darker shorts inside out, close drawcords and follow the care label. Avoid high heat when the fabric contains elastane or a brushed finish. Let the waistband dry fully before storing so the elastic does not stay stretched.",
        "Availability changes as batches move. Read the product page, then use <a href=\"/how-to-order\">How to Order</a> and the <a href=\"/cnfans-delivery-uk\">delivery guide</a> when you need service information. CNFans UK is an independent clothing store and product discovery site; no general fit note replaces the garment measurements." ] },
    ],
    related: [
      { href: "/cnfans-summer-outfits", title: "Summer Outfit Ideas", blurb: "Light layers and easy warm-weather combinations." },
      { href: "/category/co-ords-sets/shorts-sets", title: "Shorts Sets", blurb: "Matching options when you want the top and bottom to connect." },
      ...commonRelated,
    ],
  },
  {
    path: "/cnfans-shirt-finds",
    title: "CNFans Shirt Finds 2026 | Casual Shirts & Overshirt Finds",
    description: "Browse CNFans shirt finds for 2026, including casual button shirts and overshirt-style layers with practical fit notes.",
    h1: "CNFans Shirt Finds 2026",
    primaryKeyword: "cnfans shirt finds",
    secondaryKeywords: ["casual button shirts", "overshirts", "flannel-style shirts"],
    searchIntent: "Compare casual shirts by collar, cloth, fit and layering role rather than treating every button top alike.",
    intro: "A casual shirt can be a base layer, a light jacket or the piece that sharpens a simple pair of jeans. The useful details are familiar ones: collar shape, cloth weight, sleeve finish, body length and the room left for a tee underneath.",
    catalogCategory: "tops",
    catalogSubcategory: "shirts",
    catalogQuery: "shirt",
    productPattern: /shirt|overshirt|flannel/i,
    productExcludePattern: /t-?shirt|sweatshirt|hoodie/i,
    browseHref: "/category/tops/shirts",
    browseLabel: "Browse Shirts",
    productHeading: "Shirts and overshirt layers in the live catalogue",
    closingHeading: "Let the shirt do one clear job",
    closing: "Decide if the piece is your base shirt, an open layer or a light jacket before choosing a size. Compare the collar, chest, sleeve and back length with something you already wear. Check <a href=\"/how-to-order\">How to Order</a> for the purchase steps and the live listing for its current cloth and options. CNFans UK is an independent clothing store and product discovery site.",
    sections: [
      { heading: "Know which shirt role you need", paragraphs: [
        "A button shirt worn close to the body needs a clean shoulder and a hem that sits comfortably when tucked or left out. An overshirt is cut with more ease so it can sit over a tee or fine knit. The words can overlap in a title, so use the photos and measurements to understand the intended role.",
        "Collar height changes the outfit. A spread or point collar reads neater under knitwear, while a camp or soft collar feels more relaxed worn open. The <a href=\"/category/tops/shirts\">Shirts category</a> gives you the current product context; the <a href=\"/cnfans-size-guide\">size guide</a> explains how to compare a flat garment." ] },
      { heading: "Fabric decides the season", paragraphs: [
        "Oxford-style cotton and brushed flannel carry more structure and warmth, while poplin, linen blends and lighter jersey breathe more easily. A heavier shirt can replace a jacket on a mild day, but it needs an armhole that still moves when worn over a base layer.",
        "Check the surface and drape in multiple product images. A crisp cloth holds a straighter line; a washed or brushed finish softens the outline. If you want a layer for changeable weather, compare shirts with the <a href=\"/category/outerwear\">outerwear collection</a> rather than assuming one shirt weight covers every month." ] },
      { heading: "Get the shoulder and length working together", paragraphs: [
        "The shoulder seam should sit where the construction intends. An overshirt may drop farther out, but the sleeve still needs to finish near the wrist when your arms hang naturally. Body length controls the proportion over trousers: a shorter shirt suits a higher rise, while a longer overshirt can cover a tee without bunching.",
        "Compare chest, shoulder, sleeve and back length with a shirt you reach for often. If a piece is meant to be worn open, leave space for the base layer without creating a large gap at the neck. Use <a href=\"/cnfans-finds\">CNFans Finds</a> to move between shirts, tees and outer layers as one outfit." ] },
      { heading: "Simple outfit formulas", paragraphs: [
        "A plain tee under an open shirt is the dependable starting point. Add straight jeans for a clean line, relaxed trousers for more volume or shorts when the fabric is light enough for warm weather. A patterned shirt can lead the outfit, so keep the rest of the colours quiet and let the collar remain visible.",
        "For a smarter feel, close the shirt and tuck only the front into a higher-rise bottom. For a casual layer, push the sleeves once and leave the hem open. The <a href=\"/category/new-in\">New In</a> collection shows recent stock, but check each listing before relying on a colour or size." ] },
      { heading: "A shirt can change the level of a simple outfit", paragraphs: [
        "Start with the same jeans and tee, then change only the shirt. An open overshirt adds texture and a second vertical line; a closed button shirt gives a cleaner frame; a brushed check makes the outfit feel more relaxed. This is why collar, hem and sleeve shape are worth checking before colour.",
        "If you roll the sleeves, measure the cuff and upper arm with that movement in mind. A neat roll needs enough width to stay in place without pushing the fabric above the elbow. Small construction choices often decide whether a shirt feels easy or fussy."
      ] },
      { heading: "Care and ordering notes", paragraphs: [
        "Follow the care label, especially for brushed or garment-dyed cloth. Hang shirts while damp only when the fabric supports it, and reshape the collar and cuffs before drying. Turn printed pieces inside out to reduce rubbing across the surface.",
        "Before ordering, confirm the actual measurements and closure details. <a href=\"/how-to-order\">How to Order</a> covers the purchase flow and the <a href=\"/cnfans-delivery-uk\">delivery guide</a> covers service notes. CNFans UK is an independent clothing store and product discovery site; the current listing is the source for its own material and fit information." ] },
    ],
    related: [
      { href: "/cnfans-t-shirt-finds", title: "T-Shirt Finds", blurb: "Base layers to wear beneath an open shirt." },
      { href: "/category/tops", title: "Tops", blurb: "Compare shirts with tees, hoodies and knit layers." },
      ...commonRelated,
    ],
  },
  {
    path: "/cnfans-knitwear-finds",
    title: "CNFans Knitwear Finds 2026 | Sweaters, Cardigans & Knits",
    description: "Explore CNFans knitwear finds for 2026, from sweaters to cardigans, with clear notes on stitch, fibre, weight and fit.",
    h1: "CNFans Knitwear Finds 2026",
    primaryKeyword: "cnfans knitwear finds",
    secondaryKeywords: ["knitwear guide", "sweaters and cardigans", "knitted tops"],
    searchIntent: "Browse the wider knitwear edit and decide which construction, weight and silhouette fits an existing wardrobe.",
    intro: "Knitwear is a category rather than one silhouette. A fine crewneck, a button cardigan and a patterned heavier knit can all live in the same drawer while doing different jobs. This wider 2026 guide helps you compare those jobs and then follow the product link that matches your plan.",
    catalogCategory: "tops",
    catalogSubcategory: "sweaters",
    catalogQuery: "knit",
    productPattern: /knit|sweater|jumper|cardigan|pullover/i,
    browseHref: "/category/tops/sweaters",
    browseLabel: "Browse Knitwear",
    productHeading: "A cross-section of current knitwear",
    closingHeading: "Build the category around different roles",
    closing: "Keep one note beside each shortlist item: base layer, mid-layer or visible top layer. That small distinction prevents three similar knits competing for the same use. Confirm the current measurements and material notes, then move through <a href=\"/cnfans-finds\">CNFans Finds</a> when you want to compare another clothing category. CNFans UK is an independent clothing store and product discovery site.",
    sections: [
      { heading: "Start with construction", paragraphs: [
        "The stitch affects both texture and movement. A smooth fine gauge layers neatly under a jacket, a rib knit has more stretch and a stronger vertical line, while cables and jacquards add depth and usually more weight. The same fibre can feel different depending on how tightly it is knitted.",
        "Separate sweaters from cardigans by the way the front is built. Pullovers make a continuous body; cardigans need a stable placket, buttons or another closure. Use the <a href=\"/cnfans-sweater-finds\">sweater finds</a> page for crewneck-focused choices and <a href=\"/cnfans-cardigan-finds\">cardigan finds</a> when the front opening matters." ] },
      { heading: "Fibre, handle and heat", paragraphs: [
        "Wool and wool blends can hold warmth with a lighter surface, cotton knits often feel breathable and familiar, and synthetic blends may add resilience or a smoother finish. Do not infer a composition from colour or fuzz. If a listing does not state a material, treat it as not specified.",
        "Think about indoor temperature and the layer above. Dense knitwear can replace a light jacket, but it needs room at the armhole. For a broader comparison, browse <a href=\"/category/tops/sweaters\">Sweaters</a> and check each product’s own material and measurements." ] },
      { heading: "Fit across the shoulders", paragraphs: [
        "Knitwear can stretch, but stretching is not a substitute for the right size. Shoulder position, chest ease, sleeve length and hem width all affect the final line. A dropped shoulder looks relaxed; a set-in shoulder keeps a cleaner edge under outerwear. Body length also decides whether a layer works with a higher rise.",
        "Measure a knit flat without pulling it, then compare with a piece you like. If you plan to wear a shirt underneath, add room for the collar and sleeves. The <a href=\"/cnfans-size-guide\">size guide</a> is a useful reminder to compare like-for-like rather than relying on a letter label." ] },
      { heading: "Make texture do the work", paragraphs: [
        "A textured knit gives an outfit interest without a large print. Keep the lower half simple with dark denim, straight trousers or clean shorts in warmer months. Fine knits can carry a patterned shirt underneath; a chunky pattern usually looks better with a plain base and uncomplicated outerwear.",
        "Neutral colours create the most combinations, while a single seasonal shade can change the feel of an existing outfit. Check <a href=\"/category/new-in\">New In</a> for recent additions, but remember that catalogue availability changes and a new listing is not automatically a better fit." ] },
      { heading: "Build a knitwear shelf with different jobs", paragraphs: [
        "A fine crewneck can sit under a jacket, a button cardigan can replace an overshirt and a textured jumper can become the visible centre of an outfit. Giving each knit a different role makes the category easier to shop and stops several pieces competing for the same space in your weekly rotation.",
        "When comparing listings, write down the use case beside the measurements: base layer, mid-layer or top layer. That short note keeps a visually appealing knit from becoming an awkward purchase once you try to dress around it."
      ] },
      { heading: "Care, storage and ordering", paragraphs: [
        "Read the care label and avoid high heat. Fold heavy pieces, support wet knits and keep rough surfaces from rubbing against fine yarn. Rotate wear so the elbows and cuffs have time to recover. These small habits protect shape more reliably than trying to repair a stretched shoulder later.",
        "For the purchase steps, use <a href=\"/how-to-order\">How to Order</a>; for service details, see the <a href=\"/cnfans-delivery-uk\">delivery guide</a>. CNFans UK is an independent clothing store and product discovery site, and each product page remains the place to confirm its current specifications." ] },
    ],
    related: commonRelated,
  },
  {
    path: "/cnfans-zip-hoodie-finds",
    title: "CNFans Zip Hoodie Finds 2026 | Full-Zip Hoodie Layers",
    description: "Browse CNFans zip hoodie finds for 2026, with practical checks for zipper feel, hood shape, fabric weight and layering room.",
    h1: "CNFans Zip Hoodie Finds 2026",
    primaryKeyword: "cnfans zip hoodie finds",
    secondaryKeywords: ["full-zip hoodies", "zip-up hoodie fit", "hoodie layering"],
    searchIntent: "Find genuine full-zip or zip-up hoodies when the available catalogue data identifies them clearly.",
    intro: "A full-zip hoodie works as a top layer because you can open it as the temperature changes. The useful checks are different from a pullover: the zipper should lie flat, the hood needs enough shape to sit comfortably and the body must leave room for the base layer without looking inflated.",
    catalogCategory: "tops",
    catalogSubcategory: "hoodies",
    catalogQuery: "zip hoodie",
    productPattern: /zip/i,
    browseHref: "/category/tops/hoodies",
    browseLabel: "Browse Hoodies",
    productHeading: "Verified zip construction in the live catalogue",
    closingHeading: "Keep this page honest as stock changes",
    closing: "A zip-hoodie page only helps when the live listing clearly identifies a full opening. Check the front construction, hood and measurements on each product rather than assuming a pullover is equivalent. If the catalogue adds a matching item later, return to this page; until then, use <a href=\"/cnfans-hoodie-finds\">hoodie finds</a> for the broader edit. CNFans UK is an independent clothing store and product discovery site.",
    sections: [
      { heading: "Check the front opening", paragraphs: [
        "A full-length zip changes the way a hoodie hangs. When open, both sides should fall without twisting; when closed, the teeth or coil should track smoothly and not pull across the chest. A two-way zip can give more movement at the hem, but only if the listing clearly shows that construction.",
        "Look for the zipper pull, guard and pocket openings in the product photos. Do not assume a sweatshirt with a small neck zip is a full-zip hoodie. Start with the live <a href=\"/category/tops/hoodies\">Hoodies category</a> and confirm the closure in each product listing." ] },
      { heading: "Hood, cuffs and fabric weight", paragraphs: [
        "A hood with a little structure stays put when worn open, while a very soft hood can collapse against the back. Ribbed cuffs and hem should recover after movement. Brushed fleece is warmer and fuller; loopback cotton layers more easily and feels cooler indoors.",
        "The fabric weight should match the jacket you plan to wear over it. A heavy zip hoodie needs a generous armhole, while a medium layer can sit beneath a lighter jacket. Compare sleeve and chest measurements in the <a href=\"/cnfans-size-guide\">size guide</a>, not just the model’s silhouette." ] },
      { heading: "How to wear a full zip", paragraphs: [
        "Open over a plain tee, a zip hoodie creates a vertical line and lets the base layer provide colour. Closed under a coat, it works like a sweatshirt but gives quicker temperature control. Pair it with straight jeans or trousers when the top is relaxed; wider bottoms need a hem or waist detail to keep the outfit balanced.",
        "A neutral black, grey, navy or stone hoodie travels between outfits easily. If the listing has a strong logo or contrast zip, keep the other layers quiet. The <a href=\"/cnfans-finds\">finds guide</a> and <a href=\"/category/outerwear\">outerwear collection</a> help you plan the full top half rather than buying a zip layer in isolation." ] },
      { heading: "When the data is narrow", paragraphs: [
        "The live catalogue changes and not every hoodie is labelled as zip-up. This page only displays product cards when the stored title or description identifies a zip construction; it does not relabel a pullover to make the list look fuller. That keeps the product links honest even when the selection is small.",
        "For broader everyday hoodie choices, use <a href=\"/cnfans-hoodie-finds\">hoodie finds</a>. Check the current size, colour and closure on the individual page before ordering, especially when a batch has changed." ] },
      { heading: "Test the zip with the layer underneath", paragraphs: [
        "A full-zip hoodie should open far enough to reveal the base layer without the two sides flaring away from the body. Try the intended tee or shirt underneath when you compare chest and hem measurements. If the zip line bows, the issue may be the layer allowance rather than the hoodie label.",
        "Check the hood when the zip is open and closed. A drawcord, higher collar or double-layer hood can change how the garment sits at the neck, especially under a coat. Those details are worth noting before you decide that every zip hoodie has the same fit."
      ] },
      { heading: "Care and service notes", paragraphs: [
        "Close the zip before washing, turn printed panels inside out and avoid high heat that can soften or warp the tape. Empty the pockets and reshape the hood while damp. A smooth zipper and stable cuffs last longer when the garment is not washed aggressively.",
        "Use <a href=\"/how-to-order\">How to Order</a> for the purchase flow and the <a href=\"/cnfans-delivery-uk\">delivery guide</a> for service information. CNFans UK is an independent clothing store and product discovery site; the page does not promise stock or construction that a live listing does not state." ] },
    ],
    related: [
      { href: "/cnfans-hoodie-finds", title: "Hoodie Finds", blurb: "Broader hoodie and sweatshirt choices." },
      { href: "/cnfans-hoodie-sizing", title: "Hoodie Sizing", blurb: "Measurements for shoulders, chest and sleeve room." },
      ...commonRelated,
    ],
  },
  {
    path: "/cnfans-baggy-jeans-finds",
    title: "CNFans Baggy Jeans Finds 2026 | Loose & Relaxed Denim",
    description: "Explore CNFans baggy jeans finds for 2026, comparing rise, leg opening, wash, length and proportions for relaxed denim.",
    h1: "CNFans Baggy Jeans Finds 2026",
    primaryKeyword: "cnfans baggy jeans finds",
    secondaryKeywords: ["loose fit jeans", "relaxed denim", "wide-leg jeans"],
    searchIntent: "Find denim with genuinely loose or relaxed shaping and choose a proportion that works with the rest of an outfit.",
    intro: "Baggy jeans are defined by the shape through the seat, thigh and leg, not by a single size label. This guide narrows the live denim catalogue to titles that indicate a loose, relaxed or similarly roomy cut, then explains what to check before ordering.",
    catalogCategory: "bottoms",
    catalogSubcategory: "jeans",
    catalogQuery: "relaxed",
    productPattern: /baggy|loose|relaxed|wide[- ]leg|boyfriend/i,
    browseHref: "/category/bottoms/jeans",
    browseLabel: "Browse Jeans",
    productHeading: "Loose and relaxed denim to compare",
    closingHeading: "Let the waist anchor the wider leg",
    closing: "The final check is simple: the waistband should stay secure, the rise should feel comfortable when seated and the hem should work with your usual shoe. Confirm those measurements on the current listing, then use <a href=\"/how-to-order\">How to Order</a> for the purchase flow. CNFans UK is an independent clothing store and product discovery site, and the garment page remains the authority for its specifications.",
    sections: [
      { heading: "Baggy is a proportion, not a waist size", paragraphs: [
        "A larger waist does not create a convincing baggy fit; it simply changes where the waistband sits. Look at the rise, seat, thigh and leg opening together. A higher rise can give the silhouette more stability, while a low rise may make a wide leg appear longer and harder to control.",
        "Measure jeans you already like flat and compare the waistband, front rise, hip, thigh, inside leg and hem. The <a href=\"/cnfans-size-guide\">size guide</a> helps you keep the method consistent. Start with the <a href=\"/category/bottoms/jeans\">Jeans category</a> when you want to inspect the full denim range." ] },
      { heading: "Choose the leg opening deliberately", paragraphs: [
        "A relaxed straight leg gives room without covering the shoe, while a wider opening creates more movement and a stronger streetwear line. Stacking can be intentional, but excess length also hides the footwear and collects at the ankle. Compare the hem with the shoes you actually wear.",
        "A cropped or shorter top can balance a wide lower half, but a neat shirt or fine knit can work as well when the rise is visible. Use <a href=\"/cnfans-finds\">CNFans Finds</a> to compare proportions across tops and outerwear instead of treating denim as a standalone trend." ] },
      { heading: "Wash and surface change the mood", paragraphs: [
        "Dark denim looks cleaner and can support a sharper jacket; mid-blue is the everyday middle ground; pale and washed finishes feel more casual. Distressing, paint or patchwork adds visual activity, so check whether the details sit where the leg naturally bends and whether they match your usual wardrobe.",
        "Denim starts firmer than it feels after wear. A little ease through the thigh improves movement, but excess fabric at the back can become uncomfortable. Check the product images for the actual fall, then browse <a href=\"/category/new-in\">New In</a> for recent washes without assuming a new batch has the same cut." ] },
      { heading: "Build outfits around the volume", paragraphs: [
        "A boxy tee or relaxed sweatshirt can share the volume of baggy jeans, but keep one edge defined: a shorter hem, a visible waistband or a jacket that finishes above the hip. A long oversized top over wide denim can lose the shape entirely unless that is the point.",
        "Shoes matter because the hem frames them. Low trainers keep a clean line; a heavier shoe can support a wider opening. A simple tee, open shirt and baggy denim is a reliable starting point, and the <a href=\"/cnfans-t-shirt-finds\">T-shirt finds</a> page gives real base-layer options." ] },
      { heading: "Start with the shoe and work upwards", paragraphs: [
        "Baggy denim changes the amount of shoe you can see. A low trainer leaves a clean break and keeps the leg looking longer; a wider or higher shoe supports a fuller hem. Try the intended footwear when checking the inside leg instead of judging the jeans with bare feet.",
        "A belt can stabilise a higher rise, but it will not fix a waistband that is too large. Prioritise the seat and rise first, then use the belt only for small adjustment. The goal is relaxed fabric with a secure base, not trousers that need constant pulling up."
      ] },
      { heading: "Care and ordering checks", paragraphs: [
        "Wash denim less often, turn it inside out and follow the care label to reduce unnecessary colour loss. Empty pockets and close fasteners before washing. Let jeans dry naturally when possible so the waist and leg do not take on a hard crease from high heat.",
        "Confirm waist, rise and inside-leg measurements on the live listing. Use <a href=\"/how-to-order\">How to Order</a> and the <a href=\"/cnfans-delivery-uk\">delivery guide</a> for service steps. CNFans UK is an independent clothing store and product discovery site; no general baggy-jeans rule replaces the garment measurements." ] },
    ],
    related: [
      { href: "/cnfans-jeans-finds", title: "Jeans Finds", blurb: "The wider denim edit, including straighter fits." },
      { href: "/cnfans-trouser-finds", title: "Trouser Finds", blurb: "Compare relaxed proportions in non-denim bottoms." },
      ...commonRelated,
    ],
  },
  {
    path: "/cnfans-graphic-t-shirt-finds",
    title: "CNFans Graphic T-Shirt Finds 2026 | Graphic Tee Finds",
    description: "Browse CNFans graphic T-shirt finds for 2026, with practical notes on print placement, blank fit, fabric weight and care.",
    h1: "CNFans Graphic T-Shirt Finds 2026",
    primaryKeyword: "cnfans graphic t-shirt finds",
    secondaryKeywords: ["graphic tees", "printed T-shirts", "oversized graphic tees"],
    searchIntent: "Find current printed tees and compare the artwork, blank shape, fabric weight and fit before ordering.",
    intro: "A graphic tee is two garments at once: the blank underneath and the artwork across it. The blank controls comfort and proportion; the print controls where the eye lands. This 2026 page narrows live T-shirt listings to titles that actually describe a graphic or print, then gives you a practical way to compare them.",
    catalogCategory: "tops",
    catalogSubcategory: "t-shirts",
    catalogQuery: "graphic",
    productPattern: /graphic|print|printed|logo|illustration|artwork/i,
    productExcludePattern: /hoodie|sweatshirt|shirt jacket/i,
    browseHref: "/category/tops/t-shirts",
    browseLabel: "Browse T-Shirts",
    productHeading: "Graphic tees currently available to compare",
    closingHeading: "Make the graphic part of an outfit",
    closing: "Choose the blank and the print together. Check the artwork scale against the body length, then picture it with your most-used bottoms and outer layer. Confirm the current size, colour and care notes before ordering; <a href=\"/how-to-order\">How to Order</a> covers the next step. CNFans UK is an independent clothing store and product discovery site.",
    sections: [
      { heading: "Look at the blank first", paragraphs: [
        "The same artwork can feel completely different on a close regular tee, a boxy blank or a long oversized body. Check shoulder width, chest ease, body length and sleeve shape before judging the print. A dropped shoulder creates more room and changes the position of a front graphic relative to your frame.",
        "Fabric weight affects how the tee hangs. Light jersey moves easily and layers under a shirt; heavier cotton gives a firmer outline and can carry a larger print without collapsing. Compare a current product with the <a href=\"/category/tops/t-shirts\">T-Shirts category</a> and use the <a href=\"/cnfans-size-guide\">size guide</a> for a flat measurement reference." ] },
      { heading: "Print placement and scale", paragraphs: [
        "A small chest mark leaves more room for other layers, while a large front or back graphic becomes the outfit’s main detail. Check whether the artwork sits high, centred or closer to the hem. Placement changes when the tee is worn oversized, so picture the actual body length rather than the model’s pose.",
        "If the listing shows a back print, make sure the front remains simple enough for the layers you own. A graphic tee beneath an open shirt is easier to balance when the artwork is not fighting a large collar or pocket. Browse <a href=\"/cnfans-shirt-finds\">shirt finds</a> for examples of that layering role." ] },
      { heading: "Fit the graphic to the rest of the outfit", paragraphs: [
        "A boxy graphic tee works naturally with straight or baggy denim, while a regular tee can tuck into higher-rise trousers without adding bulk. Keep the lower half quieter when the artwork is large; if the print is small, texture or colour in the bottoms can do more of the work.",
        "Black, white, washed grey and muted colour blanks are easy starting points. Stronger artwork can still work with a simple jacket or overshirt. The <a href=\"/cnfans-baggy-jeans-finds\">baggy jeans finds</a> page is useful when you want to test the tee against a wider lower silhouette." ] },
      { heading: "Care protects the artwork", paragraphs: [
        "Turn printed tees inside out before washing, use the temperature on the care label and avoid high dryer heat. Do not iron directly over a print. A little space between wears lets the fabric and collar recover, especially on heavier blanks.",
        "Print names can be broad, so check the images and product details rather than assuming a title describes every finish. Use <a href=\"/category/new-in\">New In</a> for current arrivals, but confirm the size and colour on the individual listing." ] },
      { heading: "Choose artwork you can live with", paragraphs: [
        "A graphic tee appears in more outfits when the artwork has a clear relationship with its blank. A small chest mark can sit below an open shirt, while a large back print may be the reason you leave the shirt open. Think about the settings in which you will wear it, not only the image on the listing.",
        "If you are choosing between two colours, picture the same tee with your most-used bottoms. The blank may matter more than the print once the garment is part of a full outfit, and a quieter shade often gives the artwork more space."
      ] },
      { heading: "Order with a clear expectation", paragraphs: [
        "A graphic tee is a visual choice, but fit still decides how often it is worn. Compare your reference tee, decide how much room you want and check the artwork scale against the measurements. If a size chart is incomplete, do not invent a fabric weight or print technique.",
        "Use <a href=\"/how-to-order\">How to Order</a> for the purchase path and the <a href=\"/cnfans-delivery-uk\">delivery guide</a> for service notes. CNFans UK is an independent clothing store and product discovery site; the live product page is the source for its current artwork, material and options." ] },
    ],
    related: [
      { href: "/cnfans-t-shirt-finds", title: "T-Shirt Finds", blurb: "Plain and everyday tee shapes for comparison." },
      { href: "/cnfans-streetwear-finds", title: "Streetwear Finds", blurb: "A wider edit of tops, bottoms and outerwear." },
      ...commonRelated,
    ],
  },
];

// Zip hoodies remain a prepared draft until the live catalogue contains an
// unambiguous full-zip product. The route stays available for later review,
// but public discovery surfaces must not advertise an empty finds page.
export const PHASE_FIVE_PUBLIC_GUIDES = PHASE_FIVE_GUIDES.filter(
  (guide) => guide.path !== "/cnfans-zip-hoodie-finds",
);

export function getPhaseFiveGuide(path: string) {
  const guide = PHASE_FIVE_GUIDES.find((item) => item.path === path);
  if (!guide) throw new Error(`Unknown phase five guide: ${path}`);
  return guide;
}
