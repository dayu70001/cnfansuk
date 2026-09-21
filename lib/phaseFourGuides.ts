import type { RelatedLink } from "@/components/GuideRelated";

export type LongTailGuideSection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

export type LongTailGuide = {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  note: string;
  sections: LongTailGuideSection[];
  related: RelatedLink[];
  browseHref?: string;
  browseLabel?: string;
};

export const PHASE_FOUR_GUIDES: LongTailGuide[] = [
  {
    path: "/cnfans-size-up-or-true-to-size",
    title: "CNFans Size Up or True to Size? A Better Way to Pick Your Size",
    description: "A practical CNFans sizing guide for deciding when to stay true to size and when garment measurements suggest sizing up.",
    h1: "CNFans Size Up or True to Size?",
    intro: "Going one size up sounds like an easy rule. It is not. The better choice depends on the garment measurements, the intended fit and the layers you plan to wear underneath.",
    sections: [
      {
        heading: "Start with the fit you actually want",
        paragraphs: [
          "True to size only has meaning when you know what the maker intended by that size. A regular hoodie, an oversized sweatshirt and a cropped jacket can all use the same letter while leaving very different amounts of room around the body. Decide first whether you want a close, regular or relaxed result.",
          "Sizing up is useful when you want extra ease through the chest, a longer sleeve or room for a layer. It can also make a shoulder seam drop lower and change the shape more than you expect. If you only want a little more width, a larger label may give you too much length as well.",
        ],
      },
      {
        heading: "Why measurements beat the label",
        paragraphs: [
          "A product page may show chest width, shoulder width, sleeve length and body length. Those figures describe the garment in front of you; the letter is only a broad label. Compare the measurements with a similar piece you already like instead of treating M, L or XL as a universal standard.",
          "Measure your reference garment flat and use the same method for the listing. A chest measurement taken across the front is not directly comparable with a full circumference unless you account for the difference. Small method errors can make a size-up decision look more certain than it is.",
        ],
      },
      {
        heading: "When staying true to size makes sense",
        paragraphs: [
          "Stay with your usual label when the listing measurements match a garment that fits you well and the cut is described as regular. This is often the safer choice for jackets with shaped shoulders, trousers with a fixed waist or tops where excess fabric would spoil the intended line.",
          "A familiar size also makes sense when the fabric has structure and the product is not designed to look loose. Extra room cannot always be removed by styling. A jacket that is too wide at the shoulders may feel less comfortable, even if the chest has plenty of space.",
        ],
      },
      {
        heading: "When sizing up is reasonable",
        paragraphs: [
          "Consider the next size when the measurements are smaller than your reference garment, when the product is meant to layer, or when you deliberately want a relaxed silhouette. For a hoodie, compare the shoulder and sleeve as well as the chest because a wider body with short sleeves can still feel wrong.",
          "For trousers, do not use the same rule automatically. A larger waist can create a poor rise and extra fabric at the seat. Check waist, hip, rise and inside leg together, then decide which compromise you can actually live with.",
        ],
      },
      {
        heading: "A quick decision before ordering",
        paragraphs: [
          "Put your reference garment beside the product measurements and write down the two or three figures that matter most. For a hoodie that may be chest, body length and sleeve; for a jacket it may be shoulder, chest and sleeve; for jeans it is usually waist, rise and inside leg.",
          "If the choice still sits between two sizes, use the product photos to check the intended proportion, then read the <a href=\"/cnfans-size-guide\">CNFans size guide</a> for the measuring method. The goal is not to find a universal size-up rule. It is to choose the garment that matches how you plan to wear it.",
        ],
      },
    ],
    note: "A larger label is only helpful when the measurements and the planned fit support it. Keep the reference garment, the listing and the way you will layer in view at the same time.",
    related: [
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Measure a garment and compare the important points." },
      { href: "/cnfans-hoodie-finds", title: "CNFans Hoodie Finds UK", blurb: "Browse hoodies and sets with different intended fits." },
      { href: "/cnfans-same-size-different-fit", title: "Same Size, Different Fit", blurb: "See why identical labels do not guarantee identical garments." },
    ],
    browseHref: "/category/tops",
    browseLabel: "Browse Tops",
  },
  {
    path: "/cnfans-hoodie-sizing",
    title: "CNFans Hoodie Sizing: What to Measure Before Choosing a Size",
    description: "Learn which hoodie measurements matter most, how to compare them with a favourite layer and how to allow room without guessing.",
    h1: "CNFans Hoodie Sizing: What to Measure First",
    intro: "A hoodie can be roomy through the body and still feel tight at the shoulders, or look oversized while having short sleeves. For CNFans hoodie sizing, start with the garment measurements and the way you intend to wear it.",
    sections: [
      {
        heading: "The five measurements that tell the story",
        paragraphs: [
          "Chest width gives you a useful idea of room across the front, but it is only one part of the fit. Shoulder width affects how the hood and sleeves sit, body length controls the proportion over trousers, and sleeve length matters when the cuff is meant to finish at the wrist. Hood opening and hem width can also change how relaxed the garment feels.",
          "Not every listing provides every figure. When information is limited, use the measurements that are available and treat the photos as context rather than proof. A dropped shoulder can make a hoodie look wider even when the chest number is close to a regular cut.",
        ],
      },
      {
        heading: "Use a hoodie you already like",
        paragraphs: [
          "Lay a hoodie that fits well on a flat surface, smooth the fabric without stretching it and measure across the chest, from shoulder seam to shoulder seam and from the top of the shoulder to the cuff. Measure the back length from the highest shoulder point to the hem. Record the numbers before opening another listing.",
          "This reference is more useful than a generic size chart because it captures your preferred ease. If your favourite hoodie is deliberately loose, comparing a new slim-fit style with it may make the new item look too small even when the listing is accurate. Compare like with like where possible.",
        ],
      },
      {
        heading: "Fit changes with the hoodie construction",
        paragraphs: [
          "A raglan sleeve usually gives a softer shoulder line and more movement, while a set-in sleeve makes the shoulder measurement more important. A dropped shoulder adds visual width and can lengthen the sleeve from the seam. A heavyweight hood and ribbed hem may also make the same chest width feel fuller than a light layer.",
          "Cropped hoodies need a different check from longline styles. Compare body length before choosing a larger size for width, because moving up can turn a neat crop into an unexpectedly long top. The same caution applies to zip hoodies, where the front zip can make a close chest feel more restrictive.",
        ],
      },
      {
        heading: "Allow room for the layer underneath",
        paragraphs: [
          "Think about your base layer and outer layer separately. A hoodie worn over a T-shirt needs less space than one worn under a jacket, and a thick fleece hoodie may need a coat with a generous armhole. More chest room is not enough if the sleeve becomes bunched inside the jacket.",
          "If you are between two sizes, choose the one whose shoulder and sleeve are closest to your reference garment. You can tolerate a little extra body width in a relaxed hoodie, but a short sleeve or tight upper arm tends to stay annoying throughout the day.",
        ],
      },
      {
        heading: "Before you choose the label",
        paragraphs: [
          "Write down the listing figures, note the intended fit and compare them with the hoodie on your bed. Then check the <a href=\"/cnfans-size-guide\">CNFans size guide</a> for measuring reminders and the <a href=\"/cnfans-hoodie-finds\">hoodie finds</a> page for the types of cut already in the edit.",
          "A good size decision should explain itself: the chest gives enough ease, the shoulders are not crowded, the sleeves finish where you want them and the length works with your usual bottoms. If you cannot say why a size is right, measure once more before ordering.",
        ],
      },
    ],
    note: "For hoodies, the best reference is a hoodie you wear often. Its actual measurements reveal your preferred room far more clearly than the label sewn into the neck.",
    related: [
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Use a consistent method to measure your reference layer." },
      { href: "/cnfans-hoodie-finds", title: "CNFans Hoodie Finds UK", blurb: "Compare everyday hoodies, sweatshirts and sets." },
      { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "Know what visible details photos can help you check." },
    ],
    browseHref: "/category/tops/hoodies",
    browseLabel: "Browse Hoodies",
  },
  {
    path: "/cnfans-jacket-sizing",
    title: "CNFans Jacket Sizing: Chest, Shoulders, Sleeves and Layering Room",
    description: "A practical jacket sizing guide covering chest, shoulders, sleeves, body length and the room needed for everyday layers.",
    h1: "CNFans Jacket Sizing: Check Chest, Shoulders and Sleeves",
    intro: "Jacket sizing is less forgiving than T-shirt sizing. A jacket has to sit correctly at the shoulders, close without pulling and leave enough room for the layers you really wear.",
    sections: [
      {
        heading: "Shoulders come before the label",
        paragraphs: [
          "The shoulder seam is the first place to inspect because it sets the jacket's structure. If it sits far beyond your shoulder, the whole piece can look oversized even when the chest feels comfortable. If it lands too far inside, movement becomes restricted and the sleeve may twist.",
          "Some jackets use dropped shoulders or raglan sleeves, so the seam is not always a straight comparison. In that case, use the chest, sleeve and upper-arm shape together. Photos can show the construction, while the measurement table tells you how much cloth is actually there.",
        ],
      },
      {
        heading: "Chest room is for movement and layers",
        paragraphs: [
          "Measure a jacket you can zip or button comfortably over your usual base layer. Compare its chest width and hem width with the listing. The hem can be narrower than the chest on a bomber or elasticated style, so do not assume a generous chest guarantees a comfortable closed fit.",
          "The layer underneath affects the answer. A thin tee needs little allowance; a hoodie, knit or padded mid-layer needs more. The aim is room to move your arms without the front pulling, not a jacket so large that the shoulders lose their shape.",
        ],
      },
      {
        heading: "Sleeve length and cuff position",
        paragraphs: [
          "A sleeve should cover the wrist in a natural standing position without swallowing the hand. When you bend your arm, it will move slightly upward, so a very short sleeve can become obvious during normal movement. Compare sleeve length from the same starting point used by the listing.",
          "Cuffs change the visual result. Elastic cuffs can hold a little extra length, while open hems show every millimetre. Check whether the product has a dropped shoulder before comparing sleeve numbers with a tailored jacket; the measurement may begin farther out.",
        ],
      },
      {
        heading: "Body length should suit the outfit",
        paragraphs: [
          "A shorter jacket works with higher-rise trousers and a clean layered look. A longer coat or overshirt needs enough length to cover the base layer without bunching around the hips. Use a jacket from your wardrobe as the reference, especially if you know you prefer a cropped or relaxed proportion.",
          "Do not size up only to gain length. Moving up can add more width at the chest and shoulders than you want. If the body is the only measurement that misses, look for a different cut rather than expecting the next label to solve every dimension.",
        ],
      },
      {
        heading: "A simple pre-order check",
        paragraphs: [
          "Write down your reference jacket's shoulder, chest, sleeve and back length. Then decide whether the new item will be worn over a T-shirt, hoodie or another jacket. The <a href=\"/cnfans-size-guide\">CNFans size guide</a> is useful for keeping the measuring method consistent before you choose.",
          "If the numbers are close but the cut is unfamiliar, use the <a href=\"/cnfans-jacket-finds\">jacket finds</a> page to compare similar shapes. A measurement-led decision is usually more reliable than the phrase true to size on its own.",
        ],
      },
    ],
    note: "A jacket should fit the shoulders first, then provide enough chest and sleeve room for the layer underneath. The right number is the one that works across those points together.",
    related: [
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Measure a jacket and compare like-for-like." },
      { href: "/cnfans-jacket-finds", title: "CNFans Jacket Finds UK", blurb: "Browse outerwear in different constructions and lengths." },
      { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "Review visible shape, finish and construction details." },
    ],
    browseHref: "/category/outerwear",
    browseLabel: "Browse Outerwear",
  },
  {
    path: "/cnfans-puffer-jacket-sizing",
    title: "CNFans Puffer Jacket Sizing: Should You Leave Room for Layers?",
    description: "Understand puffer jacket sizing, insulation bulk and layering room without relying on a simple size-up rule.",
    h1: "CNFans Puffer Jacket Sizing: Leave Room for Layers",
    intro: "A puffer already has volume built into its shape. Choosing a larger label can add useful layering room, or it can make the shoulders and hem look unnecessarily loose. Check where the bulk is coming from before deciding.",
    sections: [
      {
        heading: "Separate insulation from extra size",
        paragraphs: [
          "A padded jacket can look large because of its filling and quilting, not because it is too big for you. Compare the actual chest, shoulder and sleeve measurements with a puffer or coat that fits well. The outside outline is useful context, but it cannot replace the figures.",
          "Some puffers are cut close to the body, while others are designed to sit away from it. The same nominal size may therefore leave different room for a sweatshirt. Read the silhouette in the photos, then use the listing measurements to decide whether the look is achievable for your frame.",
        ],
      },
      {
        heading: "How much layering room do you need?",
        paragraphs: [
          "Start with the thickest layer you expect to wear underneath most often. A T-shirt and a thin knit need less space than a fleece hoodie. Put that layer on, measure a coat that closes comfortably over it and use the result as your reference rather than adding a random amount.",
          "Check the upper arm and armhole as well as the chest. A puffer may close across the body but still pull when you reach forward. A little extra room through the sleeve is helpful; excessive shoulder width can make the jacket feel heavy and change how the hood sits.",
        ],
      },
      {
        heading: "The measurements that matter most",
        paragraphs: [
          "For a puffer, prioritise shoulder construction, chest width, sleeve length, body length and hem width. Quilted horizontal sections can make the jacket feel shorter when filled, so compare body length with another padded garment rather than a flat overshirt.",
          "A ribbed or elasticated hem may gather the excess and keep warmth in, but it does not make a very wide jacket fit like a regular one. If the product has a fixed hem, take that width seriously when checking whether you will wear it open or closed.",
        ],
      },
      {
        heading: "When not to size up",
        paragraphs: [
          "Do not move up simply because the jacket looks puffy in the product photos. If the shoulders of the reference and listing already match, the filling may provide the visual volume you want. A larger size can create long sleeves, a low armhole and a hem that sits below the proportion shown.",
          "A close-fitting puffer may also be designed for a neat urban layer rather than a thick hoodie. If you want that look, choose the size closest to your reference measurements and use a thinner base layer instead of forcing the coat to accommodate everything.",
        ],
      },
      {
        heading: "Use the guide and the garment together",
        paragraphs: [
          "The <a href=\"/cnfans-size-guide\">CNFans size guide</a> explains how to take a comparable measurement. Then read the <a href=\"/cnfans-winter-jacket-finds\">winter jacket finds</a> page for context on coats, layers and seasonal use. If the puffer is still hard to place, compare it with the jacket you intend to replace.",
          "The best puffer size leaves room for movement and your actual mid-layer while keeping the shoulders and hem intentional. It should feel like a coat, not a blanket you happen to be wearing.",
        ],
      },
    ],
    note: "Puffer volume is not the same thing as oversized fit. Judge the measurements while wearing the layer you plan to use, then check whether the resulting shape still looks deliberate.",
    related: [
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Use a consistent measurement method at home." },
      { href: "/cnfans-winter-jacket-finds", title: "CNFans Winter Jackets UK", blurb: "Compare padded coats and warmer layering options." },
      { href: "/cnfans-jacket-finds", title: "CNFans Jacket Finds UK", blurb: "See how different outerwear shapes are built." },
    ],
    browseHref: "/category/outerwear",
    browseLabel: "Browse Outerwear",
  },
  {
    path: "/cnfans-tracksuit-sizing",
    title: "CNFans Tracksuit Sizing: Why the Top and Bottom May Fit Differently",
    description: "Work out tracksuit sizing by checking the top and trousers separately, including waist, rise, sleeve and body length.",
    h1: "CNFans Tracksuit Sizing: Check the Top and Bottom Separately",
    intro: "A matching tracksuit looks like one purchase, but it is two fit decisions. The top may need shoulder room while the bottoms need a secure waist and the right rise.",
    sections: [
      {
        heading: "A set does not guarantee one proportion",
        paragraphs: [
          "Matching colour and fabric can make a tracksuit feel like a single item, yet the jacket or sweatshirt and the trousers may be cut for different bodies. A roomy top paired with a narrow jogger is not unusual, and an elastic waist does not remove the need to check the rise and inside leg.",
          "Before choosing a label, decide which piece is harder for you to fit. If tops are usually tight at the shoulders, prioritise that measurement. If trousers tend to pull at the waist or sit too low, start with waist, hip and rise instead of relying on the top size.",
        ],
      },
      {
        heading: "Sizing the top",
        paragraphs: [
          "For the top, compare chest, shoulder, sleeve and body length with a sweatshirt or zip layer you already enjoy. A dropped shoulder changes the starting point of the sleeve, while a fitted ribbed hem can make a top feel smaller when zipped or pulled down.",
          "Think about the base layer and the way the tracksuit will be worn. A thin tee leaves more freedom than a hoodie, and a relaxed top may need less size-up room than a structured jacket. Photos can show the intended silhouette, but measurements decide whether it will sit that way on you.",
        ],
      },
      {
        heading: "Sizing the bottoms",
        paragraphs: [
          "Check the relaxed waist measurement, hip, front rise and inside leg. A drawcord can fine-tune the waist, but it cannot fix a rise that is too short or legs that finish well above your preferred shoe. Compare the figures with joggers that stay comfortable when you sit and walk.",
          "Tapered joggers and wide-leg bottoms need different length judgments. A cuff can hold extra fabric at the ankle; a straight hem shows the full inside leg. If the top and bottom are sold as one set, inspect both parts before assuming the larger label is the best answer.",
        ],
      },
      {
        heading: "Different fits within the same set",
        paragraphs: [
          "A slim tracksuit usually follows the body and leaves less room for a thick layer. A relaxed set adds ease through the chest and thigh, while an oversized set may also lower the shoulder and widen the leg. Those words describe shape, not a universal measurement standard.",
          "Use the <a href=\"/cnfans-size-guide\">CNFans size guide</a> to measure a reference set, then compare the new figures piece by piece. The <a href=\"/cnfans-tracksuit-finds\">tracksuit finds</a> page can help you recognise whether the set is built around a neat, relaxed or wider silhouette.",
        ],
      },
      {
        heading: "The final set check",
        paragraphs: [
          "Imagine the tracksuit in motion, not only standing in the product pose. Raise your arms, sit down and walk a few steps in your reference set. If the new top matches at the shoulders and the bottoms match at waist and rise, the rest of the comparison becomes much clearer.",
          "A matching set is worth keeping when both pieces can also work separately. That makes a small difference in proportion easier to style and prevents you from choosing a size that technically matches but feels wrong in daily wear.",
        ],
      },
    ],
    note: "Treat the top and bottoms as two garments that happen to share a fabric and colour. The most comfortable set is the one where both halves work independently.",
    related: [
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Compare top and bottom measurements accurately." },
      { href: "/cnfans-tracksuit-finds", title: "CNFans Tracksuit Finds UK", blurb: "Browse matching sets and relaxed everyday options." },
      { href: "/cnfans-co-ord-finds", title: "CNFans Co-ords UK", blurb: "See how matching pieces can be worn separately." },
    ],
    browseHref: "/category/co-ords-sets",
    browseLabel: "Browse Sets",
  },
  {
    path: "/cnfans-jeans-sizing",
    title: "CNFans Jeans Sizing: Waist, Rise and Leg Length Explained",
    description: "A clear CNFans jeans sizing guide covering waist, rise, thigh, leg length and the measurements that determine the fit.",
    h1: "CNFans Jeans Sizing: Waist, Rise and Leg Length",
    intro: "A jeans size is not just a waist number. Rise, thigh room and inside leg decide where the jeans sit and how the whole outfit falls.",
    sections: [
      {
        heading: "Measure jeans, not your memory",
        paragraphs: [
          "The easiest reference is a pair of jeans you already wear comfortably. Fasten them, lay them flat and measure the waistband, front rise, thigh and inside leg using the same points described by the listing. A favourite pair gives you a useful target even if its label is from a different brand.",
          "Do not compare a flat waistband measurement with a full waist circumference without understanding the method. Listings can use different conventions, and a few centimetres of apparent difference may simply come from measuring a curved or stretched band in another way.",
        ],
      },
      {
        heading: "Waist and rise work together",
        paragraphs: [
          "Waist tells you whether the jeans will stay in place, while rise controls how much space there is from the crotch to the waistband. A low-rise pair with the right waist can still feel too short through the body. A higher rise may feel more secure but change the amount of top you want to tuck in.",
          "Check the hip and seat if the listing provides them. Skinny, straight, relaxed and wide cuts distribute the same waist measurement differently. If you need more room at the thigh, increasing the waist label may create a loose waistband without solving the actual problem.",
        ],
      },
      {
        heading: "Inside leg and the finished look",
        paragraphs: [
          "Inside leg determines where the hem reaches the shoe. Straight jeans often look clean when they just meet the trainer, while wide or stacked styles may be designed to sit lower. Compare the measurement with a pair that has the break you like rather than choosing from the label alone.",
          "Denim can soften with wear, but that does not make an incorrect length correct. Stretch can change comfort around the waist and thigh, yet it is not a substitute for a suitable rise. Treat fabric information as context and the measurements as the main evidence.",
        ],
      },
      {
        heading: "Fit names are not measurements",
        paragraphs: [
          "Slim, straight, relaxed and baggy are useful descriptions of shape, but each can be interpreted differently. Look at the leg opening, thigh and knee figures where available. Two straight pairs can look quite different if one has a higher rise or a wider thigh.",
          "The <a href=\"/cnfans-size-guide\">CNFans size guide</a> offers a consistent way to compare your reference garment. For more examples of denim cuts, browse the <a href=\"/cnfans-jeans-finds\">jeans finds</a> page and note the proportion rather than only the product name.",
        ],
      },
      {
        heading: "A jeans checklist",
        paragraphs: [
          "Before ordering, confirm the waist method, rise, hip or thigh room, inside leg and the cut shown in the photos. Think about whether you will wear the jeans high, at the natural waist or lower on the hip, because that changes the useful rise and the finished leg length.",
          "If one measurement is far away from your reference, do not assume another size will repair every difference. It may be better to choose a different cut. The right pair feels secure at the waist, gives you movement through the seat and finishes at the shoe without constant adjustment.",
        ],
      },
    ],
    note: "The best jeans size is the set of measurements that works together. Waist alone cannot tell you where the jeans will sit or how the leg will break.",
    related: [
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Use the same measuring points for every comparison." },
      { href: "/cnfans-jeans-finds", title: "CNFans Jeans Finds UK", blurb: "Compare everyday denim shapes and proportions." },
      { href: "/cnfans-trouser-finds", title: "CNFans Trouser Finds UK", blurb: "See how rise and leg shape change casual bottoms." },
    ],
    browseHref: "/category/bottoms/jeans",
    browseLabel: "Browse Jeans",
  },
  {
    path: "/cnfans-size-labels-vs-measurements",
    title: "CNFans Size Labels vs Measurements: Why S, M, L and XL Can Mislead",
    description: "Why CNFans clothing labels can vary between garments, and how chest, shoulder, sleeve, waist and length measurements give a better comparison.",
    h1: "CNFans Size Labels vs Actual Measurements",
    intro: "A size label is a category, not a measurement. Two CNFans clothing finds marked XL can have different chest, shoulder, sleeve or body-length figures and still be labelled correctly for their intended cuts.",
    sections: [
      {
        heading: "The letter is shorthand",
        paragraphs: [
          "S, M, L, XL and XXL help a listing organise options, but they do not describe one fixed garment size across every style. A label is influenced by the cut, the intended wearer and the proportions of the piece. It tells you where to begin looking, not where to stop.",
          "That is why one XL hoodie can measure very differently from an XL cropped jacket. The difference is not necessarily an error. Each garment is solving a different shape and styling requirement.",
        ],
      },
      {
        heading: "Why measurements change between finds",
        paragraphs: [
          "Chest, shoulder, sleeve, length, waist and rise all respond to the design. A dropped shoulder pushes width outward; a cropped hem removes body length; a higher rise changes the distance from waistband to crotch. Fabric stretch and construction can change the feel again without changing the printed label.",
          "Hoodies and jackets are especially easy to misread because the outside silhouette includes hoods, padding, cuffs and layering room. Trousers create a different problem: the waist label may look familiar while the rise or thigh shape does not suit you.",
        ],
      },
      {
        heading: "Use a garment as your reference",
        paragraphs: [
          "Choose a piece that already fits the way you want and measure it flat. Keep the garment relaxed, note the points used by the listing and compare like with like. A hoodie is a better reference for a hoodie than a T-shirt, and a pair of jeans is more useful for another pair of jeans.",
          "This approach also reveals which measurements matter most to you. You may find that shoulder and sleeve decide every hoodie purchase, while waist and rise decide every trouser purchase. Those preferences are more reliable than your memory of the last label you bought.",
        ],
      },
      {
        heading: "Oversized, regular and cropped labels",
        paragraphs: [
          "An oversized description usually signals more ease, but it does not tell you whether the extra room is in the chest, shoulder, sleeve or length. A regular cut may be wider at the hem than at the shoulder, while a cropped piece may deliberately shorten the body without reducing sleeve length.",
          "Read the fit description and look at the whole measurement set. The <a href=\"/cnfans-same-size-different-fit\">same size, different fit</a> guide explains why an identical label can create a different result, while the <a href=\"/cnfans-size-guide\">CNFans size guide</a> covers the measuring basics.",
        ],
      },
      {
        heading: "A better way to choose M, L or XL",
        paragraphs: [
          "Start with your reference garment, then identify the two or three measurements that cannot be compromised. If the new item is close at those points and the remaining differences match the intended cut, the label is probably doing its job. If the key measurements miss badly, move to another size or another style.",
          "Do not choose a larger label simply because the product is from a different clothing find. Choose it when the actual figures give you the room and proportion you need. The label is useful for navigation; the garment measurements make the decision.",
        ],
      },
    ],
    note: "Keep the size label as a starting point and the actual garment measurements as the evidence. That small change prevents many avoidable sizing guesses.",
    related: [
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Measure the garment points that affect the fit." },
      { href: "/cnfans-size-up-or-true-to-size", title: "Size Up or True to Size?", blurb: "Make the size-up decision after comparing measurements." },
      { href: "/cnfans-same-size-different-fit", title: "Same Size, Different Fit", blurb: "See how construction changes the result behind a label." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-same-size-different-fit",
    title: "Why Two CNFans XL Hoodies Can Fit Completely Differently",
    description: "An explanation of why two CNFans XL hoodies may feel different, from shoulder construction and fabric to body length and intended fit.",
    h1: "Why Two CNFans XL Hoodies Can Fit Differently",
    intro: "Two hoodies can both say XL and still disagree about almost everything that matters: chest width, shoulder position, sleeve length, hem shape and body length.",
    sections: [
      {
        heading: "XL describes an option, not a blueprint",
        paragraphs: [
          "The letter on a hoodie organises the available choices. It does not force every style to use the same chest or sleeve figure. A relaxed pullover, a cropped zip hoodie and a heavy fleece layer can each use XL while being designed for different proportions.",
          "This is why a label comparison alone can be frustrating. One XL may be comfortable over a tee, while another needs a larger layer underneath or a different shoulder shape. The issue is usually the garment design rather than the label itself.",
        ],
      },
      {
        heading: "Construction changes the feel",
        paragraphs: [
          "A dropped shoulder moves the seam outward and can make the sleeve look longer. Raglan sleeves change the shoulder line and often allow more movement. A set-in sleeve gives a cleaner outline but makes the shoulder measurement more important. The chest number is only one view of that construction.",
          "Fabric adds another layer of difference. Dense fleece feels fuller than light loopback cotton, and a firm ribbed hem can make the body seem shorter. The cloth may soften with wear, but it will not turn one cut into another.",
        ],
      },
      {
        heading: "Fit words need context",
        paragraphs: [
          "Regular, relaxed and oversized are useful only when read alongside the measurements and photos. Regular usually suggests a closer outline, relaxed gives more ease, and oversized may add width, length or both. There is no single amount of extra fabric attached to the word oversized.",
          "Look for the balance between width and length. A wide but short hoodie gives a different result from a wide and long one, even if both are called oversized. Compare the garment with a hoodie in your wardrobe that has the same visual intention.",
        ],
      },
      {
        heading: "How to compare two XL listings",
        paragraphs: [
          "Put the chest, shoulder, sleeve and body length figures side by side. Mark the differences that you will notice when moving, layering and sitting. The <a href=\"/cnfans-size-guide\">CNFans size guide</a> gives a reliable measuring method; the <a href=\"/cnfans-hoodie-finds\">hoodie finds</a> page helps put the various cuts into a useful wardrobe context.",
          "If one XL is wider but shorter and another is narrower but longer, neither is automatically more accurate. Choose according to the outfit and layer you have in mind. The correct answer can be different for two products even when your preferred label stays XL.",
        ],
      },
      {
        heading: "Do not solve every difference by sizing up",
        paragraphs: [
          "Moving to XXL changes every dimension, not just the one that feels tight. If your problem is a short sleeve, the larger size may add unwanted width and length without giving the proportion you want. Sometimes the better fix is a different construction or a different listing.",
          "Keep a simple record of the measurements from pieces you love. Over time, your personal size range becomes clearer than a single label. That record also makes new CNFans sizing decisions faster because you are comparing to evidence you already trust.",
        ],
      },
    ],
    note: "When two XL hoodies fit differently, compare the construction and measurements before blaming the label. The label is shared; the pattern is not.",
    related: [
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Build a reliable reference from clothes you own." },
      { href: "/cnfans-hoodie-finds", title: "CNFans Hoodie Finds UK", blurb: "Compare relaxed, regular and set-friendly hoodies." },
      { href: "/cnfans-size-labels-vs-measurements", title: "Size Labels vs Measurements", blurb: "Why S, M, L and XL cannot replace measurements." },
    ],
    browseHref: "/category/tops/hoodies",
    browseLabel: "Browse Hoodies",
  },
  {
    path: "/cnfans-qc-photos-fit",
    title: "What CNFans QC Photos Can — and Cannot — Tell You About Fit",
    description: "Use CNFans QC photos as evidence about proportions and construction, while keeping the limits of photo-based fit checks clear.",
    h1: "What CNFans QC Photos Can Tell You About Fit",
    intro: "QC photos are useful evidence, but they are not a fitting room. They can reveal proportions and visible construction; they cannot reliably tell you how a garment will feel on your body.",
    sections: [
      {
        heading: "What a photo can show",
        paragraphs: [
          "A clear warehouse-style photo may show whether the body looks short, long, narrow, broad or visibly uneven. It can also give you clues about the shoulder position, sleeve relationship and hem shape when the item is laid flat or photographed from more than one angle.",
          "That visual evidence works best beside the listing measurements. If a hoodie looks broad in the chest but the stated body length is short, you can recognise a boxy proportion rather than assuming the image proves an oversized fit on you.",
        ],
      },
      {
        heading: "Compare landmarks, not the camera frame",
        paragraphs: [
          "Use stable details such as the collar, zip, pocket, hem and sleeve cuff to judge the garment's own proportions. The distance between those points is more useful than how large the item appears in the photograph. Lens angle and distance can make the same piece look larger or smaller.",
          "If a tape measure or size reference is visible, treat it as supporting information and check how it was placed. A measurement across the front is not automatically a chest circumference, and a photo taken at an angle can distort a straight line.",
        ],
      },
      {
        heading: "What QC photos cannot prove",
        paragraphs: [
          "A flat garment photo cannot prove comfort, movement, warmth or the exact way a sleeve will sit on a particular person. It also cannot recreate the feel of the fabric, the weight on your shoulders or how the item behaves after washing.",
          "Even visible fit clues have limits. A garment can look balanced on a table and feel tight across your upper arm, or appear roomy while having a short rise. Use photos to spot questions, then use measurements and your own reference clothes to answer them.",
        ],
      },
      {
        heading: "A useful photo-led checklist",
        paragraphs: [
          "Before relying on the image, check whether the whole garment is visible, whether it is laid flat and whether the lighting hides any edge. Look at the relationship between shoulder and sleeve, the straightness of the side seams, the hem, the pockets and any obvious asymmetry.",
          "The <a href=\"/cnfans-qc-photos\">CNFans QC Photos Guide</a> covers size, fabric, colour and finish. For the fit decision itself, compare those observations with the <a href=\"/cnfans-size-guide\">CNFans size guide</a> and a garment you already wear comfortably.",
        ],
        items: [
          "Use the listing measurements as the main sizing evidence.",
          "Use QC photos to identify visible questions or construction differences.",
          "Do not infer comfort or exact fabric feel from a single image.",
        ],
      },
      {
        heading: "When the photo changes your decision",
        paragraphs: [
          "A photo is especially helpful when it contradicts your first impression from the product listing. A hem that sits higher than expected, a shoulder seam that is visibly dropped or a sleeve that looks short can prompt you to recheck the numbers before ordering.",
          "It is also reasonable to stop when the evidence is incomplete. Good sizing is not about squeezing certainty from a blurry image. If a key measurement or angle is missing, choose a clearer listing or ask for the information you need.",
        ],
      },
    ],
    note: "Treat QC photos as a second pair of eyes for visible details, not as a substitute for wearing the garment. They are strongest when combined with measurements and a familiar reference piece.",
    related: [
      { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "Check colour, fabric, finish and visible details." },
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Compare actual garment measurements at home." },
      { href: "/cnfans-product-photos-vs-qc-photos", title: "Product Photos vs QC Photos", blurb: "See which type of image answers which question." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-hoodie-qc",
    title: "CNFans Hoodie QC: What Is Actually Worth Checking?",
    description: "A practical CNFans hoodie QC checklist for checking shape, seams, fabric, hardware, print placement and visible finish.",
    h1: "CNFans Hoodie QC: What Is Worth Checking?",
    intro: "A good hoodie QC check is not a hunt for microscopic flaws. It is a short review of the details that affect whether the piece looks and functions as intended.",
    sections: [
      {
        heading: "Start with the overall shape",
        paragraphs: [
          "Look at the hoodie laid flat and check whether the body appears balanced from left to right. The shoulders, side seams and hem should give you a clear idea of the intended silhouette. A relaxed hoodie can be wide, but the extra room should look deliberate rather than twisted or uneven.",
          "Compare the visible proportion with the product listing. If the listing shows a cropped body but the inspected piece looks long, or the shoulder line sits differently from the advertised styling, note the difference before making a decision about the fit.",
        ],
      },
      {
        heading: "Check the hood, collar and cuffs",
        paragraphs: [
          "The hood should sit cleanly around the neckline and show an even opening. Look for bunching where the hood joins the body, a drawcord that disappears into the seam or a collar that pulls to one side. These details affect both appearance and how the garment sits when worn.",
          "Cuffs and the hem should look attached evenly and recover after being handled. Loose ribbing is visible in a photo, but the image cannot tell you exactly how it will behave after repeated wear. Treat the check as a way to spot obvious issues, not to promise long-term durability.",
        ],
      },
      {
        heading: "Fabric, print and surface details",
        paragraphs: [
          "Use the photo to look for patchy colour, heavy creasing, pulled fibres or a print that is visibly off-centre. A close image may show whether the surface is smooth, brushed or textured, although lighting can make fabric look heavier or shinier than it is in person.",
          "If the hoodie has embroidery, a logo or a graphic, inspect the edges and placement rather than expecting every thread to be visible. Compare the inspected position with the product photos and allow for the way a laid-flat garment can shift slightly.",
        ],
      },
      {
        heading: "Zips, pockets and seams",
        paragraphs: [
          "On a zip hoodie, look for a zip that sits straight and a pocket opening that is attached cleanly. Check the seam joining the sleeves to the body and scan the side seams for obvious puckering. These are simple visual checks that often tell you more than a long list of vague quality claims.",
          "The <a href=\"/cnfans-qc-photos\">CNFans QC Photos Guide</a> explains how to review size, colour and finish without overreading an image. For context on the item itself, compare with <a href=\"/cnfans-hoodie-finds\">CNFans hoodie finds</a> and the product measurements.",
        ],
      },
      {
        heading: "What not to claim from a photo",
        paragraphs: [
          "A QC photo cannot guarantee warmth, softness, comfort or how the hoodie will fit every body. It may not reveal the inside of a seam, the true weight of the fabric or how a cuff will recover after washing. Keep those limits in mind when deciding how much confidence the image deserves.",
          "If the important details are clear and the measurements match your reference, the check has done its job. If a key area is hidden or the image quality is poor, record the question instead of turning a guess into a promise.",
        ],
      },
    ],
    note: "Focus a hoodie QC check on visible shape, construction and obvious finish issues. Leave comfort, durability and exact fabric feel outside what a photo can prove.",
    related: [
      { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "A wider checklist for visible product details." },
      { href: "/cnfans-hoodie-finds", title: "CNFans Hoodie Finds UK", blurb: "Browse hoodies, sweatshirts and matching sets." },
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Compare the dimensions before choosing a label." },
    ],
    browseHref: "/category/tops/hoodies",
    browseLabel: "Browse Hoodies",
  },
  {
    path: "/cnfans-jacket-qc",
    title: "CNFans Jacket QC: Fit, Shape, Zips and Construction",
    description: "Know what to inspect in CNFans jacket QC photos, including shoulder shape, panels, zips, pockets, cuffs and visible construction.",
    h1: "CNFans Jacket QC: Fit, Shape, Zips and Construction",
    intro: "Jacket QC is mostly about structure. Check the parts that create the silhouette, close the garment and carry the wear: shoulders, panels, zips, pockets, cuffs and seams.",
    sections: [
      {
        heading: "Read the jacket as a whole",
        paragraphs: [
          "Start with the jacket laid flat or shown from a straight angle. Look for a balanced front, even side seams and a hem that does not appear twisted. A relaxed jacket may have extra width, but the panels and fastenings should still line up with the intended design.",
          "Compare the inspected outline with the listing images. Differences in styling can come from lighting or how the sample is arranged, while a changed collar, pocket position or panel shape deserves a closer look.",
        ],
      },
      {
        heading: "Shoulders, sleeves and armholes",
        paragraphs: [
          "Inspect where the sleeve meets the body and whether both sides look similar. A dropped shoulder can be intentionally low, but an uneven seam or a sleeve that appears attached at a different height may signal a construction problem. Look at the cuff and opening as part of the same line.",
          "Photo evidence cannot prove movement or comfort. It can show whether the jacket's visible proportions are close to the listing and whether the measurements are worth checking again against your reference layer.",
        ],
      },
      {
        heading: "Zips, buttons and pockets",
        paragraphs: [
          "Zips should follow the front line without an obvious wave, and pockets should sit at matching heights when the design calls for symmetry. Buttons, snaps and pullers should appear attached and placed where the product photos show them. Look for fabric pulling around a fastener rather than judging only the hardware itself.",
          "Functional testing may not be possible from a still image, so do not present a visual check as proof that a zip will last or a pocket will carry a particular load. Record visible concerns and ask for more information when the fastening is central to the purchase.",
        ],
      },
      {
        heading: "Panels, lining and finish",
        paragraphs: [
          "Panel lines, quilting, lining edges and seam tape can make a jacket look tidy or careless. Check whether the visible panels follow the advertised design and whether the fabric bunches unexpectedly at the shoulder, hem or pocket. A close QC image is useful for obvious issues, not microscopic certification.",
          "The <a href=\"/cnfans-qc-photos\">CNFans QC Photos Guide</a> gives a general way to check colour and finish. Use the <a href=\"/cnfans-size-guide\">CNFans size guide</a> separately for chest, shoulder and sleeve comparisons.",
        ],
      },
      {
        heading: "Keep the conclusion measured",
        paragraphs: [
          "A jacket photo can support a decision when the silhouette, construction and visible hardware match the information on the listing. It cannot tell you how warm the coat is, how waterproof it will be or how it feels through a full day of movement.",
          "If the proportions look right and no obvious issue appears, move on to the measurements and intended layers. If the image raises a question, ask about that specific point rather than assuming every unseen detail is perfect or faulty.",
        ],
      },
    ],
    note: "Good jacket QC is specific: inspect structure, fastenings and visible finish, then keep claims within what the photos actually show.",
    related: [
      { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "Use the wider inspection checklist before ordering." },
      { href: "/cnfans-jacket-finds", title: "CNFans Jacket Finds UK", blurb: "Compare outerwear shapes and layering pieces." },
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Check the measurements that control jacket fit." },
    ],
    browseHref: "/category/outerwear",
    browseLabel: "Browse Outerwear",
  },
  {
    path: "/cnfans-puffer-qc",
    title: "CNFans Puffer Jacket QC: Shape, Filling and Fit Checks",
    description: "A cautious CNFans puffer QC checklist for quilting, visible shape, filling distribution, closures and fit-related measurements.",
    h1: "CNFans Puffer Jacket QC: Shape, Filling and Fit Checks",
    intro: "Puffer QC is about the pattern created by the padding. Look for an even visible shape, consistent quilting and closures that sit properly, while remembering that photos cannot prove warmth or long-term loft.",
    sections: [
      {
        heading: "Check the quilted outline",
        paragraphs: [
          "A puffer's panels should follow the shape shown in the listing without an unexplained flat patch, severe bunching or a visibly uneven hem. Some variation comes from the jacket being folded or compressed for the photograph, so look for repeated evidence across more than one angle.",
          "The overall outline also helps you understand the intended fit. A short, broad puffer behaves differently from a longer coat, even when both are labelled relaxed. Use the image to read the silhouette and the measurements to decide whether it works on you.",
        ],
      },
      {
        heading: "Filling and panel consistency",
        paragraphs: [
          "Look for large differences in the visible fullness of neighbouring panels, especially across the chest, shoulders and sleeves. A small change in puffiness can come from handling or lighting; a repeated empty-looking section is more useful as a question to raise.",
          "Do not turn a still image into a claim about the material inside. You may be able to see whether the filling appears evenly distributed, but you cannot reliably establish exact composition, warmth, recovery or performance from a photo alone.",
        ],
      },
      {
        heading: "Closures, cuffs and hem",
        paragraphs: [
          "Inspect the zip or snaps along the front line and check whether the storm flap, collar and pockets appear aligned. Cuffs and hems should look attached evenly, particularly where elastic or drawcords are meant to hold heat in. A visible pull or twisted edge is worth noting.",
          "The jacket should still be measured independently. A puffy outline can hide a short sleeve or a narrow armhole, and a large size can add unwanted width. The <a href=\"/cnfans-size-guide\">CNFans size guide</a> is better for that comparison than the photo itself.",
        ],
      },
      {
        heading: "Use QC beside product photos",
        paragraphs: [
          "Product images show the intended styling, while QC images may reveal the actual sample's shape and visible finish. Compare distinctive features such as quilting direction, pocket placement and collar height, but allow for different lighting and how the jacket has been arranged.",
          "The <a href=\"/cnfans-qc-photos\">CNFans QC Photos Guide</a> explains the limits of visible checks. For a wider seasonal comparison, look at the <a href=\"/cnfans-winter-jacket-finds\">winter jacket finds</a> page and decide what role the puffer has in your wardrobe.",
        ],
      },
      {
        heading: "What a puffer photo cannot settle",
        paragraphs: [
          "A puffer image cannot prove exact warmth, water resistance, comfort, durability or how much room remains for your usual layers. It can help identify obvious visual concerns, but those wider performance questions need reliable product information and sensible expectations.",
          "If the visible shape, construction and measurements make sense together, the QC check is useful. If a key panel is hidden or the image is too compressed to read, keep the decision open rather than awarding certainty that the photograph cannot provide.",
        ],
      },
    ],
    note: "Inspect the visible pattern and construction of a puffer, then separate that evidence from claims about warmth, filling performance or durability.",
    related: [
      { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "Review visible colour, fabric and finish details." },
      { href: "/cnfans-winter-jacket-finds", title: "CNFans Winter Jackets UK", blurb: "Compare padded coats and winter layers." },
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Check chest, shoulder and sleeve room." },
    ],
    browseHref: "/category/outerwear",
    browseLabel: "Browse Outerwear",
  },
  {
    path: "/cnfans-product-photos-vs-qc-photos",
    title: "CNFans Product Photos vs QC Photos: What Each One Can Actually Tell You",
    description: "Understand the difference between CNFans product photos and QC photos, including design, colour, construction and fit limits.",
    h1: "CNFans Product Photos vs QC Photos",
    intro: "Product photos show what a listing is trying to sell you. QC photos show what an inspected item visibly looks like. Both are useful, but they answer different questions.",
    sections: [
      {
        heading: "Product photos describe the intended item",
        paragraphs: [
          "Seller or product-listing images are best for understanding the design: the advertised colour, silhouette, pockets, panels, branding placement and styling. They give you the clearest view of how the maker wants the garment to look when worn or arranged for presentation.",
          "They are still presentation images. Lighting, editing, posing and the choice of sample can make a fabric look smoother or a colour look slightly different from another photograph. Use them to understand the offer, not as a guarantee of the exact piece in every respect.",
        ],
      },
      {
        heading: "QC photos add a second kind of evidence",
        paragraphs: [
          "QC or warehouse-style photos are more useful for checking the actual item that has arrived for inspection. When the angles are clear, you may be able to see its proportions, stitching, panel alignment, logo placement and obvious flaws. You can also compare its colour with the listing under the different lighting.",
          "That makes QC photos valuable for spotting a mismatch between expectation and the inspected sample. They do not automatically prove that every hidden part is perfect, and they should not be read as a full product test.",
        ],
      },
      {
        heading: "What neither photo type can prove",
        paragraphs: [
          "Neither product photos nor QC photos can reliably reproduce comfort, fabric hand-feel, warmth or durability. A flat item is not a person wearing it, and a posed model does not tell you how the same measurements will sit on your body.",
          "Fit decisions still need garment measurements and a reference item. The <a href=\"/cnfans-qc-photos-fit\">QC photos and fit</a> guide explains what visual proportions can suggest, while the <a href=\"/cnfans-size-guide\">CNFans size guide</a> covers the comparison method.",
        ],
      },
      {
        heading: "A two-photo comparison",
        paragraphs: [
          "Start with the listing image and write down the features that matter: colour, collar, pockets, quilting, graphic position or hem length. Then look at the QC image for the same landmarks. This keeps you comparing design details rather than reacting to the different background and camera angle.",
          "If the two sets disagree, separate obvious differences from conditions that can explain them. Lighting can change colour, folding can hide length and perspective can alter proportions. A repeated construction difference across clear images deserves more attention than a single shadow.",
        ],
        items: [
          "Product photos: intended design, styling and advertised features.",
          "QC photos: visible condition and proportions of the inspected item.",
          "Measurements: the strongest evidence for choosing a personal size.",
        ],
      },
      {
        heading: "Use each image for its proper job",
        paragraphs: [
          "Use product photos to decide whether the style belongs in your wardrobe. Use QC photos to check whether the inspected sample appears consistent with that choice. Use measurements to decide whether the garment is likely to fit the way you want.",
          "The distinction keeps the review honest. It also makes your questions more precise: ask about a visible mismatch, request a missing measurement or note a lighting difference instead of asking one image to answer every possible concern.",
        ],
      },
    ],
    note: "Product photos set the expectation, QC photos test visible reality, and measurements handle the personal fit decision. Keeping those jobs separate makes both types of image more useful.",
    related: [
      { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "Check visible details without overreading a photo." },
      { href: "/cnfans-qc-photos-fit", title: "QC Photos and Fit", blurb: "Understand what proportions can and cannot suggest." },
      { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "Browse clothing finds and compare product information." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-hoodie-fabric-weight",
    title: "CNFans Hoodie Fabric Weight: Lightweight vs Heavyweight",
    description: "Compare lightweight, mid-weight and heavyweight hoodie fabrics by warmth, drape, layering and everyday wear.",
    h1: "CNFans Hoodie Fabric Weight: Lightweight vs Heavyweight",
    intro: "Fabric weight changes the way a hoodie hangs, layers and feels through the day. Lightweight and heavyweight are not better or worse; they suit different jobs.",
    sections: [
      {
        heading: "What fabric weight changes",
        paragraphs: [
          "A lighter hoodie usually folds smaller, feels less warm and sits more easily under a jacket. A heavier one tends to hold a stronger outline, add substance to the outfit and feel more protective on a cool day. The difference is noticeable even when the chest and sleeve measurements are similar.",
          "Weight is not the same as quality. A dense, well-finished lighter fabric may be more useful to you than a bulky layer that is difficult to wear. Read the fabric description alongside the photos and think about the weather, room and wardrobe gap the hoodie is meant to fill.",
        ],
      },
      {
        heading: "Lightweight layers",
        paragraphs: [
          "Light jersey or thin loopback cotton works well over a T-shirt and beneath an overshirt or coat. It can be the easiest option for travel, changing temperatures and outfits where the hoodie is meant to add colour without becoming the main event.",
          "The trade-off is structure. A light hoodie may show the shape of the layer underneath and may not create the substantial drape shown by a heavyweight streetwear cut. That is not a flaw if you want a flexible mid-layer; it is simply a different use.",
        ],
      },
      {
        heading: "Mid-weight everyday options",
        paragraphs: [
          "A medium-weight cotton or loopback hoodie usually covers the widest range of days. It has enough body to look good on its own, but it does not take over the armhole of a jacket. For many wardrobes, this balance is more useful than choosing the extreme ends of the scale.",
          "Look at the hood and ribbing as well as the main fabric. A substantial hood can add warmth and visual weight even when the body is moderate. Ribbed cuffs and hem help the shape hold together, but they do not tell you exactly how heavy the fabric is.",
        ],
      },
      {
        heading: "Heavyweight and brushed fabrics",
        paragraphs: [
          "Heavyweight fleece or dense jersey feels fuller and often gives a boxier outline. It can work as the main warm layer with jeans or relaxed trousers, but the extra thickness may feel crowded beneath a close-fitting jacket. Check the sleeve and upper-arm room if layering is important.",
          "Brushed interiors feel soft and warm, while loopback interiors usually feel more breathable. These are useful clues rather than promises about a particular temperature. The <a href=\"/cnfans-hoodie-finds\">CNFans hoodie finds</a> page gives outfit context, and the <a href=\"/cnfans-size-guide\">CNFans size guide</a> helps separate fabric thickness from size choice.",
        ],
      },
      {
        heading: "Choose around your week",
        paragraphs: [
          "Ask where the hoodie will spend most of its time: under a coat, in a heated room, outside on its own or packed in a bag. A lighter layer is easier to repeat across seasons, while a heavier piece earns its space when you regularly want warmth and a clear silhouette.",
          "Do not use a product photograph as a precise weight measurement. Compare the listing information, the construction and your intended layers, then choose the fabric that will be worn rather than the one that sounds most impressive.",
        ],
      },
    ],
    note: "Choose hoodie weight by use: light layers for flexibility, moderate cloth for everyday range and heavy fabric when warmth and structure are the point.",
    related: [
      { href: "/cnfans-hoodie-finds", title: "CNFans Hoodie Finds UK", blurb: "Browse different hoodie shapes and everyday layers." },
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Check measurements when fabric thickness affects layering." },
      { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "Review visible fabric and finish details carefully." },
    ],
    browseHref: "/category/tops/hoodies",
    browseLabel: "Browse Hoodies",
  },
  {
    path: "/cnfans-estimated-weight-vs-actual-weight",
    title: "CNFans Estimated Weight vs Actual Weight: Why the Numbers Can Differ",
    description: "Understand why a CNFans parcel estimate can differ from the packed figure, including packaging, dimensions and item information.",
    h1: "CNFans Estimated Weight vs Actual Weight",
    intro: "An estimated parcel weight is a planning figure. The packed weight is measured after the items, packaging and chosen presentation are brought together, so a difference does not automatically mean something went wrong.",
    sections: [
      {
        heading: "The estimate comes earlier",
        paragraphs: [
          "Before a parcel is assembled, weight may be inferred from item information, previous records or a provisional product figure. At that point the final box, protective material and the way the items are consolidated may not be known. The estimate is useful for planning, but it is not a measurement of the finished parcel.",
          "Item information can also be incomplete or rounded. Clothing sizes, footwear packaging and different product constructions can change the physical result. Treat the number as a working indication and check the current estimate shown by the service before submitting a parcel.",
        ],
      },
      {
        heading: "What the packed figure includes",
        paragraphs: [
          "The actual figure can include the products, individual packaging, protective material, an outer carton or mailing bag and any other packing selected for the shipment. Those parts belong to the parcel even though they are not the clothing itself.",
          "A small item count does not always mean a simple package. Shoes may remain in boxes, several pieces may be combined into one carton and a jacket may need more space than a folded T-shirt. The composition of the parcel matters as much as the number of products.",
        ],
      },
      {
        heading: "Physical weight and shipping calculation",
        paragraphs: [
          "Physical weight is the mass measured on a scale. Shipping calculations can also take the parcel's dimensions into account, depending on the carrier and service. That is why the figure used for a shipping quote may not behave like a simple total of product weights.",
          "The <a href=\"/cnfans-volumetric-weight\">CNFans volumetric weight</a> guide explains the dimension side separately. For packaging-specific factors, see <a href=\"/cnfans-packaging-weight\">CNFans packaging weight</a> rather than treating every difference as a product-weight error.",
        ],
      },
      {
        heading: "How to read a change without guessing",
        paragraphs: [
          "Compare the original estimate with the packed information and ask what changed: item count, boxes, protective packing, parcel dimensions or the selected shipping method. Without that context, the difference alone cannot tell you which part caused it.",
          "Avoid turning one parcel into a rule for every future order. A clothing-heavy haul, a parcel with shoes and a single padded jacket can produce different patterns. Keep the current service details in view and use a broad range of possibilities rather than an invented fixed adjustment.",
        ],
      },
      {
        heading: "A sensible next step",
        paragraphs: [
          "Use an estimate to compare options and plan a parcel, then review the final information when packing is complete. If the change looks surprising, check the item list and packaging choices first. A specific question is easier to answer than a general assumption about what the service should have done.",
          "For order and tracking context, open the <a href=\"/cnfans-delivery-uk\">CNFans UK delivery guide</a>. Keep weight, packing and delivery as separate stages so that one provisional figure does not carry more certainty than it deserves.",
        ],
      },
    ],
    note: "Estimated and packed weights describe different moments. Compare the items, packaging and parcel dimensions before deciding why the figures changed.",
    related: [
      { href: "/cnfans-packaging-weight", title: "CNFans Packaging Weight", blurb: "Look specifically at boxes and protective packing." },
      { href: "/cnfans-volumetric-weight", title: "CNFans Volumetric Weight", blurb: "Understand when parcel dimensions affect a calculation." },
      { href: "/cnfans-delivery-uk", title: "CNFans UK Delivery Guide", blurb: "Follow the broader order and tracking process." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-volumetric-weight",
    title: "CNFans Volumetric Weight Explained in Plain English",
    description: "A plain-English explanation of CNFans volumetric weight, parcel dimensions and why a large light box can calculate differently.",
    h1: "CNFans Volumetric Weight in Plain English",
    intro: "Volumetric weight is a way of accounting for the space a parcel occupies. It matters because a large, light box can use more delivery capacity than its scale weight suggests.",
    sections: [
      {
        heading: "Why dimensions can matter",
        paragraphs: [
          "A carrier has to move both mass and occupied space. A compact heavy parcel and a large light parcel place different demands on a vehicle or aircraft. Depending on the shipping service, the chargeable calculation may therefore consider the box dimensions as well as its physical weight.",
          "This does not mean every parcel is charged by volume. The relevant method depends on the carrier, route and service terms shown at the time. Read the current quote and parcel information rather than assuming one formula applies to every option.",
        ],
      },
      {
        heading: "Physical versus volumetric weight",
        paragraphs: [
          "Physical weight is what a scale records. Volumetric weight is derived from the parcel's length, width and height using the carrier's calculation method. A service may compare the two figures and use the one that its rules treat as chargeable.",
          "The exact divisor or threshold is not universal, and it can vary by service. This article explains the concept rather than presenting a fixed platform rule. Check the current estimate displayed for the parcel before making a shipping decision.",
        ],
      },
      {
        heading: "Why clothing parcels vary",
        paragraphs: [
          "Folded clothing can often be arranged compactly, but shoes may occupy their boxes and padded jackets may resist being made as small as a thin top. Protective material and the outer carton add another layer. Two parcels with a similar item count can therefore take different amounts of space.",
          "Consolidation can change the shape again. Several small packages may become one larger carton, or the final packing may use a different container to protect the contents. Those changes affect dimensions even when the product list stays the same.",
        ],
      },
      {
        heading: "How to read the estimate",
        paragraphs: [
          "Treat a pre-packing figure as a planning aid. Look for the parcel dimensions when they become available, compare the physical and calculated descriptions and note which shipping service you are viewing. A weight number without its context is easy to misunderstand.",
          "For the product and packaging side of the comparison, read <a href=\"/cnfans-estimated-weight-vs-actual-weight\">estimated versus actual weight</a> and <a href=\"/cnfans-packaging-weight\">CNFans packaging weight</a>. The <a href=\"/cnfans-delivery-uk\">delivery guide</a> covers the order stage around those figures.",
        ],
      },
      {
        heading: "Avoid false precision",
        paragraphs: [
          "Without the current carrier method and parcel dimensions, it is not possible to promise a particular chargeable result. Be cautious with posts or spreadsheets that present one number as a universal answer, especially when they were created for a different route or packing setup.",
          "The useful question is not whether volumetric weight is good or bad. It is whether the current parcel shape and service make space relevant, and whether a different packing choice is available and appropriate for the items.",
        ],
      },
    ],
    note: "Volumetric weight is about occupied space, not a hidden product surcharge. Check the current service terms and parcel dimensions before treating an estimate as final.",
    related: [
      { href: "/cnfans-estimated-weight-vs-actual-weight", title: "Estimated vs Actual Weight", blurb: "Separate early estimates from packed measurements." },
      { href: "/cnfans-packaging-weight", title: "CNFans Packaging Weight", blurb: "See how boxes and protective material change a parcel." },
      { href: "/cnfans-delivery-uk", title: "CNFans UK Delivery Guide", blurb: "Review delivery and tracking information together." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-rehearsal-shipping",
    title: "What Is CNFans Rehearsal Shipping and Why Do People Use It?",
    description: "An independent explanation of CNFans rehearsal shipping, what the idea is meant to clarify and what to check before submitting a parcel.",
    h1: "What Is CNFans Rehearsal Shipping?",
    intro: "Rehearsal shipping generally refers to checking or preparing parcel details before the final shipping choice is made. The useful part is better information about the packed parcel, not a promise of one universal outcome.",
    sections: [
      {
        heading: "The problem it is meant to address",
        paragraphs: [
          "Before packing is complete, a parcel estimate can be based on incomplete item or packaging information. Once the contents are arranged, the parcel may have a different physical weight or shape. A rehearsal-style step is intended to give the buyer a clearer picture before committing to a delivery option.",
          "The exact feature name and workflow can vary by service and may change over time. This page is an educational explanation for people researching the term, not an official promise about what a particular platform currently offers.",
        ],
      },
      {
        heading: "What a pre-shipping check can clarify",
        paragraphs: [
          "A packing check may make it easier to review the item list, parcel dimensions, packaging choices and the information used for a shipping estimate. That context helps explain why a provisional number and the packed figure are not always the same.",
          "It can also prompt practical decisions, such as whether a shoe box is necessary for the way you want the item protected or whether a different consolidation arrangement is suitable. Those choices depend on the products and the current service options.",
        ],
      },
      {
        heading: "What it does not guarantee",
        paragraphs: [
          "A rehearsal or packing check cannot guarantee a particular delivery price, transit time, customs outcome or final carrier result. The service selected, route, parcel shape and current terms all remain relevant. Avoid guides that present one historic example as a fixed rule.",
          "The <a href=\"/cnfans-estimated-weight-vs-actual-weight\">estimated versus actual weight</a> guide explains the timing difference between the two figures. For the space side, see <a href=\"/cnfans-volumetric-weight\">volumetric weight</a> and check the current quote shown to you.",
        ],
      },
      {
        heading: "Questions to check before shipping",
        paragraphs: [
          "Before selecting a service, confirm what the displayed weight means, whether the dimensions are available, which packing choices are included and whether the quote is current. If the feature is unclear, use the platform's present instructions or support channel rather than relying on an old screenshot.",
          "Keep a record of the parcel contents and the choices you make. That makes a later delivery question easier to describe without assuming that the first estimate or a community explanation was the final figure.",
        ],
        items: [
          "Is the figure an estimate, a packed measurement or a chargeable calculation?",
          "Are product boxes or protective materials included in the parcel description?",
          "Does the selected service show its current route and terms?",
        ],
      },
      {
        heading: "Keep the term in perspective",
        paragraphs: [
          "Rehearsal shipping is best understood as an information step around packing. It may make a decision clearer, but it does not remove the normal uncertainty that comes with different parcels, services and routes.",
          "For the broader process, the <a href=\"/cnfans-delivery-uk\">CNFans UK delivery guide</a> covers order processing, tracking and support. Use both pages to separate what is known from what still depends on the current shipment.",
        ],
      },
    ],
    note: "Use rehearsal shipping as a way to review current parcel information. Keep prices, times and carrier outcomes conditional unless the live service confirms them.",
    related: [
      { href: "/cnfans-delivery-uk", title: "CNFans UK Delivery Guide", blurb: "Follow the wider order and tracking journey." },
      { href: "/cnfans-estimated-weight-vs-actual-weight", title: "Estimated vs Actual Weight", blurb: "Understand why parcel figures can change." },
      { href: "/cnfans-volumetric-weight", title: "CNFans Volumetric Weight", blurb: "See how parcel dimensions can affect a calculation." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-haul-weight",
    title: "CNFans Haul Weight: Clothes, Shoes and Jackets Compared",
    description: "Compare the factors that make clothing, shoes, jackets and mixed hauls occupy different amounts of parcel weight and space.",
    h1: "CNFans Haul Weight: Clothes, Shoes and Jackets Compared",
    intro: "A haul's weight is shaped by what is inside it and how those items are packed. Thin tops, denim, shoes and padded jackets each create a different combination of mass, bulk and space.",
    sections: [
      {
        heading: "Why item count is a poor shortcut",
        paragraphs: [
          "Ten lightweight tops do not create the same parcel as ten pairs of shoes, and one winter jacket can take more space than several thin shirts. Item count is useful for a first glance, but material, construction and packaging make a bigger difference to the final parcel.",
          "A mixed haul is harder to estimate because each group contributes differently. Clothing can often be folded, footwear may keep its boxes and structured outerwear can resist compression. Think in categories before trying to picture the combined parcel.",
        ],
      },
      {
        heading: "Clothing, denim and tracksuits",
        paragraphs: [
          "T-shirts and light tops are usually easy to fold into a compact shape. Hoodies and tracksuits add more fabric, while denim and heavier trousers bring a denser bundle. The size of the garment matters, but so do seams, waistbands, fleece and any attached structure.",
          "The <a href=\"/cnfans-finds\">CNFans finds</a> pages group clothing by type, which makes it easier to see why two product lists may behave differently. For a closer clothing comparison, keep the item details and the current packing information together rather than relying on a generic average.",
        ],
      },
      {
        heading: "Shoes change the parcel shape",
        paragraphs: [
          "Shoes are not only a question of physical weight. Soles, tissue, inserts and shoe boxes can create a larger package, and the final arrangement depends on the chosen protection. A pair that is compact without its box may occupy a different amount of space when the box is kept.",
          "That is why a shoes-and-clothing haul can behave differently from a clothing-only parcel even when the scale estimate looks similar. The relevant question is what packaging is included and what the current shipping service uses for its calculation.",
        ],
      },
      {
        heading: "Jackets and padded layers",
        paragraphs: [
          "Jackets vary widely. A thin shell folds differently from a lined coat, and a puffer can retain more air and occupy more room until it is packed. The product's measurements, construction and packing method all matter; the word jacket alone does not supply a reliable number.",
          "For puffer-specific context, see <a href=\"/cnfans-puffer-weight\">puffer jacket weight</a>. If you are planning the wider delivery stage, the <a href=\"/cnfans-delivery-uk\">CNFans UK delivery guide</a> explains what happens after the order is prepared.",
        ],
      },
      {
        heading: "Physical weight is not the whole story",
        paragraphs: [
          "A parcel can have a scale weight and a dimensional calculation, depending on the service and route. The box shape, outer carton and protective material may therefore matter even when the product list has not changed.",
          "Use the <a href=\"/cnfans-volumetric-weight\">volumetric weight</a> explanation for that distinction and the <a href=\"/cnfans-packaging-weight\">packaging weight</a> article for the materials around the products. These are separate questions from how heavy a particular hoodie, shoe or jacket feels in isolation.",
        ],
      },
    ],
    note: "Compare the contents by material and packing needs, not just item count. A mixed haul becomes easier to understand when product weight and parcel space are kept separate.",
    related: [
      { href: "/cnfans-puffer-weight", title: "CNFans Puffer Weight", blurb: "Look at why padded jackets can affect parcel space." },
      { href: "/cnfans-packaging-weight", title: "CNFans Packaging Weight", blurb: "Review boxes, bags and protective materials." },
      { href: "/cnfans-volumetric-weight", title: "CNFans Volumetric Weight", blurb: "Understand the dimension side of a shipping calculation." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-puffer-weight",
    title: "How Much Does a Puffer Jacket Add to a CNFans Parcel?",
    description: "A careful guide to the factors that make a puffer jacket affect CNFans parcel weight and space, without inventing fixed numbers.",
    h1: "How a Puffer Jacket Can Affect Parcel Weight",
    intro: "There is no useful universal number for what a puffer adds to a parcel. The jacket's size, construction, filling, packaging and the final box all influence the result.",
    sections: [
      {
        heading: "The jacket is more than its fabric",
        paragraphs: [
          "A puffer combines an outer shell, lining, panels, fastenings and filling. Those parts can make it denser than a thin top and can also leave more air in the folded bundle. The garment's measurements and construction are therefore more informative than the category label alone.",
          "Two puffers can behave differently even when they are both described as winter jackets. A shorter lightweight style, a long heavily quilted coat and a hooded design do not present the same packing problem.",
        ],
      },
      {
        heading: "Packing changes the space it takes",
        paragraphs: [
          "The way the puffer is folded or protected can change the parcel shape. It may be placed with softer clothing, kept in a separate bag or packed with other structured items. Compression may be possible in some situations, but the appropriate method depends on the garment and the protection it needs.",
          "This is why the parcel figure should be treated as a current estimate until the packing stage is complete. A product page cannot show the final outer carton, and a single community example cannot stand in for every shipment.",
        ],
      },
      {
        heading: "Weight versus dimensions",
        paragraphs: [
          "A puffer may affect both the physical weight and the amount of room used in the parcel. Depending on the shipping method, dimensions can matter separately from what the scale records. The result is a parcel question, not simply a property of the coat.",
          "Read <a href=\"/cnfans-volumetric-weight\">CNFans volumetric weight</a> for the space calculation and <a href=\"/cnfans-packaging-weight\">CNFans packaging weight</a> for boxes and protective material. Keeping those ideas separate prevents a guessed jacket number from being presented as a shipping rule.",
        ],
      },
      {
        heading: "What to check before planning a haul",
        paragraphs: [
          "Note the puffer's size, length and visible construction, then consider whether it will travel with shoes, denim or other bulky pieces. Review the current parcel information once the items are gathered and check which figure the selected service is displaying.",
          "If you need a delivery estimate for a date, leave room for the packing and carrier stages. The broader <a href=\"/cnfans-delivery-uk\">CNFans UK delivery guide</a> explains those stages, while this page is only about the contribution a puffer may make to the parcel.",
        ],
      },
      {
        heading: "Avoid fixed promises",
        paragraphs: [
          "Without a reliable item record, packaging choice and current service calculation, a precise added weight would be made up. Use conditional language such as can, may and depending on because those are the honest limits of the information available.",
          "The useful outcome is a better question: is the puffer the largest item by mass, by volume or by both in this particular parcel? Answer that from the current details rather than from an invented average.",
        ],
      },
    ],
    note: "A puffer can affect a parcel through both its material and its space. The final result belongs to the packed shipment, not to a fixed jacket category average.",
    related: [
      { href: "/cnfans-packaging-weight", title: "CNFans Packaging Weight", blurb: "See how the material around products affects a parcel." },
      { href: "/cnfans-volumetric-weight", title: "CNFans Volumetric Weight", blurb: "Separate occupied space from physical weight." },
      { href: "/cnfans-winter-jacket-finds", title: "CNFans Winter Jackets UK", blurb: "Browse padded coats and cold-weather layers." },
    ],
    browseHref: "/category/outerwear",
    browseLabel: "Browse Outerwear",
  },
  {
    path: "/cnfans-packaging-weight",
    title: "CNFans Packaging Weight: How Boxes and Packing Can Affect a Parcel",
    description: "Understand how product packaging, shoe boxes, cartons and protective materials can affect a CNFans parcel's weight and dimensions.",
    h1: "How Packaging Can Affect CNFans Parcel Weight",
    intro: "The parcel contains more than the products. Boxes, bags, paper, protective material and the outer carton can all affect the final physical weight or the space the shipment occupies.",
    sections: [
      {
        heading: "Product packaging travels too",
        paragraphs: [
          "A product may arrive with its own presentation materials before the outer parcel is prepared. Clothing can have bags or tags, while shoes may have tissue, inserts and a box. Whether those materials remain in the shipment depends on the packing choices available for that parcel.",
          "The important point is simple: packaging is part of what is being moved. A product-only mental estimate can therefore be lower than the packed figure without any change to the product list.",
        ],
      },
      {
        heading: "Shoe boxes and structured items",
        paragraphs: [
          "Shoe boxes can matter because they add their own material and preserve a rectangular space around the shoes. Keeping them may suit the protection you want, while removing or changing them may produce a different parcel shape where the current service allows it.",
          "Jackets can create a related space problem. A puffer, padded coat or structured outerwear piece may not fold into the same profile as a T-shirt, particularly when it is combined with several small packages.",
        ],
      },
      {
        heading: "Outer cartons and protection",
        paragraphs: [
          "Once several items are consolidated, the outer carton or mailing bag becomes part of the shipment. The size and strength of that container depend on the contents and the packing method. Protective material can also be added where the items need separation or cushioning.",
          "These are reasons to use can, may and depending on rather than promising one fixed adjustment. Without the live packing information, there is no honest way to state how much a particular parcel's packaging will add.",
        ],
      },
      {
        heading: "Physical weight is different from parcel volume",
        paragraphs: [
          "A box can add physical material while also increasing the space around the products. Depending on the shipping service, dimensions may affect the chargeable calculation separately from the scale weight. Read the current service information rather than assuming a product total is the only relevant figure.",
          "For that distinction, see <a href=\"/cnfans-volumetric-weight\">CNFans volumetric weight</a>. For the earlier estimate stage, <a href=\"/cnfans-estimated-weight-vs-actual-weight\">estimated versus actual weight</a> explains why the final packed number can differ.",
        ],
      },
      {
        heading: "A packaging-focused check",
        paragraphs: [
          "When the parcel is ready, identify which product packaging has been kept, which outer container is being used and whether protective materials are visible in the information provided. Then compare the current physical and dimensional descriptions for the selected service.",
          "Use the <a href=\"/cnfans-delivery-uk\">CNFans UK delivery guide</a> for the order timeline and tracking steps. This page stays narrower: it explains why the material around your clothing, shoes or jackets belongs in the parcel conversation.",
        ],
      },
    ],
    note: "Packaging is part of the shipment, but its effect is parcel-specific. Check the current packed details instead of applying a made-up box or shoe-box allowance.",
    related: [
      { href: "/cnfans-estimated-weight-vs-actual-weight", title: "Estimated vs Actual Weight", blurb: "Understand why the packed figure can replace an estimate." },
      { href: "/cnfans-volumetric-weight", title: "CNFans Volumetric Weight", blurb: "See why a box's dimensions may matter." },
      { href: "/cnfans-haul-weight", title: "CNFans Haul Weight", blurb: "Compare clothing, shoes and jackets in a mixed parcel." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-dead-links",
    title: "Why CNFans Spreadsheet Links Stop Working",
    description: "Find out why CNFans spreadsheet links can fail and how to separate an expired link, a moved listing and a temporary access issue.",
    h1: "Why CNFans Spreadsheet Links Stop Working",
    intro: "A dead link does not always mean the underlying find was useless. The row may point to a moved listing, an expired product, a temporary error or a destination that is no longer available.",
    sections: [
      {
        heading: "The link and the product are separate",
        paragraphs: [
          "A spreadsheet is a collection of references. Its row can remain visible after the destination changes, so the spreadsheet itself and the product page do not necessarily update at the same time. That gap is one reason old finds can continue to circulate after a link stops opening.",
          "Start by recording what the row actually says: item type, colour, source note and any product identifier. A little context gives you more options than repeatedly clicking the same address with no plan.",
        ],
      },
      {
        heading: "Common reasons a link fails",
        paragraphs: [
          "A listing may have been removed, renamed or moved to another address. A link can also be copied incorrectly, lose part of its query string or point to a page that is temporarily unavailable. Access rules and browser issues are another possibility, especially when only one device sees the error.",
          "Do not assume every failure has the same cause. A blank page, a not-found response, a redirect to a different item and a temporary loading problem each deserve a different next step.",
        ],
      },
      {
        heading: "A quick way to troubleshoot",
        paragraphs: [
          "Open the link again from the original row, check the visible destination and try a separate browser or a fresh tab if the error looks temporary. Compare the product name and images with current finds rather than searching only for an identical old URL.",
          "If a spreadsheet has its own search or filter, search by clothing type, colour or a distinctive style term. The <a href=\"/cnfans-spreadsheet-search-tips\">CNFans spreadsheet search tips</a> page covers a faster way to narrow a large sheet, while <a href=\"/cnfans-finds\">CNFans finds</a> offers a current browse route.",
        ],
      },
      {
        heading: "When to stop chasing an old row",
        paragraphs: [
          "If the destination repeatedly returns a clear not-found response and no current listing matches the identifying details, treat the find as unavailable for now. Saving a dozen uncertain replacements often creates more work than starting again with the current catalogue.",
          "Be careful with replacement links that preserve the name but change the product. A similar-looking hoodie or jacket may have different measurements, fabric and price. Verify the current listing details before treating it as the same find.",
        ],
      },
      {
        heading: "Keep a spreadsheet useful",
        paragraphs: [
          "A useful sheet needs more than a large number of rows. Dates, clear categories and enough product context help people recognise when a link has aged. As a reader, organise the links you still want and remove duplicates from your own notes so that a dead row does not keep resurfacing.",
          "The <a href=\"/cnfans-spreadsheet\">CNFans spreadsheet guide</a> explains the broader role of a sheet. This article stays focused on link health and the practical decision to move on when the source is no longer reliable.",
        ],
      },
    ],
    note: "Treat a dead link as a troubleshooting clue, not as proof that every detail in the row was wrong. Verify the current find before saving a replacement.",
    related: [
      { href: "/cnfans-spreadsheet", title: "CNFans Spreadsheet UK", blurb: "Understand what spreadsheet rows are meant to provide." },
      { href: "/cnfans-spreadsheet-search-tips", title: "Spreadsheet Search Tips", blurb: "Search a large sheet without endless scrolling." },
      { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "Browse current clothing finds by category." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-spreadsheet-search-tips",
    title: "CNFans Spreadsheet Search Tips: How to Find Clothing Without Scrolling Forever",
    description: "Practical CNFans spreadsheet search tips for filtering clothing by type, colour and style while checking whether links and details are current.",
    h1: "How to Search a CNFans Spreadsheet More Efficiently",
    intro: "A large spreadsheet becomes easier once you stop treating it like a page to scroll. Search for the kind of item you want, narrow the results and open the most promising rows first.",
    sections: [
      {
        heading: "Start with the item type",
        paragraphs: [
          "Use a simple clothing word before adding detailed terms. Search for hoodie, jacket, jeans or tracksuit, then review the smaller set of rows that remains. This is faster than beginning with a long phrase that may not match the way the sheet was labelled.",
          "Try close variations when the first search is sparse. A sheet may use sweatshirt instead of hoodie, outerwear instead of jacket or denim instead of jeans. Note which terms the sheet actually uses so later searches become more consistent.",
        ],
      },
      {
        heading: "Layer a second filter",
        paragraphs: [
          "Once the category is narrowed, add colour, material or a useful style word. Black hoodie, winter jacket or straight jeans is more manageable than searching the full sheet for a vague idea. If the spreadsheet has filter controls, use those alongside the browser's Find function.",
          "Brand or style terms can help when they are genuinely part of the row data. They can also hide good results if the sheet uses inconsistent names, so search the broad category first and only then add a narrower term.",
        ],
      },
      {
        heading: "Open rows in a sensible order",
        paragraphs: [
          "Check the row's image, description, size information and link before opening every destination. Save the strongest matches first, then compare them side by side. This avoids filling your browser history with near-identical finds that you never intended to keep.",
          "The product page matters more than a catchy row title. Confirm the current colour, measurements and availability after opening it. A spreadsheet can be useful for discovery while still needing a fresh check before you order.",
        ],
      },
      {
        heading: "Keep broken and repeated rows out",
        paragraphs: [
          "If a link fails, do not keep it in your shortlist without a note. The <a href=\"/cnfans-dead-links\">dead links guide</a> explains how to separate an expired destination from a temporary problem. Removing or labelling uncertain rows keeps the useful results visible.",
          "Several rows may lead to the same product or differ only in a small colour detail. Record the reason you prefer one. A short note about fit, fabric or price is more useful than saving every row that contains the same destination.",
        ],
      },
      {
        heading: "Know when to leave the spreadsheet",
        paragraphs: [
          "A sheet is a discovery tool, not a requirement to stay inside the sheet. When you know the category and fit you want, the <a href=\"/cnfans-finds\">CNFans finds</a> pages can be quicker to browse because the products are grouped into a readable catalogue.",
          "The existing <a href=\"/cnfans-spreadsheet\">CNFans spreadsheet guide</a> explains how spreadsheets and finds fit together. The efficient workflow is simple: search narrowly, verify the current listing and move to a direct browse page when the sheet stops saving time.",
        ],
      },
    ],
    note: "Search by category first, narrow with one useful detail, verify the current listing and discard rows that no longer help. A spreadsheet should reduce browsing time, not create another form of it.",
    related: [
      { href: "/cnfans-spreadsheet", title: "CNFans Spreadsheet UK", blurb: "Start with the broader spreadsheet explanation." },
      { href: "/cnfans-dead-links", title: "Why Links Stop Working", blurb: "Handle expired or moved spreadsheet destinations." },
      { href: "/cnfans-finds-vs-spreadsheet", title: "Finds vs Spreadsheet", blurb: "Compare the two ways to browse clothing." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-finds-vs-spreadsheet",
    title: "CNFans Finds vs Spreadsheet: Which Is Easier to Browse?",
    description: "Compare CNFans finds and spreadsheets by discovery, filtering, product context, link maintenance and the way you prefer to shop.",
    h1: "CNFans Finds vs Spreadsheet: Which Is Easier to Browse?",
    intro: "A spreadsheet is useful when you want a large collection of references. A finds page is usually easier when you want to browse a smaller, organised edit and compare products in one place.",
    sections: [
      {
        heading: "What a spreadsheet does well",
        paragraphs: [
          "Spreadsheets can gather a wide range of products in a compact format. Rows may include category labels, colours, style terms and links, which makes them useful for discovery when you already have a broad idea of what you want.",
          "The trade-off is that you have to interpret the row yourself. Links can age, measurements may need checking and several rows may look similar. A sheet gives you breadth, but not always the clearest route through the options.",
        ],
      },
      {
        heading: "What a finds page does well",
        paragraphs: [
          "A finds page turns a group of products into a more readable browse experience. Categories, images and short notes help you compare the shape of the edit before opening an individual product. This can be helpful when you are still deciding whether you want a hoodie, jacket, trouser or matching set.",
          "A catalogue does not remove the need to inspect the product page. Size, colour and availability still belong to the current listing, and the <a href=\"/cnfans-size-guide\">CNFans size guide</a> remains useful when fit is the deciding factor.",
        ],
      },
      {
        heading: "Search and comparison",
        paragraphs: [
          "If you know a precise term, a spreadsheet's search can be quick when the rows are labelled consistently. If you prefer visual comparison or do not know the exact wording, a finds page may take less effort. Neither method is automatically better; they remove different kinds of friction.",
          "Use the <a href=\"/cnfans-spreadsheet-search-tips\">spreadsheet search tips</a> when you are working from a large sheet. Use the specific <a href=\"/cnfans-hoodie-finds\">hoodie finds</a> or <a href=\"/cnfans-jacket-finds\">jacket finds</a> pages when the category is already clear.",
        ],
      },
      {
        heading: "Link maintenance matters",
        paragraphs: [
          "A spreadsheet row can outlive its destination. That does not make the format bad, but it means the reader has to check whether the link still opens and whether the current page is the same product. Read <a href=\"/cnfans-dead-links\">why spreadsheet links stop working</a> before treating an old row as current.",
          "A finds page gives you a direct internal route to products, although individual listings can still change. Whichever format you use, verify the product information immediately before ordering rather than relying on an old saved reference.",
        ],
      },
      {
        heading: "Choose by the job in front of you",
        paragraphs: [
          "Use a spreadsheet for wide research, unusual search terms or building a shortlist from many references. Use finds pages for a cleaner browse, visual comparison and a quicker route into the current catalogue. It is perfectly reasonable to use both in one session.",
          "The <a href=\"/cnfans-spreadsheet\">CNFans spreadsheet guide</a> explains the original format, while <a href=\"/cnfans-finds\">CNFans finds</a> keeps the current browse route simple. The better choice is the one that helps you make a clear product decision with less wasted scrolling.",
        ],
      },
    ],
    note: "Spreadsheets provide breadth; finds pages provide a more guided browse. Use the format that matches the question you are trying to answer, then verify the live product details.",
    related: [
      { href: "/cnfans-spreadsheet", title: "CNFans Spreadsheet UK", blurb: "Learn how spreadsheet rows and product links work." },
      { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "Browse the current clothing edit directly." },
      { href: "/cnfans-spreadsheet-search-tips", title: "Spreadsheet Search Tips", blurb: "Find a precise item faster inside a large sheet." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
  {
    path: "/cnfans-reddit",
    title: "CNFans Reddit Questions: Sizing, QC, Shipping and Finds Explained",
    description: "A neutral guide to recurring CNFans Reddit questions about sizing, QC photos, shipping, spreadsheets and clothing finds.",
    h1: "CNFans Reddit Questions: Sizing, QC, Shipping and Finds",
    intro: "Public community discussions often return to the same CNFans questions: which size to choose, what QC photos show, how shipping figures work and where to find useful clothing references.",
    sections: [
      {
        heading: "Sizing questions need measurements",
        paragraphs: [
          "Community advice can be a useful starting point, but a recommendation such as size up or stay true to size only makes sense with the garment, the cut and the person's measurements in view. A hoodie, jacket and pair of jeans should not share one automatic rule.",
          "Use a garment you already like as the reference. The <a href=\"/cnfans-size-guide\">CNFans size guide</a> explains the measuring method, while the pages for <a href=\"/cnfans-hoodie-finds\">hoodie finds</a> and <a href=\"/cnfans-jacket-finds\">jacket finds</a> add context about different shapes.",
        ],
      },
      {
        heading: "What QC photos can answer",
        paragraphs: [
          "QC photos can help you inspect visible colour, construction, proportions, stitching, graphics and obvious flaws in the item shown. They cannot reproduce comfort, fabric feel, exact warmth or how the garment fits every body.",
          "The <a href=\"/cnfans-qc-photos\">CNFans QC Photos Guide</a> gives a practical checklist, and <a href=\"/cnfans-qc-photos-fit\">QC photos and fit</a> explains why a flat image should be combined with actual garment measurements.",
        ],
      },
      {
        heading: "Shipping answers should stay conditional",
        paragraphs: [
          "Shipping discussions can become confusing when one parcel's weight or route is repeated as if it were a universal rule. Estimates, packaging, dimensions and the selected service can all affect the result, so check the current information for the parcel in front of you.",
          "For plain-English background, read the <a href=\"/cnfans-delivery-uk\">CNFans UK delivery guide</a>, <a href=\"/cnfans-volumetric-weight\">volumetric weight</a> and <a href=\"/cnfans-packaging-weight\">packaging weight</a> pages. This site is an independent clothing and product discovery site, not an official Reddit or CNFans service account.",
        ],
      },
      {
        heading: "Finds and spreadsheet advice",
        paragraphs: [
          "A spreadsheet can help collect a large number of references, while a finds page can be easier to browse by clothing type. Old rows may contain links that have moved or expired, so verify the current product before treating a community reference as live.",
          "The <a href=\"/cnfans-spreadsheet\">CNFans spreadsheet guide</a>, <a href=\"/cnfans-spreadsheet-search-tips\">spreadsheet search tips</a> and <a href=\"/cnfans-finds-vs-spreadsheet\">finds versus spreadsheet</a> comparison cover those choices without pretending that one format suits every reader.",
        ],
      },
      {
        heading: "How to read community answers",
        paragraphs: [
          "Look for the details behind an answer: product type, actual measurements, photos, parcel context and when the information was posted. A short confident reply can be less useful than a careful answer that explains what remains uncertain.",
          "Do not copy community posts as proof or treat an unverified quote as a guarantee. Use public discussion to identify questions, then confirm the current product and service information through the relevant listing and guide.",
        ],
        items: [
          "Separate a personal recommendation from a general sizing rule.",
          "Check the date and context of shipping or link advice.",
          "Use current product information before making a purchase decision.",
        ],
      },
    ],
    note: "Community questions are useful prompts, not universal answers. Keep sizing measurement-led, keep shipping conditional and verify every current product or link yourself.",
    related: [
      { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Start with measurements rather than a label guess." },
      { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "Review visible details with sensible limits." },
      { href: "/cnfans-spreadsheet", title: "CNFans Spreadsheet UK", blurb: "Understand spreadsheet references and product links." },
      { href: "/cnfans-delivery-uk", title: "CNFans UK Delivery Guide", blurb: "Keep shipping and tracking information current." },
    ],
    browseHref: "/category/new-in",
    browseLabel: "Browse New In",
  },
];

export function getPhaseFourGuide(path: string) {
  const guide = PHASE_FOUR_GUIDES.find((item) => item.path === path);
  if (!guide) throw new Error(`Unknown phase four guide: ${path}`);
  return guide;
}
