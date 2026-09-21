import type { GlobalFindsGuide } from "@/lib/phaseFiveGuides";

const phaseSixRelated = [
  { href: "/cnfans-size-guide", title: "CNFans Size Guide", blurb: "Compare a familiar garment with the listing measurements." },
  { href: "/how-to-order", title: "How to Order", blurb: "Follow the purchase steps from product page to tracking." },
  { href: "/cnfans-delivery-uk", title: "Delivery Guide", blurb: "Read the current delivery and tracking notes." },
  { href: "/cnfans-finds", title: "CNFans Finds", blurb: "Return to the wider clothing discovery edit." },
];

export const PHASE_SIX_GUIDES: GlobalFindsGuide[] = [
  {
    path: "/cnfans-polo-shirt-finds",
    title: "CNFans Polo Shirt Finds 2026 | Polo & Collared Shirt Finds",
    description: "Browse CNFans polo shirt finds for 2026, with practical checks for collars, plackets, fabric weight, fit and hems.",
    h1: "CNFans Polo Shirt Finds 2026",
    primaryKeyword: "cnfans polo shirt finds",
    secondaryKeywords: ["polo fit guide", "collared shirt finds", "polo fabric weight"],
    searchIntent: "Compare current polo shirts by collar, placket, sleeve, fabric weight and everyday fit.",
    intro: "A polo sits between a T-shirt and a button shirt, so small construction details make a noticeable difference. This page narrows the live shirts catalogue to listings that name a polo, then sets out the checks that matter before you choose a size or plan an outfit.",
    catalogCategory: "tops",
    catalogSubcategory: "shirts",
    catalogQuery: "polo",
    // Require a garment signal next to “polo”; a brand or collection name
    // containing Polo alone is not enough to call the item a polo shirt.
    productPattern: /\bpolo\s+(?:shirt|top)\b|\b(?:short|long)[-\s]?sleeve\s+polo(?:\s+shirt)?\b|\bpolo\s+(?:collar|knit)\b/i,
    browseHref: "/category/tops/shirts",
    browseLabel: "Browse Shirts",
    productHeading: "Polo shirts in the live catalogue",
    closingHeading: "Choose the polo for its construction",
    closing: "Read the collar, placket, sleeve and hem details together, then compare the measurements with a polo you already wear. Use <a href=\"/how-to-order\">How to Order</a> for the purchase flow and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for service notes. CNFans UK is an independent clothing store and product discovery site. The individual listing remains the source for its current specification.",
    sections: [
      {
        heading: "Collar and placket set the tone",
        paragraphs: [
          "A collar that rolls softly gives a relaxed feel, while a firmer rib or structured edge keeps the neckline tidy under a jacket. Check how wide the collar points sit and whether the band looks substantial enough to hold its shape after movement. A narrow collar often reads cleaner with tailored trousers; a wider one can suit a looser, casual outfit.",
          "The placket changes how much of the base layer you see. Two buttons create a simple open neckline, while three or four allow more adjustment when the day moves from outdoors to indoors. Look at the button spacing and stitching in the product images, then compare the current <a href=\"/category/tops/shirts\">Shirts collection</a> rather than judging by colour alone."
        ]
      },
      {
        heading: "Short sleeve, long sleeve or a layer",
        paragraphs: [
          "Short-sleeve polos are easy in warm weather and sit neatly beneath a light overshirt. A longer sleeve gives more coverage and can work as a transitional layer, but check the cuff and upper-arm room before assuming it will feel like a standard shirt. Sleeve length should finish where you expect when your arm is relaxed, not only in a posed photograph.",
          "If you plan to add a jacket, leave enough space across the shoulder and upper chest for the collar to lie flat. The <a href=\"/cnfans-size-guide\">size guide</a> is useful here: measure a polo and a shirt that already layer well, then use those numbers as references instead of relying on a familiar letter label."
        ]
      },
      {
        heading: "Fabric weight and hand feel",
        paragraphs: [
          "Piqué has a visible texture and a little air through the surface; smoother jersey tends to drape closer to the body. Neither is automatically better. A lighter fabric can be more comfortable on a warm commute, while a denser knit may hold a sharper collar and resist clinging when worn alone.",
          "Only treat fibre content as known when the listing states it. Colour, sheen and close-up photography cannot confirm cotton, wool or a blend. For a broader everyday comparison, browse <a href=\"/category/tops\">Tops</a> and keep a note of each listing’s material and care information."
        ]
      },
      {
        heading: "Fit through the body and hem",
        paragraphs: [
          "The shoulder seam, chest ease and side shape decide whether a polo looks neat or deliberately relaxed. A straight body can be tucked or left loose; a shaped hem may sit better untucked. Check the front and back length together, since a longer back can change how the piece works with shorts or higher-rise trousers.",
          "Use a polo from your wardrobe as a flat measurement reference. Compare chest, shoulder, sleeve and length, then choose the amount of movement room you want under outerwear. If you want another collared option, the <a href=\"/cnfans-shirt-finds\">shirt finds</a> page gives a useful point of comparison."
        ]
      },
      {
        heading: "Styling a polo without forcing it",
        paragraphs: [
          "A plain polo can anchor relaxed denim, clean trousers or tailored shorts. Keep the collar open for a casual line, or fasten the top button when the rest of the outfit is simple. A light jacket over the top works best when the collar has enough structure to stay visible rather than bunching at the neck.",
          "Logo or embroidery placement deserves a practical look. Check whether a chest mark sits where a bag strap or jacket lapel will cover it, and whether the thread or print changes the fabric’s drape. Recent pieces are collected in <a href=\"/category/new-in\">New In</a>, although every listing still needs its own size and colour check."
        ]
      },
      {
        heading: "Care and ordering checks",
        paragraphs: [
          "Follow the care label and avoid high heat when the collar or placket includes a knitted trim. Reshape the collar while damp and store the polo with enough room for the fabric to recover. Turn a printed or embroidered style inside out when the care instructions support it.",
          "Before ordering, confirm the current measurements, available options and any material notes on the product page. Use <a href=\"/cnfans-finds\">CNFans Finds</a> to browse neighbouring categories, then keep your final decision tied to the actual listing rather than a generic polo rule."
        ]
      }
    ],
    related: [
      { href: "/cnfans-shirt-finds", title: "Shirt Finds", blurb: "Button shirts and overshirts for a different collar line." },
      { href: "/cnfans-t-shirt-finds", title: "T-Shirt Finds", blurb: "Simple base layers for warmer days." },
      ...phaseSixRelated,
    ],
  },
  {
    path: "/cnfans-denim-shorts-finds",
    title: "CNFans Denim Shorts Finds 2026 | Jean Shorts & Denim Finds",
    description: "Browse CNFans denim shorts finds for 2026, with practical notes on rise, length, leg width, wash and everyday styling.",
    h1: "CNFans Denim Shorts Finds 2026",
    primaryKeyword: "cnfans denim shorts finds",
    secondaryKeywords: ["denim shorts", "jorts style", "jean shorts fit"],
    searchIntent: "Compare denim shorts by rise, length, leg opening, wash and the shoes or tops they work with.",
    intro: "Denim shorts are often called jorts in style conversations, but the useful decision is more specific: how high is the rise, where does the hem finish and how much room is in the leg? This page focuses on the live denim-shorts listings and keeps the language tied to what the catalogue actually describes.",
    catalogCategory: "bottoms",
    catalogSubcategory: "shorts",
    catalogQuery: "denim",
    productPattern: /\bjorts?\b|\b(?:denim|jean)\s+shorts?\b|\bshorts?\s+(?:in\s+)?(?:denim|jean)\b/i,
    browseHref: "/category/bottoms/shorts",
    browseLabel: "Browse Shorts",
    productHeading: "Denim shorts currently listed",
    closingHeading: "Let the measurements decide the pair",
    closing: "Check the rise, waist, inseam and hem against shorts you already like, then picture the pair with your usual shoes. Visit <a href=\"/cnfans-size-guide\">CNFans Size Guide</a> before choosing a label and use <a href=\"/how-to-order\">How to Order</a> when the fit checks are clear. CNFans UK is an independent clothing store and product discovery site. The live listing is the source for its own wash and fabric details.",
    sections: [
      {
        heading: "Rise and waistband first",
        paragraphs: [
          "The rise changes the whole proportion of denim shorts. A higher rise gives more coverage and can make a shorter top feel balanced; a lower rise leaves more space between waistband and hem but needs a comfortable seat when you sit. Measure the front rise on a pair that works for you, including the waistband, and compare it with the listing.",
          "Waist fit should be secure without relying on a belt to hold the shorts in place. Check the waistband flat, then allow for the amount of ease you prefer at the hip. The <a href=\"/category/bottoms\">Bottoms collection</a> helps you compare denim shorts with jeans and trousers using the same measurement method."
        ]
      },
      {
        heading: "Length and leg width change the mood",
        paragraphs: [
          "A shorter inseam shows more leg and feels direct in warm weather, while a longer hem gives a calmer line and more coverage. Leg width matters just as much: a straight opening can look tidy, a wider cut moves more freely and a narrow opening can feel restrictive when you walk or sit.",
          "Look at the hem in relation to the side seam and pockets. A deep turn-up, raw edge or heavy embroidery can add visual weight, so check the product images at full length. For another warm-weather option, compare the practical notes on <a href=\"/cnfans-summer-outfits\">Summer Outfits</a>."
        ]
      },
      {
        heading: "Denim weight, stretch and wash",
        paragraphs: [
          "Rigid denim keeps a clear shape and may soften with wear; a touch of stretch can make sitting and cycling easier. Do not assume every denim short has the same handle. Read the stated material and look for signs of structure in the waistband, pocket opening and hem rather than guessing from a product photo.",
          "Dark indigo can look sharper with a shirt, mid-blue is an easy everyday middle ground and a faded wash feels more casual. Distressing or printed details should sit comfortably around the places that bend. The <a href=\"/cnfans-jeans-finds\">Jeans Finds</a> page is useful if you want to compare the same wash idea at full length."
        ]
      },
      {
        heading: "Build the rest of the outfit around the hem",
        paragraphs: [
          "A clean tee keeps the focus on the denim, while an open shirt gives the outfit a second vertical line. If the shorts are wide, a shorter or tucked top can show the rise; if the leg is straighter, a relaxed top can add ease without making the shape disappear.",
          "Shoes should support the opening rather than compete with it. Low trainers keep the line light, while a substantial shoe can balance a wider hem. Use <a href=\"/category/tops/t-shirts\">T-Shirts</a> to find simple bases and test the full outfit before deciding which wash earns repeat wear."
        ]
      },
      {
        heading: "Pockets and movement are practical details",
        paragraphs: [
          "Pocket depth affects how the shorts sit when you carry a phone or keys. A heavy object can pull a relaxed waist down, while a shallow pocket may be frustrating for everyday use. Check where the pocket opening starts and whether the side seam remains comfortable when you sit.",
          "Move through the fit in your mind: walking, sitting, climbing stairs and wearing the shorts with the shoes you use most. These checks are more useful than a generic “jorts” label. Current arrivals can be compared through <a href=\"/category/new-in\">New In</a>, with stock and options confirmed on each product page."
        ]
      },
      {
        heading: "Care that keeps denim wearable",
        paragraphs: [
          "Wash denim sparingly, turn it inside out and follow the care label to reduce unnecessary colour loss. Empty the pockets before washing and let the shorts dry naturally when possible. A raw edge or printed panel may need gentler handling than a plain, pre-washed pair.",
          "When you have a shortlist, record the waist, rise, inseam and leg opening beside the product link. Use <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for service notes and remember that CNFans UK is an independent clothing store and product discovery site."
        ]
      }
    ],
    related: [
      { href: "/cnfans-jeans-finds", title: "Jeans Finds", blurb: "Compare full-length denim washes and fits." },
      { href: "/cnfans-summer-outfits", title: "Summer Outfits", blurb: "Light layers and warm-weather combinations." },
      ...phaseSixRelated,
    ],
  },
  {
    path: "/cnfans-long-sleeve-finds",
    title: "CNFans Long Sleeve Finds 2026 | Shirts & Long-Sleeve Tops",
    description: "Explore CNFans long sleeve finds for 2026, separating long-sleeve shirts from long-sleeve T-shirts with fit and layering notes.",
    h1: "CNFans Long Sleeve Finds 2026",
    primaryKeyword: "cnfans long sleeve finds",
    secondaryKeywords: ["long sleeve shirts", "long sleeve T-shirts", "layering tops"],
    searchIntent: "Find long-sleeve shirts and tees, then choose the sleeve, collar, fabric and fit for the intended layer.",
    intro: "Long sleeves cover two different shopping jobs in the catalogue: a button shirt with a collar and a long-sleeve T-shirt with a simpler neckline. Treating them as one group makes fit decisions harder, so this guide separates the two and explains how each works through a day of layering.",
    catalogCategory: "tops",
    catalogSubcategory: "",
    // The catalogue search is token based, so "long" keeps hyphenated
    // titles in the candidate pool; the title pattern below confirms the
    // complete long-sleeve garment signal.
    catalogQuery: "long",
    productPattern: /\blong[\s-]?sleeve(?:d)?\b/i,
    productExcludePattern: /hoodie|sweater|jumper|jacket|coat|sweatshirt|cardigan|puffer|gilet|vest/i,
    browseHref: "/category/tops",
    browseLabel: "Browse Tops",
    productHeading: "Long-sleeve shirts and tees in the catalogue",
    closingHeading: "Match the sleeve to the layer",
    closing: "Choose between a collared shirt and a simpler long-sleeve tee, then compare sleeve, chest, shoulder and body measurements with a garment you own. Browse <a href=\"/cnfans-shirt-finds\">Shirt Finds</a> and <a href=\"/cnfans-t-shirt-finds\">T-Shirt Finds</a> for neighbouring options. CNFans UK is an independent clothing store and product discovery site. Each product page is the place to confirm its current material and size information.",
    sections: [
      {
        heading: "Two garments share a sleeve length",
        paragraphs: [
          "A long-sleeve shirt brings a collar, placket and cuff into the outfit. It can sit open over a tee or close up beneath a jacket. A long-sleeve T-shirt is usually simpler at the neck and easier to wear as a base layer. Check the title and product images for that distinction before comparing cuts across the catalogue.",
          "The <a href=\"/category/tops/shirts\">Shirts category</a> is the better starting point for button-front styles, while <a href=\"/category/tops/t-shirts\">T-Shirts</a> helps you compare jersey bases. Keeping those routes separate prevents a roomy shirt from setting the wrong expectation for a close-fitting tee."
        ]
      },
      {
        heading: "Sleeve and cuff details affect comfort",
        paragraphs: [
          "Look at where the sleeve finishes when the arm hangs naturally. A shirt cuff can be adjusted or rolled, while a tee sleeve usually relies on a rib or simple hem. Check the upper-arm width as well as the length; extra fabric at the wrist will not solve a sleeve that restricts movement above the elbow.",
          "If you plan to layer a short-sleeve tee over a long-sleeve base, leave a little room through the upper body so neither fabric pulls across the shoulders. Community fit discussions often focus on keeping the outer tee loose enough to show a deliberate layer rather than a squeezed one."
        ]
      },
      {
        heading: "Fabric makes the same sleeve feel different",
        paragraphs: [
          "A light jersey long-sleeve tee can sit under a sweatshirt without adding much bulk. A brushed or denser fabric may work better alone but need more room beneath a jacket. Woven shirts hold a clearer collar and can feel cooler through the body, depending on the fibre and weave stated in the listing.",
          "Do not turn a photograph into a material claim. Use the product details when they specify cotton, a blend or another fibre, and treat missing information as unknown. The <a href=\"/cnfans-size-guide\">size guide</a> gives a repeatable way to compare flat measurements across both garment types."
        ]
      },
      {
        heading: "Layering proportions that stay comfortable",
        paragraphs: [
          "When a long-sleeve tee is the base, keep the outer layer relaxed through the armhole and shoulder. A shirt over it can be worn open, with the cuff pushed back to reveal the base sleeve. If the shirt is close through the chest, a thinner tee and a shorter sleeve can prevent bunching.",
          "A long-sleeve shirt also works beneath a jacket when the collar and cuff have somewhere to sit. Check the jacket’s sleeve length before ordering both pieces. For a broader edit of layers, use <a href=\"/cnfans-jacket-finds\">Jacket Finds</a> and compare the product proportions rather than assuming every outer layer has the same room."
        ]
      },
      {
        heading: "Choose the neckline for the setting",
        paragraphs: [
          "A crew neckline keeps a long-sleeve tee straightforward and works with an open shirt or overshirt. A button shirt can create a sharper frame when closed, or a softer line with the top buttons undone. Collar height, button spacing and the way the front hem sits all change the level of the outfit.",
          "Colour can help separate the layers: a quieter base lets the outer shirt carry more texture, while a contrast sleeve makes the layering intentional. Recent options sit in <a href=\"/category/new-in\">New In</a>, but check each listing for the actual sleeve and body measurements before relying on a familiar size."
        ]
      },
      {
        heading: "Care and everyday use",
        paragraphs: [
          "Follow the care label, reshape cuffs and collar while damp and avoid high heat when the garment includes stretch or a printed surface. Long sleeves pick up friction at the wrist and forearm, so rotate pieces and check those areas when deciding between a smooth tee and a textured shirt.",
          "Write down the intended role beside each shortlisted link: base layer, open overshirt or standalone top. Then use <a href=\"/how-to-order\">How to Order</a> and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for the next steps. CNFans UK is an independent clothing store and product discovery site."
        ]
      }
    ],
    related: [
      { href: "/cnfans-shirt-finds", title: "Shirt Finds", blurb: "Button-front shirts and overshirt proportions." },
      { href: "/cnfans-t-shirt-finds", title: "T-Shirt Finds", blurb: "Short-sleeve and everyday jersey bases." },
      ...phaseSixRelated,
    ],
  },
  {
    path: "/cnfans-windbreaker-finds",
    title: "CNFans Windbreaker Finds 2026 | Lightweight Jacket Finds",
    description: "Browse CNFans windbreaker finds for 2026, with practical notes on shell weight, hood shape, pockets, fit and layering.",
    h1: "CNFans Windbreaker Finds 2026",
    primaryKeyword: "cnfans windbreaker finds",
    secondaryKeywords: ["lightweight jackets", "wind layer", "hooded windbreakers"],
    searchIntent: "Compare windbreakers as light outer layers by shell feel, hood, closure, pockets and room for a mid-layer.",
    intro: "A windbreaker earns its place when it adds a light barrier without making the outfit feel boxed in. The current guide looks only at clear windbreaker titles in the Outerwear / Jackets catalogue, then covers shell feel, hood shape, closure, pocket use and the room needed for a layer beneath.",
    catalogCategory: "outerwear",
    catalogSubcategory: "jackets",
    catalogQuery: "windbreaker",
    productPattern: /\bwind[ -]?breaker\b/i,
    browseHref: "/category/outerwear/jackets",
    browseLabel: "Browse Jackets",
    productHeading: "Windbreakers in the outerwear catalogue",
    closingHeading: "Use a windbreaker for the conditions it suits",
    closing: "Treat a windbreaker as a light outer layer unless the listing clearly states something more. Check the shell, hood, cuffs, pockets and measurements, then use <a href=\"/cnfans-size-guide\">CNFans Size Guide</a> and <a href=\"/how-to-order\">How to Order</a> before choosing. CNFans UK is an independent clothing store and product discovery site. The live product page remains the source for its construction and care notes.",
    sections: [
      {
        heading: "Shell feel and weather expectations",
        paragraphs: [
          "A thin woven shell can cut a breeze while keeping the garment easy to pack. A lined or denser jacket may feel more substantial and hold a cleaner shape, but it can also need more room over a sweatshirt. Read the material and lining notes rather than assuming a windbreaker is waterproof or insulated from the name alone.",
          "The shell should move with the shoulders and not crackle against every layer. Look at the surface in the product images and compare the current <a href=\"/category/outerwear/jackets\">Jackets category</a> for weight and closure details. A wind layer works as one part of a system, with warmth coming from the layers beneath."
        ]
      },
      {
        heading: "Hood, collar and closure",
        paragraphs: [
          "A hood changes how the jacket sits at the neck and how much space you need beneath it. Check whether it is fixed, adjustable or shaped to lie flat when not in use. A high collar can add useful coverage against a breeze, but it may compete with a bulky hoodie underneath.",
          "Zip length and pull placement affect ventilation. A full zip gives a quicker change between open and closed, while a shorter opening keeps a simpler front. Check the cuff and hem finish too: elastic or adjustable tabs can help hold the layer in place when you are moving."
        ]
      },
      {
        heading: "Fit for the layer underneath",
        paragraphs: [
          "Start with the layer you expect to wear most. A T-shirt needs less ease than a sweatshirt, and a knitted jumper needs room at the armhole even when the chest measurement looks generous. Compare shoulder, chest, sleeve and back length with a jacket that already works over your usual base.",
          "A slightly relaxed body can be useful for cycling, travel or carrying a small bag, but excess length may bunch at the hem. The <a href=\"/cnfans-size-guide\">size guide</a> helps keep the comparison flat and consistent. For another light layer, see <a href=\"/cnfans-jacket-finds\">Jacket Finds</a> and check each listing’s own proportions."
        ]
      },
      {
        heading: "Pockets should match the day",
        paragraphs: [
          "Side pockets can be enough for keys and a card holder, while zipped or flap pockets add security when you are travelling. Look at the opening angle and depth, and check whether a phone pulls the shell forward. A pocket placed too close to the side seam can feel awkward when you sit.",
          "Keep pocket details in proportion with the rest of the jacket. A clean shell suits a simple base layer; a more technical pocket layout can carry a plain tee and uncomplicated trousers. Browse <a href=\"/category/new-in\">New In</a> for recent outerwear, then verify the live images and options before ordering."
        ]
      },
      {
        heading: "Make a light jacket work across outfits",
        paragraphs: [
          "A neutral windbreaker can sit over a tee with jeans, relaxed trousers or shorts. Leave the zip open when the layer underneath provides the colour, or close it and let the hood or collar frame the face. A contrast panel or logo becomes easier to wear when the rest of the outfit is quiet.",
          "Think about packability as well as appearance. If the jacket is for changeable days, a lighter shell that folds without fighting the lining may be more useful than a heavier style reserved for one forecast. The <a href=\"/category/outerwear\">Outerwear collection</a> lets you compare that role with other jacket shapes."
        ]
      },
      {
        heading: "Care, storage and ordering",
        paragraphs: [
          "Follow the stated care instructions, close zips before washing and avoid high heat when the shell has a coating, print or elastic trim. Hang the jacket to dry and check the hood and cuffs for trapped moisture. Do not add a waterproof claim that the listing does not make.",
          "Record the shell description, measurements and pocket layout beside the product link. Use <a href=\"/how-to-order\">How to Order</a> for the purchase route and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for service details. CNFans UK is an independent clothing store and product discovery site; the product page is the reliable reference for the individual item."
        ]
      }
    ],
    related: [
      { href: "/cnfans-jacket-finds", title: "Jacket Finds", blurb: "A wider outerwear edit for different weights and shapes." },
      { href: "/category/outerwear", title: "Outerwear", blurb: "Compare jackets, puffers, coats and other current layers." },
      ...phaseSixRelated,
    ],
  },
];

export function getPhaseSixGuide(path: string) {
  const guide = PHASE_SIX_GUIDES.find((item) => item.path === path);
  if (!guide) throw new Error(`Unknown phase six guide: ${path}`);
  return guide;
}
