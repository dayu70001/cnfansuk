import type { GlobalFindsGuide } from "@/lib/phaseFiveGuides";

const phaseEightRelated = [
  { href: "/cnfans-size-guide", title: "CNFans Size Guide", blurb: "Compare measurements with a garment you already own." },
  { href: "/how-to-order", title: "How to Order", blurb: "Follow the route from a product page to your order." },
  { href: "/cnfans-delivery-uk", title: "Delivery Guide", blurb: "Read the current delivery and tracking notes." },
  { href: "/cnfans-finds", title: "CNFans Finds", blurb: "Return to the wider clothing discovery edit." },
];

export const PHASE_EIGHT_GUIDES: GlobalFindsGuide[] = [
  {
    path: "/cnfans-embroidered-t-shirt-finds",
    title: "CNFans Embroidered T-Shirt Finds 2026 | Embroidered Tee Finds",
    description: "Browse CNFans embroidered T-shirt finds for 2026, with practical notes on placement, scale, fabric, fit and care.",
    h1: "CNFans Embroidered T-Shirt Finds 2026",
    primaryKeyword: "cnfans embroidered t shirt finds",
    secondaryKeywords: ["embroidered tees", "chest embroidery T-shirts", "embroidered logo tees"],
    searchIntent: "Find live embroidered T-shirts and compare placement, scale, fit and the way the stitching sits on the fabric.",
    intro: "Embroidery changes a T-shirt before the cut does. A small chest mark can keep a simple tee quiet, while a back panel or patch becomes the part people notice first. This edit starts with live Tops / T-Shirts listings whose titles mention embroidery, then gives you a practical way to compare the detail without assuming facts the product page does not state.",
    catalogCategory: "tops",
    catalogSubcategory: "t-shirts",
    catalogQuery: "embroidered",
    productPattern: /embroid/i,
    browseHref: "/category/tops/t-shirts",
    browseLabel: "Browse T-Shirts",
    productHeading: "Embroidered T-shirts in the live catalogue",
    closingHeading: "Choose the detail you will actually wear",
    closing: "Save the placement, measurements and material note beside each shortlist item, then compare it with a tee you already like. The <a href=\"/cnfans-size-guide\">size guide</a> helps with the numbers and <a href=\"/how-to-order\">How to Order</a> covers the purchase route. CNFans UK is an independent clothing store and product discovery site; the live listing remains the source for its own details.",
    sections: [
      {
        heading: "Start with where the embroidery sits",
        paragraphs: [
          "Chest embroidery is usually the easiest place to wear: it gives a plain tee a focal point without taking over the whole front. A back design has more room to speak, while a sleeve or pocket detail can stay visible when a jacket is open. Read the title and inspect the product images for the actual position before deciding what kind of tee it is.",
          "Placement should be judged on the garment, not on a cropped thumbnail. Check whether the mark sits close to the collar, follows a pocket line or is centred across the body. The <a href=\"/category/tops/t-shirts\">T-Shirts collection</a> lets you compare the surrounding cuts, but the individual images decide what is really present."
        ]
      },
      {
        heading: "Scale changes the proportion",
        paragraphs: [
          "A small emblem leaves the neckline and hem doing most of the work, so it can sit neatly with jeans, shorts or an open shirt. A large front or back piece adds visual weight and may look more balanced on a boxier body. Use the model view and any stated measurements to judge the design relative to the chest rather than treating every logo as the same size.",
          "Patch-style embroidery can add a raised edge, while a flatter mark may follow the fabric more closely. That is a visual observation, not a claim about the stitch method. If the design includes print as well as embroidery, note which part will remain visible under a jacket."
        ]
      },
      {
        heading: "Keep fabric claims tied to the listing",
        paragraphs: [
          "The same embroidery can feel different on a light jersey and a denser cotton tee. Look for the stated fibre or fabric weight, then use the product images to see how the body hangs around the detail. Do not guess thread type, stitch density or composition from a photograph; missing information is simply unknown.",
          "A heavier tee can hold a larger design with less curling around the chest, while a softer lightweight top may move more when you walk. Compare the shoulder, chest and length measurements with a tee from your wardrobe. The wider <a href=\"/category/tops\">Tops collection</a> is useful for that side-by-side check."
        ]
      },
      {
        heading: "Fit decides how the artwork reads",
        paragraphs: [
          "An oversized T-shirt gives a front design more surface and lets a back panel sit away from the body. A regular cut keeps the artwork closer to the natural chest line. Neither is automatically better: choose the proportion that matches the trousers and layers you already wear, then verify the flat measurements rather than relying on a familiar label.",
          "Pay attention to the shoulder seam and sleeve opening. A dropped shoulder can make a small chest mark look lower, while a neater shoulder keeps it closer to the intended position. Use <a href=\"/cnfans-size-guide\">CNFans Size Guide</a> before deciding between two sizes."
        ]
      },
      {
        heading: "Build an outfit around one focal point",
        paragraphs: [
          "If the embroidery is bold, let the lower half stay simple: straight denim, relaxed trousers or clean shorts keep the design readable. Smaller chest detail can support a more textured jacket or a patterned pair of bottoms. A shirt worn open gives the tee a frame without hiding the work completely.",
          "Think about bags and straps too. A cross-body strap can cover a chest mark, while a back design may disappear under outerwear. <a href=\"/cnfans-graphic-t-shirt-finds\">Graphic T-Shirt Finds</a> offers a useful comparison when the artwork is the main reason you are browsing, but the embroidery page stays focused on stitched detail."
        ]
      },
      {
        heading: "Care for the raised detail",
        paragraphs: [
          "Follow the care label and turn a decorated tee inside out when the instructions allow it. Avoid high heat if the listing warns against it, and do not pull loose threads through the front. A gentle wash and natural drying help the body and the embroidery keep their shape together.",
          "Stock, colours and sizes can change between catalogue batches. Check the current product page, then use <a href=\"/category/new-in\">New In</a> to see recent additions and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for service notes. CNFans UK is an independent clothing store and product discovery site."
        ]
      },
      {
        heading: "Check the detail against the shoulder line",
        paragraphs: [
          "A design close to the shoulder seam can shift when the tee is worn, especially in a dropped-shoulder cut. Check the front and back images for how much room sits around the artwork. If the mark crosses a pocket, seam or fold, treat that as part of the visual rather than expecting it to sit like a centred chest logo.",
          "Sleeve embroidery has its own movement. The mark may turn away when your arm hangs or become more visible when you bend it. That can be exactly the point, but it is worth knowing before you choose a size. Measure the shoulder and sleeve together, then use <a href=\"/category/tops\">Tops</a> to compare nearby silhouettes."
        ]
      },
      {
        heading: "Separate a finish from a fit promise",
        paragraphs: [
          "Embroidery tells you about the surface detail, not whether the tee is oversized, regular or close through the body. Keep the decoration note and the fit note in separate columns when making a shortlist. A large stitched design can appear calm on a roomy tee and busy on a shorter, closer one even when both use similar colours.",
          "The safest comparison is a flat one: chest, shoulder, sleeve and length beside a garment you own. Read the stated fabric and care notes as well. If a listing leaves a detail out, do not fill the gap from a generic T-shirt expectation."
        ]
      },
      {
        heading: "Check visibility under your usual layer",
        paragraphs: [
          "Try the imagined outfit with the jacket, overshirt or bag you wear most. A chest design may sit below a lapel, while a back design can disappear under outerwear. The best choice is the one whose detail remains intentional in the situations where you will actually wear the tee."
        ]
      }
    ],
    related: [
      { href: "/cnfans-t-shirt-finds", title: "T-Shirt Finds", blurb: "A broader everyday tee edit." },
      { href: "/cnfans-graphic-t-shirt-finds", title: "Graphic T-Shirt Finds", blurb: "Compare print-led designs with stitched details." },
      ...phaseEightRelated,
    ],
  },
  {
    path: "/cnfans-reversible-jacket-finds",
    title: "CNFans Reversible Jacket Finds 2026 | Two-Sided Jacket Finds",
    description: "Explore CNFans reversible jacket finds for 2026, with practical checks for both sides, pockets, closures, fit and layering.",
    h1: "CNFans Reversible Jacket Finds 2026",
    primaryKeyword: "cnfans reversible jacket finds",
    secondaryKeywords: ["two-sided jackets", "reversible outerwear", "reversible jacket fit"],
    searchIntent: "Compare live reversible jackets by how both faces work, including closures, pockets, hood shape and fit.",
    intro: "A reversible jacket has to earn its space twice. The useful question is not only which side looks better, but whether both faces close comfortably, carry what you need and sit correctly on your shoulders. This page narrows the live outerwear catalogue to titles that clearly say reversible, then treats each direction as part of the same fit decision.",
    catalogCategory: "outerwear",
    catalogSubcategory: "",
    catalogQuery: "reversible",
    productPattern: /reversible[\s-]+.*\bjacket\b|\bjacket\b.*reversible/i,
    browseHref: "/category/outerwear/jackets",
    browseLabel: "Browse Jackets",
    productHeading: "Reversible jackets in the live catalogue",
    closingHeading: "Test both faces before choosing",
    closing: "Compare the jacket closed and open on both sides, then record shoulder, chest, sleeve and back length beside a piece you own. Use the <a href=\"/cnfans-size-guide\">size guide</a> and <a href=\"/how-to-order\">How to Order</a> once the two-way fit makes sense. CNFans UK is an independent clothing store and product discovery site; the listing remains the reference for its own construction.",
    sections: [
      {
        heading: "Confirm that both sides are designed to show",
        paragraphs: [
          "A true reversible jacket is finished to be worn with either face outward. Look for a clean edge, usable fastening and a surface that does not reveal unfinished seams when turned. A normal lined jacket is not automatically reversible just because it can be turned inside out; the title and images should support the claim.",
          "Give each face a separate look in the product gallery. Note the colour, visible branding and the way the hem falls. The <a href=\"/category/outerwear/jackets\">Jackets collection</a> is a useful baseline for comparing the reversible construction with a conventional outer layer."
        ]
      },
      {
        heading: "Pockets and closures need a second check",
        paragraphs: [
          "Pocket placement can change completely between faces. A slash pocket may become a patch pocket, or one side may keep a simpler front. Check that the openings are reachable with the jacket fastened and that a phone or card holder will not pull the body out of line.",
          "Operate the zip, snaps or buttons in both directions. Hardware can feel different against the wrist or neck when the other face is out, and a puller may sit on a different side. These are practical checks rather than assumptions about how the jacket was made."
        ]
      },
      {
        heading: "Choose the fit that works twice",
        paragraphs: [
          "A jacket that fits only on the quieter side is not a flexible purchase. Compare shoulder position, chest ease and sleeve length while imagining both faces closed. If one side has a thicker panel or larger pocket, it may need a little more room even though the outside dimensions look similar.",
          "Use a jacket you already own as a flat reference. Measure across the shoulders, chest, sleeve and back, then decide whether the reversible piece needs to sit over a tee or a sweater. <a href=\"/cnfans-size-guide\">CNFans Size Guide</a> keeps that comparison consistent."
        ]
      },
      {
        heading: "Hood and collar change the layering plan",
        paragraphs: [
          "A hood can frame one face neatly and feel bulky on the other, especially when it folds into a high collar. Check whether it lies flat, can be adjusted or simply hangs behind the neck. A stand collar may work with a tee but compete with a thick hoodie underneath.",
          "Think about the layer you will actually wear. A lighter reversible jacket can sit over a long-sleeve tee, while a roomier cut may be more useful over a knit. For colder combinations, compare <a href=\"/cnfans-winter-jacket-finds\">Winter Jacket Finds</a> without assuming every reversible style provides the same warmth."
        ]
      },
      {
        heading: "Two looks, one outfit rotation",
        paragraphs: [
          "Use the calmer face with printed tees or textured bottoms, then turn the jacket when the outfit needs a stronger colour or visible logo. A reversible layer can also break up a repeated week of outfits without needing a different cut each day. Keep the trousers and shoes simple when the outer face carries the visual weight.",
          "Check where the second face works in your wardrobe. A dark side may suit jeans and trousers, while a contrast panel might sit better over a plain base. The <a href=\"/cnfans-jacket-finds\">Jacket Finds</a> guide is useful for proportion ideas, but every reversible listing still needs its own image check."
        ]
      },
      {
        heading: "Care for the whole garment",
        paragraphs: [
          "Follow the care instructions for the more delicate face, not the easiest-looking one. Close the fastening before washing, protect prints or embroidery when the label advises it and dry the garment in a way that does not pull one side longer than the other.",
          "Availability and colour combinations can change as new rows arrive. Check both faces, current options and measurements on the product page, then use <a href=\"/category/new-in\">New In</a> and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for the next step. CNFans UK is an independent clothing store and product discovery site."
        ]
      },
      {
        heading: "Look for balance at the edges",
        paragraphs: [
          "The hem, cuff and neckline are where a reversible piece reveals whether both faces were considered together. Check that seams remain tidy when the jacket is turned and that one side does not pull the other upward. A small difference in edge finish can change the way the jacket hangs, especially when it is worn open.",
          "Try the imagined movement that matters to you: reaching for a rail, carrying a bag or sitting with the zip closed. If one face bunches at the back or catches at the wrist, record it as a trade-off rather than assuming the other side will solve it."
        ]
      },
      {
        heading: "Compare the faces in daylight",
        paragraphs: [
          "Colour and surface can read differently indoors than in daylight. Check the full gallery for both faces, paying attention to contrast, visible labels and any pattern that only appears from one angle. This is especially useful when a logo or check sits close to a seam and could be hidden by the way the jacket is fastened.",
          "Keep the two looks in the same outfit plan. If one face needs a plain base and the other needs a darker trouser, note that before ordering. A reversible jacket earns its flexibility when both options fit your real wardrobe, not only when they look different on a product tile."
        ]
      },
      {
        heading: "Make the extra fabric work",
        paragraphs: [
          "Two finished faces can make a reversible jacket feel fuller than a single-layer shell. Check the side profile and armhole rather than judging only the chest width. A little room helps with movement, but excess fabric can gather under a bag strap or bunch at the waist when you sit.",
          "Use the intended base layer as the reference and record the jacket measurements beside it. The <a href=\"/category/outerwear\">Outerwear collection</a> can show lighter conventional jackets for comparison, while the reversible listing decides whether the additional construction is useful for you."
        ]
      }
    ],
    related: [
      { href: "/cnfans-jacket-finds", title: "Jacket Finds", blurb: "A wider outerwear comparison." },
      { href: "/cnfans-windbreaker-finds", title: "Windbreaker Finds", blurb: "Light outer layers with different construction." },
      { href: "/category/outerwear", title: "Outerwear", blurb: "Compare the current outerwear categories." },
      ...phaseEightRelated,
    ],
  },
  {
    path: "/cnfans-leather-jacket-finds",
    title: "CNFans Leather Jacket Finds 2026 | Leather Outerwear Finds",
    description: "Browse CNFans leather jacket finds for 2026, with practical notes on cut, collar, closure, length, fit and layering.",
    h1: "CNFans Leather Jacket Finds 2026",
    primaryKeyword: "cnfans leather jacket finds",
    secondaryKeywords: ["leather outerwear", "leather jacket fit", "leather jacket styling"],
    searchIntent: "Find current leather-jacket listings and compare their cut, hardware, proportions and layering room.",
    intro: "Leather jackets can look similar in a thumbnail and feel completely different in an outfit. Collar height, front length, shoulder width and the amount of room over a T-shirt all change the result. This catalogue edit uses titles that clearly say leather jacket, while keeping material claims limited to what each live listing actually states.",
    catalogCategory: "outerwear",
    catalogSubcategory: "jackets",
    catalogQuery: "leather",
    productPattern: /leather[\s-]+jacket|jacket[\s-]+.*leather/i,
    browseHref: "/category/outerwear/jackets",
    browseLabel: "Browse Jackets",
    productHeading: "Leather jackets in the live catalogue",
    closingHeading: "Fit the jacket around your real layers",
    closing: "Use a jacket you already wear to compare shoulder, chest, sleeve and back length, then read the listing for its stated material and care notes. The <a href=\"/cnfans-size-guide\">size guide</a> and <a href=\"/how-to-order\">How to Order</a> can follow once the shape is right. CNFans UK is an independent clothing store and product discovery site; no material grade is implied beyond the product information.",
    sections: [
      {
        heading: "Treat the material wording carefully",
        paragraphs: [
          "A title that says leather jacket tells you the garment category and the material term used by the listing. It does not, by itself, confirm genuine leather, a particular hide or a specific finish. Read the product details for any composition information and leave unknowns as unknown rather than filling them in from the photograph.",
          "Surface appearance can still help with styling. A smooth-looking finish reads differently from a visibly grainy or panelled design, but that is a visual cue, not a material certification. Compare the live images with the wider <a href=\"/category/outerwear/jackets\">Jackets collection</a> before narrowing your shortlist."
        ]
      },
      {
        heading: "Cut and length set the silhouette",
        paragraphs: [
          "A shorter jacket brings the hem closer to the waistband and can work with a higher-rise trouser. A longer body gives more coverage and may suit a calmer, layered outfit. Check the front and back lengths together; the relationship between the hem and your rise often matters more than the label attached to the cut.",
          "Shoulder shape is equally important. A clean shoulder can read neat, while a dropped seam adds width and changes the sleeve line. Measure a jacket from your wardrobe flat so the comparison includes the body proportions you actually like."
        ]
      },
      {
        heading: "Collar and fastening carry the detail",
        paragraphs: [
          "A stand collar keeps the neck line compact, while a lapel or spread collar creates more room for a tee or shirt to show. Check how the collar sits when the front is open and closed, and whether the neckline catches on the layer underneath.",
          "Zips, snaps and buttons also change the front. Look at the hardware position, pocket entry and cuff finish in the product gallery. These details help you decide if the jacket feels like a clean daily layer or a more decorated outer piece without inventing a story about its construction."
        ]
      },
      {
        heading: "Allow space for movement",
        paragraphs: [
          "Leather-style outerwear often feels less forgiving than a soft jersey top. Check chest ease and upper-arm width with your arms forward, then picture the layer you intend to wear beneath. If you mainly use a tee, a closer body may work; a chunky knit needs more shoulder and sleeve room.",
          "Sleeve length and shoulder width work together. A jacket that is too broad at the shoulder can make the sleeve look long, while sizing down for the sleeve alone may restrict the chest. Use <a href=\"/cnfans-size-guide\">CNFans Size Guide</a> and compare like-for-like measurements rather than choosing by height alone."
        ]
      },
      {
        heading: "Keep the surrounding outfit simple",
        paragraphs: [
          "A detailed leather jacket can anchor plain denim, relaxed trousers or a simple tee. If the jacket has contrast panels, embroidery or multiple pockets, let one other piece carry texture instead of making every layer compete. A quieter jacket can handle a stronger knit or printed base.",
          "Think about the length of the bottom half. A shorter jacket can balance a higher rise, while a longer body may sit more naturally over a straight or relaxed leg. Browse <a href=\"/cnfans-jeans-finds\">Jeans Finds</a> or <a href=\"/category/bottoms\">Bottoms</a> for proportion checks, not for a promise that one outfit formula suits everyone."
        ]
      },
      {
        heading: "Care and ordering checks",
        paragraphs: [
          "Follow the care label and avoid treating a leather term as permission for one universal cleaning method. Keep hardware closed when the instructions recommend it, protect printed or embroidered areas and store the jacket so the shoulders are supported without stretching the body.",
          "Before ordering, record the stated material, closure, collar, measurements and any fit note on the live product page. Use <a href=\"/category/new-in\">New In</a> for recent rows and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for service information. CNFans UK is an independent clothing store and product discovery site."
        ]
      },
      {
        heading: "Check the back as carefully as the front",
        paragraphs: [
          "A leather jacket can look neat from the front and feel restrictive across the back when you reach forward. Use the rear image to judge shoulder width, yoke shape and any panel or seam that changes the drape. If you carry a bag, leave enough room for the strap without forcing the jacket to twist.",
          "A back detail also changes how the piece works under outerwear. A smooth panel can disappear beneath a coat, while raised decoration may create pressure or bulk. Keep those observations beside the product measurements, not as assumptions about the material itself."
        ]
      },
      {
        heading: "Decide how much hardware you want",
        paragraphs: [
          "Some jackets keep the front quiet with one zip; others add snaps, belts or multiple pocket closures. Count the areas you will touch during a normal day and consider whether the hardware supports the outfit or becomes its main feature. The choice is personal, but the product images should make it clear what is actually there.",
          "Use a simple base layer when the jacket already carries several details. A plain tee, straight denim or relaxed trouser gives the cut space to show. For a different outer layer, compare <a href=\"/category/outerwear\">Outerwear</a> before deciding whether this jacket fills a gap or repeats one you already own."
        ]
      },
      {
        heading: "Think about the first month of wear",
        paragraphs: [
          "A jacket that looks right for one photograph still has to work through ordinary movement and repeat outfits. Check the back length when seated, the sleeve at the wrist and the space across the chest when the front is closed. These small tests reveal whether the cut belongs in your everyday rotation or only suits a single styled look."
          ,"Write down the outfit roles before you buy: tee-only layer, shirt layer or something that needs a knit underneath. That short note makes it easier to compare two similar jackets and prevents a dramatic cut from replacing a more useful everyday option."
        ]
      }
    ],
    related: [
      { href: "/cnfans-jacket-finds", title: "Jacket Finds", blurb: "Compare other current outerwear shapes." },
      { href: "/cnfans-denim-jacket-finds", title: "Denim Jacket Finds", blurb: "A different material and layering profile." },
      { href: "/category/outerwear", title: "Outerwear", blurb: "Browse the full outerwear catalogue." },
      ...phaseEightRelated,
    ],
  },
  {
    path: "/cnfans-down-jacket-finds",
    title: "CNFans Down Jacket Finds 2026 | Down Outerwear Finds",
    description: "Explore CNFans down jacket finds for 2026, with practical notes on baffle layout, hood shape, fit, layering and closures.",
    h1: "CNFans Down Jacket Finds 2026",
    primaryKeyword: "cnfans down jacket finds",
    secondaryKeywords: ["down outerwear", "down jacket layering", "hooded down jackets"],
    searchIntent: "Compare current down-jacket listings by visible construction, proportions, hood or collar and room for layers.",
    intro: "A down jacket has a different fit job from a light shell: it needs enough room to keep the shape comfortable, but not so much that the body loses its line. This page gathers live outerwear titles that name down and a jacket, then focuses on the construction and fit signals you can actually inspect. It does not turn a title into a fill-power or temperature claim.",
    catalogCategory: "outerwear",
    catalogSubcategory: "",
    catalogQuery: "down",
    productPattern: /\bdown\b.*jacket|jacket.*\bdown\b/i,
    productExcludePattern: /turn[- ]down/i,
    browseHref: "/category/outerwear/puffers",
    browseLabel: "Browse Puffers",
    productHeading: "Down jackets in the live catalogue",
    closingHeading: "Plan the layer before you choose the size",
    closing: "Compare the jacket measurements with the base and mid-layer you expect to wear, then confirm the listing’s own material and construction notes. Use <a href=\"/cnfans-size-guide\">CNFans Size Guide</a> and <a href=\"/how-to-order\">How to Order</a> once the proportions work. CNFans UK is an independent clothing store and product discovery site; fill details and performance claims are not added unless the listing states them.",
    sections: [
      {
        heading: "Read the title, then inspect the build",
        paragraphs: [
          "The word down identifies the signal used for this edit, not a complete specification. Check the product details for any stated composition, then look at the images for the jacket’s shape. A title alone cannot confirm down percentage, goose or duck source, fill power, waterproofing or a temperature rating.",
          "Visible panel or baffle layout can still help you compare proportions. Note whether the lines run horizontally, vertically or in a shaped pattern, and whether the body looks compact or full. Keep those observations separate from technical performance claims."
        ]
      },
      {
        heading: "Volume changes the way a jacket layers",
        paragraphs: [
          "A shorter, closer jacket can work over a T-shirt or thin long sleeve, while a fuller body may be easier over a sweatshirt. Try the size decision with your real base layer in mind. A coat that feels neat over a tee may restrict the arm when a thicker mid-layer is added.",
          "Do not solve sleeve length by automatically sizing up. Extra width at the shoulder can make the jacket look unbalanced and allow more air movement than you want. Compare shoulder, chest, sleeve and back measurements with <a href=\"/cnfans-size-guide\">a familiar jacket</a> instead."
        ]
      },
      {
        heading: "Hood, collar and hem are practical choices",
        paragraphs: [
          "A hood adds coverage around the head and changes the neck profile. Check if it looks fixed, adjustable or shaped to fold away in the listing images. A stand collar gives a cleaner line when the hood is not in use, but it can feel crowded with a high-neck layer beneath.",
          "Look at the hem and cuff finish too. Elastic, snaps or an adjustable tab can change how the jacket sits when you move. These details help you judge everyday comfort without claiming that the garment blocks wind or rain unless the product page says so."
        ]
      },
      {
        heading: "Closures and pockets affect bulk",
        paragraphs: [
          "A full zip makes it easier to release heat or show the layer underneath. Snaps and covered closures create a different front line and can add thickness at the chest. Check how the fastening lies when closed rather than judging it only from the front-open image.",
          "Pocket entry should be reachable without pulling the jacket sideways. Note whether a pocket is zipped, hidden or open, and whether it sits high enough for a phone or keys. The <a href=\"/category/outerwear\">Outerwear collection</a> gives a broader comparison with jackets that use a lighter construction."
        ]
      },
      {
        heading: "Use down outerwear with clear proportions",
        paragraphs: [
          "A compact jacket can sit over straight jeans or trousers without changing the outfit’s line. A fuller puffer may look more balanced with a cleaner lower half and a little space at the hem. If both jacket and trousers are wide, use the front opening or a shorter base layer to keep the proportions readable.",
          "Layering is also a comfort decision. Leave room at the upper arm and shoulder for the garment you will actually wear, then check <a href=\"/cnfans-winter-jacket-finds\">Winter Jacket Finds</a> for a wider seasonal comparison."
        ]
      },
      {
        heading: "Care for the fill and shell as stated",
        paragraphs: [
          "Follow the product care instructions rather than using a generic down routine. Avoid high heat when the label warns against it, close the fastening before washing and make sure the jacket is fully dry in the way the instructions require. Do not compress it for long periods if the product page advises otherwise.",
          "Options and colours can change with the live catalogue. Confirm the material note, hood, closure and current size range on the product page, then use <a href=\"/category/new-in\">New In</a> and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a>. CNFans UK is an independent clothing store and product discovery site."
        ]
      },
      {
        heading: "Read the jacket at rest and in motion",
        paragraphs: [
          "A puffer can look compact in a flat image and take more space once the body is filled and zipped. Check the side view, arm position and hem when the model is standing naturally. The aim is not a tight outline; it is enough room for the layer beneath without a sleeve that drags at the shoulder.",
          "Picture common movements such as reaching, sitting or lifting a bag. If the collar presses into your neck when the zip is closed, a stand-collar style may not suit the way you intend to wear it. Keep that practical observation separate from any technical warmth claim."
        ]
      },
      {
        heading: "Compare baffles without inventing performance",
        paragraphs: [
          "Panel size and direction change the visual bulk of a down jacket. Narrow horizontal lines can create a more compact rhythm, while larger panels make the body look fuller. These are useful styling observations, but they do not prove how much insulation a garment contains or how it will perform outdoors.",
          "Use the stated construction notes for anything technical. If the product page does not list fill composition, fill power or a weather rating, leave those fields blank in your comparison. The <a href=\"/category/outerwear/puffers\">Puffers category</a> lets you see the range of shapes without adding unsupported claims."
        ]
      },
      {
        heading: "Keep the lower half calm",
        paragraphs: [
          "A fuller down jacket usually benefits from a clean lower line. Straight jeans, simple trousers or a narrower shoe let the jacket’s volume read as deliberate rather than accidental. A shorter jacket can work with a higher rise; a longer one may need a little space at the hem so the outfit does not feel compressed.",
          "If the jacket has a strong colour or visible panel pattern, let one other item carry texture. <a href=\"/cnfans-finds\">CNFans Finds</a> gives a wider discovery route, while the live product images decide which details are genuinely present."
        ]
      },
      {
        heading: "Check storage before the season starts",
        paragraphs: [
          "Down outerwear needs a practical home between wears. Follow the product instructions for hanging, folding or longer-term storage, and avoid leaving a compressed jacket in a bag if the listing warns against it. A quick check of the collar, cuffs and zip after storage can save a surprise on the first cold day.",
          "Keep the product page beside your notes when the temperature drops. A new batch may use a different hood, panel layout or size range even when the title looks familiar, so confirm the exact row instead of relying on a saved screenshot."
        ]
      },
      {
        heading: "Match the collar to your base layer",
        paragraphs: [
          "A stand collar can sit neatly over a crewneck tee, but it may compete with a high neck or thick knit. A hooded style brings another layer of fabric around the shoulders. Use the product images to see how the neckline settles when the zip is open and closed, then compare that shape with the layers you reach for most.",
          "This small check also helps with scarves and bags. Extra fabric at the neck can catch under a strap or bunch when you turn, so leave a little room for the movement you expect rather than judging only the front view."
        ]
      }
    ],
    related: [
      { href: "/cnfans-jacket-finds", title: "Jacket Finds", blurb: "A wider edit of current outerwear." },
      { href: "/cnfans-winter-jacket-finds", title: "Winter Jacket Finds", blurb: "Seasonal layering notes across outerwear." },
      { href: "/category/outerwear/puffers", title: "Puffers", blurb: "Browse the current puffer category." },
      ...phaseEightRelated,
    ],
  },
  {
    path: "/cnfans-denim-jacket-finds",
    title: "CNFans Denim Jacket Finds 2026 | Denim Outerwear Finds",
    description: "Browse CNFans denim jacket finds for 2026, with practical notes on wash, cut, layering, closures, weight and fit.",
    h1: "CNFans Denim Jacket Finds 2026",
    primaryKeyword: "cnfans denim jacket finds",
    secondaryKeywords: ["denim outerwear", "denim jacket fit", "washed denim jackets"],
    searchIntent: "Find denim outerwear and compare wash, length, shoulder fit, closure and room for layers.",
    intro: "A denim jacket sits between shirt and outerwear, which is why its proportions matter so much. The right length can frame a higher rise, while the wrong shoulder can make the whole layer feel borrowed. This page uses live Outerwear / Jackets listings that name denim, with checks for wash, fit, closure and the layers you plan to put underneath.",
    catalogCategory: "outerwear",
    catalogSubcategory: "jackets",
    catalogQuery: "denim",
    productPattern: /denim[\s-]+jacket|jacket[\s-]+.*denim/i,
    browseHref: "/category/outerwear/jackets",
    browseLabel: "Browse Jackets",
    productHeading: "Denim jackets in the live catalogue",
    closingHeading: "Use denim as the layer it is",
    closing: "Compare the jacket’s shoulder, length, sleeve and stated fabric notes with a piece you already wear. Then use <a href=\"/cnfans-size-guide\">CNFans Size Guide</a> and <a href=\"/how-to-order\">How to Order</a> before choosing. CNFans UK is an independent clothing store and product discovery site; the live product page remains the authority for its wash, material and options.",
    sections: [
      {
        heading: "Wash changes the first impression",
        paragraphs: [
          "A clean dark denim can sit close to smarter trousers, while a pale or heavily washed surface reads more relaxed. Contrast details, jacquard work or floral panels add another layer to the colour decision. Look at the full garment rather than one close-up so you can see how the wash runs across the sleeves and back.",
          "If you plan to wear denim with denim, compare the washes rather than matching them exactly by habit. The <a href=\"/cnfans-jeans-finds\">Jeans Finds</a> page helps you see full-length options, but this edit stays focused on the jacket as outerwear."
        ]
      },
      {
        heading: "Length and shoulder shape lead the fit",
        paragraphs: [
          "A shorter jacket can stop around the waistband and make a higher-rise bottom look intentional. A longer cut gives more coverage and can work over a longer tee. Check front and back length, then compare where the shoulder seam lands when your arms hang naturally.",
          "A snug shoulder can make a denim jacket useful as a mid-layer, while a roomier body is easier over a hoodie or knit. Choose around the layer you will actually wear, not the layer shown in one posed image."
        ]
      },
      {
        heading: "Closure and pockets show how it will work",
        paragraphs: [
          "Buttons create a traditional front line and can be worn partly fastened to show a tee. A zip gives a cleaner closed shape and changes how the jacket stacks at the hem. Check the collar, button spacing or zip length in the product gallery before deciding which role suits you.",
          "Chest and side pockets add structure, but their position also affects movement. Note whether a phone or wallet sits comfortably and whether the pocket pulls the front when the jacket is closed. The <a href=\"/category/outerwear/jackets\">Jackets category</a> provides a useful comparison with other closure types."
        ]
      },
      {
        heading: "Treat weight as a stated detail",
        paragraphs: [
          "Some listings give a fabric or blend note; others do not. Use the information that is present and avoid assigning a denim weight from a photograph. A denser-looking jacket may still feel different from one that is described as lightweight, so keep the product description beside the images when comparing.",
          "Weight changes the season and the layer beneath. A lighter jacket may work on a mild day or under a coat, while a more structured style can act as the outermost piece. The <a href=\"/category/outerwear\">Outerwear collection</a> lets you compare that role without changing the product category."
        ]
      },
      {
        heading: "Make the wash work with the rest",
        paragraphs: [
          "A pale wash can lift a dark tee and trousers, while deep indigo gives a stronger frame to a lighter base. If the jacket has a statement panel or embroidery, keep the neighbouring pieces calmer. A simple shoe and a clean lower half let the denim remain the texture in the outfit.",
          "For colder days, leave enough room for a knit or hoodie at the upper arm. Compare <a href=\"/cnfans-hoodie-finds\">Hoodie Finds</a> or <a href=\"/cnfans-sweater-finds\">Sweater Finds</a> for layer ideas, then return to the actual jacket measurements before ordering."
        ]
      },
      {
        heading: "Care for the colour and shape",
        paragraphs: [
          "Follow the care label, turn denim inside out when instructed and avoid unnecessary heat if the product warns against it. Let the jacket dry in a way that supports the shoulders, especially when the fabric is wet and heavier than it feels on the hanger.",
          "Save the stated wash, closure, length and measurements with the product link. Check <a href=\"/category/new-in\">New In</a> for recent additions and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for service information. CNFans UK is an independent clothing store and product discovery site."
        ]
      },
      {
        heading: "Notice where a hood changes the shape",
        paragraphs: [
          "A hooded denim jacket can feel closer to a light outer layer than a classic trucker cut. Check how the hood joins the collar and whether it sits flat when unused. The extra fabric around the neck may need more room under a coat, while a clean collar can layer more easily over a shirt.",
          "The product images should also show whether the hood is the main feature or a small secondary detail. Record that distinction beside the shoulder and back measurements, then compare it with <a href=\"/cnfans-hoodie-finds\">Hoodie Finds</a> if you are planning a hood-on-hood combination."
        ]
      },
      {
        heading: "Use the shoulders as your reference point",
        paragraphs: [
          "A denim jacket that sits cleanly at the shoulder can look intentional even when the body is relaxed. If the seam drops far down the arm, decide whether that is the desired oversized shape or simply too much room. Check the upper back as well; movement across the shoulder is more revealing than a static front image.",
          "Measure a jacket that already works over your usual tee or knit and compare chest, shoulder and sleeve together. A smaller label is not automatically a better fit if the layer underneath becomes restrictive."
        ]
      },
      {
        heading: "Pair texture with a clear bottom line",
        paragraphs: [
          "Denim already supplies texture, so the outfit often works best when the bottom half has a simple line. Straight jeans, relaxed trousers or shorts can all work; the key is deciding which volume should lead. A shorter jacket can show a higher rise, while a longer layer may suit a quieter, longer trouser.",
          "If you wear double denim, vary the wash or surface rather than trying to match every shade. <a href=\"/cnfans-denim-shorts-finds\">Denim Shorts Finds</a> offers a warm-weather comparison, but the jacket’s own length and wash still decide the proportion.",
          "An embroidered or patterned denim jacket can be the focal point without becoming difficult to wear. Keep the base layer plain, let the collar sit naturally and check that the shoulder remains comfortable when you move. That combination makes the jacket easier to repeat across seasons."
        ]
      }
    ],
    related: [
      { href: "/cnfans-jacket-finds", title: "Jacket Finds", blurb: "Compare other outerwear silhouettes." },
      { href: "/cnfans-jeans-finds", title: "Jeans Finds", blurb: "See the same denim idea at full length." },
      { href: "/cnfans-denim-shorts-finds", title: "Denim Shorts Finds", blurb: "A warm-weather denim comparison." },
      ...phaseEightRelated,
    ],
  },
  {
    path: "/cnfans-slim-straight-jeans-finds",
    title: "CNFans Slim Straight Jeans Finds 2026 | Straight-Leg Denim Finds",
    description: "Explore CNFans slim straight jeans finds for 2026, with practical notes on rise, thigh fit, knee line, leg opening and inseam.",
    h1: "CNFans Slim Straight Jeans Finds 2026",
    primaryKeyword: "cnfans slim straight jeans finds",
    secondaryKeywords: ["slim straight denim", "slim straight fit", "straight-leg jeans fit"],
    searchIntent: "Compare slim-straight jeans by rise, thigh room, knee line, leg opening, inseam and the break you prefer.",
    intro: "Slim-straight is a useful middle ground: closer through the upper leg than a relaxed cut, but not narrowed into a skinny ankle. The live Bottoms / Jeans catalogue contains a clear group using this wording, so this page focuses on the measurements that make the silhouette recognisable rather than treating every straight jean as the same fit.",
    catalogCategory: "bottoms",
    catalogSubcategory: "jeans",
    catalogQuery: "slim",
    productPattern: /slim[\s-]+straight(?:[\s-]+leg)?/i,
    browseHref: "/category/bottoms/jeans",
    browseLabel: "Browse Jeans",
    productHeading: "Slim-straight jeans in the live catalogue",
    closingHeading: "Let the measurements define slim-straight",
    closing: "Record rise, thigh, knee, leg opening and inseam beside a pair you own, then use <a href=\"/cnfans-size-guide\">CNFans Size Guide</a> before choosing a label. <a href=\"/how-to-order\">How to Order</a> covers the next step once the fit is clear. CNFans UK is an independent clothing store and product discovery site; the product page remains the source for its current measurements and material notes.",
    sections: [
      {
        heading: "What the cut is trying to do",
        paragraphs: [
          "Slim-straight jeans usually sit closer through the hip and thigh, then keep a straighter line from the knee to the hem. They should not pinch like a skinny cut or balloon like a baggy leg. The title is a starting signal; the listing measurements decide how that idea has been interpreted in the actual product.",
          "Look at the front and side images together. A leg that appears slim from the front may still have useful room through the thigh, while a narrow hem can change the line at the ankle. Compare the current <a href=\"/category/bottoms/jeans\">Jeans collection</a> with a familiar pair before choosing."
        ]
      },
      {
        heading: "Measure rise, thigh and knee",
        paragraphs: [
          "Rise sets where the waistband sits and changes the relationship between the tee, belt and top block. Measure it on a pair that feels right, then compare the front rise in the listing. Thigh width matters because the cut should move comfortably before it narrows into the straight lower leg.",
          "The knee measurement tells you where the shape changes. Two pairs can share a slim-straight label but feel different if one is close at the thigh and the other leaves more ease. Keep the measurements flat and consistent; do not mix body measurements with garment measurements."
        ]
      },
      {
        heading: "Leg opening and inseam finish the line",
        paragraphs: [
          "A straight leg does not mean one universal hem width. A narrower opening can sit cleanly over a low trainer, while a wider opening leaves room for a heavier shoe. Check the listed leg opening and picture it with the footwear you wear most.",
          "Inseam decides where the jeans break, stack or stop. A longer inseam can create a small fold over the shoe; a shorter one keeps the lower line clearer. Note the rise and inseam together, because changing one without the other alters the whole proportion."
        ]
      },
      {
        heading: "Stretch changes the feel, not the label",
        paragraphs: [
          "Some listings state stretch or a denim blend, while others leave the fibre details open. Use the product information that is present and do not assume a slim-straight jean will stretch simply because the cut is close. Comfort comes from the relationship between thigh room, rise and fabric, not the name alone.",
          "If you sit or cycle often, allow enough movement at the seat and knee. The <a href=\"/cnfans-size-guide\">size guide</a> helps you compare those points with a pair you already own, while <a href=\"/category/bottoms\">Bottoms</a> gives a wider view of alternative fits."
        ]
      },
      {
        heading: "Keep slim-straight distinct from baggy",
        paragraphs: [
          "A slim-straight pair can support a closer top or a shorter jacket without swallowing the outfit. Baggy jeans create a different lower-half volume and need a different balance through the shoulder and hem. Treat the two as neighbouring choices, not interchangeable words.",
          "For an easy outfit, try a plain tee, a shorter overshirt or a knit that ends near the waistband. If you prefer more volume, compare <a href=\"/cnfans-baggy-jeans-finds\">Baggy Jeans Finds</a> and decide which leg line matches your wardrobe before returning to this narrower cut."
        ]
      },
      {
        heading: "Ordering checks for denim",
        paragraphs: [
          "Record waist, front rise, thigh, knee, leg opening and inseam in one note. Check whether the listing uses inches or centimetres and compare the same units with your reference pair. Wash and surface details matter for styling, but they cannot replace a fit measurement.",
          "Current rows and size options can move between catalogue batches. Verify the live product page, then use <a href=\"/category/new-in\">New In</a> and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for the next steps. CNFans UK is an independent clothing store and product discovery site."
        ]
      },
      {
        heading: "Check the break with the shoes you own",
        paragraphs: [
          "Slim-straight jeans can finish cleanly at the ankle or leave a small break over a trainer. Look at the inseam and leg opening together, then picture the hem with your everyday footwear. A narrow opening may sit neatly on a low shoe but feel crowded over a larger sole.",
          "If you prefer a little stacking, make sure the extra length does not turn the lower leg into an unintended taper. The <a href=\"/category/bottoms\">Bottoms collection</a> is useful for comparing the same footwear with a wider trouser or short, but the slim-straight decision stays measurement-led."
        ]
      },
      {
        heading: "Use the waist as the anchor",
        paragraphs: [
          "A comfortable waistband keeps the rest of the fit in place. Check the stated waist measurement, rise and fastening together; a close thigh with a low rise can feel very different from a close thigh with more coverage. Do not assume that a familiar size has the same waist across every catalogue row.",
          "Try the sitting test mentally as well as standing. If the seat pulls or the top block feels restrictive, a larger label may not solve the problem if it makes the leg too wide. Record the measurements, then use <a href=\"/cnfans-jeans-sizing\">Jeans Sizing</a> for a second check."
        ]
      },
      {
        heading: "Check the waistband and fastening",
        paragraphs: [
          "Button, zip and belt-loop placement can alter how a slim-straight pair sits at the waist. Look at the top block in the product images and note whether the waistband lies flat or gathers when fastened. A clean closure keeps the line through the hip and thigh easier to read.",
          "If you wear a belt most days, leave room for it in the comparison. A pair that only works without the belt may feel different once the waistband is anchored, so include that small detail in your fit notes."
        ]
      },
      {
        heading: "Read the front and side together",
        paragraphs: [
          "A front photograph shows the top block clearly, but the side view reveals whether the thigh falls straight or pulls into the knee. Check the seat, hip and lower leg as one line. This prevents a pair with the right waist but the wrong thigh shape from being mistaken for the slim-straight fit you intended.",
          "If you usually wear a wider jean, compare the hem and shoe together before ordering a slimmer line. A change of only a few centimetres at the knee or opening can alter how the denim balances with a jacket or knit, even when the waist stays the same."
        ]
      }
    ],
    related: [
      { href: "/cnfans-jeans-finds", title: "Jeans Finds", blurb: "A broader denim edit." },
      { href: "/cnfans-baggy-jeans-finds", title: "Baggy Jeans Finds", blurb: "Compare a roomier leg and different balance." },
      { href: "/category/bottoms", title: "Bottoms", blurb: "Browse trousers, shorts and jeans together." },
      ...phaseEightRelated,
    ],
  },
  {
    path: "/cnfans-embroidered-shirt-finds",
    title: "CNFans Embroidered Shirt Finds 2026 | Embroidered Button Shirts",
    description: "Browse CNFans embroidered shirt finds for 2026, with practical notes on chest, collar and cuff detail, fit, fabric and layering.",
    h1: "CNFans Embroidered Shirt Finds 2026",
    primaryKeyword: "cnfans embroidered shirt finds",
    secondaryKeywords: ["embroidered button shirts", "embroidered shirt details", "shirt embroidery placement"],
    searchIntent: "Find live embroidered button shirts and compare placement, collar, cuffs, sleeve length, fit and layering use.",
    intro: "An embroidered shirt can stay quiet at the chest or turn the collar, cuff or back into the focal point. The useful comparison is the shirt construction around the decoration: how the placket closes, where the embroidery sits and whether the sleeve works tucked, open or under a jacket. This page uses Tops / Shirts titles with a clear embroidery signal and leaves polo-led listings to their own intent.",
    catalogCategory: "tops",
    catalogSubcategory: "shirts",
    catalogQuery: "embroidered",
    productPattern: /embroid.*\bshirt\b|\bshirt\b.*embroid/i,
    productExcludePattern: /\bpolo\b/i,
    browseHref: "/category/tops/shirts",
    browseLabel: "Browse Shirts",
    productHeading: "Embroidered shirts in the live catalogue",
    closingHeading: "Choose the shirt around its placement",
    closing: "Check the collar, placket, sleeve, body length and stated material beside a shirt you already wear. Use <a href=\"/cnfans-size-guide\">CNFans Size Guide</a> and <a href=\"/how-to-order\">How to Order</a> once the fit is clear. CNFans UK is an independent clothing store and product discovery site; the live listing is the source for its own embroidery and fabric details.",
    sections: [
      {
        heading: "Chest, collar, cuff or back",
        paragraphs: [
          "A small chest motif can keep a button shirt understated, while collar or cuff embroidery becomes visible as you move your arms or roll the sleeve. Back detailing needs more space and can sit beneath a jacket. Read the title, then inspect the full front and back images so the placement is not guessed from a close crop.",
          "Placement also affects how the shirt layers. A chest mark may disappear under a cross-body strap, while a collar design can remain visible over a crewneck. The <a href=\"/category/tops/shirts\">Shirts collection</a> gives a wider baseline for comparing these positions."
        ]
      },
      {
        heading: "The front construction still matters",
        paragraphs: [
          "Button spacing, collar height and the way the placket lies decide whether the shirt reads neat or relaxed. Check the front closed and open in the product images. An embroidered chest can pull attention to a pocket or seam, so look at how the detail sits alongside the construction rather than treating it as a separate badge.",
          "Cuffs affect both comfort and styling. A buttoned cuff gives a clearer finish, while a simpler hem can be rolled or pushed back. Note the sleeve opening and compare it with a shirt you already use for layering."
        ]
      },
      {
        heading: "Short sleeve and long sleeve do different jobs",
        paragraphs: [
          "Short-sleeve embroidered shirts can work as a light top with shorts or jeans, while a long sleeve can sit open over a tee or under a jacket. The same chest detail may look more formal on a long cuffed sleeve and more relaxed on a short camp-style cut.",
          "Check shoulder, upper-arm and sleeve measurements together. A shirt that fits the chest but restricts the arm will not work as an open layer. For longer sleeves, the <a href=\"/cnfans-long-sleeve-finds\">Long Sleeve Finds</a> page helps with neighbouring options without replacing the live measurement check."
        ]
      },
      {
        heading: "Scale the embroidery to the outfit",
        paragraphs: [
          "Small embroidery can sit comfortably with patterned trousers or a textured knit. Larger lettering, back work or a decorated collar needs more quiet space around it. Use the garment’s full proportions and the product images to decide how much of the shirt should carry attention.",
          "A shirt worn open gives the embroidered front a frame, while fastening it makes the placement more direct. Pair a busier design with clean denim or trousers, and use <a href=\"/cnfans-shirt-finds\">Shirt Finds</a> when you want to compare less decorated button shirts."
        ]
      },
      {
        heading: "Use stated fabric and fit information",
        paragraphs: [
          "Only treat fibre content as known when the listing says it. A smooth photograph cannot confirm silk, cotton or a blend, and embroidery does not reveal the fabric weight by itself. Record the material note next to the collar, sleeve and body measurements before choosing.",
          "A closer shirt can sit under a jacket; a roomier one may be better open over a tee. Compare the shoulder and chest with a shirt from your wardrobe and use <a href=\"/category/tops\">Tops</a> to see how the wider collection handles proportion."
        ]
      },
      {
        heading: "Care around the decorated areas",
        paragraphs: [
          "Follow the care label, protect the embroidery from unnecessary friction and reshape the collar and cuffs while damp when the instructions allow it. Turn the shirt inside out only when the care guidance supports that approach, especially if it also carries print or other surface detail.",
          "Availability and options change as new products arrive. Confirm the current product page, then use <a href=\"/category/new-in\">New In</a> and <a href=\"/cnfans-delivery-uk\">Delivery Guide</a> for service notes. CNFans UK is an independent clothing store and product discovery site."
        ]
      },
      {
        heading: "Let the collar frame the embroidery",
        paragraphs: [
          "A chest motif sits differently beneath a closed collar, an open neckline or a jacket lapel. Check the front image in each position shown and note whether the artwork remains visible. A high collar may make the detail feel closer to the neck, while a softer spread gives it more breathing room.",
          "The same idea applies to cuff and sleeve work. Roll or push the sleeve back only if the cuff construction supports it, and check whether the detail disappears when the arm bends. These small choices help you decide how often the shirt will be worn rather than simply how striking it looks flat."
        ]
      },
      {
        heading: "Check the hem when the shirt is open",
        paragraphs: [
          "An open embroidered shirt needs a hem that falls cleanly over the base layer. Compare the front and back lengths, then picture the shirt with the rise of your usual jeans or trousers. A shorter hem can frame the waistband; a longer one may work better with a straighter, calmer bottom line.",
          "Notice the side seam when the shirt is worn loose. If it kicks out sharply, the body may be intended to sit open; if it falls close, it may work better buttoned or tucked. Use that visual cue alongside the stated measurements instead of assuming one universal shirt proportion."
        ]
      },
      {
        heading: "Notice where embroidery meets movement",
        paragraphs: [
          "A motif placed near the placket, armhole or cuff will move as the shirt opens, folds and reaches forward. Look for the way the design breaks across a seam or gathers when the arm bends. That movement can give a plain shirt character, but it is worth understanding before you decide how formal or relaxed the piece feels.",
          "Keep the decoration note separate from the fit note. A comfortable shoulder and a clean placket matter even when the embroidery is the reason you clicked through, and a smaller motif can be more useful if you plan to wear the shirt repeatedly."
        ]
      },
      {
        heading: "Compare the shirt as an open layer",
        paragraphs: [
          "An embroidered button shirt can work open over a plain tee, but the front needs enough space to fall without pulling across the chest. Check the side view and the lower hem in the listing images. A shorter shirt may frame a higher rise, while a longer body can sit more naturally over a relaxed bottom.",
          "If the embroidery is on the back, remember that an open shirt can hide it when the jacket behind you becomes the main layer. Use the product images to decide which direction of wear gives the detail a real place in your rotation."
        ]
      }
    ],
    related: [
      { href: "/cnfans-shirt-finds", title: "Shirt Finds", blurb: "A broader button-shirt edit." },
      { href: "/cnfans-long-sleeve-finds", title: "Long Sleeve Finds", blurb: "Compare sleeve-led layering options." },
      { href: "/cnfans-t-shirt-finds", title: "T-Shirt Finds", blurb: "Simple bases to wear underneath." },
      ...phaseEightRelated,
    ],
  },
];

export function getPhaseEightGuide(path: string) {
  const guide = PHASE_EIGHT_GUIDES.find((item) => item.path === path);
  if (!guide) throw new Error(`Unknown phase eight guide: ${path}`);
  return guide;
}
